/**
 * Calcula el costo total basado en hora de inicio, hora de fin y costo por hora.
 * 
 * @param {string} horaInicio - Hora de inicio en formato "HH:MM"
 * @param {string} horaFin - Hora de fin en formato "HH:MM"
 * @param {number|string} costoPorHora - Costo por hora
 * @returns {number} - Costo total calculado (0 si los parámetros son inválidos)
 */
export const calcularCostoTotal = (horaInicio, horaFin, costoPorHora) => {
  // Validar que todos los parámetros estén presentes
  if (!horaInicio || !horaFin || costoPorHora === undefined || costoPorHora === null) {
    return 0;
  }

  try {
    // Crear objetos Date con una fecha fija y las horas proporcionadas
    const inicio = new Date(`2000-01-01T${horaInicio}`);
    const fin = new Date(`2000-01-01T${horaFin}`);
    
    // Validar que las fechas sean válidas
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return 0;
    }
    
    // Calcular duración en horas
    const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
    
    // Calcular costo total
    const costoTotal = duracionHoras * parseFloat(costoPorHora);
    
    // Retornar 0 si el resultado es NaN, de lo contrario retornar el costo
    return isNaN(costoTotal) ? 0 : costoTotal;
  } catch (error) {
    // En caso de cualquier error, retornar 0
    return 0;
  }
};
