// src/components/configuracion/ContratosMensuales.jsx
//
// Componente para administrar contratos mensuales (sombra y paquetes)
// Permite configurar cobros fijos mensuales a clientes
//

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Users,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
  Check,
  Calendar,
  Briefcase,
  TrendingUp
} from 'lucide-react';

// Tipos de contrato disponibles
const TIPOS_CONTRATO = [
  { 
    value: 'mensual_fijo', 
    label: 'Mensual Fijo', 
    descripcion: 'Cobro y pago mensual fijo',
    ejemplo: 'Anna, Isabella'
  },
  { 
    value: 'hibrido', 
    label: 'Híbrido', 
    descripcion: 'Cobro mensual fijo, pago por hora a terapeuta',
    ejemplo: 'Eva'
  },
  { 
    value: 'paquete', 
    label: 'Paquete', 
    descripcion: 'Paquete de horas con precio fijo mensual',
    ejemplo: 'Matías'
  },
  {
    value: 'desglosado',
    label: 'Desglosado',
    descripcion: 'Monto fijo con descuento por cancelaciones (para aseguradoras)',
    ejemplo: 'Daniel'
  }
];

const ContratosMensuales = ({ 
  contratos = [],
  clientes = [],
  terapeutas = [],
  servicios = [],
  asignaciones = [],
  onCrear,
  onActualizar,
  onEliminar,
  onCrearAsignacion
}) => {
  // Estados
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  
  // Formulario
  const [formulario, setFormulario] = useState({
    clienteId: '',
    clienteNombre: '',
    tipoContrato: 'mensual_fijo',
    servicio: 'Sombra - Asistencia Escolar',
    terapeutas: [], // Ahora cada terapeuta tiene: { id, nombre, pagoTipo, pagoMonto }
    terapeutaSeleccionada: '',
    terapeutaPagoTipo: 'por_hora', // Tipo de pago para nueva terapeuta
    terapeutaPagoMonto: '', // Monto para nueva terapeuta
    cobroClienteTipo: 'mensual',
    cobroClienteMensual: '',
    cobroClientePorHora: '',
    montoMensualBase: '', // Para contratos desglosados: monto fijo antes de descuentos
    horasEstimadas: '',
    descripcionRecibo: '',
    notas: '',
    crearAsignaciones: true // Nuevo: auto-crear asignaciones
  });

  // Contratos activos
  const contratosActivos = useMemo(() => {
    return contratos.filter(c => c.activo !== false);
  }, [contratos]);

  // Contratos filtrados
  const contratosFiltrados = useMemo(() => {
    if (!busqueda) return contratosActivos;
    
    const busquedaLower = busqueda.toLowerCase();
    return contratosActivos.filter(c => 
      c.clienteNombre?.toLowerCase().includes(busquedaLower) ||
      c.servicio?.toLowerCase().includes(busquedaLower) ||
      c.terapeutas?.some(t => (t.nombre || t).toLowerCase().includes(busquedaLower))
    );
  }, [contratosActivos, busqueda]);

  // Mostrar mensaje temporal
  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  // Resetear formulario
  const resetearFormulario = () => {
    setFormulario({
      clienteId: '',
      clienteNombre: '',
      tipoContrato: 'mensual_fijo',
      servicio: 'Sombra - Asistencia Escolar',
      terapeutas: [],
      terapeutaSeleccionada: '',
      terapeutaPagoTipo: 'por_hora',
      terapeutaPagoMonto: '',
      cobroClienteTipo: 'mensual',
      cobroClienteMensual: '',
      cobroClientePorHora: '',
      montoMensualBase: '',
      horasEstimadas: '',
      descripcionRecibo: '',
      notas: '',
      crearAsignaciones: true
    });
  };

  // Abrir modal para nuevo contrato
  const nuevoContrato = () => {
    resetearFormulario();
    setEditando(null);
    setMostrarModal(true);
  };

  // Abrir modal para editar
  const editarContrato = (contrato) => {
    setFormulario({
      clienteId: contrato.clienteId || '',
      clienteNombre: contrato.clienteNombre || '',
      tipoContrato: contrato.tipoContrato || 'mensual_fijo',
      servicio: contrato.servicio || 'Sombra - Asistencia Escolar',
      terapeutas: (contrato.terapeutas || []).map(t => ({
        id: t.id,
        nombre: t.nombre,
        pagoTipo: t.pagoTipo || contrato.pagoTerapeuta?.tipo || 'por_hora',
        pagoMonto: t.pagoMonto || (contrato.pagoTerapeuta?.tipo === 'mensual' 
          ? contrato.pagoTerapeuta?.montoMensual 
          : contrato.pagoTerapeuta?.montoPorHora) || 0
      })),
      terapeutaSeleccionada: '',
      terapeutaPagoTipo: 'por_hora',
      terapeutaPagoMonto: '',
      cobroClienteTipo: contrato.cobroCliente?.tipo || 'mensual',
      cobroClienteMensual: contrato.cobroCliente?.montoMensual?.toString() || '',
      cobroClientePorHora: contrato.cobroCliente?.montoPorHora?.toString() || '',
      montoMensualBase: contrato.montoMensualBase?.toString() || '',
      horasEstimadas: contrato.horasEstimadas?.toString() || '',
      descripcionRecibo: contrato.descripcionRecibo || '',
      notas: contrato.notas || ''
    });
    setEditando(contrato.id);
    setMostrarModal(true);
  };

  // Manejar cambio de cliente
  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const cliente = clientes.find(c => c.id === clienteId);
    setFormulario(prev => ({
      ...prev,
      clienteId,
      clienteNombre: cliente?.nombre || ''
    }));
  };

  // Manejar cambio de tipo de contrato
  const handleTipoContratoChange = (tipo) => {
    let cobroTipo = 'mensual';
    let pagoTipoDefault = 'por_hora'; // Tipo de pago por defecto para nuevas terapeutas

    switch (tipo) {
      case 'mensual_fijo':
        cobroTipo = 'mensual';
        pagoTipoDefault = 'mensual';
        break;
      case 'hibrido':
        cobroTipo = 'mensual';
        pagoTipoDefault = 'por_hora';
        break;
      case 'paquete':
        cobroTipo = 'mensual';
        pagoTipoDefault = 'por_hora';
        break;
      case 'desglosado':
        cobroTipo = 'por_hora';
        pagoTipoDefault = 'por_hora';
        break;
    }

    setFormulario(prev => ({
      ...prev,
      tipoContrato: tipo,
      cobroClienteTipo: cobroTipo,
      terapeutaPagoTipo: pagoTipoDefault
    }));
  };

  // Agregar terapeuta al contrato
  const agregarTerapeuta = () => {
    if (!formulario.terapeutaSeleccionada) return;
    
    const terapeuta = terapeutas.find(t => t.id === formulario.terapeutaSeleccionada);
    if (!terapeuta) return;

    // Verificar que no esté ya agregada
    if (formulario.terapeutas.some(t => t.id === terapeuta.id)) {
      mostrarMensaje('Esta terapeuta ya está en el contrato', 'error');
      return;
    }

    // Validar que tenga monto
    const monto = parseFloat(formulario.terapeutaPagoMonto) || 0;
    if (monto <= 0) {
      mostrarMensaje('Ingresa la tarifa para la terapeuta', 'error');
      return;
    }

    setFormulario(prev => ({
      ...prev,
      terapeutas: [...prev.terapeutas, { 
        id: terapeuta.id, 
        nombre: terapeuta.nombre,
        pagoTipo: prev.terapeutaPagoTipo,
        pagoMonto: monto
      }],
      terapeutaSeleccionada: '',
      terapeutaPagoMonto: '' // Limpiar el monto para la siguiente
    }));
  };

  // Actualizar tarifa de terapeuta existente
  const actualizarTarifaTerapeuta = (terapeutaId, campo, valor) => {
    setFormulario(prev => ({
      ...prev,
      terapeutas: prev.terapeutas.map(t => 
        t.id === terapeutaId 
          ? { ...t, [campo]: campo === 'pagoMonto' ? parseFloat(valor) || 0 : valor }
          : t
      )
    }));
  };

  // Quitar terapeuta del contrato
  const quitarTerapeuta = (terapeutaId) => {
    setFormulario(prev => ({
      ...prev,
      terapeutas: prev.terapeutas.filter(t => t.id !== terapeutaId)
    }));
  };

  /**
   * Busca el servicio que mejor coincide con el nombre del contrato
   */
  const buscarServicioId = (nombreServicio) => {
    if (!servicios || servicios.length === 0) return null;
    
    const nombreLower = nombreServicio?.toLowerCase() || '';
    
    // Mapeo de nombres de contrato a nombres de servicio
    const mapeoServicios = {
      'sombra': 'Servicios de Sombra',
      'asistencia escolar': 'Servicios de Sombra',
      'aba': 'Sesión de ABA estándar',
      'ocupacional': 'Terapia Ocupacional',
      'paquete': 'Paquete 4hr/semana'
    };
    
    // Buscar por mapeo
    for (const [clave, valor] of Object.entries(mapeoServicios)) {
      if (nombreLower.includes(clave)) {
        const servicio = servicios.find(s => s.nombre === valor);
        if (servicio) return servicio;
      }
    }
    
    // Buscar por coincidencia parcial
    return servicios.find(s => 
      nombreLower.includes(s.nombre?.toLowerCase()) ||
      s.nombre?.toLowerCase().includes(nombreLower.split('-')[0]?.trim())
    );
  };

  /**
   * Verifica si ya existe una asignación para cliente+terapeuta+servicio
   */
  const existeAsignacion = (clienteId, terapeutaId, servicioNombre) => {
    return asignaciones.some(a => 
      a.clienteId === clienteId &&
      a.terapeutaId === terapeutaId &&
      (a.servicioNombre === servicioNombre || a.servicio === servicioNombre)
    );
  };

  /**
   * Crea asignaciones automáticas basadas en el contrato
   */
  const crearAsignacionesDesdeContrato = async (datos) => {
    if (!onCrearAsignacion) {
      console.warn('No se proporcionó función onCrearAsignacion');
      return { creadas: 0, existentes: 0 };
    }

    const servicio = buscarServicioId(datos.servicio);
    let creadas = 0;
    let existentes = 0;

    // Calcular precio por hora al cliente
    let precioClienteHora = 0;
    if (datos.cobroCliente?.tipo === 'por_hora') {
      precioClienteHora = datos.cobroCliente.montoPorHora || 0;
    } else if (datos.horasEstimadas > 0) {
      // Dividir cobro mensual entre horas estimadas
      precioClienteHora = Math.round((datos.cobroCliente?.montoMensual || 0) / datos.horasEstimadas);
    }

    // Crear una asignación por cada terapeuta
    for (const terapeuta of datos.terapeutas) {
      // Verificar si ya existe
      if (existeAsignacion(datos.clienteId, terapeuta.id, datos.servicio)) {
        existentes++;
        continue;
      }

      // Calcular pago por hora al terapeuta
      let pagoTerapeutaHora = 0;
      if (terapeuta.pagoTipo === 'por_hora') {
        pagoTerapeutaHora = terapeuta.pagoMonto || 0;
      } else if (datos.horasEstimadas > 0 && datos.terapeutas.length > 0) {
        // Pago mensual dividido entre horas (distribuido equitativamente)
        const horasPorTerapeuta = datos.horasEstimadas / datos.terapeutas.length;
        pagoTerapeutaHora = Math.round((terapeuta.pagoMonto || 0) / horasPorTerapeuta);
      }

      const asignacionData = {
        clienteId: datos.clienteId,
        clienteNombre: datos.clienteNombre,
        terapeutaId: terapeuta.id,
        terapeutaNombre: terapeuta.nombre,
        servicioId: servicio?.id || null,
        servicioNombre: servicio?.nombre || datos.servicio,
        servicio: servicio?.nombre || datos.servicio,
        precioCliente: precioClienteHora,
        pagoTerapeuta: pagoTerapeutaHora,
        activo: true,
        creadoDesdeContrato: true,
        contratoId: null // Se actualizará después de guardar el contrato
      };

      try {
        await onCrearAsignacion(asignacionData);
        creadas++;
      } catch (error) {
        console.error('Error creando asignación para', terapeuta.nombre, error);
      }
    }

    return { creadas, existentes };
  };

  // Guardar contrato
  const handleGuardar = async () => {
    // Validaciones
    if (!formulario.clienteNombre) {
      mostrarMensaje('Selecciona un cliente', 'error');
      return;
    }
    if (formulario.terapeutas.length === 0) {
      mostrarMensaje('Agrega al menos una terapeuta', 'error');
      return;
    }
    
    // Validar que todas las terapeutas tengan tarifa
    const sinTarifa = formulario.terapeutas.filter(t => !t.pagoMonto || t.pagoMonto <= 0);
    if (sinTarifa.length > 0) {
      mostrarMensaje(`Falta tarifa para: ${sinTarifa.map(t => t.nombre).join(', ')}`, 'error');
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        clienteId: formulario.clienteId,
        clienteNombre: formulario.clienteNombre,
        tipoContrato: formulario.tipoContrato,
        servicio: formulario.servicio,
        terapeutas: formulario.terapeutas, // Ahora incluye pagoTipo y pagoMonto por cada una
        cobroCliente: {
          tipo: formulario.cobroClienteTipo,
          montoMensual: formulario.cobroClienteTipo === 'mensual'
            ? parseFloat(formulario.cobroClienteMensual) || 0
            : null,
          montoPorHora: formulario.cobroClienteTipo === 'por_hora'
            ? parseFloat(formulario.cobroClientePorHora) || 0
            : null
        },
        // Para contratos desglosados: monto fijo base antes de descuentos por cancelaciones
        montoMensualBase: formulario.tipoContrato === 'desglosado'
          ? parseFloat(formulario.montoMensualBase) || 0
          : null,
        horasEstimadas: parseFloat(formulario.horasEstimadas) || 0,
        descripcionRecibo: formulario.descripcionRecibo,
        notas: formulario.notas
      };

      if (editando) {
        await onActualizar(editando, datos);
        mostrarMensaje('Contrato actualizado correctamente');
      } else {
        await onCrear(datos);
        
        // Crear asignaciones automáticamente si está habilitado
        if (formulario.crearAsignaciones && onCrearAsignacion) {
          const resultado = await crearAsignacionesDesdeContrato(datos);
          if (resultado.creadas > 0) {
            mostrarMensaje(
              `Contrato creado. ${resultado.creadas} asignación(es) creada(s)` +
              (resultado.existentes > 0 ? ` (${resultado.existentes} ya existían)` : '')
            );
          } else if (resultado.existentes > 0) {
            mostrarMensaje(`Contrato creado. Las asignaciones ya existían.`);
          } else {
            mostrarMensaje('Contrato creado correctamente');
          }
        } else {
          mostrarMensaje('Contrato creado correctamente');
        }
      }

      setMostrarModal(false);
    } catch (error) {
      mostrarMensaje('Error al guardar: ' + error.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar contrato
  const handleEliminar = async (contratoId) => {
    if (!window.confirm('¿Eliminar este contrato?')) return;

    try {
      await onEliminar(contratoId);
      mostrarMensaje('Contrato eliminado');
    } catch (error) {
      mostrarMensaje('Error al eliminar: ' + error.message, 'error');
    }
  };

  // Calcular ganancia estimada
  const calcularGanancia = (contrato) => {
    const cobroMensual = contrato.cobroCliente?.tipo === 'mensual'
      ? contrato.cobroCliente.montoMensual
      : (contrato.cobroCliente?.montoPorHora || 0) * (contrato.horasEstimadas || 0);
    
    // Sumar pagos de todas las terapeutas
    let pagoMensual = 0;
    if (contrato.terapeutas && Array.isArray(contrato.terapeutas)) {
      contrato.terapeutas.forEach(t => {
        if (t.pagoTipo === 'mensual') {
          pagoMensual += t.pagoMonto || 0;
        } else {
          // Por hora: dividir horas estimadas entre número de terapeutas (aproximación)
          const horasPorTerapeuta = (contrato.horasEstimadas || 0) / contrato.terapeutas.length;
          pagoMensual += (t.pagoMonto || 0) * horasPorTerapeuta;
        }
      });
    } else if (contrato.pagoTerapeuta) {
      // Compatibilidad con estructura anterior
      pagoMensual = contrato.pagoTerapeuta?.tipo === 'mensual'
        ? contrato.pagoTerapeuta.montoMensual
        : (contrato.pagoTerapeuta?.montoPorHora || 0) * (contrato.horasEstimadas || 0);
    }
    
    return cobroMensual - pagoMensual;
  };

  // Calcular pago total a terapeutas (para mostrar en estadísticas)
  const calcularPagoTotalTerapeutas = (contrato) => {
    let pagoMensual = 0;
    if (contrato.terapeutas && Array.isArray(contrato.terapeutas)) {
      contrato.terapeutas.forEach(t => {
        if (t.pagoTipo === 'mensual') {
          pagoMensual += t.pagoMonto || 0;
        } else {
          const horasPorTerapeuta = (contrato.horasEstimadas || 0) / contrato.terapeutas.length;
          pagoMensual += (t.pagoMonto || 0) * horasPorTerapeuta;
        }
      });
    } else if (contrato.pagoTerapeuta) {
      pagoMensual = contrato.pagoTerapeuta?.tipo === 'mensual'
        ? contrato.pagoTerapeuta.montoMensual || 0
        : (contrato.pagoTerapeuta?.montoPorHora || 0) * (contrato.horasEstimadas || 0);
    }
    return pagoMensual;
  };

  // Obtener etiqueta del tipo de contrato
  const getTipoContratoLabel = (tipo) => {
    return TIPOS_CONTRATO.find(t => t.value === tipo)?.label || tipo;
  };

  // Obtener color del tipo de contrato
  const getTipoContratoColor = (tipo) => {
    switch (tipo) {
      case 'mensual_fijo': return 'bg-blue-100 text-blue-700';
      case 'hibrido': return 'bg-purple-100 text-purple-700';
      case 'paquete': return 'bg-green-100 text-green-700';
      case 'desglosado': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Mensaje de feedback */}
      {mensaje && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          mensaje.tipo === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {mensaje.tipo === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {mensaje.texto}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Contratos Mensuales</h2>
            <p className="text-purple-100">
              Configura cobros fijos mensuales para sombra y paquetes
            </p>
          </div>
          <button
            onClick={nuevoContrato}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            <Plus size={20} />
            Nuevo Contrato
          </button>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{contratosActivos.length}</div>
            <div className="text-purple-100 text-sm">Contratos</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">
              ${contratosActivos.reduce((sum, c) => sum + (c.cobroCliente?.montoMensual || 0), 0).toLocaleString()}
            </div>
            <div className="text-purple-100 text-sm">Cobro Mensual</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">
              ${contratosActivos.reduce((sum, c) => sum + calcularPagoTotalTerapeutas(c), 0).toLocaleString()}
            </div>
            <div className="text-purple-100 text-sm">Pago Terapeutas</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">
              ${contratosActivos.reduce((sum, c) => sum + calcularGanancia(c), 0).toLocaleString()}
            </div>
            <div className="text-purple-100 text-sm">Ganancia Est.</div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente, servicio o terapeuta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Lista de contratos */}
      <div className="space-y-4">
        {contratosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No hay contratos configurados
            </h3>
            <p className="text-gray-500 mb-4">
              Crea contratos mensuales para servicios de sombra y paquetes
            </p>
            <button
              onClick={nuevoContrato}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus size={20} />
              Crear primer contrato
            </button>
          </div>
        ) : (
          contratosFiltrados.map(contrato => {
            const ganancia = calcularGanancia(contrato);
            return (
              <div key={contrato.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    {/* Info principal */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Briefcase className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {contrato.clienteNombre}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTipoContratoColor(contrato.tipoContrato)}`}>
                            {getTipoContratoLabel(contrato.tipoContrato)}
                          </span>
                        </div>
                        <p className="text-gray-500">{contrato.servicio}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Users size={14} />
                            {contrato.terapeutas?.map(t => {
                              const nombre = t.nombre || t;
                              const tarifa = t.pagoMonto ? ` ($${t.pagoMonto}/${t.pagoTipo === 'mensual' ? 'mes' : 'hr'})` : '';
                              return nombre + tarifa;
                            }).join(', ')}
                          </span>
                          {contrato.horasEstimadas > 0 && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <Clock size={14} />
                              ~{contrato.horasEstimadas} hrs/mes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => editarContrato(contrato)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleEliminar(contrato.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Montos */}
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-1">Cobro Cliente</div>
                      <div className="font-semibold text-gray-800">
                        {contrato.tipoContrato === 'desglosado' && contrato.montoMensualBase ? (
                          <div>
                            <div>${contrato.montoMensualBase?.toLocaleString()}/mes</div>
                            <div className="text-xs text-gray-500 font-normal">
                              (${contrato.cobroCliente?.montoPorHora?.toLocaleString()}/hr para desglose)
                            </div>
                          </div>
                        ) : contrato.cobroCliente?.tipo === 'mensual' ? (
                          <>${contrato.cobroCliente.montoMensual?.toLocaleString()}/mes</>
                        ) : (
                          <>${contrato.cobroCliente?.montoPorHora?.toLocaleString()}/hr</>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-1">Pago Terapeutas</div>
                      <div className="font-semibold text-gray-800">
                        {contrato.terapeutas?.some(t => t.pagoMonto) ? (
                          // Nueva estructura con tarifas individuales
                          <div className="space-y-0.5">
                            {contrato.terapeutas.map((t, idx) => (
                              <div key={idx} className="text-sm">
                                {t.nombre?.split(' ')[0]}: ${t.pagoMonto?.toLocaleString()}/{t.pagoTipo === 'mensual' ? 'mes' : 'hr'}
                              </div>
                            ))}
                          </div>
                        ) : contrato.pagoTerapeuta ? (
                          // Compatibilidad con estructura anterior
                          contrato.pagoTerapeuta?.tipo === 'mensual' ? (
                            <>${contrato.pagoTerapeuta.montoMensual?.toLocaleString()}/mes</>
                          ) : (
                            <>${contrato.pagoTerapeuta?.montoPorHora?.toLocaleString()}/hr</>
                          )
                        ) : (
                          <span className="text-gray-400">No definido</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-1">Ganancia Est.</div>
                      <div className={`font-semibold ${ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ganancia >= 0 ? '+' : ''}${ganancia.toLocaleString()}/mes
                      </div>
                    </div>
                  </div>

                  {/* Descripción del recibo */}
                  {contrato.descripcionRecibo && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      <span className="text-gray-400">En recibo:</span> {contrato.descripcionRecibo}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de crear/editar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b bg-purple-50">
              <h3 className="text-lg font-semibold text-gray-800">
                {editando ? 'Editar Contrato' : 'Nuevo Contrato Mensual'}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-1 hover:bg-purple-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Formulario */}
            <div className="p-4 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  value={formulario.clienteId}
                  onChange={handleClienteChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contrato *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_CONTRATO.map(tipo => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => handleTipoContratoChange(tipo.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        formulario.tipoContrato === tipo.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-800">{tipo.label}</div>
                      <div className="text-xs text-gray-500">{tipo.descripcion}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicio
                </label>
                <select
                  value={formulario.servicio}
                  onChange={(e) => setFormulario(prev => ({ ...prev, servicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Sombra - Asistencia Escolar">Sombra - Asistencia Escolar</option>
                  <option value="Paquete de Terapia">Paquete de Terapia</option>
                  <option value="Servicios de ABA">Servicios de ABA</option>
                  <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                </select>
              </div>

              {/* Terapeutas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terapeutas y Tarifas *
                </label>
                
                {/* Agregar nueva terapeuta */}
                <div className="bg-green-50 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <label className="block text-xs text-green-700 mb-1">Terapeuta</label>
                      <select
                        value={formulario.terapeutaSeleccionada}
                        onChange={(e) => setFormulario(prev => ({ ...prev, terapeutaSeleccionada: e.target.value }))}
                        className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {terapeutas.filter(t => !formulario.terapeutas.some(ft => ft.id === t.id)).map(t => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-green-700 mb-1">Tipo Pago</label>
                      <select
                        value={formulario.terapeutaPagoTipo}
                        onChange={(e) => setFormulario(prev => ({ ...prev, terapeutaPagoTipo: e.target.value }))}
                        className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value="por_hora">Por Hora</option>
                        <option value="mensual">Mensual</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-green-700 mb-1">
                        {formulario.terapeutaPagoTipo === 'mensual' ? 'Monto/Mes' : 'Monto/Hora'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={formulario.terapeutaPagoMonto}
                          onChange={(e) => setFormulario(prev => ({ ...prev, terapeutaPagoMonto: e.target.value }))}
                          placeholder={formulario.terapeutaPagoTipo === 'mensual' ? '19500' : '200'}
                          className="w-full pl-6 pr-2 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={agregarTerapeuta}
                        disabled={!formulario.terapeutaSeleccionada || !formulario.terapeutaPagoMonto}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Lista de terapeutas agregadas */}
                {formulario.terapeutas.length > 0 && (
                  <div className="space-y-2">
                    {formulario.terapeutas.map(t => (
                      <div 
                        key={t.id} 
                        className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-purple-800">{t.nombre}</span>
                          <span className="text-sm text-purple-600">
                            ${t.pagoMonto?.toLocaleString()}/{t.pagoTipo === 'mensual' ? 'mes' : 'hr'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Editar tarifa inline */}
                          <input
                            type="number"
                            value={t.pagoMonto}
                            onChange={(e) => actualizarTarifaTerapeuta(t.id, 'pagoMonto', e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-purple-200 rounded focus:ring-1 focus:ring-purple-500"
                          />
                          <select
                            value={t.pagoTipo}
                            onChange={(e) => actualizarTarifaTerapeuta(t.id, 'pagoTipo', e.target.value)}
                            className="px-2 py-1 text-sm border border-purple-200 rounded focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="por_hora">/hr</option>
                            <option value="mensual">/mes</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => quitarTerapeuta(t.id)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {formulario.terapeutas.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Agrega al menos una terapeuta con su tarifa
                  </p>
                )}
              </div>

              {/* Cobro al cliente */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <DollarSign size={18} />
                  Cobro al Cliente
                </h4>
                {formulario.tipoContrato === 'desglosado' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-blue-700 mb-1">Monto Mensual Base (antes de descuentos)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={formulario.montoMensualBase}
                          onChange={(e) => setFormulario(prev => ({ ...prev, montoMensualBase: e.target.value }))}
                          placeholder="21000"
                          className="w-full pl-8 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Este es el monto fijo mensual. Se descontarán las citas canceladas automáticamente.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-blue-700 mb-1">Precio por Hora (para desglose en recibo)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={formulario.cobroClientePorHora}
                          onChange={(e) => setFormulario(prev => ({ ...prev, cobroClientePorHora: e.target.value }))}
                          placeholder="139"
                          className="w-full pl-8 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Este precio se usa para mostrar el desglose por hora a la aseguradora.
                      </p>
                    </div>
                  </div>
                ) : formulario.cobroClienteTipo === 'mensual' ? (
                  <div>
                    <label className="block text-sm text-blue-700 mb-1">Monto Mensual</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formulario.cobroClienteMensual}
                        onChange={(e) => setFormulario(prev => ({ ...prev, cobroClienteMensual: e.target.value }))}
                        placeholder="24000"
                        className="w-full pl-8 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-blue-700 mb-1">Precio por Hora</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formulario.cobroClientePorHora}
                        onChange={(e) => setFormulario(prev => ({ ...prev, cobroClientePorHora: e.target.value }))}
                        placeholder="139"
                        className="w-full pl-8 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Horas estimadas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas Estimadas por Mes
                </label>
                <div className="relative max-w-xs">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={formulario.horasEstimadas}
                    onChange={(e) => setFormulario(prev => ({ ...prev, horasEstimadas: e.target.value }))}
                    placeholder="120"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Descripción para recibo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción para Recibo
                </label>
                <input
                  type="text"
                  value={formulario.descripcionRecibo}
                  onChange={(e) => setFormulario(prev => ({ ...prev, descripcionRecibo: e.target.value }))}
                  placeholder="Ej: Asistencia escolar - Westhill"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este texto aparecerá en el recibo del cliente
                </p>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={formulario.notas}
                  onChange={(e) => setFormulario(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Información adicional..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Checkbox para crear asignaciones */}
              {!editando && onCrearAsignacion && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formulario.crearAsignaciones}
                      onChange={(e) => setFormulario(prev => ({ 
                        ...prev, 
                        crearAsignaciones: e.target.checked 
                      }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="font-medium text-blue-900">
                        Crear asignaciones automáticamente
                      </span>
                      <p className="text-sm text-blue-700 mt-0.5">
                        Se creará una asignación de precio por hora para cada terapeuta. 
                        Esto permite que las citas importadas usen estos precios automáticamente.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Preview de ganancia */}
              {(formulario.cobroClienteMensual || formulario.cobroClientePorHora) && formulario.terapeutas.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Resumen Estimado
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-500">Cobro</div>
                      <div className="font-semibold text-gray-800">
                        ${(parseFloat(formulario.cobroClienteMensual) || 
                           (parseFloat(formulario.cobroClientePorHora) || 0) * (parseFloat(formulario.horasEstimadas) || 0)).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Pago Terapeutas</div>
                      <div className="font-semibold text-gray-800">
                        {(() => {
                          let total = 0;
                          formulario.terapeutas.forEach(t => {
                            if (t.pagoTipo === 'mensual') {
                              total += t.pagoMonto || 0;
                            } else {
                              const horasPorTerapeuta = (parseFloat(formulario.horasEstimadas) || 0) / formulario.terapeutas.length;
                              total += (t.pagoMonto || 0) * horasPorTerapeuta;
                            }
                          });
                          return `$${total.toLocaleString()}`;
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Ganancia</div>
                      {(() => {
                        const cobro = parseFloat(formulario.cobroClienteMensual) || 
                          (parseFloat(formulario.cobroClientePorHora) || 0) * (parseFloat(formulario.horasEstimadas) || 0);
                        let pago = 0;
                        formulario.terapeutas.forEach(t => {
                          if (t.pagoTipo === 'mensual') {
                            pago += t.pagoMonto || 0;
                          } else {
                            const horasPorTerapeuta = (parseFloat(formulario.horasEstimadas) || 0) / formulario.terapeutas.length;
                            pago += (t.pagoMonto || 0) * horasPorTerapeuta;
                          }
                        });
                        const ganancia = cobro - pago;
                        return (
                          <div className={`font-semibold ${ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {ganancia >= 0 ? '+' : ''}${ganancia.toLocaleString()}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Detalle por terapeuta */}
                  {formulario.terapeutas.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Desglose por terapeuta:</div>
                      <div className="space-y-1">
                        {formulario.terapeutas.map(t => {
                          const horasPorTerapeuta = (parseFloat(formulario.horasEstimadas) || 0) / formulario.terapeutas.length;
                          const pagoEst = t.pagoTipo === 'mensual' ? t.pagoMonto : (t.pagoMonto || 0) * horasPorTerapeuta;
                          return (
                            <div key={t.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">{t.nombre}</span>
                              <span className="text-gray-800">
                                ${pagoEst.toLocaleString()} 
                                <span className="text-gray-400 text-xs ml-1">
                                  ({t.pagoTipo === 'mensual' ? 'fijo' : `${horasPorTerapeuta.toFixed(1)} hrs`})
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer del modal */}
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editando ? 'Actualizar' : 'Crear Contrato'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContratosMensuales;
