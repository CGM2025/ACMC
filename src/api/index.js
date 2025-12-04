/**
 * API Central - Exportaciones de todas las funciones de Firebase
 * Este archivo facilita los imports desde otros módulos
 */

// Asignaciones de Servicio
export {
  obtenerAsignaciones,
  obtenerAsignacionesPorCliente,
  obtenerAsignacionesPorTerapeuta,
  buscarAsignacion,
  crearAsignacion,
  actualizarAsignacion,
  eliminarAsignacion,
  importarAsignaciones
} from './asignacionesServicio';

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

// Usuarios - Vinculación de terapeutas
export {
  obtenerUsuarios,
  vincularUsuarioTerapeuta
} from './usuarios';

// Configuración de Empresa
export {
  obtenerConfiguracion,
  guardarConfiguracion,
  subirLogo,
  eliminarLogo
} from './configuracion';

// Cargos de Sombra
export {
  obtenerCargosSombra,
  obtenerCargosSombraPorMes,
  obtenerCargosSombraPorCliente,
  obtenerCargosSombraPorTerapeuta,
  crearCargoSombra,
  actualizarCargoSombra,
  eliminarCargoSombra,
  verificarCargoExistente
} from './cargosSombra';

// Pagos a Terapeutas
export {
  obtenerPagosTerapeutas,
  obtenerPagosTerapeutasPorMes,
  obtenerPagosPorTerapeuta,
  registrarPagoTerapeuta,
  actualizarPagoTerapeuta,
  eliminarPagoTerapeuta,
  verificarPagoExistente
} from './pagosTerapeutas';
