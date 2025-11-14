// src/components/CalendarioCitas.js
import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarioCitas.css';

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment);

/**
 * Mensajes en español para el calendario
 */
const messages = {
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

/**
 * Componente de Calendario Profesional usando react-big-calendar
 * 
 * @param {Object} props
 * @param {Array} props.citas - Lista de citas
 * @param {Function} props.onSelectCita - Callback al seleccionar una cita
 * @param {Function} props.onSelectSlot - Callback al seleccionar un slot vacío (opcional)
 * @param {Function} props.onEventDrop - Callback al mover una cita (opcional)
 */
const CalendarioCitas = ({ 
  citas, 
  onSelectCita,
  onSelectSlot,
  onEventDrop
}) => {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date()); // ← AGREGAR estado de fecha

  /**
   * Convertir citas al formato que espera react-big-calendar
   */
  const eventos = useMemo(() => {
    return citas.map(cita => {
      const fecha = new Date(cita.fecha);
      const [horaInicioH, horaInicioM] = cita.horaInicio.split(':');
      const [horaFinH, horaFinM] = cita.horaFin.split(':');
      
      const start = new Date(fecha);
      start.setHours(parseInt(horaInicioH), parseInt(horaInicioM), 0);
      
      const end = new Date(fecha);
      end.setHours(parseInt(horaFinH), parseInt(horaFinM), 0);

      return {
        id: cita.id,
        title: `${cita.terapeuta} - ${cita.cliente}`,
        start,
        end,
        resource: cita
      };
    });
  }, [citas]);

  /**
   * Estilos personalizados según el estado de la cita
   */
  const eventStyleGetter = useCallback((event) => {
    const cita = event.resource;
    const backgroundColor = 
      cita.estado === 'completada' ? '#10b981' :
      cita.estado === 'confirmada' ? '#3b82f6' :
      cita.estado === 'cancelada' ? '#ef4444' :
      '#f59e0b'; // pendiente

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85em',
        padding: '2px 5px'
      }
    };
  }, []);

  /**
   * Handler cuando se selecciona un evento (cita)
   */
  const handleSelectEvent = useCallback((event) => {
    if (onSelectCita) {
      onSelectCita(event.resource);
    }
  }, [onSelectCita]);

  /**
   * Handler cuando se selecciona un slot vacío
   */
  const handleSelectSlot = useCallback((slotInfo) => {
    if (onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  }, [onSelectSlot]);

  /**
   * Handler cuando se mueve un evento (drag & drop)
   */
  const handleEventDrop = useCallback(({ event, start, end }) => {
    if (onEventDrop) {
      onEventDrop(event.resource, start, end);
    }
  }, [onEventDrop]);

  /**
   * Handler cuando cambia la navegación (mes/semana/día)
   */
  const handleNavigate = useCallback((newDate) => {
    setDate(newDate);
  }, []);

  /**
   * Formatos de fecha personalizados
   */
  const formats = {
    dayHeaderFormat: (date) => moment(date).format('dddd DD/MM'),
    dayRangeHeaderFormat: ({ start, end }) => 
      `${moment(start).format('DD MMM')} - ${moment(end).format('DD MMM')}`,
    agendaHeaderFormat: ({ start, end }) =>
      `${moment(start).format('DD MMM YYYY')} - ${moment(end).format('DD MMM YYYY')}`,
    monthHeaderFormat: (date) => moment(date).format('MMMM YYYY'),
    dayFormat: (date) => moment(date).format('ddd DD/MM'),
    weekdayFormat: (date) => moment(date).format('dddd'),
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" style={{ height: '700px' }}>
      {/* Leyenda de colores */}
      <div className="flex gap-4 mb-4 justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm">Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm">Confirmada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">Cancelada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">Completada</span>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100% - 100px)' }}
        date={date}  // ← AGREGAR prop date
        onNavigate={handleNavigate}  // ← AGREGAR handler de navegación
        view={view}
        onView={setView}
        views={['month', 'week', 'day', 'agenda']}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        selectable={!!onSelectSlot}
        resizable={!!onEventDrop}
        step={30}
        showMultiDayTimes
        messages={messages}
        formats={formats}
        eventPropGetter={eventStyleGetter}
        popup
        culture="es"
      />

      {/* Instrucciones */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Instrucciones:</strong> Haz clic en una cita para ver/editar
          {onSelectSlot && ' • Haz clic en un espacio vacío para crear'}
          {onEventDrop && ' • Arrastra las citas para moverlas'}
        </p>
      </div>
    </div>
  );
};

export default CalendarioCitas;