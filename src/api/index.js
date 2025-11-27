/**
 * API Central - Exportaciones de todas las funciones de Firebase
 * Este archivo facilita los imports desde otros módulos
 */

// Citas
export {
  obtenerCitas,
  crearCita,
  actualizarCita,
  eliminarCita,
  crearCitasEnBatch
} from './citas';

// Terapeutas
export {
  obtenerTerapeutas,
  crearTerapeuta,
  actualizarTerapeuta,
  eliminarTerapeuta
} from './terapeutas';

// Clientes
export {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} from './clientes';

// Horas Trabajadas
export {
  obtenerHorasTrabajadas,
  crearHorasTrabajadas,
  actualizarHorasTrabajadas,
  eliminarHorasTrabajadas
} from './horasTrabajadas';

// Pagos
export {
  obtenerPagos,
  crearPago,
  actualizarPago,
  eliminarPago
} from './pagos';

// Recibos
export {
  obtenerRecibos,
  obtenerRecibosPorCliente,
  obtenerRecibosPorMes,
  crearRecibo,
  actualizarRecibo,
  actualizarEstadoPagoRecibo,
  eliminarRecibo,
  generarReciboId
} from './recibos';

// Utilidad Histórica
export {
  obtenerUtilidadHistorica,
  importarUtilidadHistorica
} from './utilidadHistorica';

// Servicios
export {
  obtenerServicios,
  obtenerServiciosActivos,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
  activarServicio,
  desactivarServicio,
  inicializarServiciosPorDefecto,
  serviciosAPreciosBase
} from './servicios';
