/**
 * Utilidades para manejo de fechas
 */

/**
 * Verifica si una fecha pertenece a un mes y año específicos
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @param {number} year - Año
 * @param {number} month - Mes (0-11)
 * @returns {boolean}
 */
export const perteneceAlMes = (fechaStr, year, month) => {
  const fecha = new Date(fechaStr);
  return fecha.getFullYear() === parseInt(year) && 
         fecha.getMonth() === parseInt(month) - 1;
};

/**
 * Formatea una fecha para mostrar
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha formateada
 */
export const formatearFecha = (fechaStr) => {
  const fecha = new Date(fechaStr);
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
  return { year: parseInt(year), month: parseInt(month) };
};