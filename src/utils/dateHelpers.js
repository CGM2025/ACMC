/**
 * Utilidades para manejo de fechas
 */

/**
 * Verifica si una fecha pertenece a un mes y año específicos
 * ARREGLADO: Compara strings directamente para evitar problemas de timezone
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @param {number} year - Año
 * @param {number} month - Mes (1-12)
 * @returns {boolean}
 */
export const perteneceAlMes = (fechaStr, year, month) => {
  // Comparar directamente con el string para evitar conversión de timezone
  const [fechaYear, fechaMonth] = fechaStr.split('-');
  
  // DEBUG: Descomentar para ver qué está pasando
  console.log('🔍 perteneceAlMes:', {
    fechaStr,
    fechaYear,
    fechaMonth,
    year,
    month,
    resultado: parseInt(fechaYear) === parseInt(year) && parseInt(fechaMonth) === parseInt(month)
  });
  
  return parseInt(fechaYear) === parseInt(year) && 
         parseInt(fechaMonth) === parseInt(month);
};

/**
 * Formatea una fecha para mostrar
 * ARREGLADO: Crea fecha local para evitar problemas de timezone
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha formateada
 */
export const formatearFecha = (fechaStr) => {
  // Separar la fecha para crear fecha local
  const [year, month, day] = fechaStr.split('-');
  const fecha = new Date(year, month - 1, day); // Crear fecha local
  return fecha.toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Obtiene el nombre del mes
 * @param {number} mesIndex - Índice del mes (0-11)
 * @param {Array} meses - Array con nombres de meses
 * @returns {string} - Nombre del mes
 */
export const obtenerNombreMes = (mesIndex, meses) => {
  return meses[mesIndex] || '';
};

/**
 * Parsea un string de mes-año (YYYY-MM)
 * @param {string} mesReporte - String en formato YYYY-MM
 * @returns {Object} - { year: number, month: number }
 */
export const parsearMesReporte = (mesReporte) => {
  const [year, month] = mesReporte.split('-');
  
  // DEBUG: Ver qué recibe y qué devuelve
  console.log('🗓️ parsearMesReporte:', {
    mesReporte,
    year,
    month,
    yearParsed: parseInt(year),
    monthParsed: parseInt(month)
  });
  
  return { year: parseInt(year), month: parseInt(month) };
};
