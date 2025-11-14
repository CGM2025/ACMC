import { useState, useCallback, useMemo } from 'react';
import mammoth from 'mammoth';

import { actualizarCita, crearCitasEnBatch } from '../api';

/**
 * Custom Hook para manejar toda la lógica relacionada con citas
 * 
 * @param {Array} citas - Lista de citas del sistema
 * @param {Array} terapeutas - Lista de terapeutas
 * @param {Array} clientes - Lista de clientes
 * @param {Function} cargarCitas - Función para recargar citas desde Firebase
 * @param {Object} preciosBasePorTerapia - Precios base por tipo de terapia
 * @returns {Object} Estados y funciones para gestionar citas
 */
export const useCitas = (citas, terapeutas, clientes, cargarCitas, preciosBasePorTerapia) => {
  
  // ========================================
  // ESTADOS DE FILTRADO Y BÚSQUEDA
  // ========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTerapeuta, setFilterTerapeuta] = useState('todos');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ========================================
  // ESTADOS DE CALENDARIO
  // ========================================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState('lista');
  
  // ========================================
  // ESTADOS DE DRAG & DROP
  // ========================================
  const [draggedCita, setDraggedCita] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  // ========================================
  // ESTADOS DE GENERACIÓN DE CITAS
  // ========================================
  const [horarios, setHorarios] = useState([]);
  const [nuevoHorario, setNuevoHorario] = useState({ 
    terapeuta: '', 
    cliente: '', 
    diasSemana: [], 
    horaInicio: '08:00', 
    horaFin: '12:00' 
  });
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [citasGeneradas, setCitasGeneradas] = useState([]);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  // ========================================
  // ESTADOS DE IMPORTACIÓN
  // ========================================
  const [importandoWord, setImportandoWord] = useState(false);

  // ========================================
  // FUNCIÓN: FILTRAR CITAS
  // ========================================
  const filtrarCitas = useCallback(() => {
    return citas.filter(cita => {
      const matchSearch = searchTerm === '' || 
        cita.terapeuta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.fecha?.includes(searchTerm);

      const matchEstado = filterEstado === 'todos' || cita.estado === filterEstado;
      const matchTerapeuta = filterTerapeuta === 'todos' || cita.terapeuta === filterTerapeuta;
      const matchFecha = (!filterFechaInicio || cita.fecha >= filterFechaInicio) &&
                        (!filterFechaFin || cita.fecha <= filterFechaFin);

      return matchSearch && matchEstado && matchTerapeuta && matchFecha;
    });
  }, [citas, searchTerm, filterEstado, filterTerapeuta, filterFechaInicio, filterFechaFin]);

  // ========================================
  // FUNCIÓN: LIMPIAR FILTROS
  // ========================================
  const limpiarFiltros = useCallback(() => {
    setSearchTerm('');
    setFilterEstado('todos');
    setFilterTerapeuta('todos');
    setFilterFechaInicio('');
    setFilterFechaFin('');
  }, []);

  // ========================================
  // FUNCIÓN: CONTAR FILTROS ACTIVOS
  // ========================================
  const contarFiltrosActivos = useCallback(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterEstado !== 'todos') count++;
    if (filterTerapeuta !== 'todos') count++;
    if (filterFechaInicio) count++;
    if (filterFechaFin) count++;
    return count;
  }, [searchTerm, filterEstado, filterTerapeuta, filterFechaInicio, filterFechaFin]);

  // ========================================
  // FUNCIÓN: ABRIR CITA DESDE REPORTE
  // ========================================
  const abrirCitaDesdeReporte = useCallback((fecha, terapeuta, cliente, horaInicio, horaFin, openModalCallback) => {
    const citaEncontrada = citas.find(c => 
      c.fecha === fecha && 
      c.terapeuta === terapeuta && 
      c.cliente === cliente &&
      c.horaInicio === horaInicio &&
      c.horaFin === horaFin
    );
    
    if (citaEncontrada && openModalCallback) {
      openModalCallback('cita', citaEncontrada);
    } else if (!citaEncontrada) {
      console.warn('⚠️ No se encontró la cita en el sistema');
    }

    return citaEncontrada;
  }, [citas]);

  // ========================================
  // FUNCIÓN: CALCULAR HORAS DESDE CITAS
  // ========================================
  const calcularHorasDesdeCitas = useCallback(() => {
    const horasPorTerapeuta = {};
    
    citas.forEach(cita => {
      if (cita.estado === 'completada') {
        const inicio = new Date(`2000-01-01T${cita.horaInicio}`);
        const fin = new Date(`2000-01-01T${cita.horaFin}`);
        const duracion = (fin - inicio) / (1000 * 60 * 60);
        
        if (!horasPorTerapeuta[cita.terapeuta]) {
          horasPorTerapeuta[cita.terapeuta] = 0;
        }
        horasPorTerapeuta[cita.terapeuta] += duracion;
      }
    });
    
    return horasPorTerapeuta;
  }, [citas]);

  // ========================================
  // FUNCIÓN: OBTENER CITAS DEL DÍA
  // ========================================
  const getCitasDelDia = useCallback((fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return citas.filter(cita => cita.fecha === fechaStr);
  }, [citas]);

  // ========================================
  // DRAG & DROP: HANDLERS
  // ========================================
  const handleDragStart = useCallback((e, cita) => {
    setDraggedCita(cita);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, fecha) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const fechaStr = fecha.toISOString().split('T')[0];
    setDragOverDay(fechaStr);
  }, []);

  const handleDrop = useCallback(async (e, fecha) => {
    e.preventDefault();
    
    if (!draggedCita) return;
    
    const nuevaFechaStr = fecha.toISOString().split('T')[0];
    
    if (draggedCita.fecha === nuevaFechaStr) {
      setDraggedCita(null);
      setDragOverDay(null);
      return;
    }

    try {
      // ✅ Usar la función de la API
      await actualizarCita(draggedCita.id, { fecha: nuevaFechaStr });
      
      await cargarCitas();
      alert(`✅ Cita movida al ${nuevaFechaStr}`);
    } catch (error) {
      console.error('Error al mover cita:', error);
      alert('❌ Error al mover la cita');
    }
    
    setDraggedCita(null);
    setDragOverDay(null);
  }, [draggedCita, cargarCitas]);

  const handleDragLeave = useCallback(() => {
    setDragOverDay(null);
  }, []);

  // ========================================
  // FUNCIÓN: IMPORTAR DESDE WORD
  // ========================================
  const importarDesdeWord = useCallback(async (file) => {
    setImportandoWord(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      
      const parser = new DOMParser();
      const docHtml = parser.parseFromString(html, 'text/html');
      const tabla = docHtml.querySelector('table');
      
      if (!tabla) {
        alert('❌ No se encontró una tabla en el documento');
        setImportandoWord(false);
        return;
      }

      const filas = Array.from(tabla.querySelectorAll('tr'));
      const citasImportadas = [];

      for (let i = 1; i < filas.length; i++) {
        const celdas = Array.from(filas[i].querySelectorAll('td, th')).map(c => c.textContent.trim());
        
        if (celdas.length >= 6) {
          const [fechaStr, cliente, terapeuta, horaInicioStr, horaFinStr, tipoTerapia] = celdas;
          
          if (!fechaStr || !cliente || !terapeuta || !horaInicioStr || !horaFinStr) continue;

          const clienteObj = clientes.find(c => c.nombre.toLowerCase() === cliente.toLowerCase());
          const terapeutaObj = terapeutas.find(t => t.nombre.toLowerCase() === terapeuta.toLowerCase());

          if (!clienteObj || !terapeutaObj) {
            console.warn(`⚠️ Cliente o terapeuta no encontrado: ${cliente} / ${terapeuta}`);
            continue;
          }

          const tipoTerapiaFinal = tipoTerapia || 'Sesión de ABA estándar';
          
          const precioCliente = clienteObj.preciosPersonalizados?.[tipoTerapiaFinal];
          const precioBase = preciosBasePorTerapia[tipoTerapiaFinal] || 450;
          const costoPorHora = precioCliente || precioBase;

          const inicio = new Date(`2000-01-01T${horaInicioStr}`);
          const fin = new Date(`2000-01-01T${horaFinStr}`);
          const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
          const costoTotal = costoPorHora * duracionHoras;

          const costoTerapeutaCliente = terapeutaObj.costosPorCliente?.[clienteObj.id];
          const costoTerapeutaServicio = terapeutaObj.costosPorServicio?.[tipoTerapiaFinal];
          const costoTerapeuta = costoTerapeutaCliente || costoTerapeutaServicio || 200;
          const costoTerapeutaTotal = costoTerapeuta * duracionHoras;

          citasImportadas.push({
            fecha: fechaStr,
            cliente: clienteObj.nombre,
            terapeuta: terapeutaObj.nombre,
            horaInicio: horaInicioStr,
            horaFin: horaFinStr,
            estado: 'pendiente',
            tipoTerapia: tipoTerapiaFinal,
            costoPorHora,
            costoTotal,
            costoTerapeuta,
            costoTerapeutaTotal
          });
        }
      }

      if (citasImportadas.length > 0) {
        // ✅ Usar la función de la API
        await crearCitasEnBatch(citasImportadas);
        
        alert(`✅ ${citasImportadas.length} citas importadas correctamente`);
        await cargarCitas();
      } else {
        alert('⚠️ No se encontraron citas válidas en el documento');
      }
    } catch (error) {
      console.error('Error al importar:', error);
      alert('❌ Error al importar el archivo. Verifica que sea un documento Word válido.\n\nDetalle: ' + error.message);
    } finally {
      setImportandoWord(false);
    }
  }, [clientes, terapeutas, preciosBasePorTerapia, cargarCitas]);

  // ========================================
  // FUNCIÓN: AGREGAR HORARIO
  // ========================================
  const agregarHorario = useCallback(() => {
    if (!nuevoHorario.terapeuta || !nuevoHorario.cliente || nuevoHorario.diasSemana.length === 0) {
      alert('⚠️ Completa todos los campos del horario');
      return;
    }
    
    setHorarios([...horarios, { ...nuevoHorario, id: Date.now() }]);
    setNuevoHorario({ terapeuta: '', cliente: '', diasSemana: [], horaInicio: '08:00', horaFin: '12:00' });
  }, [horarios, nuevoHorario]);

  // ========================================
  // FUNCIÓN: ELIMINAR HORARIO
  // ========================================
  const eliminarHorario = useCallback((id) => {
    setHorarios(horarios.filter(h => h.id !== id));
  }, [horarios]);

  // ========================================
  // FUNCIÓN: GENERAR CITAS RECURRENTES
  // ========================================
  const generarCitas = useCallback(() => {
    if (!fechaInicio || !fechaFin || horarios.length === 0) {
      alert('⚠️ Completa las fechas y agrega al menos un horario');
      return;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const nuevasCitas = [];

    horarios.forEach(horario => {
      const clienteObj = clientes.find(c => c.nombre === horario.cliente);
      const terapeutaObj = terapeutas.find(t => t.nombre === horario.terapeuta);
      
      if (!clienteObj || !terapeutaObj) return;

      for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
        const diaSemana = fecha.getDay();
        
        if (horario.diasSemana.includes(diaSemana)) {
          const fechaStr = fecha.toISOString().split('T')[0];
          
          const tipoTerapia = 'Sesión de ABA estándar';
          const precioCliente = clienteObj.preciosPersonalizados?.[tipoTerapia];
          const precioBase = preciosBasePorTerapia[tipoTerapia] || 450;
          const costoPorHora = precioCliente || precioBase;

          const inicioHora = new Date(`2000-01-01T${horario.horaInicio}`);
          const finHora = new Date(`2000-01-01T${horario.horaFin}`);
          const duracionHoras = (finHora - inicioHora) / (1000 * 60 * 60);
          const costoTotal = costoPorHora * duracionHoras;

          const costoTerapeutaCliente = terapeutaObj.costosPorCliente?.[clienteObj.id];
          const costoTerapeutaServicio = terapeutaObj.costosPorServicio?.[tipoTerapia];
          const costoTerapeuta = costoTerapeutaCliente || costoTerapeutaServicio || 200;
          const costoTerapeutaTotal = costoTerapeuta * duracionHoras;

          nuevasCitas.push({
            fecha: fechaStr,
            terapeuta: horario.terapeuta,
            cliente: horario.cliente,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            estado: 'pendiente',
            tipoTerapia,
            costoPorHora,
            costoTotal,
            costoTerapeuta,
            costoTerapeutaTotal
          });
        }
      }
    });

    setCitasGeneradas(nuevasCitas);
    setMostrarResultado(true);
  }, [fechaInicio, fechaFin, horarios, clientes, terapeutas, preciosBasePorTerapia]);

  // ========================================
  // FUNCIÓN: GUARDAR CITAS GENERADAS
  // ========================================
  const guardarCitas = useCallback(async () => {
    try {
      // ✅ Usar la función de la API
      await crearCitasEnBatch(citasGeneradas);
      
      alert(`✅ ${citasGeneradas.length} citas guardadas`);
      setCitasGeneradas([]);
      setMostrarResultado(false);
      await cargarCitas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar citas');
    }
  }, [citasGeneradas, cargarCitas]);

  // ========================================
  // RETURN: EXPORTAR TODO
  // ========================================
  return {
    // Estados de filtrado
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterTerapeuta,
    setFilterTerapeuta,
    filterFechaInicio,
    setFilterFechaInicio,
    filterFechaFin,
    setFilterFechaFin,
    showFilters,
    setShowFilters,
    
    // Estados de calendario
    currentDate,
    setCurrentDate,
    vistaCalendario,
    setVistaCalendario,
    
    // Estados de drag & drop
    draggedCita,
    dragOverDay,
    
    // Estados de generación
    horarios,
    setHorarios,
    nuevoHorario,
    setNuevoHorario,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    citasGeneradas,
    mostrarResultado,
    
    // Estados de importación
    importandoWord,
    
    // Funciones
    filtrarCitas,
    limpiarFiltros,
    contarFiltrosActivos,
    abrirCitaDesdeReporte,
    calcularHorasDesdeCitas,
    getCitasDelDia,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragLeave,
    importarDesdeWord,
    agregarHorario,
    eliminarHorario,
    generarCitas,
    guardarCitas
  };
};
