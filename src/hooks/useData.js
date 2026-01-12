import {
  obtenerAsignaciones,
  crearAsignacion as crearAsignacionAPI,
  actualizarAsignacion as actualizarAsignacionAPI,
  eliminarAsignacion as eliminarAsignacionAPI
} from '../api/asignacionesServicio';
import { useState, useEffect, useCallback } from 'react';
import {
  registrarPagoVinculado,
  actualizarPagoVinculado,
  eliminarPagoVinculado
} from '../api/transacciones';

// Hook de suscripciones en tiempo real
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';

// ✅ Importar TODAS las funciones de la API
import {
  // Citas
  obtenerCitas,
  crearCita,
  actualizarCita,
  eliminarCita as eliminarCitaAPI,

  // Terapeutas
  obtenerTerapeutas,
  crearTerapeuta as crearTerapeutaAPI,
  actualizarTerapeuta as actualizarTerapeutaAPI,
  eliminarTerapeuta as eliminarTerapeutaAPI,

  // Clientes
  obtenerClientes,
  crearCliente as crearClienteAPI,
  actualizarCliente as actualizarClienteAPI,
  eliminarCliente as eliminarClienteAPI,

  // Horas Trabajadas
  obtenerHorasTrabajadas as obtenerHorasTrabajadasAPI,
  crearHorasTrabajadas as crearHorasTrabajadasAPI,
  actualizarHorasTrabajadas as actualizarHorasTrabajadasAPI,
  eliminarHorasTrabajadas as eliminarHorasTrabajadasAPI,

  // Pagos
  obtenerPagos,
  crearPago as crearPagoAPI,
  actualizarPago as actualizarPagoAPI,
  eliminarPago as eliminarPagoAPI,

  // Recibos
  obtenerRecibos,
  obtenerRecibosPorCliente,
  actualizarEstadoPagoRecibo,

  // Utilidad Histórica
  obtenerUtilidadHistorica,

  // Servicios
  obtenerServicios,
  crearServicio as crearServicioAPI,
  actualizarServicio as actualizarServicioAPI,
  eliminarServicio as eliminarServicioAPI,
  activarServicio as activarServicioAPI,
  desactivarServicio as desactivarServicioAPI,
  serviciosAPreciosBase,

  // Usuarios
  obtenerUsuarios,
  vincularUsuarioTerapeuta as vincularUsuarioTerapeutaAPI
} from '../api';

import {
  obtenerCargosSombra,
  obtenerCargosSombraPorMes,
  crearCargoSombra as crearCargoSombraAPI,
  actualizarCargoSombra as actualizarCargoSombraAPI,
  eliminarCargoSombra as eliminarCargoSombraAPI
} from '../api/cargosSombra';

import {
  obtenerPagosTerapeutas,
  registrarPagoTerapeuta as registrarPagoTerapeutaAPI,
  eliminarPagoTerapeuta as eliminarPagoTerapeutaAPI
} from '../api/pagosTerapeutas';

import {
  obtenerContratos,
  crearContrato as crearContratoAPI,
  actualizarContrato as actualizarContratoAPI,
  eliminarContrato as eliminarContratoAPI
} from '../api/contratosMensuales';

import {
  obtenerHorariosRecurrentes,
  crearHorarioRecurrente,
  actualizarHorarioRecurrente,
  eliminarHorarioRecurrente
} from '../api/horariosRecurrentes';

/**
 * Custom Hook para manejar la carga, guardado y eliminación de datos
 * Usa suscripciones en tiempo real para actualización automática
 *
 * @param {Object} currentUser - Usuario actual autenticado
 * @param {boolean} isLoggedIn - Estado de autenticación
 * @returns {Object} Estados y funciones para gestionar datos
 */
export const useData = (currentUser, isLoggedIn) => {
  // Obtener organizationId del usuario actual
  const organizationId = currentUser?.organizationId || null;

  // ==================== SUSCRIPCIONES EN TIEMPO REAL ====================
  // Los datos se actualizan automáticamente cuando cambian en Firestore
  const {
    citas,
    clientes,
    terapeutas,
    pagos,
    horasTrabajadas,
    recibos,
    servicios,
    usuarios,
    cargosSombra,
    pagosTerapeutas,
    asignaciones,
    contratos,
    horariosRecurrentes,
    utilidadHistorica,
    loadingInitial: loadingData,
    setCitas,
    setClientes,
    setTerapeutas,
  } = useRealtimeSubscriptions(organizationId, isLoggedIn);

  // Estado de carga para citas (compatibilidad)
  const [loadingCitas, setLoadingCitas] = useState(false);

  // Estados para ordenamiento
  const [ordenClientes, setOrdenClientes] = useState('original');
  const [ordenTerapeutas, setOrdenTerapeutas] = useState('original');

  // ==================== FUNCIONES DE CARGA (LEGACY - AHORA NO-OP) ====================
  // Los datos ahora se actualizan automáticamente via onSnapshot

  const cargarAsignaciones = useCallback(async () => {
    console.log('ℹ️ Asignaciones se actualizan en tiempo real');
  }, []);

  const cargarContratos = useCallback(async () => {
    console.log('ℹ️ Contratos se actualizan en tiempo real');
  }, []);

  const cargarCitas = useCallback(async () => {
    console.log('ℹ️ Citas se actualizan en tiempo real');
  }, []);

  const cargarTerapeutas = useCallback(async () => {
    console.log('ℹ️ Terapeutas se actualizan en tiempo real');
  }, []);

  const cargarClientes = useCallback(async () => {
    console.log('ℹ️ Clientes se actualizan en tiempo real');
  }, []);

  const cargarHorasTrabajadas = useCallback(async () => {
    console.log('ℹ️ Horas trabajadas se actualizan en tiempo real');
  }, []);

  const cargarPagos = useCallback(async () => {
    console.log('ℹ️ Pagos se actualizan en tiempo real');
  }, []);

  const cargarRecibos = useCallback(async () => {
    console.log('ℹ️ Recibos se actualizan en tiempo real');
  }, []);

  const cargarRecibosPorCliente = useCallback(async (clienteNombre) => {
    try {
      const data = await obtenerRecibosPorCliente(clienteNombre, organizationId);
      return data;
    } catch (error) {
      console.error('Error al cargar recibos por cliente:', error);
      return [];
    }
  }, [organizationId]);

  const cargarUtilidadHistorica = useCallback(async () => {
    console.log('ℹ️ Utilidad histórica se actualiza en tiempo real');
  }, []);

  const cargarUsuarios = useCallback(async () => {
    console.log('ℹ️ Usuarios se actualizan en tiempo real');
  }, []);

  const cargarServicios = useCallback(async () => {
    console.log('ℹ️ Servicios se actualizan en tiempo real');
  }, []);

  const cargarCargosSombra = useCallback(async () => {
    console.log('ℹ️ Cargos de sombra se actualizan en tiempo real');
  }, []);

  const cargarPagosTerapeutas = useCallback(async () => {
    console.log('ℹ️ Pagos a terapeutas se actualizan en tiempo real');
  }, []);

  const cargarHorariosRecurrentes = useCallback(async () => {
    console.log('ℹ️ Horarios recurrentes se actualizan en tiempo real');
  }, []);

  const cargarTodosLosDatos = useCallback(async () => {
    console.log('ℹ️ Los datos se actualizan automáticamente en tiempo real');
  }, []);

  // ==================== FUNCIONES DE HORARIOS RECURRENTES ====================

  const guardarHorarioRecurrente = async (datos, editingId = null) => {
    try {
      if (editingId) {
        await actualizarHorarioRecurrente(editingId, datos);
      } else {
        await crearHorarioRecurrente(datos, organizationId);
      }
      // Los datos se actualizan automáticamente via onSnapshot
    } catch (error) {
      console.error('Error al guardar horario:', error);
      throw error;
    }
  };

  const eliminarHorarioRecurrenteFn = async (horarioId) => {
    try {
      await eliminarHorarioRecurrente(horarioId);
      // Los datos se actualizan automáticamente via onSnapshot
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      throw error;
    }
  };

  const generarCitasDesdeHorarios = async (citasParaGenerar) => {
    try {
      for (const cita of citasParaGenerar) {
        await guardarCita(cita);
      }
      return { success: true, count: citasParaGenerar.length };
    } catch (error) {
      console.error('Error al generar citas:', error);
      throw error;
    }
  };

  // ==================== FUNCIONES DE TIPOS DE TERAPIA ====================

  const guardarServicio = async (servicioForm, editingId) => {
    try {
      if (editingId) {
        await actualizarServicioAPI(editingId, servicioForm);
      } else {
        await crearServicioAPI(servicioForm, organizationId);
      }
      return { success: true };
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      return { success: false, error };
    }
  };

  const eliminarServicio = async (id) => {
    try {
      await eliminarServicioAPI(id);
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      throw error;
    }
  };

  const activarServicio = async (id) => {
    try {
      await activarServicioAPI(id);
    } catch (error) {
      console.error('Error al activar servicio:', error);
      throw error;
    }
  };

  const desactivarServicio = async (id) => {
    try {
      await desactivarServicioAPI(id);
    } catch (error) {
      console.error('Error al desactivar servicio:', error);
      throw error;
    }
  };

  const obtenerPreciosBase = useCallback(() => {
    return serviciosAPreciosBase(servicios);
  }, [servicios]);

  // ==================== FUNCIONES DE GUARDADO ====================

  const vincularUsuario = async (usuarioId, terapeutaId) => {
    try {
      await vincularUsuarioTerapeutaAPI(usuarioId, terapeutaId);
      return { success: true };
    } catch (error) {
      console.error('Error al vincular usuario:', error);
      return { success: false, error };
    }
  };

  const registrarPagoTerapeuta = async (pagoData) => {
    await registrarPagoTerapeutaAPI(pagoData, organizationId);
    return { success: true };
  };

  const eliminarPagoTerapeuta = async (pagoId) => {
    await eliminarPagoTerapeutaAPI(pagoId);
    return { success: true };
  };

  const guardarHorasTrabajadas = async (horasForm, editingId) => {
    try {
      const data = {
        ...horasForm,
        terapeutaId: currentUser.rol === 'admin' ? horasForm.terapeutaId : currentUser.uid,
        horas: parseFloat(horasForm.horas)
      };

      if (editingId) {
        await actualizarHorasTrabajadasAPI(editingId, data);
      } else {
        await crearHorasTrabajadasAPI(data, organizationId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error al guardar horas:', error);
      return { success: false, error };
    }
  };

  const guardarTerapeuta = async (terapeutaForm, editingId) => {
    try {
      if (editingId) {
        await actualizarTerapeutaAPI(editingId, terapeutaForm);
      } else {
        await crearTerapeutaAPI(terapeutaForm, organizationId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error al guardar terapeuta:', error);
      return { success: false, error };
    }
  };

  const guardarCliente = async (clienteForm, editingId) => {
    try {
      if (editingId) {
        await actualizarClienteAPI(editingId, clienteForm);
      } else {
        await crearClienteAPI(clienteForm, organizationId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      return { success: false, error };
    }
  };

  const guardarPago = async (pagoData, editingId = null) => {
    try {
      let resultado;

      if (editingId) {
        const pagoActual = pagos.find(p => p.id === editingId);

        if (!pagoActual) {
          alert('❌ Pago no encontrado');
          return { success: false };
        }

        resultado = await actualizarPagoVinculado(
          editingId,
          pagoData,
          pagoActual.reciboFirebaseId || null,
          pagoData.reciboFirebaseId || null
        );
      } else {
        resultado = await registrarPagoVinculado(
          { ...pagoData, organizationId },
          pagoData.reciboFirebaseId || null
        );
      }

      if (resultado.exito) {
        return { success: true, mensaje: resultado.mensaje };
      } else {
        alert('❌ ' + resultado.mensaje);
        return { success: false, error: resultado.mensaje };
      }
    } catch (error) {
      console.error('Error al guardar pago:', error);
      alert('❌ Error: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  const guardarAsignacion = async (datos, editingId = null) => {
    try {
      if (editingId) {
        await actualizarAsignacionAPI(editingId, datos);
      } else {
        await crearAsignacionAPI(datos, organizationId);
      }
      return { success: true };
    } catch (error) {
      console.error('Error al guardar asignación:', error);
      return { success: false, error };
    }
  };

  const eliminarAsignacionFn = async (asignacionId) => {
    try {
      await eliminarAsignacionAPI(asignacionId);
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      return { success: false, error };
    }
  };

  const guardarContrato = async (datos, editingId = null) => {
    try {
      if (editingId) {
        await actualizarContratoAPI(editingId, datos);
      } else {
        await crearContratoAPI(datos, organizationId);
      }
      return { success: true };
    } catch (error) {
      console.error('Error al guardar contrato:', error);
      return { success: false, error };
    }
  };

  const eliminarContratoFn = async (contratoId) => {
    try {
      await eliminarContratoAPI(contratoId);
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      return { success: false, error };
    }
  };

  const actualizarEstadoReciboConPagos = async (reciboFirebaseId) => {
    try {
      const recibo = recibos.find(r => r.id === reciboFirebaseId);
      if (!recibo) {
        console.warn('Recibo no encontrado:', reciboFirebaseId);
        return;
      }

      const pagosTotales = pagos
        .filter(p => p.reciboFirebaseId === reciboFirebaseId)
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

      await actualizarEstadoPagoRecibo(
        reciboFirebaseId,
        pagosTotales,
        recibo.totalGeneral
      );

      console.log('✅ Estado del recibo actualizado:', {
        reciboId: recibo.reciboId,
        pagado: pagosTotales,
        total: recibo.totalGeneral
      });
    } catch (error) {
      console.error('Error al actualizar estado del recibo:', error);
    }
  };

  const guardarCita = async (citaForm, editingId) => {
    try {
      if (editingId) {
        await actualizarCita(editingId, citaForm);
      } else {
        await crearCita(citaForm, organizationId);
      }

      return { success: true, isEdit: !!editingId };
    } catch (error) {
      console.error('Error al guardar cita:', error);
      return { success: false, error };
    }
  };

  // ==================== FUNCIONES DE ELIMINACIÓN ====================

  const eliminarTerapeuta = async (id) => {
    if (!window.confirm('¿Eliminar terapeuta?')) return;

    try {
      await eliminarTerapeutaAPI(id);
    } catch (error) {
      console.error('Error al eliminar terapeuta:', error);
      alert('Error al eliminar terapeuta');
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Eliminar cliente?')) return;

    try {
      await eliminarClienteAPI(id);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar cliente');
    }
  };

  const eliminarPago = async (id) => {
    if (!window.confirm('¿Eliminar pago?')) return;

    try {
      const pago = pagos.find(p => p.id === id);

      if (!pago) {
        alert('❌ Pago no encontrado');
        return;
      }

      const resultado = await eliminarPagoVinculado(
        id,
        pago.reciboFirebaseId || null,
        pago.monto
      );

      if (resultado.exito) {
        alert('✅ ' + resultado.mensaje);
      } else {
        alert('❌ ' + resultado.mensaje);
      }
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      alert('❌ Error al eliminar pago: ' + error.message);
    }
  };

  const eliminarCita = async (id) => {
    if (!window.confirm('¿Eliminar cita?')) return;

    try {
      await eliminarCitaAPI(id);
      alert('✅ Cita eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      alert('Error al eliminar cita');
    }
  };

  // ==================== FUNCIONES DE CARGOS DE SOMBRA ====================

  const guardarCargoSombra = async (cargoData, cargoId) => {
    try {
      if (cargoId) {
        await actualizarCargoSombraAPI(cargoId, cargoData);
      } else {
        await crearCargoSombraAPI(cargoData, organizationId);
      }
      return { success: true };
    } catch (error) {
      console.error('Error al guardar cargo de sombra:', error);
      return { success: false, error };
    }
  };

  const eliminarCargoSombra = async (cargoId) => {
    try {
      await eliminarCargoSombraAPI(cargoId);
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar cargo de sombra:', error);
      return { success: false, error };
    }
  };

  // ==================== FUNCIONES DE ORDENAMIENTO ====================

  const ordenarClientes = (orden) => {
    setOrdenClientes(orden);

    if (orden === 'alfabetico') {
      const clientesOrdenados = [...clientes].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );
      setClientes(clientesOrdenados);
    }
  };

  const ordenarTerapeutas = (orden) => {
    setOrdenTerapeutas(orden);

    if (orden === 'alfabetico') {
      const terapeutasOrdenados = [...terapeutas].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );
      setTerapeutas(terapeutasOrdenados);
    }
  };

  // ==================== FUNCIONES AUXILIARES ====================

  const getNombre = useCallback((id, lista) => {
    const item = lista.find(x => x.id === id);
    return item?.nombre || 'Sin asignar';
  }, []);

  const getTotales = useCallback(() => {
    const totalHoras = horasTrabajadas.reduce((acc, h) => acc + parseFloat(h.horas || 0), 0);
    const totalPagos = pagos.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);
    return { totalHoras, totalPagos };
  }, [horasTrabajadas, pagos]);

  // ==================== RETURN ====================

  return {
    // Estados de datos
    clientes,
    terapeutas,
    horasTrabajadas,
    pagos,
    citas,
    utilidadHistorica,
    recibos,
    cargosSombra,

    // Estados de UI
    loadingCitas,
    loadingData,
    ordenClientes,
    ordenTerapeutas,

    // Setters directos (para casos especiales)
    setClientes,
    setTerapeutas,
    setCitas,

    // Funciones de carga (legacy - ahora son no-op)
    cargarCitas,
    cargarTerapeutas,
    cargarClientes,
    cargarHorasTrabajadas,
    cargarPagos,
    cargarRecibos,
    cargarRecibosPorCliente,
    cargarUtilidadHistorica,
    cargarTodosLosDatos,
    cargarCargosSombra,

    // Funciones de guardado
    guardarHorasTrabajadas,
    guardarTerapeuta,
    guardarCliente,
    guardarPago,
    guardarCita,

    // Funciones de eliminación
    eliminarTerapeuta,
    eliminarCliente,
    eliminarPago,
    eliminarCita,

    // Funciones de ordenamiento
    ordenarClientes,
    ordenarTerapeutas,

    // Funciones auxiliares
    getNombre,
    getTotales,

    // Cargos de sombra
    guardarCargoSombra,
    eliminarCargoSombra,

    // Servicios
    servicios,
    cargarServicios,
    guardarServicio,
    eliminarServicio,
    activarServicio,
    desactivarServicio,
    obtenerPreciosBase,

    // Usuarios
    usuarios,
    cargarUsuarios,
    vincularUsuario,

    // Comprobantes de pago a terapeutas
    pagosTerapeutas,
    cargarPagosTerapeutas,
    registrarPagoTerapeuta,
    eliminarPagoTerapeuta,

    // Asignaciones de costos y terapeutas a clientes
    asignaciones,
    cargarAsignaciones,
    guardarAsignacion,
    eliminarAsignacion: eliminarAsignacionFn,
    contratos,
    cargarContratos,
    guardarContrato,
    eliminarContrato: eliminarContratoFn,

    // Horarios recurrentes
    horariosRecurrentes,
    cargarHorariosRecurrentes,
    guardarHorarioRecurrente,
    eliminarHorarioRecurrenteFn,
    generarCitasDesdeHorarios,
  };
};
