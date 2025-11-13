/**
 * Utilidades para cálculos financieros y de tiempo
 */

/**
 * Calcula la duración en horas entre dos tiempos
 * @param {string} horaInicio - Hora de inicio en formato "HH:MM"
 * @param {string} horaFin - Hora de fin en formato "HH:MM"
 * @returns {number} - Duración en horas
 */
export const calcularDuracionHoras = (horaInicio, horaFin) => {
  const inicio = new Date(`2000-01-01T${horaInicio}`);
  const fin = new Date(`2000-01-01T${horaFin}`);
  return (fin - inicio) / (1000 * 60 * 60);
};

/**
 * Calcula el IVA (16%) de un monto
 * @param {number} monto - Monto base
 * @returns {number} - IVA calculado
 */
export const calcularIVA = (monto) => {
  return monto * 0.16;
};

/**
 * Calcula el total con IVA incluido
 * @param {number} monto - Monto base
 * @returns {number} - Total con IVA
 */
export const calcularTotalConIVA = (monto) => {
  return monto + calcularIVA(monto);
};

/**
 * Calcula el margen de ganancia en porcentaje
 * @param {number} ingreso - Ingreso total
 * @param {number} costo - Costo total
 * @returns {number} - Margen en porcentaje
 */
export const calcularMargenPorcentaje = (ingreso, costo) => {
  if (ingreso === 0) return 0;
  const ganancia = ingreso - costo;
  return (ganancia / ingreso) * 100;
};

/**
 * Calcula el costo real de una cita
 * @param {Object} cita - Objeto de cita
 * @param {number} duracionHoras - Duración en horas
 * @returns {number} - Costo real
 */
export const calcularCostoRealCita = (cita, duracionHoras) => {
  return cita.costoTotal || (cita.costoPorHora * duracionHoras) || 0;
};

/**
 * Redondea un número a 2 decimales
 * @param {number} numero - Número a redondear
 * @returns {number} - Número redondeado
 */
export const redondear = (numero) => {
  return Math.round(numero * 100) / 100;
};