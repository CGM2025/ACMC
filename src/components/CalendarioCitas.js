// src/components/CalendarioCitas.js
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

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
  showMore: total => `+ Ver más (${total})`
};

const CalendarioCitas = ({ citas, onSelectCita }) => {
  // Convertir citas al formato que espera react-big-calendar
  const eventos = citas.map(cita => {
    const fechaInicio = new Date(`${cita.fecha}T${cita.horaInicio}`);
    const fechaFin = new Date(`${cita.fecha}T${cita.horaFin}`);
    
    return {
      id: cita.id,
      title: `${cita.terapeuta} - ${cita.cliente}`,
      start: fechaInicio,
      end: fechaFin,
      resource: cita
    };
  });

  const eventStyleGetter = (event) => {
    const backgroundColor = event.resource.estado === 'completada' ? '#10b981' : 
                           event.resource.estado === 'cancelada' ? '#ef4444' : '#3b82f6';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" style={{ height: '600px' }}>
      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        messages={messages}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => onSelectCita && onSelectCita(event.resource)}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="month"
        popup
        style={{ height: '100%' }}
      />
      
      <div className="flex gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Programada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Completada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Cancelada</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarioCitas;