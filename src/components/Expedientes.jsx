// src/components/Expedientes.jsx
//
// Vista de Expediente de Cliente - Muestra toda la información relacionada a un cliente:
// - Datos de contacto
// - Equipo terapéutico
// - Asignaciones de servicio (por hora)
// - Contratos mensuales (paquetes)
// - Resumen financiero
//

import React, { useState, useMemo } from 'react';
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
  ExternalLink
} from 'lucide-react';

const Expedientes = ({
  clientes = [],
  terapeutas = [],
  servicios = [],
  asignaciones = [],
  contratos = [],
  recibos = [],
  onEditarAsignacion,
  onCrearAsignacion,
  onEditarContrato,
  onCrearContrato,
  onVerRecibos
}) => {
  // Estado del cliente seleccionado
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Secciones colapsables
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    contacto: true,
    equipo: true,
    asignaciones: true,
    contratos: true,
    financiero: true
  });

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
                              {onEditarAsignacion && (
                                <button
                                  onClick={() => onEditarAsignacion(asig)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
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
                            className="text-purple-600 hover:text-purple-800"
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
