// src/components/PortalTerapeuta.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { useConfiguracion } from '../contexts/ConfiguracionContext';
import { Calendar, Clock, DollarSign, CheckCircle, Upload, LogOut, ChevronLeft, ChevronRight, Star, Plus, X } from 'lucide-react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

/**
 * Portal simplificado para terapeutas
 * 
 * @param {Object} props
 * @param {Object} props.currentUser - Usuario actual (debe tener terapeutaId)
 * @param {Object} props.terapeuta - Datos del terapeuta vinculado
 * @param {Array} props.citas - Todas las citas del sistema
 * @param {Array} props.clientes - Lista de clientes
 * @param {Function} props.onActualizarCita - Función para actualizar una cita
 * @param {Function} props.onImportarWord - Función para importar desde Word
 * @param {Function} props.onLogout - Función para cerrar sesión
 * @param {boolean} props.importandoWord - Estado de importación
 */
const PortalTerapeuta = ({
  currentUser,
  terapeuta,
  citas,
  clientes,
  onActualizarCita,
  onCrearCita,           // ← NUEVO
  onImportarWord,
  onLogout,
  importandoWord = false
}) => {
  const [vistaActiva, setVistaActiva] = useState('citas'); // 'citas' o 'registrar'
  const [mesCalendario, setMesCalendario] = useState(new Date());
  const [mostrarFormularioCita, setMostrarFormularioCita] = useState(false);
  // Configuración de empresa
  const { configuracion } = useConfiguracion();
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [nuevaCita, setNuevaCita] = useState({
    fecha: '',
    horaInicio: '09:00',
    horaFin: '11:00',
    clienteId: '',
    tipoTerapia: 'Sesión de ABA estándar',
    notas: ''
  });

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

    // Calcular horas totales
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
  // MARCAR CITA COMO COMPLETADA
  // ========================================
  const marcarCompletada = useCallback(async (cita) => {
    if (cita.estado === 'completada') {
      alert('Esta cita ya está marcada como completada');
      return;
    }
    
    const confirmar = window.confirm(
      `¿Marcar como completada la cita con ${cita.cliente}?\n\n` +
      `📅 ${formatearFecha(cita.fecha)}\n` +
      `🕐 ${cita.horaInicio} - ${cita.horaFin}`
    );
    
    if (confirmar) {
      try {
        await onActualizarCita(cita.id, { ...cita, estado: 'completada' });
        alert('✅ Cita marcada como completada');
      } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al actualizar la cita');
      }
    }
  }, [onActualizarCita]);

  // ========================================
  // CREAR NUEVA CITA
  // ========================================
  const handleCrearCita = useCallback(async () => {
    // Validaciones
    if (!nuevaCita.fecha || !nuevaCita.clienteId) {
      alert('Por favor completa la fecha y selecciona un cliente');
      return;
    }

    const clienteSeleccionado = clientes.find(c => c.id === nuevaCita.clienteId);
    if (!clienteSeleccionado) {
      alert('Cliente no encontrado');
      return;
    }

    // Calcular duración y costos
    const [h1, m1] = nuevaCita.horaInicio.split(':').map(Number);
    const [h2, m2] = nuevaCita.horaFin.split(':').map(Number);
    const duracionHoras = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;

    if (duracionHoras <= 0) {
      alert('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Obtener precio del cliente o usar precio base
    const precioCliente = clienteSeleccionado.preciosPersonalizados?.[nuevaCita.tipoTerapia];
    const costoPorHora = precioCliente || 450;
    const costoTotal = costoPorHora * duracionHoras;

    // Obtener costo del terapeuta
    const costoTerapeuta = terapeuta.costosPorCliente?.[nuevaCita.clienteId] || 
                          terapeuta.costosPorServicio?.[nuevaCita.tipoTerapia] || 
                          200;
    const costoTerapeutaTotal = costoTerapeuta * duracionHoras;

    const citaData = {
      fecha: nuevaCita.fecha,
      horaInicio: nuevaCita.horaInicio,
      horaFin: nuevaCita.horaFin,
      terapeuta: terapeuta.nombre,
      cliente: clienteSeleccionado.nombre,
      clienteId: nuevaCita.clienteId,
      tipoTerapia: nuevaCita.tipoTerapia,
      estado: 'pendiente',
      costoPorHora,
      costoTotal,
      costoTerapeuta,
      costoTerapeutaTotal,
      notas: nuevaCita.notas || ''
    };

    try {
      await onCrearCita(citaData);
      alert('✅ Cita creada correctamente');
      setMostrarFormularioCita(false);
      setNuevaCita({
        fecha: '',
        horaInicio: '09:00',
        horaFin: '11:00',
        clienteId: '',
        tipoTerapia: 'Sesión de ABA estándar',
        notas: ''
      });
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al crear la cita');
    }
  }, [nuevaCita, clientes, terapeuta, onCrearCita]);

  // ========================================
  // CAMBIAR ESTADO DE CITA
  // ========================================
  const handleCambiarEstado = useCallback(async (nuevoEstado) => {
    if (!citaSeleccionada) return;
    
    try {
      await onActualizarCita(citaSeleccionada.id, { 
        ...citaSeleccionada, 
        estado: nuevoEstado 
      });
      alert(`✅ Cita marcada como "${nuevoEstado}"`);
      setCitaSeleccionada(null);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al actualizar la cita');
    }
  }, [citaSeleccionada, onActualizarCita]);

  // ========================================
  // FORMATEAR FECHA
  // ========================================
  const formatearFecha = (fechaStr) => {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  // ========================================
  // ESTILOS DEL CALENDARIO
  // ========================================
  const eventStyleGetter = useCallback((event) => {
    const cita = event.resource;
    const backgroundColor = 
      cita.estado === 'completada' ? '#10b981' :
      cita.estado === 'confirmada' ? '#3b82f6' :
      cita.estado === 'cancelada' ? '#ef4444' : '#f59e0b';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: cita.estado === 'cancelada' ? 0.6 : 1,
        color: 'white',
        border: 'none',
        fontSize: '12px'
      }
    };
  }, []);

  // ========================================
  // MENSAJES DEL CALENDARIO EN ESPAÑOL
  // ========================================
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

  // ========================================
  // SI NO HAY TERAPEUTA VINCULADO
  // ========================================
  if (!terapeuta) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Cuenta no vinculada</h2>
          <p className="text-gray-600 mb-4">
            Tu cuenta de usuario aún no está vinculada a un perfil de terapeuta. 
            Por favor contacta al administrador para completar la configuración.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Usuario: {currentUser?.email}
          </p>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      {/* <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <span className="font-bold text-xl text-gray-800">ACMC</span>
          </div> */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {configuracion?.logoUrl ? (
              <img 
                src={configuracion.logoUrl} 
                alt={configuracion.nombreEmpresa}
                className="w-10 h-10 object-contain rounded"
              />
            ) : (
              <span className="text-2xl">🏥</span>
            )}
            <span className="font-bold text-xl text-gray-800">
              {configuracion?.nombreEmpresa || 'ACMC'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Hola, <strong>{terapeuta.nombre.split(' ')[0]}</strong> 👋
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Citas de Hoy */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Hoy</p>
                <p className="text-3xl font-bold text-gray-800">{citasHoy.length}</p>
                <p className="text-sm text-gray-500">citas</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Horas del Mes Seleccionado */}
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

          {/* Ganado o Sesiones (según tipo de pago) */}
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
                  <p className="text-3xl font-bold text-gray-800">
                    ${estadisticasMes.totalGanado.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {mesCalendario.toLocaleDateString('es-MX', { month: 'short' })}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navegación de Pestañas */}
        <div className="flex gap-2 mb-6">
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
              vistaActiva === 'citas'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mis Citas
          </button>
          <button
            onClick={() => setVistaActiva('registrar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              vistaActiva === 'registrar'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Registrar Horas
          </button>
        </div>

        {/* Contenido según pestaña activa */}
        {vistaActiva === 'citas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: Citas del día y próximas */}
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
                          cita.estado === 'completada'
                            ? 'bg-green-50 border-green-500'
                            : cita.estado === 'cancelada'
                            ? 'bg-red-50 border-red-500'
                            : 'bg-gray-50 border-blue-500'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{cita.cliente}</p>
                            <p className="text-sm text-gray-500">
                              {cita.horaInicio} - {cita.horaFin}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {cita.tipoTerapia || 'Sesión de ABA'}
                            </p>
                          </div>
                          {/* {cita.estado !== 'completada' && cita.estado !== 'cancelada' && (
                            <button
                              onClick={() => marcarCompletada(cita)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle size={16} />
                              Completar
                            </button>
                          )}
                          {cita.estado === 'completada' && (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle size={16} />
                              Completada
                            </span>
                          )} */}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            cita.estado === 'completada' ? 'bg-green-100 text-green-700' :
                            cita.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' :
                            cita.estado === 'cancelada' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
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
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  📅 Próximos 7 días
                </h2>
                
                {citasProximas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hay citas programadas
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {citasProximas.slice(0, 10).map(cita => (
                      <div
                        key={cita.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{cita.cliente}</p>
                          <p className="text-xs text-gray-500">
                            {formatearFecha(cita.fecha)} • {cita.horaInicio}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          cita.estado === 'completada' ? 'bg-green-100 text-green-700' :
                          cita.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {cita.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Calendario */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6" style={{ height: '600px' }}>
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Mi Calendario
                </h2>
                
                {/* Leyenda */}
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Pendiente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Confirmada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Completada</span>
                  </div>
                </div>

                <BigCalendar
                  localizer={localizer}
                  events={eventosCalendario}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 'calc(100% - 80px)' }}
                  date={mesCalendario}
                  onNavigate={setMesCalendario}
                  view="month"
                  views={['month', 'week', 'day']}
                  // onSelectEvent={(event) => {
                  //   const cita = event.resource;
                  //   if (cita.estado !== 'completada' && cita.estado !== 'cancelada') {
                  //     marcarCompletada(cita);
                  //   }
                  // }}
                  onSelectEvent={(event) => {
                    setCitaSeleccionada(event.resource);
                  }}
                  messages={mensajesCalendario}
                  eventPropGetter={eventStyleGetter}
                  popup
                  culture="es"
                />
              </div>
            </div>
          </div>
        )}

        {/* Vista de Registrar Horas */}
        {vistaActiva === 'registrar' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                📝 Registrar Horas Trabajadas
              </h2>

              {/* Opción 1: Importar desde Word */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Opción 1: Importar desde Word
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Sube tu documento de horas en formato Word (.docx) con la tabla de sesiones.
                </p>
                <label className={`flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  importandoWord
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                }`}>
                  <Upload size={24} className={importandoWord ? 'text-gray-400' : 'text-blue-600'} />
                  <span className={importandoWord ? 'text-gray-400' : 'text-blue-600 font-medium'}>
                    {importandoWord ? 'Importando...' : 'Seleccionar archivo Word'}
                  </span>
                  <input
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        onImportarWord(file);
                      }
                      e.target.value = '';
                    }}
                    disabled={importandoWord}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  El nombre del archivo debe comenzar con tu nombre (ej: {terapeuta.nombre.split(' ')[0]}_Horas_noviembre.docx)
                </p>
              </div>

              {/* Separador */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500">o</span>
                </div>
              </div>

              {/* Opción 2: Información sobre marcar citas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Opción 2: Marcar citas como completadas
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  También puedes marcar tus citas como "Completada" directamente desde el calendario o la lista de citas del día. 
                  Esto registrará automáticamente las horas trabajadas.
                </p>
                <button
                  onClick={() => setVistaActiva('citas')}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Ir a Mis Citas →
                </button>
              </div>
            </div>

            {/* Resumen de horas del mes */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                📊 Resumen del Mes Actual
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-gray-800">{estadisticasMes.totalCitas}</p>
                  <p className="text-sm text-gray-500">Sesiones completadas</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-gray-800">{estadisticasMes.totalHoras}</p>
                  <p className="text-sm text-gray-500">Horas trabajadas</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Detalle de Cita */}
      {citaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Detalle de Cita</h2>
              <button
                onClick={() => setCitaSeleccionada(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              {/* Cliente */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{citaSeleccionada.cliente}</p>
                  <p className="text-sm text-gray-500">{citaSeleccionada.tipoTerapia || 'Sesión de ABA'}</p>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Fecha</p>
                  <p className="font-medium text-gray-800">{formatearFecha(citaSeleccionada.fecha)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Horario</p>
                  <p className="font-medium text-gray-800">
                    {citaSeleccionada.horaInicio} - {citaSeleccionada.horaFin}
                  </p>
                </div>
              </div>

              {/* Estado Actual */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase mb-2">Estado Actual</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  citaSeleccionada.estado === 'completada' ? 'bg-green-100 text-green-700' :
                  citaSeleccionada.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' :
                  citaSeleccionada.estado === 'cancelada' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {citaSeleccionada.estado}
                </span>
              </div>

              {/* Cambiar Estado */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Cambiar estado a:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCambiarEstado('pendiente')}
                    disabled={citaSeleccionada.estado === 'pendiente'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      citaSeleccionada.estado === 'pendiente'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    Pendiente
                  </button>
                  <button
                    onClick={() => handleCambiarEstado('confirmada')}
                    disabled={citaSeleccionada.estado === 'confirmada'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      citaSeleccionada.estado === 'confirmada'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    Confirmada
                  </button>
                  <button
                    onClick={() => handleCambiarEstado('completada')}
                    disabled={citaSeleccionada.estado === 'completada'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      citaSeleccionada.estado === 'completada'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    Completada
                  </button>
                  <button
                    onClick={() => handleCambiarEstado('cancelada')}
                    disabled={citaSeleccionada.estado === 'cancelada'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      citaSeleccionada.estado === 'cancelada'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Cancelada
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setCitaSeleccionada(null)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nueva Cita */}
      {mostrarFormularioCita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Nueva Cita</h2>
              <button
                onClick={() => setMostrarFormularioCita(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={nuevaCita.fecha}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, fecha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Horario */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={nuevaCita.horaInicio}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, horaInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={nuevaCita.horaFin}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, horaFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  value={nuevaCita.clienteId}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, clienteId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Terapia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Terapia
                </label>
                <select
                  value={nuevaCita.tipoTerapia}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, tipoTerapia: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Sesión de ABA estándar">Sesión de ABA estándar</option>
                  <option value="Sesión de ABA precio especial">Sesión de ABA precio especial</option>
                  <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                  <option value="Servicios de Apoyo y Entrenamiento">Servicios de Apoyo y Entrenamiento</option>
                  <option value="Servicios Administrativos y Reportes">Servicios Administrativos y Reportes</option>
                  <option value="Servicios de Sombra">Servicios de Sombra</option>
                </select>
              </div>

              {/* Notas (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={nuevaCita.notas}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setMostrarFormularioCita(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearCita}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalTerapeuta;
