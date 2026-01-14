// src/components/PortalTerapeuta.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useConfiguracion } from '../contexts/ConfiguracionContext';
import { Calendar, Clock, DollarSign, Upload, LogOut, Star, Plus, X, ArrowRightLeft, CalendarClock, Send, AlertCircle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { crearSolicitudCambio, obtenerSolicitudesTerapeuta } from '../api/solicitudesCambio';

moment.locale('es');
const localizer = momentLocalizer(moment);

/**
 * Portal simplificado para terapeutas
 */
const PortalTerapeuta = ({
  currentUser,
  terapeuta,
  terapeutas = [],
  citas,
  clientes,
  servicios = [],
  asignaciones = [],
  contratos = [],
  onActualizarCita,
  onCrearCita,
  onImportarWord,
  onLogout,
  importandoWord = false
}) => {
  const [vistaActiva, setVistaActiva] = useState('citas');
  const [mesCalendario, setMesCalendario] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState('month');
  const [mostrarFormularioCita, setMostrarFormularioCita] = useState(false);
  const { configuracion } = useConfiguracion();
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [nuevaCita, setNuevaCita] = useState({
    fecha: '',
    horaInicio: '09:00',
    horaFin: '11:00',
    clienteId: '',
    clienteOtroNombre: '', // Para cuando seleccionan "Otro"
    tipoTerapia: 'Sesión de ABA estándar',
    notas: ''
  });

  // Estados para solicitudes
  const [mostrarFormularioSolicitud, setMostrarFormularioSolicitud] = useState(false);
  const [tipoSolicitud, setTipoSolicitud] = useState('');
  const [solicitudData, setSolicitudData] = useState({
    nuevaFecha: '',
    nuevaHoraInicio: '',
    nuevaHoraFin: '',
    terapeutaDestinoId: '',
    motivo: ''
  });
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [mostrarConfirmacionWhatsApp, setMostrarConfirmacionWhatsApp] = useState(null);

  // Cargar solicitudes del terapeuta
  useEffect(() => {
    const cargarMisSolicitudes = async () => {
      if (!terapeuta?.id) return;
      setCargandoSolicitudes(true);
      try {
        const solicitudes = await obtenerSolicitudesTerapeuta(terapeuta.id);
        setMisSolicitudes(solicitudes);
      } catch (error) {
        console.error('Error cargando solicitudes:', error);
      } finally {
        setCargandoSolicitudes(false);
      }
    };
    cargarMisSolicitudes();
  }, [terapeuta?.id]);

  // Filtrar otros terapeutas para transferencias
  const otrosTerapeutas = useMemo(() => {
    if (!terapeuta?.id || !terapeutas?.length) return [];
    return terapeutas.filter(t => t.id !== terapeuta.id && t.activo !== false);
  }, [terapeutas, terapeuta]);

  // ========================================
  // FILTRAR CLIENTES ASIGNADOS A ESTA TERAPEUTA
  // ========================================
  const clientesFiltrados = useMemo(() => {
    if (!terapeuta?.id) return clientes;

    console.log('🔍 Filtrando clientes para terapeuta:', terapeuta.nombre, terapeuta.id);
    console.log('📋 Asignaciones recibidas:', asignaciones?.length || 0);
    console.log('📄 Contratos recibidos:', contratos?.length || 0);
    console.log('👥 Clientes asignados manualmente:', terapeuta.clientesAsignados);

    const clienteIdsAsignados = new Set();

    // 1. ASIGNACIONES DE SERVICIO
    asignaciones
      ?.filter(asig => asig.activo !== false)
      .forEach(asig => {
        const esTerapeutaPrincipal = asig.terapeutaId === terapeuta.id;
        const esTerapeutaAdicional = asig.terapeutasAdicionales?.some(
          ta => ta.terapeutaId === terapeuta.id
        );

        if (esTerapeutaPrincipal || esTerapeutaAdicional) {
          if (asig.clienteId && asig.clienteId !== 'todos') {
            clienteIdsAsignados.add(asig.clienteId);
          }
        }
      });

    // 2. CONTRATOS MENSUALES
    contratos
      ?.filter(c => c.activo !== false)
      .forEach(contrato => {
        const esTerapeutaEnContrato = contrato.terapeutas?.some(
          t => t.id === terapeuta.id
        );

        if (esTerapeutaEnContrato && contrato.clienteId) {
          clienteIdsAsignados.add(contrato.clienteId);
        }
      });

    // 3. ASIGNACIÓN MANUAL DIRECTA (campo clientesAsignados en terapeuta)
    if (terapeuta.clientesAsignados?.length > 0) {
      terapeuta.clientesAsignados.forEach(id => clienteIdsAsignados.add(id));
    }

    // NOTA: Las asignaciones globales (clienteId === 'todos') se ignoran
    // para el filtrado de clientes. Solo cuentan las asignaciones específicas.

    // Si no hay ninguna asignación específica, mostrar todos (fallback para compatibilidad)
    if (clienteIdsAsignados.size === 0) {
      console.log('⚠️ No se encontraron asignaciones para esta terapeuta, mostrando todos los clientes (fallback)');
      return clientes;
    }

    console.log('✅ Clientes filtrados:', clienteIdsAsignados.size, Array.from(clienteIdsAsignados));
    return clientes.filter(c => clienteIdsAsignados.has(c.id));
  }, [clientes, asignaciones, contratos, terapeuta]);

  // ========================================
  // FILTRAR CITAS DE ESTA TERAPEUTA
  // ========================================
  const misCitas = useMemo(() => {
    if (!terapeuta?.nombre) return [];
    return citas.filter(cita => cita.terapeuta === terapeuta.nombre);
  }, [citas, terapeuta]);

  // ========================================
  // CITAS DE HOY
  // ========================================
  const citasHoy = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return misCitas
      .filter(cita => cita.fecha === hoy)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }, [misCitas]);

  // ========================================
  // ESTADÍSTICAS DEL MES ACTUAL
  // ========================================
  const estadisticasMes = useMemo(() => {
    const year = mesCalendario.getFullYear();
    const month = mesCalendario.getMonth() + 1;
    
    const citasMes = misCitas.filter(cita => {
      if (cita.estado !== 'completada') return false;
      const [citaYear, citaMonth] = cita.fecha.split('-');
      return parseInt(citaYear) === year && parseInt(citaMonth) === month;
    });

    let totalHoras = 0;
    let totalGanado = 0;
    
    citasMes.forEach(cita => {
      const [h1, m1] = cita.horaInicio.split(':').map(Number);
      const [h2, m2] = cita.horaFin.split(':').map(Number);
      const duracion = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
      totalHoras += duracion;
      totalGanado += cita.costoTerapeutaTotal || 0;
    });

    return {
      totalCitas: citasMes.length,
      totalHoras: totalHoras.toFixed(1),
      totalGanado: totalGanado,
      totalSesiones: citasMes.length
    };
  }, [misCitas, mesCalendario]);

  // ========================================
  // CITAS PRÓXIMAS (siguientes 7 días)
  // ========================================
  const citasProximas = useMemo(() => {
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);
    
    const hoyStr = hoy.toISOString().split('T')[0];
    const en7DiasStr = en7Dias.toISOString().split('T')[0];

    return misCitas
      .filter(cita => cita.fecha >= hoyStr && cita.fecha <= en7DiasStr && cita.estado !== 'cancelada')
      .sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        return a.horaInicio.localeCompare(b.horaInicio);
      });
  }, [misCitas]);

  // ========================================
  // EVENTOS PARA EL CALENDARIO
  // ========================================
  const eventosCalendario = useMemo(() => {
    return misCitas.map(cita => {
      const [year, month, day] = cita.fecha.split('-').map(Number);
      const [horaInicioH, horaInicioM] = cita.horaInicio.split(':').map(Number);
      const [horaFinH, horaFinM] = cita.horaFin.split(':').map(Number);
      
      const start = new Date(year, month - 1, day, horaInicioH, horaInicioM);
      const end = new Date(year, month - 1, day, horaFinH, horaFinM);

      return {
        id: cita.id,
        title: cita.cliente,
        start,
        end,
        resource: cita
      };
    });
  }, [misCitas]);

  // ========================================
  // CREAR NUEVA CITA
  // ========================================
  const handleCrearCita = useCallback(async () => {
    if (!nuevaCita.fecha || !nuevaCita.clienteId) {
      alert('Por favor completa la fecha y selecciona un cliente');
      return;
    }

    // Si es "Otro", validar que haya nombre y crear solicitud
    if (nuevaCita.clienteId === '__otro__') {
      if (!nuevaCita.clienteOtroNombre.trim()) {
        alert('Por favor escribe el nombre del cliente');
        return;
      }

      const [h1, m1] = nuevaCita.horaInicio.split(':').map(Number);
      const [h2, m2] = nuevaCita.horaFin.split(':').map(Number);
      const duracionHoras = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;

      if (duracionHoras <= 0) {
        alert('La hora de fin debe ser posterior a la hora de inicio');
        return;
      }

      // Crear solicitud de tipo "cliente_otro"
      try {
        await crearSolicitudCambio({
          tipo: 'cliente_otro',
          terapeutaId: terapeuta.id,
          terapeutaNombre: terapeuta.nombre,
          // Datos de la cita propuesta
          citaPropuesta: {
            fecha: nuevaCita.fecha,
            horaInicio: nuevaCita.horaInicio,
            horaFin: nuevaCita.horaFin,
            tipoTerapia: nuevaCita.tipoTerapia,
            duracionHoras: duracionHoras,
            notas: nuevaCita.notas
          },
          clienteOtroNombre: nuevaCita.clienteOtroNombre.trim(),
          motivo: `Cliente no está en mi lista: ${nuevaCita.clienteOtroNombre.trim()}`,
          estado: 'pendiente',
          organizationId: currentUser?.organizationId
        });

        alert('✅ Solicitud enviada. El administrador asignará el cliente correcto y creará la cita.');
        setMostrarFormularioCita(false);
        setNuevaCita({
          fecha: '',
          horaInicio: '09:00',
          horaFin: '11:00',
          clienteId: '',
          clienteOtroNombre: '',
          tipoTerapia: 'Sesión de ABA estándar',
          notas: ''
        });
        // Recargar solicitudes
        const solicitudes = await obtenerSolicitudesTerapeuta(terapeuta.id);
        setMisSolicitudes(solicitudes);
      } catch (error) {
        console.error('Error al crear solicitud:', error);
        alert('❌ Error al enviar la solicitud: ' + error.message);
      }
      return;
    }

    // Flujo normal: cliente seleccionado del sistema
    const clienteSeleccionado = clientes.find(c => c.id === nuevaCita.clienteId);
    if (!clienteSeleccionado) {
      alert('Cliente no encontrado');
      return;
    }

    const [h1, m1] = nuevaCita.horaInicio.split(':').map(Number);
    const [h2, m2] = nuevaCita.horaFin.split(':').map(Number);
    const duracionHoras = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;

    if (duracionHoras <= 0) {
      alert('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    const precioCliente = clienteSeleccionado.preciosPersonalizados?.[nuevaCita.tipoTerapia];
    const costoPorHora = precioCliente || 450;
    const costoTotal = costoPorHora * duracionHoras;

    const tarifaTerapeuta = terapeuta.tarifaPorHora || 200;
    const costoTerapeutaTotal = tarifaTerapeuta * duracionHoras;

    const citaData = {
      fecha: nuevaCita.fecha,
      horaInicio: nuevaCita.horaInicio,
      horaFin: nuevaCita.horaFin,
      terapeuta: terapeuta.nombre,
      terapeutaId: terapeuta.id,
      cliente: clienteSeleccionado.nombre,
      clienteId: clienteSeleccionado.id,
      tipoTerapia: nuevaCita.tipoTerapia,
      estado: 'pendiente',
      notas: nuevaCita.notas,
      costoTotal: costoTotal,
      costoTerapeutaTotal: costoTerapeutaTotal,
      duracionHoras: duracionHoras
    };

    try {
      await onCrearCita(citaData);
      alert('✅ Cita creada exitosamente');
      setMostrarFormularioCita(false);
      setNuevaCita({
        fecha: '',
        horaInicio: '09:00',
        horaFin: '11:00',
        clienteId: '',
        clienteOtroNombre: '',
        tipoTerapia: 'Sesión de ABA estándar',
        notas: ''
      });
    } catch (error) {
      console.error('Error al crear cita:', error);
      alert('❌ Error al crear la cita: ' + error.message);
    }
  }, [nuevaCita, clientes, terapeuta, onCrearCita, currentUser, obtenerSolicitudesTerapeuta]);

  // ========================================
  // CAMBIAR ESTADO DE CITA
  // ========================================
  const handleCambiarEstado = useCallback(async (nuevoEstado) => {
    if (!citaSeleccionada) return;
    
    try {
      await onActualizarCita(citaSeleccionada.id, { estado: nuevoEstado });
      setCitaSeleccionada({ ...citaSeleccionada, estado: nuevoEstado });
      alert(`✅ Estado cambiado a: ${nuevoEstado}`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al cambiar el estado');
    }
  }, [citaSeleccionada, onActualizarCita]);

  // ========================================
  // ABRIR FORMULARIO DE SOLICITUD
  // ========================================
  const abrirFormularioSolicitud = (tipo) => {
    setTipoSolicitud(tipo);
    setSolicitudData({
      nuevaFecha: citaSeleccionada?.fecha || '',
      nuevaHoraInicio: citaSeleccionada?.horaInicio || '',
      nuevaHoraFin: citaSeleccionada?.horaFin || '',
      terapeutaDestinoId: '',
      motivo: ''
    });
    setMostrarFormularioSolicitud(true);
  };

  // ========================================
  // GENERAR LINK DE WHATSAPP PARA ADMIN
  // ========================================
  const generarLinkWhatsAppAdmin = (solicitudInfo) => {
    const telefono = configuracion?.whatsappAdmin || configuracion?.telefono || '';
    if (!telefono) return null;

    const tipoTexto = solicitudInfo.tipo === 'cambio_horario'
      ? 'Cambio de Horario'
      : solicitudInfo.tipo === 'cancelacion'
        ? 'Cancelación'
        : 'Transferencia';

    let mensajeDetalle = '';
    if (solicitudInfo.tipo === 'cambio_horario') {
      mensajeDetalle = `🔄 *Propuesta:*\n${solicitudInfo.datosPropuestos.fecha}\n${solicitudInfo.datosPropuestos.horaInicio} - ${solicitudInfo.datosPropuestos.horaFin}\n\n`;
    } else if (solicitudInfo.tipo === 'transferencia') {
      mensajeDetalle = `🔄 *Transferir a:* ${solicitudInfo.datosPropuestos.terapeutaNombre}\n\n`;
    } else if (solicitudInfo.tipo === 'cancelacion') {
      mensajeDetalle = `❌ *Solicita cancelar esta cita*\n\n`;
    }

    const mensaje = encodeURIComponent(
      `📋 *Nueva Solicitud: ${tipoTexto}*\n\n` +
      `👤 *Terapeuta:* ${terapeuta.nombre}\n` +
      `👶 *Cliente:* ${solicitudInfo.clienteNombre}\n` +
      `📌 *Tipo:* ${tipoTexto}\n\n` +
      `📅 *Cita:*\n` +
      `${solicitudInfo.citaActual.fecha}\n` +
      `${solicitudInfo.citaActual.horaInicio} - ${solicitudInfo.citaActual.horaFin}\n\n` +
      mensajeDetalle +
      `💬 *Motivo:* ${solicitudInfo.motivo}\n\n` +
      `Por favor revisa en el sistema.`
    );

    return `https://wa.me/${telefono.replace(/\D/g, '')}?text=${mensaje}`;
  };

  // ========================================
  // ENVIAR SOLICITUD DE CAMBIO
  // ========================================
  const handleEnviarSolicitud = async () => {
    if (!solicitudData.motivo.trim()) {
      alert('Por favor indica el motivo de la solicitud');
      return;
    }

    if (tipoSolicitud === 'transferencia' && !solicitudData.terapeutaDestinoId) {
      alert('Por favor selecciona el terapeuta de destino');
      return;
    }

    if (tipoSolicitud === 'cambio_horario') {
      if (!solicitudData.nuevaFecha || !solicitudData.nuevaHoraInicio || !solicitudData.nuevaHoraFin) {
        alert('Por favor completa la nueva fecha y horario');
        return;
      }
    }

    setEnviandoSolicitud(true);

    try {
      const terapeutaDestino = tipoSolicitud === 'transferencia' 
        ? terapeutas.find(t => t.id === solicitudData.terapeutaDestinoId)
        : null;

      const solicitudInfo = {
        citaId: citaSeleccionada.id,
        tipo: tipoSolicitud,
        terapeutaId: terapeuta.id,
        terapeutaNombre: terapeuta.nombre,
        clienteNombre: citaSeleccionada.cliente,
        citaActual: {
          fecha: citaSeleccionada.fecha,
          horaInicio: citaSeleccionada.horaInicio,
          horaFin: citaSeleccionada.horaFin,
          terapeuta: citaSeleccionada.terapeuta,
          tipoTerapia: citaSeleccionada.tipoTerapia
        },
        datosPropuestos: tipoSolicitud === 'cambio_horario'
          ? {
              fecha: solicitudData.nuevaFecha,
              horaInicio: solicitudData.nuevaHoraInicio,
              horaFin: solicitudData.nuevaHoraFin
            }
          : tipoSolicitud === 'cancelacion'
            ? { cancelar: true }
            : {
                terapeutaId: solicitudData.terapeutaDestinoId,
                terapeutaNombre: terapeutaDestino?.nombre || ''
              },
        motivo: solicitudData.motivo,
        organizationId: currentUser?.organizationId || 'org_acmc_001'
      };

      await crearSolicitudCambio(solicitudInfo);
      
      // Recargar solicitudes
      const nuevasSolicitudes = await obtenerSolicitudesTerapeuta(terapeuta.id);
      setMisSolicitudes(nuevasSolicitudes);

      // Generar link de WhatsApp
      const whatsappLink = generarLinkWhatsAppAdmin(solicitudInfo);
      
      setMostrarFormularioSolicitud(false);
      setCitaSeleccionada(null);

      // Mostrar confirmación con opción de WhatsApp
      if (whatsappLink) {
        setMostrarConfirmacionWhatsApp(whatsappLink);
      } else {
        alert('✅ Solicitud enviada correctamente. El administrador la revisará pronto.');
      }

    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      alert('❌ Error al enviar la solicitud: ' + error.message);
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  // ========================================
  // HELPERS
  // ========================================
  const formatearFecha = (fechaStr) => {
    const [year, month, day] = fechaStr.split('-');
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return '';
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const eventStyleGetter = useCallback((event) => {
    const cita = event.resource;
    const backgroundColor = 
      cita.estado === 'completada' ? '#10b981' :
      cita.estado === 'confirmada' ? '#3b82f6' :
      cita.estado === 'cancelada' ? '#ef4444' :
      '#f59e0b';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.75em',
        padding: '2px 4px'
      }
    };
  }, []);

  const mensajesCalendario = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Cita',
    noEventsInRange: 'No hay citas en este rango',
    showMore: (total) => `+ Ver más (${total})`
  };

  // Contar solicitudes pendientes
  const solicitudesPendientes = misSolicitudes.filter(s => s.estado === 'pendiente').length;

  // Si no hay terapeuta vinculado
  if (!terapeuta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sin terapeuta vinculado</h2>
          <p className="text-gray-600 mb-6">Tu cuenta no está vinculada a ningún terapeuta. Contacta al administrador.</p>
          <button onClick={onLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {configuracion?.logo && (
                <img src={configuracion.logo} alt="Logo" className="h-10 w-auto object-contain" />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-800">Mi Calendario</h1>
                <p className="text-sm text-gray-500">Hola, {terapeuta.nombre}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Hoy</p>
                <p className="text-3xl font-bold text-gray-800">{citasHoy.length}</p>
                <p className="text-sm text-gray-500">{citasHoy.filter(c => c.estado === 'completada').length} completadas</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">
                  {mesCalendario.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-3xl font-bold text-gray-800">{estadisticasMes.totalHoras}</p>
                <p className="text-sm text-gray-500">horas</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {terapeuta.tipoPago === 'fijo' ? (
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Sesiones</p>
                  <p className="text-3xl font-bold text-gray-800">{estadisticasMes.totalSesiones}</p>
                  <p className="text-sm text-gray-500">completadas</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <Star className="text-amber-600" size={24} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Ganancia</p>
                  <p className="text-3xl font-bold text-gray-800">${estadisticasMes.totalGanado.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{mesCalendario.toLocaleDateString('es-MX', { month: 'short' })}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setMostrarFormularioCita(true)}
            className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Nueva Cita
          </button>
          <button
            onClick={() => setVistaActiva('citas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              vistaActiva === 'citas' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mis Citas
          </button>
          <button
            onClick={() => setVistaActiva('solicitudes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              vistaActiva === 'solicitudes' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mis Solicitudes
            {solicitudesPendientes > 0 && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{solicitudesPendientes}</span>
            )}
          </button>
          <button
            onClick={() => setVistaActiva('registrar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              vistaActiva === 'registrar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Registrar Horas
          </button>
        </div>

        {/* Vista de Citas */}
        {vistaActiva === 'citas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              {/* Citas de Hoy */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-600" />
                  Citas de Hoy
                </h2>
                {citasHoy.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎉</div>
                    <p>No tienes citas hoy</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {citasHoy.map(cita => (
                      <div
                        key={cita.id}
                        onClick={() => setCitaSeleccionada(cita)}
                        className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                          cita.estado === 'completada' ? 'bg-green-50 border-green-500' :
                          cita.estado === 'cancelada' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-blue-500'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{cita.cliente}</p>
                            <p className="text-sm text-gray-500">{cita.horaInicio} - {cita.horaFin}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            cita.estado === 'completada' ? 'bg-green-100 text-green-700' :
                            cita.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' :
                            cita.estado === 'cancelada' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {cita.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Próximas Citas */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-purple-600" />
                  Próximos 7 días
                </h2>
                {citasProximas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500"><p>No hay citas programadas</p></div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {citasProximas.slice(0, 10).map(cita => (
                      <div
                        key={cita.id}
                        onClick={() => setCitaSeleccionada(cita)}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{cita.cliente}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} • {cita.horaInicio}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            cita.estado === 'completada' ? 'bg-green-100 text-green-700' :
                            cita.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {cita.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calendario */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6 h-[600px]">
                <div className="flex gap-4 mb-4 text-xs flex-wrap">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded"></div><span>Pendiente</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded"></div><span>Confirmada</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded"></div><span>Completada</span></div>
                </div>
                <BigCalendar
                  localizer={localizer}
                  events={eventosCalendario}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 'calc(100% - 50px)' }}
                  date={mesCalendario}
                  onNavigate={setMesCalendario}
                  view={vistaCalendario}
                  onView={setVistaCalendario}
                  views={['month', 'week', 'day']}
                  onSelectEvent={(event) => setCitaSeleccionada(event.resource)}
                  messages={mensajesCalendario}
                  eventPropGetter={eventStyleGetter}
                  popup
                  culture="es"
                  min={new Date(2000, 0, 1, 7, 0, 0)}
                  max={new Date(2000, 0, 1, 21, 0, 0)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Vista de Solicitudes */}
        {vistaActiva === 'solicitudes' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Send size={24} className="text-blue-600" />
                Mis Solicitudes de Cambio
              </h2>

              {cargandoSolicitudes ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : misSolicitudes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No tienes solicitudes de cambio</p>
                  <p className="text-sm mt-2">Puedes solicitar cambios desde el detalle de cualquier cita</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {misSolicitudes.map(solicitud => (
                    <div 
                      key={solicitud.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        solicitud.estado === 'pendiente' ? 'bg-yellow-50 border-yellow-500' :
                        solicitud.estado === 'aprobada' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {solicitud.tipo === 'cambio_horario' ? (
                            <CalendarClock size={18} className="text-blue-600" />
                          ) : (
                            <ArrowRightLeft size={18} className="text-purple-600" />
                          )}
                          <span className="font-medium text-gray-800">
                            {solicitud.tipo === 'cambio_horario' ? 'Cambio de Horario' : 'Transferencia'}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                          solicitud.estado === 'aprobada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {solicitud.estado === 'pendiente' && <AlertCircle size={12} />}
                          {solicitud.estado === 'aprobada' && <CheckCircle2 size={12} />}
                          {solicitud.estado === 'rechazada' && <XCircle size={12} />}
                          {solicitud.estado}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2"><strong>Cliente:</strong> {solicitud.clienteNombre}</p>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Actual:</strong> {solicitud.citaActual?.fecha} | {solicitud.citaActual?.horaInicio} - {solicitud.citaActual?.horaFin}
                      </div>

                      {solicitud.tipo === 'cambio_horario' ? (
                        <div className="text-sm text-blue-600 mb-2">
                          <strong>Propuesto:</strong> {solicitud.datosPropuestos?.fecha} | {solicitud.datosPropuestos?.horaInicio} - {solicitud.datosPropuestos?.horaFin}
                        </div>
                      ) : (
                        <div className="text-sm text-purple-600 mb-2">
                          <strong>Transferir a:</strong> {solicitud.datosPropuestos?.terapeutaNombre}
                        </div>
                      )}

                      <p className="text-sm text-gray-500 italic">"{solicitud.motivo}"</p>
                      <p className="text-xs text-gray-400 mt-2">Enviada: {formatearFechaCorta(solicitud.fechaSolicitud)}</p>

                      {/* Mostrar quién aprobó/rechazó */}
                      {solicitud.estado !== 'pendiente' && solicitud.adminNombre && (
                        <div className={`mt-3 p-3 rounded-lg ${
                          solicitud.estado === 'aprobada' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <p className="text-sm font-medium">
                            {solicitud.estado === 'aprobada' ? '✅ Aprobada' : '❌ Rechazada'} por {solicitud.adminNombre}
                          </p>
                          <p className="text-xs text-gray-500">{formatearFechaCorta(solicitud.fechaRespuesta)}</p>
                          {solicitud.respuestaAdmin && (
                            <p className="text-sm mt-1 italic">"{solicitud.respuestaAdmin}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vista de Registrar Horas */}
        {vistaActiva === 'registrar' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">📝 Registrar Horas Trabajadas</h2>
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Opción 1: Importar desde Word</h3>
                <p className="text-gray-500 text-sm mb-4">Sube tu documento de horas en formato Word (.docx).</p>
                <label className={`flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  importandoWord ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                }`}>
                  <Upload size={24} className={importandoWord ? 'text-gray-400' : 'text-blue-600'} />
                  <span className={importandoWord ? 'text-gray-400' : 'text-blue-600 font-medium'}>
                    {importandoWord ? 'Importando...' : 'Seleccionar archivo Word'}
                  </span>
                  <input type="file" accept=".docx" className="hidden" onChange={(e) => { if (e.target.files[0]) onImportarWord(e.target.files[0]); e.target.value = ''; }} disabled={importandoWord} />
                </label>
              </div>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-gray-500">o</span></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Opción 2: Marcar citas como completadas</h3>
                <p className="text-gray-500 text-sm mb-4">Marca tus citas como "Completada" desde el calendario.</p>
                <button onClick={() => setVistaActiva('citas')} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Ir a Mis Citas →</button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">📊 Resumen del Mes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800">{estadisticasMes.totalCitas}</p>
                  <p className="text-sm text-gray-500">Sesiones completadas</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800">{estadisticasMes.totalHoras}</p>
                  <p className="text-sm text-gray-500">Horas trabajadas</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Detalle de Cita */}
      {citaSeleccionada && !mostrarFormularioSolicitud && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Detalle de Cita</h2>
              <button onClick={() => setCitaSeleccionada(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><p className="text-sm text-gray-500">Cliente</p><p className="font-semibold text-gray-800">{citaSeleccionada.cliente}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Fecha</p><p className="font-medium text-gray-800">{formatearFecha(citaSeleccionada.fecha)}</p></div>
                <div><p className="text-sm text-gray-500">Horario</p><p className="font-medium text-gray-800">{citaSeleccionada.horaInicio} - {citaSeleccionada.horaFin}</p></div>
              </div>
              <div><p className="text-sm text-gray-500">Tipo de terapia</p><p className="font-medium text-gray-800">{citaSeleccionada.tipoTerapia || 'Sesión de ABA'}</p></div>
              <div>
                <p className="text-sm text-gray-500">Estado actual</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  citaSeleccionada.estado === 'completada' ? 'bg-green-100 text-green-700' :
                  citaSeleccionada.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' :
                  citaSeleccionada.estado === 'cancelada' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{citaSeleccionada.estado}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Cambiar estado a:</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Terapeutas solo pueden cambiar a pendiente, confirmada o completada */}
                  {['pendiente', 'confirmada', 'completada'].map(estado => (
                    <button
                      key={estado}
                      onClick={() => handleCambiarEstado(estado)}
                      disabled={citaSeleccionada.estado === estado || citaSeleccionada.estado === 'cancelada'}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        citaSeleccionada.estado === estado || citaSeleccionada.estado === 'cancelada' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                        estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                        estado === 'confirmada' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                        'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </button>
                  ))}
                  {/* Botón de cancelar requiere solicitud */}
                  <button
                    onClick={() => abrirFormularioSolicitud('cancelacion')}
                    disabled={citaSeleccionada.estado === 'cancelada' || citaSeleccionada.estado === 'completada'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      citaSeleccionada.estado === 'cancelada' || citaSeleccionada.estado === 'completada'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Solicitar Cancelación
                  </button>
                </div>
              </div>
              {(citaSeleccionada.estado === 'pendiente' || citaSeleccionada.estado === 'confirmada') && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">Solicitar cambio:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => abrirFormularioSolicitud('cambio_horario')} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                      <CalendarClock size={18} /><span className="text-sm font-medium">Cambiar Horario</span>
                    </button>
                    <button onClick={() => abrirFormularioSolicitud('transferencia')} className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
                      <ArrowRightLeft size={18} /><span className="text-sm font-medium">Transferir</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Las solicitudes requieren aprobación del administrador</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <button onClick={() => setCitaSeleccionada(null)} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulario de Solicitud */}
      {mostrarFormularioSolicitud && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {tipoSolicitud === 'cambio_horario' ? (
                  <><CalendarClock size={24} className="text-blue-600" />Cambio de Horario</>
                ) : tipoSolicitud === 'cancelacion' ? (
                  <><XCircle size={24} className="text-red-600" />Solicitar Cancelación</>
                ) : (
                  <><ArrowRightLeft size={24} className="text-purple-600" />Transferencia</>
                )}
              </h2>
              <button onClick={() => setMostrarFormularioSolicitud(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{tipoSolicitud === 'cancelacion' ? 'Cita a cancelar:' : 'Cita actual:'}</p>
                <p className="font-medium text-gray-800">{citaSeleccionada?.cliente}</p>
                <p className="text-sm text-gray-600">{citaSeleccionada?.fecha} | {citaSeleccionada?.horaInicio} - {citaSeleccionada?.horaFin}</p>
              </div>
              {tipoSolicitud === 'cancelacion' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Nota:</strong> Esta solicitud será enviada al administrador para su aprobación.
                    Por favor indica el motivo de la cancelación.
                  </p>
                </div>
              )}
              {tipoSolicitud === 'cambio_horario' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nueva Fecha</label><input type="date" value={solicitudData.nuevaFecha} onChange={(e) => setSolicitudData({ ...solicitudData, nuevaFecha: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nueva Hora Inicio</label><input type="time" value={solicitudData.nuevaHoraInicio} onChange={(e) => setSolicitudData({ ...solicitudData, nuevaHoraInicio: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nueva Hora Fin</label><input type="time" value={solicitudData.nuevaHoraFin} onChange={(e) => setSolicitudData({ ...solicitudData, nuevaHoraFin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                  </div>
                </>
              )}
              {tipoSolicitud === 'transferencia' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transferir a</label>
                  <select value={solicitudData.terapeutaDestinoId} onChange={(e) => setSolicitudData({ ...solicitudData, terapeutaDestinoId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">Seleccionar terapeuta...</option>
                    {otrosTerapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la solicitud *</label>
                <textarea value={solicitudData.motivo} onChange={(e) => setSolicitudData({ ...solicitudData, motivo: e.target.value })} placeholder="Explica brevemente el motivo del cambio..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button onClick={() => setMostrarFormularioSolicitud(false)} disabled={enviandoSolicitud} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Volver</button>
              <button onClick={handleEnviarSolicitud} disabled={enviandoSolicitud} className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                tipoSolicitud === 'cambio_horario' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                tipoSolicitud === 'cancelacion' ? 'bg-red-600 text-white hover:bg-red-700' :
                'bg-purple-600 text-white hover:bg-purple-700'
              } ${enviandoSolicitud ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Send size={18} />{enviandoSolicitud ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación con WhatsApp */}
      {mostrarConfirmacionWhatsApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">¡Solicitud Enviada!</h2>
              <p className="text-gray-600 mb-6">Tu solicitud ha sido registrada. ¿Deseas notificar al administrador por WhatsApp?</p>
              <div className="space-y-3">
                <a
                  href={mostrarConfirmacionWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  onClick={() => setMostrarConfirmacionWhatsApp(null)}
                >
                  <ExternalLink size={18} />
                  Notificar por WhatsApp
                </a>
                <button
                  onClick={() => setMostrarConfirmacionWhatsApp(null)}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  No, gracias
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nueva Cita */}
      {mostrarFormularioCita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Nueva Cita</h2>
              <button onClick={() => setMostrarFormularioCita(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label><input type="date" value={nuevaCita.fecha} onChange={(e) => setNuevaCita({ ...nuevaCita, fecha: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label><input type="time" value={nuevaCita.horaInicio} onChange={(e) => setNuevaCita({ ...nuevaCita, horaInicio: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label><input type="time" value={nuevaCita.horaFin} onChange={(e) => setNuevaCita({ ...nuevaCita, horaFin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select
                  value={nuevaCita.clienteId}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, clienteId: e.target.value, clienteOtroNombre: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientesFiltrados
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                    .map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
                  <option value="__otro__">── Otro (no está en la lista) ──</option>
                </select>
                {clientesFiltrados.length < clientes.length && nuevaCita.clienteId !== '__otro__' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Mostrando {clientesFiltrados.length} cliente(s) asignado(s)
                  </p>
                )}
                {/* Campo para nombre del cliente cuando seleccionan "Otro" */}
                {nuevaCita.clienteId === '__otro__' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={nuevaCita.clienteOtroNombre}
                      onChange={(e) => setNuevaCita({ ...nuevaCita, clienteOtroNombre: e.target.value })}
                      placeholder="Escribe el nombre del cliente..."
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-amber-50 focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Esta cita se enviará como solicitud para que el admin asigne el cliente correcto
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Terapia</label>
                <select value={nuevaCita.tipoTerapia} onChange={(e) => setNuevaCita({ ...nuevaCita, tipoTerapia: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {servicios.length > 0 ? (
                    servicios
                      .filter(s => s.activo !== false)
                      .filter(s => {
                        // Si no hay niveles definidos en el servicio, todos pueden darlo
                        if (!s.nivelesPermitidos || s.nivelesPermitidos.length === 0) return true;
                        // Compatibilidad: si existe 'nivel' (string antiguo), convertir a array
                        let nivelesTerapeuta = terapeuta?.niveles || [];
                        if (!nivelesTerapeuta.length && terapeuta?.nivel) {
                          nivelesTerapeuta = [terapeuta.nivel];
                        }
                        // Si no hay niveles en la terapeuta, mostrar todos
                        if (!nivelesTerapeuta.length) return true;
                        // Verificar si ALGUNO de los niveles de la terapeuta está en los permitidos
                        return nivelesTerapeuta.some(nivel => s.nivelesPermitidos.includes(nivel));
                      })
                      .sort((a, b) => a.nombre.localeCompare(b.nombre))
                      .map(servicio => (
                        <option key={servicio.id} value={servicio.nombre}>
                          {servicio.nombre}
                        </option>
                      ))
                  ) : (
                    <>
                      <option value="Sesión de ABA estándar">Sesión de ABA estándar</option>
                      <option value="Sesión de ABA precio especial">Sesión de ABA precio especial</option>
                      <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                      <option value="Servicios de Apoyo y Entrenamiento">Servicios de Apoyo y Entrenamiento</option>
                      <option value="Servicios Administrativos y Reportes">Servicios Administrativos y Reportes</option>
                      <option value="Servicios de Sombra">Servicios de Sombra</option>
                    </>
                  )}
                </select>
                {(() => {
                  // Compatibilidad: si existe 'nivel' (string antiguo), convertir a array
                  let nivelesTerapeuta = terapeuta?.niveles || [];
                  if (!nivelesTerapeuta.length && terapeuta?.nivel) {
                    nivelesTerapeuta = [terapeuta.nivel];
                  }
                  if (nivelesTerapeuta.length > 0) {
                    const nivelesLabels = {
                      'terapeuta_ocupacional': 'T. Ocupacional',
                      'junior': 'Junior',
                      'senior': 'Senior',
                      'coordinadora': 'Coordinadora',
                      'supervisora': 'Supervisora',
                      'recursos_humanos': 'RRHH'
                    };
                    const labelsActivos = nivelesTerapeuta.map(n => nivelesLabels[n] || n).join(', ');
                    return (
                      <p className="text-xs text-blue-600 mt-1">
                        Servicios para: {labelsActivos}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label><textarea value={nuevaCita.notas} onChange={(e) => setNuevaCita({ ...nuevaCita, notas: e.target.value })} placeholder="Notas adicionales..." rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none" /></div>
            </div>
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button onClick={() => setMostrarFormularioCita(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Cancelar</button>
              <button onClick={handleCrearCita} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Crear Cita</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalTerapeuta;
