// src/components/Expedientes.jsx
//
// Vista de Expediente de Cliente - Muestra toda la información relacionada a un cliente:
// - Datos de contacto
// - Equipo terapéutico
// - Asignaciones de servicio (por hora)
// - Contratos mensuales (paquetes)
// - Resumen financiero
//

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  User,
  Users,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Clock,
  Edit2,
  Plus,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Calendar,
  CreditCard,
  TrendingUp,
  ExternalLink,
  Receipt,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image,
  X,
  Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { obtenerComprobantesCliente, obtenerComprobantes } from '../api/comprobantes';
import { FolderOpen } from 'lucide-react';

const Expedientes = ({
  clientes = [],
  terapeutas = [],
  servicios = [],
  asignaciones = [],
  contratos = [],
  recibos = [],
  citas = [],
  organizationId,
  seccionInicial = 'expedientes-clientes',
  onEditarAsignacion,
  onCrearAsignacion,
  onEditarContrato,
  onCrearContrato,
  onVerRecibos
}) => {
  // Estado del cliente seleccionado
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Comprobantes del cliente (se cargan al seleccionar cliente)
  const [comprobantesCliente, setComprobantesCliente] = useState([]);
  const [cargandoComprobantes, setCargandoComprobantes] = useState(false);

  // Todos los comprobantes (para la vista global de comprobantes)
  const [todosComprobantes, setTodosComprobantes] = useState([]);
  const [cargandoTodosComprobantes, setCargandoTodosComprobantes] = useState(false);

  // Filtros para vistas globales
  const [filtroClienteRecibos, setFiltroClienteRecibos] = useState('');
  const [filtroEstadoRecibos, setFiltroEstadoRecibos] = useState('');
  const [filtroClienteComprobantes, setFiltroClienteComprobantes] = useState('');
  const [filtroEstadoComprobantes, setFiltroEstadoComprobantes] = useState('');

  // Modal de vista previa del recibo
  const [reciboVistaPrevia, setReciboVistaPrevia] = useState(null);

  // Secciones colapsables (solo para vista de expedientes-clientes)
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    contacto: true,
    equipo: true,
    asignaciones: true,
    contratos: true,
    recibos: true,
    comprobantes: true,
    citas: false,
    financiero: true
  });

  // Cargar todos los comprobantes cuando estamos en la vista de comprobantes
  useEffect(() => {
    const cargarTodosComprobantes = async () => {
      if (seccionInicial !== 'expedientes-comprobantes' || !organizationId) {
        return;
      }

      setCargandoTodosComprobantes(true);
      try {
        const datos = await obtenerComprobantes(organizationId);
        setTodosComprobantes(datos);
      } catch (error) {
        console.error('Error cargando comprobantes:', error);
        setTodosComprobantes([]);
      } finally {
        setCargandoTodosComprobantes(false);
      }
    };

    cargarTodosComprobantes();
  }, [seccionInicial, organizationId]);

  // Cargar comprobantes cuando cambia el cliente seleccionado
  useEffect(() => {
    const cargarComprobantes = async () => {
      if (!clienteSeleccionado || !organizationId) {
        setComprobantesCliente([]);
        return;
      }

      setCargandoComprobantes(true);
      try {
        const datos = await obtenerComprobantesCliente(clienteSeleccionado.id, organizationId);
        setComprobantesCliente(datos);
      } catch (error) {
        console.error('Error cargando comprobantes:', error);
        setComprobantesCliente([]);
      } finally {
        setCargandoComprobantes(false);
      }
    };

    cargarComprobantes();
  }, [clienteSeleccionado, organizationId]);

  // Clientes ordenados alfabéticamente
  const clientesOrdenados = useMemo(() => {
    return [...clientes]
      .filter(c => c.activo !== false)
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [clientes]);

  // Filtrar clientes por búsqueda
  const clientesFiltrados = useMemo(() => {
    if (!busqueda) return clientesOrdenados;
    const busquedaLower = busqueda.toLowerCase();
    return clientesOrdenados.filter(c =>
      c.nombre?.toLowerCase().includes(busquedaLower) ||
      c.codigo?.toLowerCase().includes(busquedaLower)
    );
  }, [clientesOrdenados, busqueda]);

  // Asignaciones del cliente seleccionado
  const asignacionesCliente = useMemo(() => {
    if (!clienteSeleccionado) return [];
    return asignaciones.filter(a =>
      a.clienteId === clienteSeleccionado.id && a.activo !== false
    );
  }, [asignaciones, clienteSeleccionado]);

  // Contratos del cliente seleccionado
  const contratosCliente = useMemo(() => {
    if (!clienteSeleccionado) return [];
    return contratos.filter(c =>
      c.clienteId === clienteSeleccionado.id && c.activo !== false
    );
  }, [contratos, clienteSeleccionado]);

  // Equipo terapéutico (terapeutas únicos de asignaciones y contratos)
  const equipoTerapeutico = useMemo(() => {
    if (!clienteSeleccionado) return [];

    const terapeutasIds = new Set();

    // De asignaciones
    asignacionesCliente.forEach(a => {
      if (a.terapeutaId) terapeutasIds.add(a.terapeutaId);
      if (a.terapeutaSecundarioId) terapeutasIds.add(a.terapeutaSecundarioId);
    });

    // De contratos
    contratosCliente.forEach(c => {
      (c.terapeutas || []).forEach(t => {
        if (t.id) terapeutasIds.add(t.id);
      });
    });

    return terapeutas.filter(t => terapeutasIds.has(t.id));
  }, [clienteSeleccionado, asignacionesCliente, contratosCliente, terapeutas]);

  // Recibos del cliente
  const recibosCliente = useMemo(() => {
    if (!clienteSeleccionado) return [];
    return recibos.filter(r => r.clienteId === clienteSeleccionado.id);
  }, [recibos, clienteSeleccionado]);

  // Citas del cliente (historial) - ordenadas por fecha más reciente
  const citasCliente = useMemo(() => {
    if (!clienteSeleccionado) return [];
    return citas
      .filter(c => c.clienteId === clienteSeleccionado.id || c.cliente === clienteSeleccionado.nombre)
      .sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
        const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
        return fechaB - fechaA;
      })
      .slice(0, 50); // Limitar a últimas 50 citas
  }, [citas, clienteSeleccionado]);

  // Resumen financiero
  const resumenFinanciero = useMemo(() => {
    if (!clienteSeleccionado) return { balance: 0, ultimoPago: null };

    // Calcular balance de recibos
    const totalFacturado = recibosCliente.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalPagado = recibosCliente
      .filter(r => r.pagado)
      .reduce((sum, r) => sum + (r.total || 0), 0);

    const ultimoReciboPagado = recibosCliente
      .filter(r => r.pagado && r.fechaPago)
      .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))[0];

    return {
      balance: totalFacturado - totalPagado,
      totalFacturado,
      totalPagado,
      ultimoPago: ultimoReciboPagado
    };
  }, [clienteSeleccionado, recibosCliente]);

  // Recibos filtrados para vista global (todos los recibos con filtros)
  const recibosFiltrados = useMemo(() => {
    let filtrados = [...recibos];

    // Filtrar por cliente
    if (filtroClienteRecibos) {
      filtrados = filtrados.filter(r => r.clienteId === filtroClienteRecibos);
    }

    // Filtrar por estado
    if (filtroEstadoRecibos) {
      filtrados = filtrados.filter(r => {
        const estado = r.estadoPago || (r.pagado ? 'pagado' : 'pendiente');
        return estado === filtroEstadoRecibos;
      });
    }

    // Ordenar por fecha (más reciente primero)
    return filtrados.sort((a, b) => (b.mes || '').localeCompare(a.mes || ''));
  }, [recibos, filtroClienteRecibos, filtroEstadoRecibos]);

  // Comprobantes filtrados para vista global
  const comprobantesFiltrados = useMemo(() => {
    let filtrados = [...todosComprobantes];

    // Filtrar por cliente
    if (filtroClienteComprobantes) {
      filtrados = filtrados.filter(c => c.clienteId === filtroClienteComprobantes);
    }

    // Filtrar por estado
    if (filtroEstadoComprobantes) {
      filtrados = filtrados.filter(c => c.estado === filtroEstadoComprobantes);
    }

    return filtrados;
  }, [todosComprobantes, filtroClienteComprobantes, filtroEstadoComprobantes]);

  // Obtener nombre de cliente por ID
  const getNombreCliente = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nombre || 'Cliente desconocido';
  };

  // Toggle sección
  const toggleSeccion = (seccion) => {
    setSeccionesExpandidas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  };

  // Calcular ganancia de asignación
  const calcularGanancia = (asig) => {
    const precio = parseFloat(asig.precioCliente) || 0;
    const pago = parseFloat(asig.pagoTerapeuta) || 0;
    const pagoSecundario = parseFloat(asig.pagoTerapeutaSecundario) || 0;
    return precio - pago - pagoSecundario;
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Formatear período del recibo (YYYY-MM a nombre de mes)
  const formatearPeriodo = (mes) => {
    if (!mes) return 'N/A';
    try {
      const [year, month] = mes.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    } catch {
      return mes;
    }
  };

  // Obtener color y texto del estado de pago
  const getEstadoPago = (recibo) => {
    const estado = recibo.estadoPago || (recibo.pagado ? 'pagado' : 'pendiente');
    switch (estado) {
      case 'pagado':
        return { color: 'bg-green-100 text-green-700', texto: 'Pagado', icono: CheckCircle };
      case 'parcial':
        return { color: 'bg-yellow-100 text-yellow-700', texto: 'Parcial', icono: AlertCircle };
      default:
        return { color: 'bg-red-100 text-red-700', texto: 'Pendiente', icono: XCircle };
    }
  };

  // Obtener color y texto del estado de comprobante
  const getEstadoComprobante = (estado) => {
    switch (estado) {
      case 'aprobado':
        return { color: 'bg-green-100 text-green-700', texto: 'Aprobado', icono: CheckCircle };
      case 'rechazado':
        return { color: 'bg-red-100 text-red-700', texto: 'Rechazado', icono: XCircle };
      default:
        return { color: 'bg-yellow-100 text-yellow-700', texto: 'Pendiente', icono: AlertCircle };
    }
  };

  // Generar PDF del recibo
  const generarReciboPDF = (recibo) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ACMC', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gesti\u00f3n', 14, 28);

    // Recibo ID en el header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`RECIBO: ${recibo.reciboId || recibo.id}`, pageWidth - 14, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fechaGeneracion = recibo.fechaGeneracion
      ? new Date(recibo.fechaGeneracion).toLocaleDateString('es-MX')
      : new Date().toLocaleDateString('es-MX');
    doc.text(`Fecha: ${fechaGeneracion}`, pageWidth - 14, 28, { align: 'right' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Info del cliente
    let yPos = 55;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 14, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 8;
    doc.text(recibo.clienteNombre || clienteSeleccionado?.nombre || 'N/A', 14, yPos);

    if (recibo.clienteCodigo || clienteSeleccionado?.codigo) {
      yPos += 6;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`C\u00f3digo: ${recibo.clienteCodigo || clienteSeleccionado?.codigo}`, 14, yPos);
      doc.setTextColor(0, 0, 0);
    }

    // Per\u00edodo
    yPos += 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PER\u00cdODO', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 8;
    doc.text(formatearPeriodo(recibo.mes), 14, yPos);

    // Tabla de servicios/citas
    yPos += 15;

    // Si el recibo tiene citas detalladas
    if (recibo.citas && recibo.citas.length > 0) {
      const citasData = recibo.citas.map(cita => [
        cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : 'N/A',
        cita.terapeuta || 'N/A',
        cita.tipoTerapia || cita.servicio || 'Sesi\u00f3n',
        `${cita.duracion || cita.horas || 1} hr`,
        `$${parseFloat(cita.precio || 0).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Terapeuta', 'Servicio', 'Duraci\u00f3n', 'Precio']],
        body: citasData,
        theme: 'striped',
        headStyles: {
          fillColor: [37, 99, 235],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 45 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' }
        }
      });

      yPos = doc.lastAutoTable.finalY + 10;
    } else {
      // Sin citas detalladas, mostrar resumen
      autoTable(doc, {
        startY: yPos,
        head: [['Concepto', 'Cantidad', 'Precio']],
        body: [
          ['Servicios del per\u00edodo', `${recibo.totalCitas || 1} sesi\u00f3n(es)`, `$${parseFloat(recibo.totalPrecio || recibo.total || 0).toFixed(2)}`]
        ],
        theme: 'striped',
        headStyles: {
          fillColor: [37, 99, 235],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { fontSize: 9 }
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Totales
    const subtotal = parseFloat(recibo.totalPrecio || recibo.total || 0);
    const iva = parseFloat(recibo.totalIva || 0);
    const total = parseFloat(recibo.totalGeneral || recibo.total || subtotal);

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Subtotal:', `$${subtotal.toFixed(2)}`],
        ['IVA (16%):', `$${iva.toFixed(2)}`],
        ['TOTAL:', `$${total.toFixed(2)}`]
      ],
      theme: 'plain',
      styles: {
        fontSize: 11,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 140, fontStyle: 'bold', halign: 'right' },
        1: { cellWidth: 40, halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.row.index === 2) {
          data.cell.styles.fontSize = 14;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Estado de pago
    const estadoPago = getEstadoPago(recibo);
    doc.setFillColor(estadoPago.texto === 'Pagado' ? 34 : estadoPago.texto === 'Parcial' ? 234 : 239,
                     estadoPago.texto === 'Pagado' ? 197 : estadoPago.texto === 'Parcial' ? 179 : 68,
                     estadoPago.texto === 'Pagado' ? 94 : estadoPago.texto === 'Parcial' ? 8 : 68);
    doc.roundedRect(14, yPos, 60, 12, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Estado: ${estadoPago.texto.toUpperCase()}`, 44, yPos + 8, { align: 'center' });

    // Monto pagado si aplica
    if (recibo.montoPagado && recibo.montoPagado > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Monto pagado: $${parseFloat(recibo.montoPagado).toFixed(2)}`, 90, yPos + 8);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Este documento es un comprobante de servicios proporcionados.', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Descargar
    const nombreArchivo = `Recibo_${recibo.reciboId || recibo.mes || 'recibo'}_${clienteSeleccionado?.nombre?.replace(/\s+/g, '_') || 'cliente'}.pdf`;
    doc.save(nombreArchivo);
  };

  // Header de sección colapsable
  const SeccionHeader = ({ id, titulo, icono: Icon, children, badge }) => (
    <div className="border rounded-lg bg-white shadow-sm mb-4">
      <button
        onClick={() => toggleSeccion(id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-blue-600" />
          <span className="font-semibold text-gray-800">{titulo}</span>
          {badge && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {seccionesExpandidas[id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {seccionesExpandidas[id] && (
        <div className="px-4 pb-4 border-t">
          {children}
        </div>
      )}
    </div>
  );

  // ==================== VISTA: RECIBOS GLOBALES ====================
  if (seccionInicial === 'expedientes-recibos') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Recibos</h2>
          <span className="text-gray-500">{recibosFiltrados.length} recibo(s)</span>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={filtroClienteRecibos}
                onChange={(e) => setFiltroClienteRecibos(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los clientes</option>
                {clientesOrdenados.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtroEstadoRecibos}
                onChange={(e) => setFiltroEstadoRecibos(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Parcial</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>

            {/* Limpiar filtros */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltroClienteRecibos('');
                  setFiltroEstadoRecibos('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de recibos */}
        {recibosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Receipt size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No hay recibos</h3>
            <p className="text-gray-500">No se encontraron recibos con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recibosFiltrados.map(recibo => {
              const estadoPago = getEstadoPago(recibo);
              const IconoEstado = estadoPago.icono;
              const total = parseFloat(recibo.totalGeneral || recibo.total || 0);

              return (
                <div
                  key={recibo.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-800">
                          {recibo.reciboId || `Recibo ${recibo.mes}`}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoPago.color}`}>
                          <IconoEstado size={12} />
                          {estadoPago.texto}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Cliente</p>
                          <p className="font-medium">{getNombreCliente(recibo.clienteId)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Período</p>
                          <p className="font-medium">{formatearPeriodo(recibo.mes)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-semibold text-green-600">${total.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pagado</p>
                          <p className="font-medium">${parseFloat(recibo.montoPagado || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Citas</p>
                          <p className="font-medium">{recibo.totalCitas || (recibo.citas?.length) || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setReciboVistaPrevia(recibo)}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                        title="Ver recibo"
                      >
                        <Eye size={16} />
                        Ver
                      </button>
                      <button
                        onClick={() => {
                          // Seleccionar el cliente y generar PDF
                          const cliente = clientes.find(c => c.id === recibo.clienteId);
                          setClienteSeleccionado(cliente);
                          setTimeout(() => generarReciboPDF(recibo), 100);
                        }}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                        title="Descargar PDF"
                      >
                        <Download size={16} />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Vista Previa del Recibo */}
        {reciboVistaPrevia && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">ACMC</h3>
                  <p className="text-blue-100 text-sm">Sistema de Gestión</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">RECIBO: {reciboVistaPrevia.reciboId || reciboVistaPrevia.id}</p>
                  <p className="text-blue-100 text-sm">
                    {reciboVistaPrevia.fechaGeneracion
                      ? new Date(reciboVistaPrevia.fechaGeneracion).toLocaleDateString('es-MX')
                      : new Date().toLocaleDateString('es-MX')}
                  </p>
                </div>
                <button
                  onClick={() => setReciboVistaPrevia(null)}
                  className="ml-4 p-1 hover:bg-blue-500 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Contenido del Recibo */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Info del Cliente */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Cliente</h4>
                  <p className="text-lg font-semibold text-gray-800">
                    {reciboVistaPrevia.clienteNombre || getNombreCliente(reciboVistaPrevia.clienteId)}
                  </p>
                  {reciboVistaPrevia.clienteCodigo && (
                    <p className="text-gray-500 text-sm">Código: {reciboVistaPrevia.clienteCodigo}</p>
                  )}
                </div>

                {/* Período */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Período</h4>
                  <p className="text-lg font-medium text-gray-800">{formatearPeriodo(reciboVistaPrevia.mes)}</p>
                </div>

                {/* Tabla de Servicios */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Detalle de Servicios</h4>
                  {reciboVistaPrevia.citas && reciboVistaPrevia.citas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-blue-800">Fecha</th>
                            <th className="px-3 py-2 text-left font-medium text-blue-800">Terapeuta</th>
                            <th className="px-3 py-2 text-left font-medium text-blue-800">Servicio</th>
                            <th className="px-3 py-2 text-center font-medium text-blue-800">Horas</th>
                            <th className="px-3 py-2 text-right font-medium text-blue-800">Precio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reciboVistaPrevia.citas.map((cita, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                {cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : 'N/A'}
                              </td>
                              <td className="px-3 py-2">{cita.terapeuta || 'N/A'}</td>
                              <td className="px-3 py-2">{cita.tipoTerapia || cita.servicio || 'Sesión'}</td>
                              <td className="px-3 py-2 text-center">{cita.duracion || cita.horas || 1}</td>
                              <td className="px-3 py-2 text-right font-medium">${parseFloat(cita.precio || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600">
                        Servicios del período: {reciboVistaPrevia.totalCitas || 1} sesión(es)
                      </p>
                    </div>
                  )}
                </div>

                {/* Totales */}
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>${parseFloat(reciboVistaPrevia.totalPrecio || reciboVistaPrevia.total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>IVA (16%):</span>
                        <span>${parseFloat(reciboVistaPrevia.totalIva || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-2">
                        <span>TOTAL:</span>
                        <span>${parseFloat(reciboVistaPrevia.totalGeneral || reciboVistaPrevia.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estado de Pago */}
                <div className="mt-6 flex items-center gap-4">
                  {(() => {
                    const estado = getEstadoPago(reciboVistaPrevia);
                    const IconoEstado = estado.icono;
                    return (
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${estado.color}`}>
                        <IconoEstado size={16} />
                        Estado: {estado.texto}
                      </span>
                    );
                  })()}
                  {reciboVistaPrevia.montoPagado > 0 && (
                    <span className="text-gray-600 text-sm">
                      Monto pagado: ${parseFloat(reciboVistaPrevia.montoPagado).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
                <p className="text-xs text-gray-500">
                  Generado el {new Date().toLocaleDateString('es-MX')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const cliente = clientes.find(c => c.id === reciboVistaPrevia.clienteId);
                      setClienteSeleccionado(cliente);
                      setTimeout(() => {
                        generarReciboPDF(reciboVistaPrevia);
                        setReciboVistaPrevia(null);
                      }, 100);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download size={16} />
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <Printer size={16} />
                    Imprimir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen */}
        {recibosFiltrados.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-500 text-sm">Total Facturado</p>
                <p className="text-xl font-bold text-gray-800">
                  ${recibosFiltrados.reduce((s, r) => s + parseFloat(r.totalGeneral || r.total || 0), 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Pagado</p>
                <p className="text-xl font-bold text-green-600">
                  ${recibosFiltrados.reduce((s, r) => s + parseFloat(r.montoPagado || 0), 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pendiente</p>
                <p className="text-xl font-bold text-red-600">
                  ${recibosFiltrados.reduce((s, r) => s + (parseFloat(r.totalGeneral || r.total || 0) - parseFloat(r.montoPagado || 0)), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== VISTA: COMPROBANTES GLOBALES ====================
  if (seccionInicial === 'expedientes-comprobantes') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Comprobantes de Pago</h2>
          <span className="text-gray-500">{comprobantesFiltrados.length} comprobante(s)</span>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={filtroClienteComprobantes}
                onChange={(e) => setFiltroClienteComprobantes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los clientes</option>
                {clientesOrdenados.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtroEstadoComprobantes}
                onChange={(e) => setFiltroEstadoComprobantes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>

            {/* Limpiar filtros */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltroClienteComprobantes('');
                  setFiltroEstadoComprobantes('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de comprobantes */}
        {cargandoTodosComprobantes ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Cargando comprobantes...</p>
          </div>
        ) : comprobantesFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Image size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No hay comprobantes</h3>
            <p className="text-gray-500">No se encontraron comprobantes con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comprobantesFiltrados.map(comprobante => {
              const estadoComp = getEstadoComprobante(comprobante.estado);
              const IconoEstado = estadoComp.icono;

              return (
                <div
                  key={comprobante.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-800">
                          {comprobante.concepto || 'Comprobante de pago'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoComp.color}`}>
                          <IconoEstado size={12} />
                          {estadoComp.texto}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Cliente</p>
                          <p className="font-medium">{getNombreCliente(comprobante.clienteId)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Fecha</p>
                          <p className="font-medium">{formatearFecha(comprobante.fechaSubida)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Monto</p>
                          <p className="font-semibold text-green-600">${parseFloat(comprobante.monto || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Método</p>
                          <p className="font-medium capitalize">{comprobante.metodoPago || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Período</p>
                          <p className="font-medium">{comprobante.reciboPeriodo || 'N/A'}</p>
                        </div>
                      </div>

                      {comprobante.estado === 'rechazado' && comprobante.motivoRechazo && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          <strong>Motivo de rechazo:</strong> {comprobante.motivoRechazo}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {comprobante.archivoURL && (
                        <>
                          <a
                            href={comprobante.archivoURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                            title="Ver comprobante"
                          >
                            <Eye size={16} />
                            Ver
                          </a>
                          <a
                            href={comprobante.archivoURL}
                            download={comprobante.archivoNombre}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                            title="Descargar comprobante"
                          >
                            <Download size={16} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resumen */}
        {comprobantesFiltrados.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-gray-500 text-sm">Total</p>
                <p className="text-xl font-bold text-gray-800">
                  ${comprobantesFiltrados.reduce((s, c) => s + parseFloat(c.monto || 0), 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Aprobados</p>
                <p className="text-xl font-bold text-green-600">
                  {comprobantesFiltrados.filter(c => c.estado === 'aprobado').length}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pendientes</p>
                <p className="text-xl font-bold text-yellow-600">
                  {comprobantesFiltrados.filter(c => c.estado === 'pendiente').length}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Rechazados</p>
                <p className="text-xl font-bold text-red-600">
                  {comprobantesFiltrados.filter(c => c.estado === 'rechazado').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== VISTA: EXPEDIENTES DE CLIENTES (por defecto) ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Expedientes de Clientes</h2>
      </div>

      {/* Selector de Cliente */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Cliente
        </label>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={clienteSeleccionado?.id || ''}
            onChange={(e) => {
              const cliente = clientes.find(c => c.id === e.target.value);
              setClienteSeleccionado(cliente || null);
              setBusqueda('');
            }}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Seleccionar cliente --</option>
            {clientesFiltrados.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} {cliente.codigo ? `(${cliente.codigo})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenido del Expediente */}
      {clienteSeleccionado ? (
        <div className="space-y-4">
          {/* Nombre del cliente como título */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-bold">{clienteSeleccionado.nombre}</h3>
            {clienteSeleccionado.codigo && (
              <p className="text-blue-100">Código: {clienteSeleccionado.codigo}</p>
            )}
          </div>

          {/* Sección: Datos de Contacto */}
          <SeccionHeader id="contacto" titulo="Datos de Contacto" icono={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{clienteSeleccionado.email || 'No especificado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="font-medium">{clienteSeleccionado.telefono || 'No especificado'}</p>
                </div>
              </div>
              {clienteSeleccionado.notas && (
                <div className="col-span-2 flex items-start gap-3">
                  <FileText size={18} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Notas</p>
                    <p className="text-gray-700">{clienteSeleccionado.notas}</p>
                  </div>
                </div>
              )}
            </div>
          </SeccionHeader>

          {/* Sección: Equipo Terapéutico */}
          <SeccionHeader
            id="equipo"
            titulo="Equipo Terapéutico"
            icono={Users}
            badge={equipoTerapeutico.length}
          >
            <div className="pt-4">
              {equipoTerapeutico.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay terapeutas asignados a este cliente</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {equipoTerapeutico.map(terapeuta => (
                    <div
                      key={terapeuta.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{terapeuta.nombre}</p>
                        <p className="text-xs text-gray-500">{terapeuta.especialidad || 'Terapeuta'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SeccionHeader>

          {/* Sección: Asignaciones (servicios por hora) */}
          <SeccionHeader
            id="asignaciones"
            titulo="Asignaciones (Servicios por Hora)"
            icono={Clock}
            badge={asignacionesCliente.length}
          >
            <div className="pt-4">
              <div className="flex justify-end mb-3">
                {onCrearAsignacion && (
                  <button
                    onClick={() => onCrearAsignacion(clienteSeleccionado)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Plus size={16} />
                    Nueva Asignación
                  </button>
                )}
              </div>

              {asignacionesCliente.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay asignaciones para este cliente</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Terapeuta</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Servicio</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Precio/hr</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Pago Terapeuta</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Ganancia</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {asignacionesCliente.map(asig => {
                        const ganancia = calcularGanancia(asig);
                        return (
                          <tr key={asig.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              {asig.terapeutaNombre}
                              {asig.terapeutaSecundarioNombre && (
                                <span className="text-gray-400 text-xs block">
                                  + {asig.terapeutaSecundarioNombre}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">{asig.servicioNombre}</td>
                            <td className="px-3 py-2 text-right font-medium">
                              ${parseFloat(asig.precioCliente || 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              ${parseFloat(asig.pagoTerapeuta || 0).toFixed(2)}
                              {asig.pagoTerapeutaSecundario > 0 && (
                                <span className="text-gray-400 text-xs block">
                                  + ${parseFloat(asig.pagoTerapeutaSecundario).toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${ganancia.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {onEditarAsignacion && (
                                  <button
                                    onClick={() => onEditarAsignacion(asig)}
                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                    title="Editar"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 font-medium">
                      <tr>
                        <td colSpan="2" className="px-3 py-2">Total</td>
                        <td className="px-3 py-2 text-right">
                          ${asignacionesCliente.reduce((s, a) => s + (parseFloat(a.precioCliente) || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          ${asignacionesCliente.reduce((s, a) => s + (parseFloat(a.pagoTerapeuta) || 0) + (parseFloat(a.pagoTerapeutaSecundario) || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-green-600">
                          ${asignacionesCliente.reduce((s, a) => s + calcularGanancia(a), 0).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </SeccionHeader>

          {/* Sección: Contratos (paquetes mensuales) */}
          <SeccionHeader
            id="contratos"
            titulo="Contratos (Paquetes Mensuales)"
            icono={Briefcase}
            badge={contratosCliente.length}
          >
            <div className="pt-4">
              <div className="flex justify-end mb-3">
                {onCrearContrato && (
                  <button
                    onClick={() => onCrearContrato(clienteSeleccionado)}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    <Plus size={16} />
                    Nuevo Contrato
                  </button>
                )}
              </div>

              {contratosCliente.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay contratos para este cliente</p>
              ) : (
                <div className="space-y-3">
                  {contratosCliente.map(contrato => (
                    <div
                      key={contrato.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                              {contrato.tipoContrato?.replace('_', ' ').toUpperCase() || 'CONTRATO'}
                            </span>
                            <span className="text-gray-600 text-sm">{contrato.servicio}</span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Cobro Mensual</p>
                              <p className="font-semibold text-green-600">
                                ${parseFloat(contrato.cobroCliente?.montoMensual || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Horas Estimadas</p>
                              <p className="font-medium">{contrato.horasEstimadas || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Terapeutas</p>
                              <p className="font-medium">
                                {(contrato.terapeutas || []).map(t => t.nombre || t).join(', ') || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Ganancia Est.</p>
                              <p className="font-semibold text-blue-600">
                                {contrato.gananciaEstimada
                                  ? `$${parseFloat(contrato.gananciaEstimada).toFixed(2)}`
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {onEditarContrato && (
                          <button
                            onClick={() => onEditarContrato(contrato)}
                            className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                            title="Editar contrato"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SeccionHeader>

          {/* Sección: Recibos */}
          <SeccionHeader
            id="recibos"
            titulo="Recibos"
            icono={Receipt}
            badge={recibosCliente.length}
          >
            <div className="pt-4">
              {recibosCliente.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay recibos para este cliente</p>
              ) : (
                <div className="space-y-3">
                  {recibosCliente
                    .sort((a, b) => (b.mes || '').localeCompare(a.mes || ''))
                    .map(recibo => {
                      const estadoPago = getEstadoPago(recibo);
                      const IconoEstado = estadoPago.icono;
                      const total = parseFloat(recibo.totalGeneral || recibo.total || 0);

                      return (
                        <div
                          key={recibo.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-800">
                                  {recibo.reciboId || `Recibo ${recibo.mes}`}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoPago.color}`}>
                                  <IconoEstado size={12} />
                                  {estadoPago.texto}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Período</p>
                                  <p className="font-medium">{formatearPeriodo(recibo.mes)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Total</p>
                                  <p className="font-semibold text-green-600">${total.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Pagado</p>
                                  <p className="font-medium">${parseFloat(recibo.montoPagado || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Citas</p>
                                  <p className="font-medium">{recibo.totalCitas || (recibo.citas?.length) || 0}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => generarReciboPDF(recibo)}
                                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                                title="Descargar PDF"
                              >
                                <Download size={16} />
                                PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Resumen de recibos */}
              {recibosCliente.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total de {recibosCliente.length} recibo(s)</span>
                    <span className="font-semibold">
                      ${recibosCliente.reduce((s, r) => s + parseFloat(r.totalGeneral || r.total || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </SeccionHeader>

          {/* Sección: Comprobantes de Pago */}
          <SeccionHeader
            id="comprobantes"
            titulo="Comprobantes de Pago"
            icono={Image}
            badge={comprobantesCliente.length}
          >
            <div className="pt-4">
              {cargandoComprobantes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-gray-500">Cargando comprobantes...</span>
                </div>
              ) : comprobantesCliente.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay comprobantes de pago para este cliente</p>
              ) : (
                <div className="space-y-3">
                  {comprobantesCliente.map(comprobante => {
                    const estadoComp = getEstadoComprobante(comprobante.estado);
                    const IconoEstado = estadoComp.icono;

                    return (
                      <div
                        key={comprobante.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-gray-800">
                                {comprobante.concepto || 'Comprobante de pago'}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoComp.color}`}>
                                <IconoEstado size={12} />
                                {estadoComp.texto}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Fecha</p>
                                <p className="font-medium">{formatearFecha(comprobante.fechaSubida)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Monto</p>
                                <p className="font-semibold text-green-600">${parseFloat(comprobante.monto || 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Método</p>
                                <p className="font-medium capitalize">{comprobante.metodoPago || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Período</p>
                                <p className="font-medium">{comprobante.reciboPeriodo || 'N/A'}</p>
                              </div>
                            </div>

                            {comprobante.estado === 'rechazado' && comprobante.motivoRechazo && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                                <strong>Motivo de rechazo:</strong> {comprobante.motivoRechazo}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {comprobante.archivoURL && (
                              <>
                                <a
                                  href={comprobante.archivoURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                                  title="Ver comprobante"
                                >
                                  <Eye size={16} />
                                  Ver
                                </a>
                                <a
                                  href={comprobante.archivoURL}
                                  download={comprobante.archivoNombre}
                                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                                  title="Descargar comprobante"
                                >
                                  <Download size={16} />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Resumen de comprobantes */}
              {comprobantesCliente.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <div className="flex gap-4">
                      <span className="text-gray-600">
                        {comprobantesCliente.filter(c => c.estado === 'aprobado').length} aprobado(s)
                      </span>
                      <span className="text-yellow-600">
                        {comprobantesCliente.filter(c => c.estado === 'pendiente').length} pendiente(s)
                      </span>
                    </div>
                    <span className="font-semibold">
                      Total: ${comprobantesCliente.reduce((s, c) => s + parseFloat(c.monto || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </SeccionHeader>

          {/* Sección: Historial de Citas */}
          <SeccionHeader
            id="citas"
            titulo="Historial de Citas"
            icono={Calendar}
            badge={citasCliente.length}
          >
            <div className="pt-4">
              {citasCliente.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay citas registradas para este cliente</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Fecha</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Horario</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Terapeuta</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Servicio</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Horas</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Precio</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {citasCliente.map(cita => {
                        const fecha = cita.fecha ? new Date(cita.fecha) : null;
                        const horas = parseFloat(cita.horas) || 0;
                        const precio = parseFloat(cita.precio) || parseFloat(cita.precioHora) || 0;

                        return (
                          <tr key={cita.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              {fecha ? fecha.toLocaleDateString('es-MX', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              }) : 'N/A'}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {cita.horaInicio || ''} - {cita.horaFin || ''}
                            </td>
                            <td className="px-3 py-2">{cita.terapeuta || cita.terapeutaNombre || 'N/A'}</td>
                            <td className="px-3 py-2">{cita.servicio || cita.tipoServicio || 'N/A'}</td>
                            <td className="px-3 py-2 text-right">{horas.toFixed(1)}</td>
                            <td className="px-3 py-2 text-right font-medium">
                              ${precio.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cita.completada || cita.estado === 'completada'
                                  ? 'bg-green-100 text-green-700'
                                  : cita.cancelada || cita.estado === 'cancelada'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {cita.completada || cita.estado === 'completada' ? 'Completada' :
                                 cita.cancelada || cita.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 font-medium">
                      <tr>
                        <td colSpan="4" className="px-3 py-2">Total ({citasCliente.length} citas)</td>
                        <td className="px-3 py-2 text-right">
                          {citasCliente.reduce((s, c) => s + (parseFloat(c.horas) || 0), 0).toFixed(1)} hrs
                        </td>
                        <td className="px-3 py-2 text-right">
                          ${citasCliente.reduce((s, c) => s + (parseFloat(c.precio) || parseFloat(c.precioHora) || 0), 0).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </SeccionHeader>

          {/* Sección: Resumen Financiero */}
          <SeccionHeader id="financiero" titulo="Resumen Financiero" icono={DollarSign}>
            <div className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Balance */}
                <div className={`p-4 rounded-lg ${resumenFinanciero.balance > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={18} className={resumenFinanciero.balance > 0 ? 'text-red-500' : 'text-green-500'} />
                    <span className="text-sm text-gray-600">Balance Pendiente</span>
                  </div>
                  <p className={`text-2xl font-bold ${resumenFinanciero.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${resumenFinanciero.balance.toFixed(2)}
                  </p>
                </div>

                {/* Total Facturado */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={18} className="text-blue-500" />
                    <span className="text-sm text-gray-600">Total Facturado</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    ${resumenFinanciero.totalFacturado.toFixed(2)}
                  </p>
                </div>

                {/* Último Pago */}
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-600">Último Pago</span>
                  </div>
                  {resumenFinanciero.ultimoPago ? (
                    <div>
                      <p className="text-lg font-bold text-gray-700">
                        ${parseFloat(resumenFinanciero.ultimoPago.total || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(resumenFinanciero.ultimoPago.fechaPago).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400">Sin pagos registrados</p>
                  )}
                </div>
              </div>

              {/* Link a recibos */}
              {onVerRecibos && (
                <button
                  onClick={() => onVerRecibos(clienteSeleccionado)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <ExternalLink size={16} />
                  Ver todos los recibos de {clienteSeleccionado.nombre}
                </button>
              )}
            </div>
          </SeccionHeader>
        </div>
      ) : (
        /* Estado vacío */
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Selecciona un cliente
          </h3>
          <p className="text-gray-500">
            Usa el selector de arriba para ver el expediente completo de un cliente
          </p>
        </div>
      )}
    </div>
  );
};

export default Expedientes;
