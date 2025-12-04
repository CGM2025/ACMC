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
 * @param {string} organizationId - ID de la organización
 * @param {Array} asignaciones - Lista de asignaciones de servicio (NUEVO)
 * @returns {Object} Estados y funciones para gestionar citas
 */
export const useCitas = (citas, terapeutas, clientes, cargarCitas, preciosBasePorTerapia, organizationId, asignaciones = []) => {
  
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
  // FUNCIÓN: BUSCAR ASIGNACIÓN (NUEVO)
  // ========================================
  const buscarAsignacionParaCita = useCallback((clienteNombre, terapeutaNombre, horaInicio) => {
    if (!asignaciones || asignaciones.length === 0) return null;
    
    // Normalizar nombres para comparación flexible
    const normalizar = (str) => (str || '').toLowerCase().trim();
    
    const nombresCoinciden = (nombre1, nombre2) => {
      const n1 = normalizar(nombre1);
      const n2 = normalizar(nombre2);
      if (!n1 || !n2) return false;
      
      // Comparación exacta
      if (n1 === n2) return true;
      
      // Uno contiene al otro
      if (n1.includes(n2) || n2.includes(n1)) return true;
      
      // Comparar solo primer nombre
      const primerNombre1 = n1.split(' ')[0];
      const primerNombre2 = n2.split(' ')[0];
      if (primerNombre1 === primerNombre2 && primerNombre1.length > 2) return true;
      
      return false;
    };
    
    // Filtrar asignaciones activas que coincidan
    const asignacionesActivas = asignaciones.filter(a => a.activo !== false);
    
    const asignacionesCoincidentes = asignacionesActivas.filter(asig => {
      const matchCliente = nombresCoinciden(asig.clienteNombre, clienteNombre);
      const matchTerapeuta = nombresCoinciden(asig.terapeutaNombre, terapeutaNombre);
      return matchCliente && matchTerapeuta;
    });

    if (asignacionesCoincidentes.length === 0) return null;
    if (asignacionesCoincidentes.length === 1) return asignacionesCoincidentes[0];

    // Si hay múltiples, intentar filtrar por horario
    if (horaInicio) {
      const horaNum = parseInt(horaInicio.split(':')[0]);
      
      for (const asig of asignacionesCoincidentes) {
        if (asig.condicion?.tipo === 'horario' && asig.condicion.horaInicio && asig.condicion.horaFin) {
          const inicioNum = parseInt(asig.condicion.horaInicio.split(':')[0]);
          const finNum = parseInt(asig.condicion.horaFin.split(':')[0]);
          
          if (horaNum >= inicioNum && horaNum < finNum) {
            return asig;
          }
        }
      }
    }

    // Retornar la primera que tenga condición "siempre" o la primera disponible
    return asignacionesCoincidentes.find(a => !a.condicion?.tipo || a.condicion.tipo === 'siempre') 
      || asignacionesCoincidentes[0];
  }, [asignaciones]);

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
  // FUNCIÓN: IMPORTAR DESDE WORD (ACTUALIZADA CON ASIGNACIONES)
  // ========================================
  // 
  // Esta versión soporta el formato real de tus documentos Word:
  // Columnas: [Fecha, Hora inicio, Hora fin, Tiempo total, Costo/hora, Costo total, Paciente]
  // Fecha formato: dd-mm-yy (ej: 04-11-25)
  // Hora formato: 12h con am/pm (ej: 3:30 pm)
  // El nombre del terapeuta se extrae del nombre del archivo
  //
  // ✨ NUEVO: Usa las asignaciones configuradas para determinar servicio y precios
  //
  const importarDesdeWord = useCallback(async (file) => {
    setImportandoWord(true);
    try {
      // ========================================
      // PASO 1: Extraer nombre del terapeuta del archivo
      // ========================================
      const nombreArchivo = file.name.replace('.docx', '').replace('.doc', '');
      const partesNombre = nombreArchivo.split('_');
      const posibleNombreTerapeuta = partesNombre[0];
      
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
      // PASO 3: Funciones de conversión
      // ========================================
      
      const convertirFecha = (fechaStr) => {
        if (!fechaStr) return null;
        const partes = fechaStr.trim().split('-');
        if (partes.length !== 3) return null;
        
        let [dia, mes, anio] = partes;
        if (anio.length === 2) anio = '20' + anio;
        dia = dia.padStart(2, '0');
        mes = mes.padStart(2, '0');
        
        return `${anio}-${mes}-${dia}`;
      };

      const convertirHora = (horaStr) => {
        if (!horaStr) return null;
        let hora = horaStr.trim().toLowerCase();
        
        const esPM = hora.includes('pm');
        const esAM = hora.includes('am');
        hora = hora.replace('pm', '').replace('am', '').trim();
        
        let horas, minutos;
        
        if (hora.includes(':')) {
          const partes = hora.split(':');
          horas = parseInt(partes[0], 10);
          minutos = partes[1].padStart(2, '0');
        } else {
          horas = parseInt(hora, 10);
          minutos = '00';
        }
        
        if (isNaN(horas)) return null;
        
        if (esPM && horas !== 12) horas += 12;
        else if (esAM && horas === 12) horas = 0;
        
        return `${horas.toString().padStart(2, '0')}:${minutos}`;
      };
      
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
      let asignacionesUsadas = 0;
      let asignacionesNoEncontradas = 0;

      for (let i = 1; i < filas.length; i++) {
        const celdas = Array.from(filas[i].querySelectorAll('td, th')).map(c => c.textContent.trim());
        
        let fechaOriginal, horaInicioOriginal, horaFinOriginal, costoPorHoraOriginal, pacienteNombre;
        
        if (celdas.length >= 7) {
          fechaOriginal = celdas[0];
          horaInicioOriginal = celdas[1];
          horaFinOriginal = celdas[2];
          costoPorHoraOriginal = celdas[4];
          pacienteNombre = celdas[6];
        } else if (celdas.length >= 6) {
          fechaOriginal = celdas[0];
          horaInicioOriginal = celdas[1];
          horaFinOriginal = celdas[2];
          costoPorHoraOriginal = celdas[3];
          pacienteNombre = celdas[5];
        } else {
          console.warn(`⚠️ Fila ${i + 1}: Solo tiene ${celdas.length} columnas, saltando...`);
          continue;
        }
        
        pacienteNombre = pacienteNombre.split('\n')[0].trim();
        
        if (!fechaOriginal || !horaInicioOriginal || !horaFinOriginal || !pacienteNombre) {
          console.warn(`⚠️ Fila ${i + 1}: Datos incompletos, saltando...`);
          continue;
        }

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

        // ========================================
        // ✨ NUEVO: Buscar asignación configurada
        // ========================================
        const asignacion = buscarAsignacionParaCita(clienteObj.nombre, terapeutaObj.nombre, horaInicio);
        
        let tipoTerapia, costoPorHora, costoTerapeuta;
        
        if (asignacion) {
          // ✅ Usar datos de la asignación
          tipoTerapia = asignacion.servicioNombre;
          costoPorHora = asignacion.precioCliente;
          costoTerapeuta = asignacion.pagoTerapeuta;
          asignacionesUsadas++;
        } else {
          // ❌ Fallback: Usar comportamiento anterior
          tipoTerapia = 'Sesión de ABA estándar';
          asignacionesNoEncontradas++;
          
          // Usar el costo del documento si está disponible
          costoPorHora = parseFloat(costoPorHoraOriginal) || 0;
          if (!costoPorHora || costoPorHora === 0) {
            const precioCliente = clienteObj.preciosPersonalizados?.[tipoTerapia];
            const precioBase = preciosBasePorTerapia[tipoTerapia] || 450;
            costoPorHora = precioCliente || precioBase;
          }
          
          // Costo del terapeuta (fallback)
          const costoTerapeutaCliente = terapeutaObj.costosPorCliente?.[clienteObj.id];
          const costoTerapeutaServicio = terapeutaObj.costosPorServicio?.[tipoTerapia];
          costoTerapeuta = costoTerapeutaCliente || costoTerapeutaServicio || 200;
        }

        // Calcular totales
        const duracionHoras = calcularDuracionHoras(horaInicio, horaFin);
        const costoTotal = costoPorHora * duracionHoras;
        const costoTerapeutaTotal = costoTerapeuta * duracionHoras;

        citasImportadas.push({
          fecha: fechaConvertida,
          cliente: clienteObj.nombre,
          terapeuta: terapeutaObj.nombre,
          horaInicio: horaInicio,
          horaFin: horaFin,
          estado: 'completada',
          tipoTerapia: tipoTerapia,
          servicio: tipoTerapia, // Agregar también como servicio
          costoPorHora,
          costoTotal,
          costoTerapeuta,
          costoTerapeutaTotal,
          // Marcar si vino de una asignación
          tieneAsignacion: !!asignacion,
          asignacionId: asignacion?.id || null
        });
      }

      // ========================================
      // PASO 5: Mostrar resultados y guardar
      // ========================================
      if (errores.length > 0) {
        console.warn('⚠️ Errores encontrados:', errores);
      }

      if (citasImportadas.length > 0) {
        await crearCitasEnBatch(citasImportadas, organizationId);
        
        let mensaje = `✅ ${citasImportadas.length} citas importadas para ${terapeutaObj.nombre}`;
        
        // Mostrar estadísticas de asignaciones
        mensaje += `\n\n📊 Asignaciones:`;
        mensaje += `\n   • ${asignacionesUsadas} citas con asignación configurada`;
        mensaje += `\n   • ${asignacionesNoEncontradas} citas sin asignación (usaron "Sesión ABA estándar")`;
        
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
  }, [clientes, terapeutas, preciosBasePorTerapia, cargarCitas, organizationId, buscarAsignacionParaCita]);

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
  // FUNCIÓN: GENERAR CITAS RECURRENTES (ACTUALIZADA CON ASIGNACIONES)
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
          
          // ✨ NUEVO: Buscar asignación
          const asignacion = buscarAsignacionParaCita(clienteObj.nombre, terapeutaObj.nombre, horario.horaInicio);
          
          let tipoTerapia, costoPorHora, costoTerapeuta;
          
          if (asignacion) {
            tipoTerapia = asignacion.servicioNombre;
            costoPorHora = asignacion.precioCliente;
            costoTerapeuta = asignacion.pagoTerapeuta;
          } else {
            tipoTerapia = 'Sesión de ABA estándar';
            const precioCliente = clienteObj.preciosPersonalizados?.[tipoTerapia];
            const precioBase = preciosBasePorTerapia[tipoTerapia] || 450;
            costoPorHora = precioCliente || precioBase;
            
            const costoTerapeutaCliente = terapeutaObj.costosPorCliente?.[clienteObj.id];
            const costoTerapeutaServicio = terapeutaObj.costosPorServicio?.[tipoTerapia];
            costoTerapeuta = costoTerapeutaCliente || costoTerapeutaServicio || 200;
          }

          const inicioHora = new Date(`2000-01-01T${horario.horaInicio}`);
          const finHora = new Date(`2000-01-01T${horario.horaFin}`);
          const duracionHoras = (finHora - inicioHora) / (1000 * 60 * 60);
          const costoTotal = costoPorHora * duracionHoras;
          const costoTerapeutaTotal = costoTerapeuta * duracionHoras;

          nuevasCitas.push({
            fecha: fechaStr,
            terapeuta: horario.terapeuta,
            cliente: horario.cliente,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            estado: 'pendiente',
            tipoTerapia,
            servicio: tipoTerapia,
            costoPorHora,
            costoTotal,
            costoTerapeuta,
            costoTerapeutaTotal,
            tieneAsignacion: !!asignacion
          });
        }
      }
    });

    setCitasGeneradas(nuevasCitas);
    setMostrarResultado(true);
  }, [fechaInicio, fechaFin, horarios, clientes, terapeutas, preciosBasePorTerapia, buscarAsignacionParaCita]);

  // ========================================
  // FUNCIÓN: GUARDAR CITAS GENERADAS
  // ========================================
  const guardarCitas = useCallback(async () => {
    try {
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
    guardarCitas,
    
    // Nueva función expuesta
    buscarAsignacionParaCita
  };
};
