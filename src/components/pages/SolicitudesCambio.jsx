// src/components/pages/SolicitudesCambio.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  CalendarClock, 
  ArrowRightLeft,
  Clock,
  User,
  MessageSquare,
  Filter,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  obtenerSolicitudes, 
  aprobarSolicitud, 
  rechazarSolicitud 
} from '../../api/solicitudesCambio';

/**
 * Página de Gestión de Solicitudes de Cambio
 * Para que el admin apruebe o rechace solicitudes de terapeutas
 */
const SolicitudesCambio = ({ 
  currentUser,
  terapeutas = [],
  onActualizarCita,
  configuracion
}) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [solicitudExpandida, setSolicitudExpandida] = useState(null);
  const [procesando, setProcesando] = useState(null);
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  console.log('🎯 SolicitudesCambio renderizado, currentUser:', currentUser);

  // Cargar solicitudes
  const cargarSolicitudes = useCallback(async () => {
    console.log('🚀 cargarSolicitudes iniciando...');
    setCargando(true);
    try {
      const orgId = currentUser?.organizationId || 'org_acmc_001';
      console.log('🔍 Cargando solicitudes para org:', orgId);
      console.log('🔍 currentUser:', currentUser);
      
      const data = await obtenerSolicitudes(orgId);
      console.log('📋 Solicitudes encontradas:', data);
      
      setSolicitudes(data);
    } catch (error) {
      console.error('❌ Error cargando solicitudes:', error);
    } finally {
      setCargando(false);
    }
  }, [currentUser?.organizationId]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  // Filtrar solicitudes
  const solicitudesFiltradas = useMemo(() => {
    if (filtroEstado === 'todas') return solicitudes;
    return solicitudes.filter(s => s.estado === filtroEstado);
  }, [solicitudes, filtroEstado]);

  // Contar por estado
  const contadores = useMemo(() => ({
    pendiente: solicitudes.filter(s => s.estado === 'pendiente').length,
    aprobada: solicitudes.filter(s => s.estado === 'aprobada').length,
    rechazada: solicitudes.filter(s => s.estado === 'rechazada').length,
    todas: solicitudes.length
  }), [solicitudes]);

  // Obtener info del terapeuta destino
  const getTerapeutaDestino = (terapeutaId) => {
    return terapeutas.find(t => t.id === terapeutaId);
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleDateString('es-MX', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular antigüedad
  const calcularAntiguedad = (fecha) => {
    if (!fecha) return '';
    const ahora = new Date();
    const diff = ahora - new Date(fecha);
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 60) return `hace ${minutos} min`;
    if (horas < 24) return `hace ${horas}h`;
    if (dias === 1) return 'hace 1 día';
    return `hace ${dias} días`;
  };

  // Generar link de WhatsApp para notificar al admin
  const generarLinkWhatsApp = (solicitud, esAprobada) => {
    const telefono = configuracion?.whatsappAdmin || '';
    if (!telefono) return null;

    const estado = esAprobada ? '✅ APROBADA' : '❌ RECHAZADA';
    const mensaje = encodeURIComponent(
      `${estado}\n\n` +
      `Solicitud de: ${solicitud.terapeutaNombre}\n` +
      `Cliente: ${solicitud.clienteNombre}\n` +
      `Tipo: ${solicitud.tipo === 'cambio_horario' ? 'Cambio de horario' : 'Transferencia'}\n\n` +
      `Cita original: ${solicitud.citaActual?.fecha} ${solicitud.citaActual?.horaInicio}-${solicitud.citaActual?.horaFin}`
    );

    return `https://wa.me/${telefono.replace(/\D/g, '')}?text=${mensaje}`;
  };

  // APROBAR solicitud y aplicar cambios
  const handleAprobar = async (solicitud) => {
    if (!window.confirm('¿Aprobar esta solicitud y aplicar los cambios automáticamente?')) {
      return;
    }

    setProcesando(solicitud.id);

    try {
      // Preparar datos para actualizar la cita
      let datosActualizacion = {};

      if (solicitud.tipo === 'cambio_horario') {
        // Cambio de horario
        datosActualizacion = {
          fecha: solicitud.datosPropuestos.fecha,
          horaInicio: solicitud.datosPropuestos.horaInicio,
          horaFin: solicitud.datosPropuestos.horaFin
        };
      } else if (solicitud.tipo === 'transferencia') {
        // Transferencia a otro terapeuta
        const nuevoTerapeuta = getTerapeutaDestino(solicitud.datosPropuestos.terapeutaId);
        
        if (!nuevoTerapeuta) {
          throw new Error('Terapeuta destino no encontrado');
        }

        // Recalcular costo del terapeuta
        const [h1, m1] = solicitud.citaActual.horaInicio.split(':').map(Number);
        const [h2, m2] = solicitud.citaActual.horaFin.split(':').map(Number);
        const duracionHoras = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
        const nuevaTarifa = nuevoTerapeuta.tarifaPorHora || 200;
        const nuevoCostoTerapeuta = nuevaTarifa * duracionHoras;

        datosActualizacion = {
          terapeuta: nuevoTerapeuta.nombre,
          terapeutaId: nuevoTerapeuta.id,
          costoTerapeutaTotal: nuevoCostoTerapeuta
        };
      }

      // Aplicar cambios a la cita
      await onActualizarCita(solicitud.citaId, datosActualizacion);

      // Marcar solicitud como aprobada
      await aprobarSolicitud(
        solicitud.id, 
        { 
          adminId: currentUser?.id || currentUser?.uid,
          adminNombre: currentUser?.nombre || currentUser?.email 
        },
        'Solicitud aprobada y cambios aplicados'
      );

      // Recargar solicitudes
      await cargarSolicitudes();

      alert('✅ Solicitud aprobada y cambios aplicados correctamente');

    } catch (error) {
      console.error('Error al aprobar:', error);
      alert('❌ Error al aprobar la solicitud: ' + error.message);
    } finally {
      setProcesando(null);
    }
  };

  // RECHAZAR solicitud
  const handleRechazar = async () => {
    if (!mostrarModalRechazo) return;

    setProcesando(mostrarModalRechazo.id);

    try {
      await rechazarSolicitud(
        mostrarModalRechazo.id,
        {
          adminId: currentUser?.id || currentUser?.uid,
          adminNombre: currentUser?.nombre || currentUser?.email
        },
        motivoRechazo || 'Solicitud rechazada'
      );

      await cargarSolicitudes();
      setMostrarModalRechazo(null);
      setMotivoRechazo('');

      alert('Solicitud rechazada');

    } catch (error) {
      console.error('Error al rechazar:', error);
      alert('❌ Error al rechazar la solicitud');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Solicitudes de Cambio</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona las solicitudes de cambio de horario y transferencias de las terapeutas
          </p>
        </div>
        <button
          onClick={cargarSolicitudes}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filtros por estado */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltroEstado('pendiente')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'pendiente'
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border'
          }`}
        >
          <AlertCircle size={18} />
          Pendientes
          {contadores.pendiente > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              filtroEstado === 'pendiente' ? 'bg-yellow-600' : 'bg-yellow-500 text-white'
            }`}>
              {contadores.pendiente}
            </span>
          )}
        </button>
        <button
          onClick={() => setFiltroEstado('aprobada')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'aprobada'
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border'
          }`}
        >
          <CheckCircle2 size={18} />
          Aprobadas
          <span className="text-xs opacity-75">({contadores.aprobada})</span>
        </button>
        <button
          onClick={() => setFiltroEstado('rechazada')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'rechazada'
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border'
          }`}
        >
          <XCircle size={18} />
          Rechazadas
          <span className="text-xs opacity-75">({contadores.rechazada})</span>
        </button>
        <button
          onClick={() => setFiltroEstado('todas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'todas'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border'
          }`}
        >
          <Filter size={18} />
          Todas
          <span className="text-xs opacity-75">({contadores.todas})</span>
        </button>
      </div>

      {/* Lista de solicitudes */}
      {cargando ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <RefreshCw size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Cargando solicitudes...</p>
        </div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Send size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            {filtroEstado === 'pendiente' 
              ? 'No hay solicitudes pendientes' 
              : `No hay solicitudes ${filtroEstado === 'todas' ? '' : filtroEstado + 's'}`}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Las solicitudes de las terapeutas aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudesFiltradas.map(solicitud => (
            <div 
              key={solicitud.id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${
                solicitud.estado === 'pendiente' ? 'border-yellow-500' :
                solicitud.estado === 'aprobada' ? 'border-green-500' :
                'border-red-500'
              }`}
            >
              {/* Header de la solicitud */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSolicitudExpandida(
                  solicitudExpandida === solicitud.id ? null : solicitud.id
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Icono de tipo */}
                      {solicitud.tipo === 'cambio_horario' ? (
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <CalendarClock size={20} className="text-blue-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <ArrowRightLeft size={20} className="text-purple-600" />
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {solicitud.tipo === 'cambio_horario' ? 'Cambio de Horario' : 'Transferencia'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Solicitado por <span className="font-medium">{solicitud.terapeutaNombre}</span>
                        </p>
                      </div>
                    </div>

                    {/* Info resumida */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {solicitud.clienteNombre}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {solicitud.citaActual?.fecha}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {calcularAntiguedad(solicitud.fechaSolicitud)}
                      </span>
                    </div>
                  </div>

                  {/* Estado y flecha */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      solicitud.estado === 'aprobada' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {solicitud.estado}
                    </span>
                    {solicitudExpandida === solicitud.id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Contenido expandido */}
              {solicitudExpandida === solicitud.id && (
                <div className="px-4 pb-4 border-t bg-gray-50">
                  <div className="grid md:grid-cols-2 gap-4 py-4">
                    {/* Datos actuales */}
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Cita Actual</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Fecha:</strong> {solicitud.citaActual?.fecha}</p>
                        <p><strong>Horario:</strong> {solicitud.citaActual?.horaInicio} - {solicitud.citaActual?.horaFin}</p>
                        <p><strong>Terapeuta:</strong> {solicitud.citaActual?.terapeuta}</p>
                        <p><strong>Tipo:</strong> {solicitud.citaActual?.tipoTerapia}</p>
                      </div>
                    </div>

                    {/* Datos propuestos */}
                    <div className={`rounded-lg p-4 border ${
                      solicitud.tipo === 'cambio_horario' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
                    }`}>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        {solicitud.tipo === 'cambio_horario' ? 'Nuevo Horario Propuesto' : 'Transferir a'}
                      </h4>
                      <div className="space-y-1 text-sm">
                        {solicitud.tipo === 'cambio_horario' ? (
                          <>
                            <p><strong>Nueva Fecha:</strong> {solicitud.datosPropuestos?.fecha}</p>
                            <p><strong>Nuevo Horario:</strong> {solicitud.datosPropuestos?.horaInicio} - {solicitud.datosPropuestos?.horaFin}</p>
                          </>
                        ) : (
                          <p className="text-lg font-semibold text-purple-700">
                            {solicitud.datosPropuestos?.terapeutaNombre}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="bg-white rounded-lg p-4 border mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Motivo de la solicitud
                    </h4>
                    <p className="text-gray-700 italic">"{solicitud.motivo}"</p>
                  </div>

                  {/* Info de respuesta (si ya fue procesada) */}
                  {solicitud.estado !== 'pendiente' && (
                    <div className={`rounded-lg p-4 border mb-4 ${
                      solicitud.estado === 'aprobada' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        {solicitud.estado === 'aprobada' ? '✅ Aprobada' : '❌ Rechazada'} por {solicitud.adminNombre}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatearFecha(solicitud.fechaRespuesta)}
                      </p>
                      {solicitud.respuestaAdmin && (
                        <p className="text-sm mt-2 italic">"{solicitud.respuestaAdmin}"</p>
                      )}
                    </div>
                  )}

                  {/* Acciones (solo para pendientes) */}
                  {solicitud.estado === 'pendiente' && (
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => handleAprobar(solicitud)}
                        disabled={procesando === solicitud.id}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                          procesando === solicitud.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <CheckCircle2 size={20} />
                        {procesando === solicitud.id ? 'Procesando...' : 'Aprobar y Aplicar'}
                      </button>
                      <button
                        onClick={() => setMostrarModalRechazo(solicitud)}
                        disabled={procesando === solicitud.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <XCircle size={20} />
                        Rechazar
                      </button>
                    </div>
                  )}

                  {/* Fecha de solicitud */}
                  <p className="text-xs text-gray-400 mt-4 text-right">
                    Solicitud enviada: {formatearFecha(solicitud.fechaSolicitud)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Rechazo */}
      {mostrarModalRechazo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <XCircle className="text-red-500" size={24} />
                Rechazar Solicitud
              </h2>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de rechazar la solicitud de <strong>{mostrarModalRechazo.terapeutaNombre}</strong>?
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del rechazo (opcional)
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Explica por qué se rechaza la solicitud..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Este mensaje será visible para la terapeuta
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setMostrarModalRechazo(null);
                  setMotivoRechazo('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                disabled={procesando}
                className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${
                  procesando ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {procesando ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitudesCambio;
