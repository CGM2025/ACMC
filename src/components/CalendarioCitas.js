// src/components/CalendarioCitas.js
import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './CalendarioCitas.css';

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment);

// Crear el calendario con drag and drop
const DragAndDropCalendar = withDragAndDrop(Calendar);

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
 */
const CalendarioCitas = ({ 
  citas, 
  onSelectCita,
  onSelectSlot,
  onEventDrop
}) => {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  /**
   * Convertir citas al formato que espera react-big-calendar
   */
  const eventos = useMemo(() => {
    return citas.map(cita => {
      // Parsear fecha correctamente evitando problemas de timezone
      const [year, month, day] = cita.fecha.split('-').map(Number);
      const [horaInicioH, horaInicioM] = cita.horaInicio.split(':').map(Number);
      const [horaFinH, horaFinM] = cita.horaFin.split(':').map(Number);
      
      const start = new Date(year, month - 1, day, horaInicioH, horaInicioM, 0);
      const end = new Date(year, month - 1, day, horaFinH, horaFinM, 0);

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
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.75em',
        padding: '2px 4px',
        cursor: 'pointer'
      }
    };
  }, []);

  const handleSelectEvent = useCallback((event) => {
    if (onSelectCita) {
      onSelectCita(event.resource);
    }
  }, [onSelectCita]);

  const handleSelectSlot = useCallback((slotInfo) => {
    if (onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  }, [onSelectSlot]);

  const handleEventDrop = useCallback(({ event, start, end }) => {
    if (onEventDrop) {
      onEventDrop(event.resource, start, end);
    }
  }, [onEventDrop]);

  const handleEventResize = useCallback(({ event, start, end }) => {
    if (onEventDrop) {
      onEventDrop(event.resource, start, end);
    }
  }, [onEventDrop]);

  const handleNavigate = useCallback((newDate) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView) => {
    setView(newView);
  }, []);

  const formats = {
    dayHeaderFormat: (date) => moment(date).format('dddd DD/MM'),
    dayRangeHeaderFormat: ({ start, end }) => 
      `${moment(start).format('DD MMM')} - ${moment(end).format('DD MMM')}`,
    agendaHeaderFormat: ({ start, end }) =>
      `${moment(start).format('DD MMM YYYY')} - ${moment(end).format('DD MMM YYYY')}`,
    monthHeaderFormat: (date) => moment(date).format('MMMM YYYY'),
    dayFormat: (date) => moment(date).format('ddd DD/MM'),
    weekdayFormat: (date) => moment(date).format('dddd'),
    timeGutterFormat: (date) => moment(date).format('HH:mm'),
    eventTimeRangeFormat: ({ start, end }) => 
      `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
  };

  return (
    <div className="calendario-container">
      {/* Leyenda de colores - compacta */}
      <div className="flex gap-4 mb-3 justify-center flex-wrap text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Confirmada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Cancelada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Completada</span>
        </div>
      </div>

      <DragAndDropCalendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        style={{ flex: 1, minHeight: 0 }}
        date={date}
        onNavigate={handleNavigate}
        view={view}
        onView={handleViewChange}
        views={['month', 'week', 'day', 'agenda']}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        selectable={true}
        resizable={true}
        draggableAccessor={() => true}
        step={30}
        timeslots={2}
        showMultiDayTimes
        messages={messages}
        formats={formats}
        eventPropGetter={eventStyleGetter}
        popup
        culture="es"
        min={new Date(2000, 0, 1, 7, 0, 0)}
        max={new Date(2000, 0, 1, 21, 0, 0)}
      />
    </div>
  );
};

export default CalendarioCitas;
