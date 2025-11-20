import { useState, useCallback } from 'react';
import { 
  generarReporteMensual as generarReporte,
  prepararReciboParaFirebase 
} from '../utils/reportLogic';
import { crearRecibo, obtenerRecibosPorMes } from '../api/recibos';

/**
 * Custom Hook para manejar la generación y gestión de reportes mensuales
 * 
 * @param {Array} citas - Lista de citas del sistema
 * @param {Array} clientes - Lista de clientes
 * @param {Array} meses - Array con nombres de meses
 * @returns {Object} Estados y funciones para gestionar reportes
 */
export const useReportes = (citas, clientes, meses) => {
  // Estados para reportes
  const [mesReporte, setMesReporte] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reporteGenerado, setReporteGenerado] = useState(null);
  const [terapeutaReporte, setTerapeutaReporte] = useState('todas');
  const [clienteReporte, setClienteReporte] = useState('todos');
  const [ordenColumna, setOrdenColumna] = useState({ campo: null, direccion: 'asc' });
  const [guardandoRecibos, setGuardandoRecibos] = useState(false);

  /**
   * Genera el reporte mensual basado en las citas completadas
   * Ahora usa la lógica extraída en reportLogic.js
   */
  const generarReporteMensual = useCallback(() => {
    const reporte = generarReporte({
      citas,
      clientes,
      meses,
      mesReporte,
      terapeutaReporte,
      clienteReporte
    });
    
    setReporteGenerado(reporte);
  }, [citas, clientes, meses, mesReporte, terapeutaReporte, clienteReporte]);

  /**
   * Guarda los recibos del reporte actual en Firebase
   * Esta función se llama después de generar un reporte
   * @param {Object} reporteCustom - Reporte personalizado (opcional). Si no se proporciona, usa reporteGenerado
   * @param {string} reporteCustom.mes - Mes del reporte en formato YYYY-MM
   * @param {Array} reporteCustom.recibos - Array de recibos a guardar
   * @returns {Promise<Object>} - Resultado con cantidad de recibos guardados
   */
  const guardarRecibosEnFirebase = useCallback(async (reporteCustom = null) => {
    // Usar reporte personalizado o el generado por el hook
    const reporte = reporteCustom || reporteGenerado;
    const mes = reporteCustom?.mes || mesReporte;
    
    if (!reporte || !reporte.recibos || reporte.recibos.length === 0) {
      console.warn('⚠️ No hay recibos para guardar');
      return { exito: false, mensaje: 'No hay recibos para guardar' };
    }

    try {
      setGuardandoRecibos(true);
      console.log('💾 Iniciando guardado de recibos en Firebase...');

      // Verificar si ya existen recibos para este mes
      const recibosExistentes = await obtenerRecibosPorMes(mes);
      
      if (recibosExistentes.length > 0) {
        const confirmacion = window.confirm(
          `Ya existen ${recibosExistentes.length} recibos guardados para este mes.\n\n` +
          `¿Deseas continuar? Esto creará recibos duplicados.`
        );
        
        if (!confirmacion) {
          setGuardandoRecibos(false);
          return { exito: false, mensaje: 'Guardado cancelado por el usuario' };
        }
      }

      let recibosGuardados = 0;
      const errores = [];

      // Guardar cada recibo
      for (const recibo of reporte.recibos) {
        try {
          const reciboParaFirebase = prepararReciboParaFirebase(recibo, mes);
          await crearRecibo(reciboParaFirebase);
          recibosGuardados++;
          console.log(`✅ Recibo guardado: ${reciboParaFirebase.reciboId}`);
        } catch (error) {
          console.error(`❌ Error al guardar recibo de ${recibo.nombre}:`, error);
          errores.push({ cliente: recibo.nombre, error: error.message });
        }
      }

      setGuardandoRecibos(false);

      if (errores.length === 0) {
        console.log(`✅ ${recibosGuardados} recibos guardados exitosamente`);
        return {
          exito: true,
          mensaje: `${recibosGuardados} recibos guardados exitosamente`,
          recibosGuardados
        };
      } else {
        console.warn(`⚠️ ${recibosGuardados} recibos guardados, ${errores.length} errores`);
        return {
          exito: true,
          mensaje: `${recibosGuardados} recibos guardados, ${errores.length} con errores`,
          recibosGuardados,
          errores
        };
      }

    } catch (error) {
      console.error('❌ Error general al guardar recibos:', error);
      setGuardandoRecibos(false);
      return {
        exito: false,
        mensaje: 'Error al guardar recibos: ' + error.message
      };
    }
  }, [reporteGenerado, mesReporte]);

  /**
   * Genera el reporte Y guarda los recibos en un solo paso
   * @returns {Promise<Object>} - Resultado del guardado
   */
  const generarYGuardarRecibos = useCallback(async () => {
    // Primero generar el reporte
    generarReporteMensual();
    
    // Esperar un tick para que el estado se actualice
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Luego guardar los recibos
    return await guardarRecibosEnFirebase();
  }, [generarReporteMensual, guardarRecibosEnFirebase]);

  /**
   * Ordena las citas en los reportes por columna
   * @param {Array} citasArray - Array de citas a ordenar
   * @param {string} campo - Campo por el cual ordenar
   * @returns {Array} - Array de citas ordenadas
   */
  const ordenarCitasReporte = useCallback((citasArray, campo) => {
    if (!citasArray || citasArray.length === 0) return citasArray;
    
    // Cambiar dirección si se hace clic en la misma columna
    const nuevaDireccion = ordenColumna.campo === campo && ordenColumna.direccion === 'asc' ? 'desc' : 'asc';
    setOrdenColumna({ campo, direccion: nuevaDireccion });
    
    const citasOrdenadas = [...citasArray].sort((a, b) => {
      let valorA, valorB;
      
      switch(campo) {
        case 'fecha':
          valorA = new Date(a.fecha);
          valorB = new Date(b.fecha);
          break;
        case 'duracion':
          valorA = a.duracion;
          valorB = b.duracion;
          break;
        case 'tipoTerapia':
          valorA = a.tipoTerapia.toLowerCase();
          valorB = b.tipoTerapia.toLowerCase();
          return nuevaDireccion === 'asc' 
            ? valorA.localeCompare(valorB)
            : valorB.localeCompare(valorA);
        case 'terapeuta':
          valorA = a.terapeuta.toLowerCase();
          valorB = b.terapeuta.toLowerCase();
          return nuevaDireccion === 'asc' 
            ? valorA.localeCompare(valorB)
            : valorB.localeCompare(valorA);
        default:
          valorA = a[campo] || 0;
          valorB = b[campo] || 0;
      }
      
      if (nuevaDireccion === 'asc') {
        return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
      } else {
        return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
      }
    });
    
    return citasOrdenadas;
  }, [ordenColumna]);

  /**
   * Renderiza el indicador de ordenamiento en los encabezados
   * @param {string} campo - Campo a verificar
   * @returns {JSX.Element} - Elemento con la flecha de ordenamiento
   */
  const renderIndicadorOrden = useCallback((campo) => {
    if (ordenColumna.campo !== campo) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return ordenColumna.direccion === 'asc' 
      ? <span className="text-blue-600 ml-1">↑</span>
      : <span className="text-blue-600 ml-1">↓</span>;
  }, [ordenColumna]);

  /**
   * Descarga el reporte como archivo de texto
   */
  const descargarReporte = useCallback(() => {
    if (!reporteGenerado) return;

    let contenido = `REPORTE DE HORAS TRABAJADAS\n`;
    contenido += `Período: ${reporteGenerado.nombreMes}\n`;
    contenido += `Generado: ${new Date().toLocaleDateString()}\n`;
    contenido += `${'='.repeat(80)}\n\n`;

    if (reporteGenerado.recibos) {
      reporteGenerado.recibos.forEach(recibo => {
        contenido += `CLIENTE: ${recibo.nombre} (${recibo.codigo})\n`;
        contenido += `${'-'.repeat(80)}\n`;
        contenido += `Total de Horas: ${recibo.totalHoras.toFixed(2)}h\n`;
        contenido += `Total de Citas: ${recibo.totalCitas}\n`;
        contenido += `Subtotal: $${recibo.totalPrecio.toFixed(2)}\n`;
        contenido += `IVA: $${recibo.totalIva.toFixed(2)}\n`;
        contenido += `Total: $${recibo.totalGeneral.toFixed(2)}\n`;
        contenido += `Costo Terapeutas: $${recibo.totalCostoTerapeutas.toFixed(2)}\n`;
        contenido += `Ganancia: $${recibo.gananciaTotal.toFixed(2)} (${recibo.margenPorcentaje.toFixed(1)}%)\n\n`;
        
        contenido += `Desglose por Cita:\n`;
        recibo.citas.forEach(cita => {
          contenido += `  ${cita.fecha} - ${cita.terapeuta}\n`;
          contenido += `    ${cita.horaInicio} - ${cita.horaFin} (${cita.duracion.toFixed(2)}h)\n`;
          contenido += `    ${cita.tipoTerapia}: $${cita.total.toFixed(2)}\n`;
        });
        contenido += `\n${'='.repeat(80)}\n\n`;
      });
    }

    contenido += `RESUMEN GENERAL\n`;
    contenido += `${'-'.repeat(80)}\n`;
    contenido += `Total de Horas (Todos): ${reporteGenerado.totalHorasGeneral?.toFixed(2) || 0}h\n`;
    contenido += `Total de Citas (Todas): ${reporteGenerado.totalCitasGeneral || 0}\n`;
    contenido += `Ingresos Totales: $${reporteGenerado.totalIngresos?.toFixed(2) || 0}\n`;

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${mesReporte}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [reporteGenerado, mesReporte]);

  return {
    // Estados
    mesReporte,
    setMesReporte,
    reporteGenerado,
    setReporteGenerado,
    terapeutaReporte,
    setTerapeutaReporte,
    clienteReporte,
    setClienteReporte,
    ordenColumna,
    guardandoRecibos,
    
    // Funciones
    generarReporteMensual,
    guardarRecibosEnFirebase,
    generarYGuardarRecibos,
    ordenarCitasReporte,
    renderIndicadorOrden,
    descargarReporte
  };
};
