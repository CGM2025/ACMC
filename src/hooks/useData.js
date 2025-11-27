import { useState, useEffect, useCallback } from 'react';
import { 
  registrarPagoVinculado,
  actualizarPagoVinculado,
  eliminarPagoVinculado 
} from '../api/transacciones';

// ✅ Importar TODAS las funciones de la API (sin Firebase)
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
  serviciosAPreciosBase
} from '../api';

/**
 * Custom Hook para manejar la carga, guardado y eliminación de datos
 * 
 * @param {Object} currentUser - Usuario actual autenticado
 * @param {boolean} isLoggedIn - Estado de autenticación
 * @returns {Object} Estados y funciones para gestionar datos
 */
export const useData = (currentUser, isLoggedIn) => {
  
  const [servicios, setServicios] = useState([]);

  // Estados para datos
  const [clientes, setClientes] = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [horasTrabajadas, setHorasTrabajadas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [utilidadHistorica, setUtilidadHistorica] = useState([]);
  const [recibos, setRecibos] = useState([]); // ← NUEVO
  
  // Estados para ordenamiento
  const [ordenClientes, setOrdenClientes] = useState('original');
  const [ordenTerapeutas, setOrdenTerapeutas] = useState('original');
  
  // Estado de carga
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // ==================== FUNCIONES DE CARGA ====================

  /**
   * Carga las citas desde Firestore usando la API
   */
  const cargarCitas = useCallback(async () => {
    try {
      setLoadingCitas(true);
      const data = await obtenerCitas();
      setCitas(data);
      console.log('✅ Citas cargadas:', data.length);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoadingCitas(false);
    }
  }, []);

  /**
   * Carga los terapeutas desde Firestore
   */
  const cargarTerapeutas = useCallback(async () => {
    try {
      const data = await obtenerTerapeutas();
      setTerapeutas(data);
      console.log('✅ Terapeutas cargadas:', data.length);
    } catch (error) {
      console.error('Error al cargar terapeutas:', error);
    }
  }, []);

  /**
   * Carga los clientes desde Firestore
   */
  const cargarClientes = useCallback(async () => {
    try {
      const data = await obtenerClientes();
      setClientes(data);
      console.log('✅ Clientes cargados:', data.length);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  }, []);

  /**
   * Carga las horas trabajadas desde Firestore
   */
  const cargarHorasTrabajadas = useCallback(async () => {
    try {
      const data = await obtenerHorasTrabajadasAPI();
      setHorasTrabajadas(data);
      console.log('✅ Horas trabajadas cargadas:', data.length);
    } catch (error) {
      console.error('Error al cargar horas trabajadas:', error);
    }
  }, []);

  /**
   * Carga los pagos desde Firestore
   */
  const cargarPagos = useCallback(async () => {
    try {
      const data = await obtenerPagos();
      setPagos(data);
      console.log('✅ Pagos cargados:', data.length);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    }
  }, []);

  /**
   * Carga los recibos desde Firestore
   * ← NUEVA FUNCIÓN
   */
  const cargarRecibos = useCallback(async () => {
    try {
      const data = await obtenerRecibos();
      setRecibos(data);
      console.log('✅ Recibos cargados:', data.length);
    } catch (error) {
      console.error('Error al cargar recibos:', error);
    }
  }, []);

  /**
   * Carga recibos de un cliente específico
   * ← NUEVA FUNCIÓN
   */
  const cargarRecibosPorCliente = useCallback(async (clienteNombre) => {
    try {
      const data = await obtenerRecibosPorCliente(clienteNombre);
      return data;
    } catch (error) {
      console.error('Error al cargar recibos por cliente:', error);
      return [];
    }
  }, []);

  /**
   * Carga los datos históricos de utilidad
   */
  const cargarUtilidadHistorica = useCallback(async () => {
    try {
      const data = await obtenerUtilidadHistorica();
      setUtilidadHistorica(data);
      console.log('✅ Utilidad histórica cargada:', data.length);
    } catch (error) {
      console.error('Error al cargar utilidad histórica:', error);
    }
  }, []);

  /**
   * Carga los servicios desde Firestore
   */
  const cargarServicios = useCallback(async () => {
    try {
      const data = await obtenerServicios();
      setServicios(data);
      console.log('✅ Servicios cargados:', data.length);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    }
  }, []);

  /**
   * Carga todos los datos del sistema
   */
  const cargarTodosLosDatos = useCallback(async () => {
    setLoadingData(true);
    try {
      await Promise.all([
        cargarCitas(),
        cargarTerapeutas(),
        cargarClientes(),
        cargarHorasTrabajadas(),
        cargarPagos(),
        cargarRecibos(), // ← NUEVO
        cargarUtilidadHistorica(),
        cargarServicios()  // ← AGREGAR ESTO
      ]);
      console.log('✅ Todos los datos cargados');
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoadingData(false);
    }
  }, [
    cargarCitas, 
    cargarTerapeutas, 
    cargarClientes, 
    cargarHorasTrabajadas, 
    cargarPagos,
    cargarRecibos,
    cargarUtilidadHistorica,
    cargarServicios  // ← AGREGAR ESTO
  ]);

  // ==================== FUNCIONES DE TIPOS DE TERAPIA ====================

  /**
   * Guarda o actualiza un servicio
   */
  const guardarServicio = async (servicioForm, editingId) => {
    try {
      if (editingId) {
        await actualizarServicioAPI(editingId, servicioForm);
      } else {
        await crearServicioAPI(servicioForm);
      }
      await cargarServicios();
      return { success: true };
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      return { success: false, error };
    }
  };

  /**
   * Elimina un servicio
   */
  const eliminarServicio = async (id) => {
    try {
      await eliminarServicioAPI(id);
      await cargarServicios();
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      throw error;
    }
  };

  /**
   * Activa un servicio
   */
  const activarServicio = async (id) => {
    try {
      await activarServicioAPI(id);
      await cargarServicios();
    } catch (error) {
      console.error('Error al activar servicio:', error);
      throw error;
    }
  };

  /**
   * Desactiva un servicio
   */
  const desactivarServicio = async (id) => {
    try {
      await desactivarServicioAPI(id);
      await cargarServicios();
    } catch (error) {
      console.error('Error al desactivar servicio:', error);
      throw error;
    }
  };

  /**
   * Obtiene los precios base como objeto
   */
  const obtenerPreciosBase = useCallback(() => {
    return serviciosAPreciosBase(servicios);
  }, [servicios]);

  // ==================== FUNCIONES DE GUARDADO ====================

  /**
   * Guarda o actualiza horas trabajadas usando la API
   */
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
        await crearHorasTrabajadasAPI(data);
      }
      
      await cargarHorasTrabajadas();
      return { success: true };
    } catch (error) {
      console.error('Error al guardar horas:', error);
      return { success: false, error };
    }
  };

  /**
   * Guarda o actualiza un terapeuta usando la API
   */
  const guardarTerapeuta = async (terapeutaForm, editingId) => {
    try {
      if (editingId) {
        await actualizarTerapeutaAPI(editingId, terapeutaForm);
      } else {
        await crearTerapeutaAPI(terapeutaForm);
      }
      
      await cargarTerapeutas();
      return { success: true };
    } catch (error) {
      console.error('Error al guardar terapeuta:', error);
      return { success: false, error };
    }
  };

  /**
   * Guarda o actualiza un cliente usando la API
   */
  const guardarCliente = async (clienteForm, editingId) => {
    try {
      if (editingId) {
        await actualizarClienteAPI(editingId, clienteForm);
      } else {
        await crearClienteAPI(clienteForm);
      }
      
      await cargarClientes();
      return { success: true };
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      return { success: false, error };
    }
  };

  /**
   * Guarda o actualiza un pago usando la API
   * Ahora también actualiza el estado del recibo si está ligado
   * ← FUNCIÓN MEJORADA
   */
  // const guardarPago = async (pagoForm, editingId) => {
  //   try {
  //     const data = { ...pagoForm, monto: parseFloat(pagoForm.monto) };
      
  //     if (editingId) {
  //       await actualizarPagoAPI(editingId, data);
  //     } else {
  //       await crearPagoAPI(data);
  //     }
      
  //     // Si el pago está ligado a un recibo, actualizar el estado del recibo
  //     if (data.reciboFirebaseId) {
  //       await actualizarEstadoReciboConPagos(data.reciboFirebaseId);
  //     }
      
  //     await cargarPagos();
  //     await cargarRecibos(); // Recargar recibos para ver el cambio de estado
  //     return { success: true };
  //   } catch (error) {
  //     console.error('Error al guardar pago:', error);
  //     return { success: false, error };
  //   }
  // };
  /**
   * Guarda un pago (crear nuevo o actualizar existente) usando transacciones atómicas
   * ← FUNCIÓN MEJORADA CON TRANSACCIONES
   */
  const guardarPago = async (pagoData, editingId = null) => {
    try {
      let resultado;
      
      if (editingId) {
        // ACTUALIZAR pago existente
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
        // CREAR pago nuevo
        resultado = await registrarPagoVinculado(
          pagoData,
          pagoData.reciboFirebaseId || null
        );
      }
      
      if (resultado.exito) {
        // Recargar ambas colecciones (importante!)
        await cargarPagos();
        await cargarRecibos();
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
  
  /**
   * Actualiza el estado de pago de un recibo basándose en sus pagos
   * ← NUEVA FUNCIÓN AUXILIAR
   */
  const actualizarEstadoReciboConPagos = async (reciboFirebaseId) => {
    try {
      // Buscar el recibo
      const recibo = recibos.find(r => r.id === reciboFirebaseId);
      if (!recibo) {
        console.warn('Recibo no encontrado:', reciboFirebaseId);
        return;
      }

      // Calcular el total pagado para este recibo
      const pagosTotales = pagos
        .filter(p => p.reciboFirebaseId === reciboFirebaseId)
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

      // Actualizar el estado del recibo
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

  /**
   * Guarda o actualiza una cita usando la API
   */
  const guardarCita = async (citaForm, editingId) => {
    try {
      if (editingId) {
        await actualizarCita(editingId, citaForm);
      } else {
        await crearCita(citaForm);
      }
      
      await cargarCitas();
      return { success: true, isEdit: !!editingId };
    } catch (error) {
      console.error('Error al guardar cita:', error);
      return { success: false, error };
    }
  };

  // ==================== FUNCIONES DE ELIMINACIÓN ====================

  /**
   * Elimina un terapeuta usando la API
   */
  const eliminarTerapeuta = async (id) => {
    if (!window.confirm('¿Eliminar terapeuta?')) return;
    
    try {
      await eliminarTerapeutaAPI(id);
      await cargarTerapeutas();
    } catch (error) {
      console.error('Error al eliminar terapeuta:', error);
      alert('Error al eliminar terapeuta');
    }
  };

  /**
   * Elimina un cliente usando la API
   */
  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    
    try {
      await eliminarClienteAPI(id);
      await cargarClientes();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar cliente');
    }
  };

  /**
   * Elimina un pago usando transacciones atómicas
   * Revierte automáticamente el monto en el recibo vinculado
   * ← FUNCIÓN MEJORADA CON TRANSACCIONES
   */
  const eliminarPago = async (id) => {
    if (!window.confirm('¿Eliminar pago?')) return;
    
    try {
      // Buscar el pago antes de eliminarlo
      const pago = pagos.find(p => p.id === id);
      
      if (!pago) {
        alert('❌ Pago no encontrado');
        return;
      }

      // Usar transacción atómica para eliminar
      const resultado = await eliminarPagoVinculado(
        id,
        pago.reciboFirebaseId || null,
        pago.monto
      );

      if (resultado.exito) {
        alert('✅ ' + resultado.mensaje);
        // Recargar ambas colecciones
        await cargarPagos();
        await cargarRecibos();
      } else {
        alert('❌ ' + resultado.mensaje);
      }
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      alert('❌ Error al eliminar pago: ' + error.message);
    }
  };

  /**
   * Elimina una cita usando la API
   */
  const eliminarCita = async (id) => {
    if (!window.confirm('¿Eliminar cita?')) return;
    
    try {
      await eliminarCitaAPI(id);
      await cargarCitas();
      alert('✅ Cita eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      alert('Error al eliminar cita');
    }
  };

  // ==================== FUNCIONES DE ORDENAMIENTO ====================

  /**
   * Ordena los clientes alfabéticamente
   */
  const ordenarClientes = (orden) => {
    setOrdenClientes(orden);
    
    if (orden === 'alfabetico') {
      const clientesOrdenados = [...clientes].sort((a, b) => 
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );
      setClientes(clientesOrdenados);
    } else {
      cargarClientes(); // Recargar del servidor para orden original
    }
  };

  /**
   * Ordena las terapeutas alfabéticamente
   */
  const ordenarTerapeutas = (orden) => {
    setOrdenTerapeutas(orden);
    
    if (orden === 'alfabetico') {
      const terapeutasOrdenados = [...terapeutas].sort((a, b) => 
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );
      setTerapeutas(terapeutasOrdenados);
    } else {
      cargarTerapeutas(); // Recargar del servidor para orden original
    }
  };

  // ==================== FUNCIONES AUXILIARES ====================

  /**
   * Obtiene el nombre de un item por su ID
   */
  const getNombre = useCallback((id, lista) => {
    const item = lista.find(x => x.id === id);
    return item?.nombre || 'Sin asignar';
  }, []);

  /**
   * Calcula totales de horas trabajadas y pagos
   */
  const getTotales = useCallback(() => {
    const totalHoras = horasTrabajadas.reduce((acc, h) => acc + parseFloat(h.horas || 0), 0);
    const totalPagos = pagos.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);
    return { totalHoras, totalPagos };
  }, [horasTrabajadas, pagos]);

  // ==================== EFECTOS ====================

  /**
   * Carga todos los datos cuando el usuario inicia sesión
   */
  useEffect(() => {
    if (isLoggedIn) {
      cargarTodosLosDatos();
    }
  }, [isLoggedIn, cargarTodosLosDatos]);

  // ==================== RETURN ====================

  return {
    // Estados de datos
    clientes,
    terapeutas,
    horasTrabajadas,
    pagos,
    citas,
    utilidadHistorica,
    recibos, // ← NUEVO
    
    // Estados de UI
    loadingCitas,
    loadingData,
    ordenClientes,
    ordenTerapeutas,
    
    // Setters directos (para casos especiales)
    setClientes,
    setTerapeutas,
    setCitas,
    
    // Funciones de carga
    cargarCitas,
    cargarTerapeutas,
    cargarClientes,
    cargarHorasTrabajadas,
    cargarPagos,
    cargarRecibos, // ← NUEVO
    cargarRecibosPorCliente, // ← NUEVO
    cargarUtilidadHistorica,
    cargarTodosLosDatos,
    
    // Funciones de guardado
    guardarHorasTrabajadas,
    guardarTerapeuta,
    guardarCliente,
    guardarPago, // ← MEJORADO (ahora actualiza recibos)
    guardarCita,
    
    // Funciones de eliminación
    eliminarTerapeuta,
    eliminarCliente,
    eliminarPago, // ← MEJORADO (ahora actualiza recibos)
    eliminarCita,
    
    // Funciones de ordenamiento
    ordenarClientes,
    ordenarTerapeutas,
    
    // Funciones auxiliares
    getNombre,
    getTotales,

      // Servicios
    servicios,
    cargarServicios,
    guardarServicio,
    eliminarServicio,
    activarServicio,
    desactivarServicio,
    obtenerPreciosBase
  };
};
