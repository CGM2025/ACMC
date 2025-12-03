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
 * @param {string} organizationId - ID de la organización (NUEVO)
 * @returns {Object} Estados y funciones para gestionar citas
 */
export const useCitas = (citas, terapeutas, clientes, cargarCitas, preciosBasePorTerapia, organizationId) => {
  
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
  // FUNCIÓN: IMPORTAR DESDE WORD (ACTUALIZADA)
  // ========================================
  // 
  // Esta versión soporta el formato real de tus documentos Word:
  // Columnas: [Fecha, Hora inicio, Hora fin, Tiempo total, Costo/hora, Costo total, Paciente]
  // Fecha formato: dd-mm-yy (ej: 04-11-25)
  // Hora formato: 12h con am/pm (ej: 3:30 pm)
  // El nombre del terapeuta se extrae del nombre del archivo
  //
  // ⚠️ IMPORTANTE: Esta función NO usa new Date() con strings de fecha
  // para evitar problemas de timezone (consistente con dateHelpers.js)
  //
  const importarDesdeWord = useCallback(async (file) => {
    setImportandoWord(true);
    try {
      // ========================================
      // PASO 1: Extraer nombre del terapeuta del archivo
      // ========================================
      // Ejemplo: "Liz_F_Horas_octubre.docx" → buscar "Liz"
      const nombreArchivo = file.name.replace('.docx', '').replace('.doc', '');
      const partesNombre = nombreArchivo.split('_');
      const posibleNombreTerapeuta = partesNombre[0]; // Primera parte antes del _
      
      // Buscar terapeuta que coincida (búsqueda flexible)
      const terapeutaObj = terapeutas.find(t => 
        t.nombre.toLowerCase().includes(posibleNombreTerapeuta.toLowerCase()) ||
        posibleNombreTerapeuta.toLowerCase().includes(t.nombre.split(' ')[0].toLowerCase())
      );

      if (!terapeutaObj) {
        alert(`❌ No se encontró un terapeuta que coincida con "${posibleNombreTerapeuta}".\n\nAsegúrate de que el nombre del archivo comience con el nombre del terapeuta (ej: Liz_F_Horas_octubre.docx)`);
        setImportandoWord(false);
        return;
      }

      console.log(`✅ Terapeuta identificado: ${terapeutaObj.nombre}`);

      // ========================================
      // PASO 2: Leer el documento Word
      // ========================================
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

      // ========================================
      // PASO 3: Funciones de conversión (SIN usar new Date con fechas)
      // ========================================
      
      // Convertir fecha de "dd-mm-yy" a "YYYY-MM-DD" (solo manipulación de strings)
      const convertirFecha = (fechaStr) => {
        if (!fechaStr) return null;
        
        // Formato esperado: "04-11-25" (día-mes-año)
        const partes = fechaStr.trim().split('-');
        if (partes.length !== 3) return null;
        
        let [dia, mes, anio] = partes;
        
        // Asegurar que el año tenga 4 dígitos
        if (anio.length === 2) {
          anio = '20' + anio; // Asumimos años 2000+
        }
        
        // Asegurar que día y mes tengan 2 dígitos
        dia = dia.padStart(2, '0');
        mes = mes.padStart(2, '0');
        
        // Retornar string puro - NO crear Date object
        return `${anio}-${mes}-${dia}`;
      };

      // Convertir hora de "3:30 pm" o "4 pm" a "15:30" o "16:00" (solo manipulación de strings)
      const convertirHora = (horaStr) => {
        if (!horaStr) return null;
        
        // Limpiar la cadena
        let hora = horaStr.trim().toLowerCase();
        
        // Detectar AM/PM
        const esPM = hora.includes('pm');
        const esAM = hora.includes('am');
        
        // Remover am/pm y espacios
        hora = hora.replace('pm', '').replace('am', '').trim();
        
        // Separar hora y minutos
        let horas, minutos;
        
        if (hora.includes(':')) {
          // Formato con minutos: "3:30" o "11:30"
          const partes = hora.split(':');
          horas = parseInt(partes[0], 10);
          minutos = partes[1].padStart(2, '0');
        } else {
          // Formato sin minutos: "4" o "11" → asumir :00
          horas = parseInt(hora, 10);
          minutos = '00';
        }
        
        // Validar que horas sea un número válido
        if (isNaN(horas)) return null;
        
        // Convertir a formato 24 horas
        if (esPM && horas !== 12) {
          horas += 12;
        } else if (esAM && horas === 12) {
          horas = 0;
        }
        
        return `${horas.toString().padStart(2, '0')}:${minutos}`;
      };
      
      // Calcular duración en horas SIN problemas de timezone
      // Usamos cálculo matemático directo en lugar de Date objects
      const calcularDuracionHoras = (horaInicio, horaFin) => {
        const [horasInicio, minutosInicio] = horaInicio.split(':').map(Number);
        const [horasFin, minutosFin] = horaFin.split(':').map(Number);
        
        const totalMinutosInicio = horasInicio * 60 + minutosInicio;
        const totalMinutosFin = horasFin * 60 + minutosFin;
        
        return (totalMinutosFin - totalMinutosInicio) / 60;
      };

      // ========================================
      // PASO 4: Procesar las filas de la tabla
      // ========================================
      const filas = Array.from(tabla.querySelectorAll('tr'));
      const citasImportadas = [];
      const errores = [];

      // Empezar desde la fila 1 (saltando encabezado)
      for (let i = 1; i < filas.length; i++) {
        const celdas = Array.from(filas[i].querySelectorAll('td, th')).map(c => c.textContent.trim());
        
        // Soportar dos formatos de tabla:
        // Formato A (7 columnas): Fecha, Hora inicio, Hora fin, Tiempo, Costo/hora, Costo total, Paciente
        // Formato B (6 columnas): Fecha, Hora inicio, Hora fin, Costo/hora, Costo total, Paciente
        
        let fechaOriginal, horaInicioOriginal, horaFinOriginal, costoPorHoraOriginal, pacienteNombre;
        
        if (celdas.length >= 7) {
          // Formato A: 7 columnas (incluye "Tiempo total")
          fechaOriginal = celdas[0];
          horaInicioOriginal = celdas[1];
          horaFinOriginal = celdas[2];
          // celdas[3] = tiempo total (no lo usamos, lo calculamos)
          costoPorHoraOriginal = celdas[4];
          // celdas[5] = costo total (no lo usamos, lo calculamos)
          pacienteNombre = celdas[6];
        } else if (celdas.length >= 6) {
          // Formato B: 6 columnas (sin "Tiempo total")
          fechaOriginal = celdas[0];
          horaInicioOriginal = celdas[1];
          horaFinOriginal = celdas[2];
          costoPorHoraOriginal = celdas[3];
          // celdas[4] = costo total (no lo usamos, lo calculamos)
          pacienteNombre = celdas[5];
        } else {
          // Menos de 6 columnas, saltar fila
          console.warn(`⚠️ Fila ${i + 1}: Solo tiene ${celdas.length} columnas, saltando...`);
          continue;
        }
        
        // Limpiar nombre del paciente (puede tener saltos de línea con notas)
        pacienteNombre = pacienteNombre.split('\n')[0].trim();
        
        // Validar campos requeridos
        if (!fechaOriginal || !horaInicioOriginal || !horaFinOriginal || !pacienteNombre) {
          console.warn(`⚠️ Fila ${i + 1}: Datos incompletos, saltando...`);
          continue;
        }

          // Convertir formatos
          const fechaConvertida = convertirFecha(fechaOriginal);
          const horaInicio = convertirHora(horaInicioOriginal);
          const horaFin = convertirHora(horaFinOriginal);

          if (!fechaConvertida || !horaInicio || !horaFin) {
            errores.push(`Fila ${i + 1}: Error al convertir fecha/hora (${fechaOriginal}, ${horaInicioOriginal}, ${horaFinOriginal})`);
            continue;
          }

          // Buscar cliente
          const clienteObj = clientes.find(c => 
            c.nombre.toLowerCase() === pacienteNombre.toLowerCase() ||
            c.nombre.toLowerCase().includes(pacienteNombre.toLowerCase()) ||
            pacienteNombre.toLowerCase().includes(c.nombre.toLowerCase())
          );

          if (!clienteObj) {
            errores.push(`Fila ${i + 1}: Cliente no encontrado: "${pacienteNombre}"`);
            continue;
          }

          // Calcular costos
          const tipoTerapia = 'Sesión de ABA estándar';
          
          // Usar el costo del documento si está disponible, sino usar el precio del sistema
          let costoPorHora = parseFloat(costoPorHoraOriginal) || 0;
          if (!costoPorHora || costoPorHora === 0) {
            const precioCliente = clienteObj.preciosPersonalizados?.[tipoTerapia];
            const precioBase = preciosBasePorTerapia[tipoTerapia] || 450;
            costoPorHora = precioCliente || precioBase;
          }

          // Calcular duración SIN usar Date objects (evita problemas de timezone)
          const duracionHoras = calcularDuracionHoras(horaInicio, horaFin);
          const costoTotal = costoPorHora * duracionHoras;

          // Costo del terapeuta
          const costoTerapeutaCliente = terapeutaObj.costosPorCliente?.[clienteObj.id];
          const costoTerapeutaServicio = terapeutaObj.costosPorServicio?.[tipoTerapia];
          const costoTerapeuta = costoTerapeutaCliente || costoTerapeutaServicio || 200;
          const costoTerapeutaTotal = costoTerapeuta * duracionHoras;

          citasImportadas.push({
            fecha: fechaConvertida,
            cliente: clienteObj.nombre,
            terapeuta: terapeutaObj.nombre,
            horaInicio: horaInicio,
            horaFin: horaFin,
            estado: 'completada', // Las horas reportadas ya están completadas
            tipoTerapia: tipoTerapia,
            costoPorHora,
            costoTotal,
            costoTerapeuta,
            costoTerapeutaTotal
          });

          console.log(`✅ Fila ${i + 1}: ${fechaConvertida} | ${clienteObj.nombre} | ${horaInicio}-${horaFin}`);
      }

      // ========================================
      // PASO 5: Mostrar resultados y guardar
      // ========================================
      if (errores.length > 0) {
        console.warn('⚠️ Errores encontrados:', errores);
      }

      if (citasImportadas.length > 0) {
        // ✅ CORREGIDO: Pasar organizationId a crearCitasEnBatch
        await crearCitasEnBatch(citasImportadas, organizationId);
        
        let mensaje = `✅ ${citasImportadas.length} citas importadas correctamente para ${terapeutaObj.nombre}`;
        if (errores.length > 0) {
          mensaje += `\n\n⚠️ ${errores.length} filas no se pudieron importar:\n${errores.slice(0, 5).join('\n')}`;
          if (errores.length > 5) {
            mensaje += `\n... y ${errores.length - 5} errores más (ver consola)`;
          }
        }
        alert(mensaje);
        await cargarCitas();
      } else {
        let mensaje = '⚠️ No se encontraron citas válidas en el documento.';
        if (errores.length > 0) {
          mensaje += `\n\nErrores encontrados:\n${errores.slice(0, 5).join('\n')}`;
        }
        alert(mensaje);
      }
    } catch (error) {
      console.error('Error al importar:', error);
      alert('❌ Error al importar el archivo.\nVerifica que sea un documento Word válido.\n\nDetalle: ' + error.message);
    } finally {
      setImportandoWord(false);
    }
  }, [clientes, terapeutas, preciosBasePorTerapia, cargarCitas, organizationId]);

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
      // ✅ CORREGIDO: Pasar organizationId a crearCitasEnBatch
      await crearCitasEnBatch(citasGeneradas, organizationId);
      
      alert(`✅ ${citasGeneradas.length} citas guardadas`);
      setCitasGeneradas([]);
      setMostrarResultado(false);
      await cargarCitas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar citas');
    }
  }, [citasGeneradas, cargarCitas, organizationId]);

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
