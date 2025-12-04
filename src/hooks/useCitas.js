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
      // Extraer nombre del terapeuta del archivo
      const nombreArchivo = file.name.replace('.docx', '').replace('.doc', '');
      
      // Buscar terapeuta por primer nombre
      const primerNombreArchivo = nombreArchivo.split('_')[0].toLowerCase();
      const terapeutaObj = terapeutas.find(t => 
        t.nombre.toLowerCase().startsWith(primerNombreArchivo) ||
        t.nombre.toLowerCase().includes(primerNombreArchivo)
      );

      if (!terapeutaObj) {
        alert(`❌ No se encontró un terapeuta que coincida con "${primerNombreArchivo}"\n\nAsegúrate que el nombre del archivo empiece con el nombre del terapeuta.`);
        return;
      }

      console.log(`✅ Terapeuta identificado: ${terapeutaObj.nombre}`);

      // Leer contenido del Word
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const texto = result.value;
      
      console.log('📄 Contenido extraído:', texto.substring(0, 500));

      // Parsear las líneas
      const lineas = texto.split('\n').filter(l => l.trim());
      
      // Función para convertir hora 12h a 24h
      const convertirHora12a24 = (horaStr) => {
        if (!horaStr) return null;
        
        const hora = horaStr.toLowerCase().trim();
        const match = hora.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i);
        
        if (!match) return null;
        
        let horas = parseInt(match[1]);
        const minutos = match[2] ? match[2] : '00';
        const periodo = match[3]?.toLowerCase().replace('.', '');
        
        if (periodo === 'pm' && horas !== 12) {
          horas += 12;
        } else if (periodo === 'am' && horas === 12) {
          horas = 0;
        }
        
        return `${String(horas).padStart(2, '0')}:${minutos}`;
      };

      // Función para convertir fecha
      const convertirFecha = (fechaStr) => {
        if (!fechaStr) return null;
        
        const partes = fechaStr.split(/[-\/]/);
        if (partes.length !== 3) return null;
        
        let dia = partes[0].padStart(2, '0');
        let mes = partes[1].padStart(2, '0');
        let año = partes[2];
        
        if (año.length === 2) {
          año = '20' + año;
        }
        
        return `${año}-${mes}-${dia}`;
      };

      // Función para calcular duración
      const calcularDuracionHoras = (horaInicio, horaFin) => {
        const [h1, m1] = horaInicio.split(':').map(Number);
        const [h2, m2] = horaFin.split(':').map(Number);
        const minutosInicio = h1 * 60 + m1;
        const minutosFin = h2 * 60 + m2;
        return (minutosFin - minutosInicio) / 60;
      };

      const citasImportadas = [];
      const errores = [];

      // Procesar cada línea (saltar header)
      for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;

        // Separar por tabs o múltiples espacios
        const columnas = linea.split(/\t+|\s{2,}/).map(c => c.trim()).filter(c => c);
        
        if (columnas.length < 7) {
          if (columnas.length > 0 && columnas[0].match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/)) {
            errores.push(`Fila ${i + 1}: Formato incompleto - ${columnas.join(' | ')}`);
          }
          continue;
        }

        const [fechaStr, horaInicioStr, horaFinStr, , , , clienteStr] = columnas;

        // Convertir fecha
        const fechaConvertida = convertirFecha(fechaStr);
        if (!fechaConvertida) {
          errores.push(`Fila ${i + 1}: Fecha inválida "${fechaStr}"`);
          continue;
        }

        // Convertir horas
        const horaInicio = convertirHora12a24(horaInicioStr);
        const horaFin = convertirHora12a24(horaFinStr);
        
        if (!horaInicio || !horaFin) {
          errores.push(`Fila ${i + 1}: Hora inválida - inicio: "${horaInicioStr}", fin: "${horaFinStr}"`);
          continue;
        }

        // Buscar cliente
        const nombreClienteLower = clienteStr.toLowerCase().trim();
        const clienteObj = clientes.find(c => 
          c.nombre.toLowerCase() === nombreClienteLower ||
          c.nombre.toLowerCase().includes(nombreClienteLower) ||
          nombreClienteLower.includes(c.nombre.toLowerCase().split(' ')[0])
        );

        if (!clienteObj) {
          errores.push(`Fila ${i + 1}: Cliente no encontrado "${clienteStr}"`);
          continue;
        }

        // Determinar tipo de terapia y precios
        const tipoTerapia = 'Sesión de ABA estándar';
        const precioCliente = clienteObj.preciosPersonalizados?.[tipoTerapia];
        const precioBase = preciosBasePorTerapia[tipoTerapia] || 450;
        const costoPorHora = precioCliente || precioBase;

        const duracionHoras = calcularDuracionHoras(horaInicio, horaFin);
        const costoTotal = costoPorHora * duracionHoras;

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
          estado: 'completada',
          tipoTerapia: tipoTerapia,
          costoPorHora,
          costoTotal,
          costoTerapeuta,
          costoTerapeutaTotal
        });

        console.log(`✅ Fila ${i + 1}: ${fechaConvertida} | ${clienteObj.nombre} | ${horaInicio}-${horaFin}`);
      }

      // Mostrar resultados y guardar
      if (errores.length > 0) {
        console.warn('⚠️ Errores encontrados:', errores);
      }

      if (citasImportadas.length > 0) {
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
    importarDesdeWord
  };
};
