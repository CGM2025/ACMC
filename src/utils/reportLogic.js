import { 
  calcularDuracionHoras, 
  calcularIVA, 
  calcularTotalConIVA,
  calcularCostoRealCita,
  calcularMargenPorcentaje,
  redondear
} from './calculations';
import { perteneceAlMes, parsearMesReporte, obtenerNombreMes } from './dateHelpers';
import { generarReciboId } from '../api/recibos';
/**
 * Lógica de negocio para generación de reportes y recibos
 */

/**
 * Filtra las citas completadas de un mes específico
 * @param {Array} citas - Lista de todas las citas
 * @param {string} mesReporte - Mes en formato YYYY-MM
 * @param {string} terapeutaReporte - Nombre de terapeuta o "todas"
 * @param {string} clienteReporte - Nombre de cliente o "todos"
 * @returns {Array} - Citas filtradas
 */
export const filtrarCitasDelMes = (citas, mesReporte, terapeutaReporte, clienteReporte) => {
  console.log('🔎 filtrarCitasDelMes llamada con:', { mesReporte, terapeutaReporte, clienteReporte });
  const { year, month } = parsearMesReporte(mesReporte);
  
  return citas.filter(cita => {
    // Solo citas completadas
    if (cita.estado !== 'completada') return false;
    
    // Filtro de mes
    if (!perteneceAlMes(cita.fecha, year, month)) return false;
    
    // Filtro de terapeuta
    if (terapeutaReporte !== 'todas' && cita.terapeuta !== terapeutaReporte) {
      return false;
    }
    
    // Filtro de cliente
    if (clienteReporte !== 'todos' && cita.cliente !== clienteReporte) {
      return false;
    }
    
    return true;
  });
};

/**
 * Procesa una cita individual para el reporte
 * @param {Object} cita - Objeto de cita
 * @returns {Object} - Cita procesada con cálculos
 */
export const procesarCita = (cita) => {
  const duracionHoras = calcularDuracionHoras(cita.horaInicio, cita.horaFin);
  const costoReal = calcularCostoRealCita(cita, duracionHoras);
  const iva = calcularIVA(costoReal);
  const totalConIva = calcularTotalConIVA(costoReal);
  const costoTerapeuta = cita.costoTerapeutaTotal || 0;

  return {
    fecha: cita.fecha,
    terapeuta: cita.terapeuta,
    tipoTerapia: cita.tipoTerapia || 'N/A',
    horaInicio: cita.horaInicio,
    horaFin: cita.horaFin,
    duracion: redondear(duracionHoras),
    precio: redondear(costoReal),
    iva: redondear(iva),
    total: redondear(totalConIva),
    costoTerapeuta: redondear(costoTerapeuta)
  };
};

/**
 * Agrupa citas por cliente
 * @param {Array} citasDelMes - Citas filtradas del mes
 * @param {Array} clientes - Lista de clientes
 * @returns {Object} - Citas agrupadas por cliente
 */
export const agruparCitasPorCliente = (citasDelMes, clientes) => {
  const reportePorCliente = {};
  
  citasDelMes.forEach(cita => {
    if (!reportePorCliente[cita.cliente]) {
      const clienteObj = clientes.find(c => c.nombre === cita.cliente);
      reportePorCliente[cita.cliente] = {
        nombre: cita.cliente,
        codigo: clienteObj?.codigo || 'N/A',
        clienteId: clienteObj?.id || null,
        citas: [],
        totalHoras: 0,
        totalCitas: 0
      };
    }
    
    const citaProcesada = procesarCita(cita);
    reportePorCliente[cita.cliente].citas.push(citaProcesada);
    reportePorCliente[cita.cliente].totalHoras += citaProcesada.duracion;
    reportePorCliente[cita.cliente].totalCitas += 1;
  });
  
  return reportePorCliente;
};

/**
 * Calcula los totales de un recibo
 * @param {Array} citas - Citas del cliente
 * @returns {Object} - Totales calculados
 */
export const calcularTotalesRecibo = (citas) => {
  const totalPrecio = citas.reduce((sum, c) => sum + c.precio, 0);
  const totalIva = citas.reduce((sum, c) => sum + c.iva, 0);
  const totalGeneral = citas.reduce((sum, c) => sum + c.total, 0);
  const totalCostoTerapeutas = citas.reduce((sum, c) => sum + (c.costoTerapeuta || 0), 0);
  const gananciaTotal = totalGeneral - totalCostoTerapeutas;
  const margenPorcentaje = calcularMargenPorcentaje(totalGeneral, totalCostoTerapeutas);
  
  return {
    totalPrecio: redondear(totalPrecio),
    totalIva: redondear(totalIva),
    totalGeneral: redondear(totalGeneral),
    totalCostoTerapeutas: redondear(totalCostoTerapeutas),
    gananciaTotal: redondear(gananciaTotal),
    margenPorcentaje: redondear(margenPorcentaje)
  };
};

/**
 * Genera los recibos por cliente con todos los cálculos
 * @param {Object} reportePorCliente - Citas agrupadas por cliente
 * @returns {Array} - Array de recibos
 */
export const generarRecibos = (reportePorCliente) => {
  return Object.values(reportePorCliente).map(cliente => {
    // Ordenar citas por fecha
    const citasOrdenadas = cliente.citas.sort((a, b) => 
      new Date(a.fecha) - new Date(b.fecha)
    );
    
    const totales = calcularTotalesRecibo(citasOrdenadas);
    
    return {
      ...cliente,
      citas: citasOrdenadas,
      ...totales
    };
  });
};

/**
 * Prepara un recibo para guardar en Firebase
 * @param {Object} recibo - Recibo generado
 * @param {string} mesReporte - Mes en formato YYYY-MM
 * @returns {Object} - Recibo formateado para Firebase
 */
export const prepararReciboParaFirebase = (recibo, mesReporte) => {
  // Generar ID único del recibo
  const reciboId = generarReciboId(mesReporte, recibo.codigo);
  
  return {
    reciboId,
    mes: mesReporte,
    clienteNombre: recibo.nombre,
    clienteCodigo: recibo.codigo,
    clienteId: recibo.clienteId,
    totalHoras: recibo.totalHoras,
    totalCitas: recibo.totalCitas,
    totalPrecio: recibo.totalPrecio,
    totalIva: recibo.totalIva,
    totalGeneral: recibo.totalGeneral,
    totalCostoTerapeutas: recibo.totalCostoTerapeutas,
    gananciaTotal: recibo.gananciaTotal,
    margenPorcentaje: recibo.margenPorcentaje,
    citas: recibo.citas,
    fechaGeneracion: new Date().toISOString(),
    montoPagado: 0,
    estadoPago: 'pendiente'
  };
};

/**
 * Calcula el resumen general del reporte
 * @param {Array} recibos - Recibos generados
 * @param {Array} citasDelMes - Todas las citas del mes
 * @returns {Object} - Resumen general
 */
export const calcularResumenGeneral = (recibos, citasDelMes) => {
  return {
    totalCitasGeneral: citasDelMes.length,
    totalHorasGeneral: redondear(recibos.reduce((sum, r) => sum + r.totalHoras, 0)),
    totalIngresos: redondear(recibos.reduce((sum, r) => sum + r.totalGeneral, 0))
  };
};

/**
 * Función principal: Genera el reporte mensual completo
 * @param {Object} params - Parámetros del reporte
 * @param {Array} params.citas - Todas las citas
 * @param {Array} params.clientes - Todos los clientes
 * @param {Array} params.meses - Nombres de meses
 * @param {string} params.mesReporte - Mes en formato YYYY-MM
 * @param {string} params.terapeutaReporte - Terapeuta seleccionada o "todas"
 * @param {string} params.clienteReporte - Cliente seleccionado o "todos"
 * @returns {Object} - Reporte completo
 */
export const generarReporteMensual = ({ 
  citas, 
  clientes, 
  meses, 
  mesReporte, 
  terapeutaReporte, 
  clienteReporte 
}) => {
  // 1. Filtrar citas del mes
  const citasDelMes = filtrarCitasDelMes(citas, mesReporte, terapeutaReporte, clienteReporte);
  
  // 2. Agrupar por cliente
  const reportePorCliente = agruparCitasPorCliente(citasDelMes, clientes);
  
  // 3. Generar recibos con cálculos
  const recibos = generarRecibos(reportePorCliente);
  
  // 4. Calcular resumen general
  const resumen = calcularResumenGeneral(recibos, citasDelMes);
  
  // 5. Formatear información del mes
  const { year, month } = parsearMesReporte(mesReporte);
  const nombreMes = `${obtenerNombreMes(month - 1, meses)} ${year}`;
  
  return {
    mes: mesReporte,
    nombreMes,
    recibos,
    terapeutaFiltrada: terapeutaReporte,
    ...resumen
  };
};
