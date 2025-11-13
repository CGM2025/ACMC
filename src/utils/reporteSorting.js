/**
 * Ordena las citas de un reporte según el campo especificado
 * @param {Array} citas - Array de citas a ordenar
 * @param {string} campo - Campo por el cual ordenar (fecha, duracion, tipoTerapia, terapeuta, precio, iva, total, costoTerapeuta)
 * @param {string} direccion - Dirección del ordenamiento ('asc' o 'desc')
 * @returns {Array} - Array de citas ordenadas
 */
export const ordenarCitasPorCampo = (citas, campo, direccion = 'asc') => {
  if (!citas || citas.length === 0) return citas;
  
  const citasOrdenadas = [...citas].sort((a, b) => {
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
        return direccion === 'asc' 
          ? valorA.localeCompare(valorB)
          : valorB.localeCompare(valorA);
      case 'terapeuta':
        valorA = a.terapeuta.toLowerCase();
        valorB = b.terapeuta.toLowerCase();
        return direccion === 'asc' 
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
    
    if (direccion === 'asc') {
      return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
    } else {
      return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
    }
  });
  
  return citasOrdenadas;
};

/**
 * Determina la nueva dirección de ordenamiento cuando se hace clic en una columna
 * @param {string} campoActual - Campo actual de ordenamiento
 * @param {string} direccionActual - Dirección actual de ordenamiento
 * @param {string} nuevoCampo - Nuevo campo sobre el cual se hizo clic
 * @returns {string} - Nueva dirección ('asc' o 'desc')
 */
export const determinarNuevaDireccion = (campoActual, direccionActual, nuevoCampo) => {
  // Si se hace clic en la misma columna, cambiar la dirección
  if (campoActual === nuevoCampo && direccionActual === 'asc') {
    return 'desc';
  }
  // Por defecto, ordenar de forma ascendente
  return 'asc';
};
