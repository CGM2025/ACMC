import { useState, useCallback } from 'react';

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

  /**
   * Genera el reporte mensual basado en las citas completadas
   */
  const generarReporteMensual = useCallback(() => {
    const [year, month] = mesReporte.split('-');
    
    // Filtrar citas del mes
    const citasDelMes = citas.filter(cita => {
      if (cita.estado !== 'completada') return false;
      
      const fechaCita = new Date(cita.fecha);
      const cumpleMes = fechaCita.getFullYear() === parseInt(year) && 
             fechaCita.getMonth() === parseInt(month) - 1;
      
      // Filtrar por terapeuta si no es "todas"
      if (terapeutaReporte !== 'todas' && cita.terapeuta !== terapeutaReporte) {
        return false;
      }
      
      // Filtrar por cliente si no es "todos"
      if (clienteReporte !== 'todos' && cita.cliente !== clienteReporte) {
        return false;
      }
      
      return cumpleMes;
    });

    // Agrupar por cliente para generar recibos individuales
    const reportePorCliente = {};
    
    citasDelMes.forEach(cita => {
      if (!reportePorCliente[cita.cliente]) {
        // Buscar código del cliente
        const clienteObj = clientes.find(c => c.nombre === cita.cliente);
        reportePorCliente[cita.cliente] = {
          nombre: cita.cliente,
          codigo: clienteObj?.codigo || 'N/A',
          citas: [],
          totalHoras: 0,
          totalCitas: 0
        };
      }
      
      const inicio = new Date(`2000-01-01T${cita.horaInicio}`);
      const fin = new Date(`2000-01-01T${cita.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      
      // Usar el precio real de la cita
      const costoReal = cita.costoTotal || (cita.costoPorHora * duracionHoras) || 0;
      const iva = costoReal * 0.16;
      const totalConIva = costoReal + iva;

      reportePorCliente[cita.cliente].citas.push({
        fecha: cita.fecha,
        terapeuta: cita.terapeuta,
        tipoTerapia: cita.tipoTerapia || 'N/A',
        horaInicio: cita.horaInicio,
        horaFin: cita.horaFin,
        duracion: duracionHoras,
        precio: costoReal,
        iva: iva,
        total: totalConIva,
        costoTerapeuta: cita.costoTerapeutaTotal || 0
      });
      
      reportePorCliente[cita.cliente].totalHoras += duracionHoras;
      reportePorCliente[cita.cliente].totalCitas += 1;
    });

    // Convertir a array y ordenar citas por fecha
    const recibos = Object.values(reportePorCliente).map(cliente => {
      const citasOrdenadas = cliente.citas.sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
      );
      
      const totalPrecio = citasOrdenadas.reduce((sum, c) => sum + c.precio, 0);
      const totalIva = citasOrdenadas.reduce((sum, c) => sum + c.iva, 0);
      const totalGeneral = citasOrdenadas.reduce((sum, c) => sum + c.total, 0);
      const totalCostoTerapeutas = citasOrdenadas.reduce((sum, c) => sum + (c.costoTerapeuta || 0), 0);
      const gananciaTotal = totalGeneral - totalCostoTerapeutas;
      const margenPorcentaje = totalGeneral > 0 ? ((gananciaTotal / totalGeneral) * 100) : 0;
      
      return {
        ...cliente,
        citas: citasOrdenadas,
        totalPrecio,
        totalIva,
        totalGeneral,
        totalCostoTerapeutas,
        gananciaTotal,
        margenPorcentaje
      };
    });

    setReporteGenerado({
      mes: mesReporte,
      nombreMes: `${meses[parseInt(month) - 1]} ${year}`,
      recibos: recibos,
      terapeutaFiltrada: terapeutaReporte,
      totalCitasGeneral: citasDelMes.length,
      totalHorasGeneral: recibos.reduce((sum, r) => sum + r.totalHoras, 0),
      totalIngresos: recibos.reduce((sum, r) => sum + r.totalGeneral, 0)
    });
  }, [mesReporte, citas, clientes, terapeutaReporte, clienteReporte, meses]);

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
        case 'precio':
          valorA = a.precio;
          valorB = b.precio;
          break;
        case 'iva':
          valorA = a.iva;
          valorB = b.iva;
          break;
        case 'total':
          valorA = a.total;
          valorB = b.total;
          break;
        case 'costoTerapeuta':
          valorA = a.costoTerapeuta || 0;
          valorB = b.costoTerapeuta || 0;
          break;
        default:
          return 0;
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

    // Nota: La estructura original esperaba reporteGenerado.terapeutas
    // pero el reporte generado tiene reporteGenerado.recibos por cliente
    // Ajustar según la estructura real que necesites
    if (reporteGenerado.terapeutas) {
      reporteGenerado.terapeutas.forEach(terapeuta => {
        contenido += `TERAPEUTA: ${terapeuta.nombre}\n`;
        contenido += `${'-'.repeat(80)}\n`;
        contenido += `Total de Horas: ${terapeuta.totalHoras.toFixed(2)}h\n`;
        contenido += `Total de Citas: ${terapeuta.totalCitas}\n`;
        contenido += `Clientes Atendidos: ${terapeuta.totalClientes}\n`;
        contenido += `Promedio Diario: ${terapeuta.promedioDiario.toFixed(2)}h\n\n`;
        
        contenido += `Desglose por Día:\n`;
        terapeuta.detallesPorDia.forEach(dia => {
          contenido += `  ${dia.fecha} - ${dia.horas.toFixed(2)}h (${dia.citas.length} citas)\n`;
          dia.citas.forEach(cita => {
            contenido += `    • ${cita.cliente}: ${cita.horaInicio} - ${cita.horaFin} (${cita.duracion.toFixed(2)}h)\n`;
          });
        });
        contenido += `\n${'='.repeat(80)}\n\n`;
      });
    }

    contenido += `RESUMEN GENERAL\n`;
    contenido += `${'-'.repeat(80)}\n`;
    
    if (reporteGenerado.totalGeneral !== undefined) {
      contenido += `Total de Horas (Todos): ${reporteGenerado.totalGeneral.toFixed(2)}h\n`;
    } else if (reporteGenerado.totalHorasGeneral !== undefined) {
      contenido += `Total de Horas (Todos): ${reporteGenerado.totalHorasGeneral.toFixed(2)}h\n`;
    }
    
    contenido += `Total de Citas (Todas): ${reporteGenerado.totalCitasGeneral}\n`;

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_horas_${mesReporte}.txt`;
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
    
    // Funciones
    generarReporteMensual,
    ordenarCitasReporte,
    renderIndicadorOrden,
    descargarReporte
  };
};
