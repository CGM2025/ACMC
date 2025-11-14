import { useState, useEffect, useCallback } from 'react';

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
  
  // Utilidad Histórica
  obtenerUtilidadHistorica
} from '../api';

/**
 * Custom Hook para manejar la carga, guardado y eliminación de datos
 * 
 * @param {Object} currentUser - Usuario actual autenticado
 * @param {boolean} isLoggedIn - Estado de autenticación
 * @returns {Object} Estados y funciones para gestionar datos
 */
export const useData = (currentUser, isLoggedIn) => {
  // Estados para datos
  const [clientes, setClientes] = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [horasTrabajadas, setHorasTrabajadas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [utilidadHistorica, setUtilidadHistorica] = useState([]);
  
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
   * Carga los terapeutas desde Firestore usando la API
   */
  const cargarTerapeutas = useCallback(async () => {
    try {
      const data = await obtenerTerapeutas();
      setTerapeutas(data);
      console.log('✅ Terapeutas cargados:', data.length);
    } catch (error) {
      console.error('Error al cargar terapeutas:', error);
    }
  }, []);

  /**
   * Carga los clientes desde Firestore usando la API
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
   * Carga las horas trabajadas desde Firestore usando la API
   * Si el usuario es terapeuta, solo carga sus propias horas
   */
  const cargarHorasTrabajadas = useCallback(async () => {
    try {
      const terapeutaId = currentUser?.rol === 'terapeuta' ? currentUser.uid : null;
      const data = await obtenerHorasTrabajadasAPI(terapeutaId);
      setHorasTrabajadas(data);
      console.log('✅ Horas trabajadas cargadas:', data.length);
    } catch (error) {
      console.error('Error al cargar horas trabajadas:', error);
    }
  }, [currentUser]);

  /**
   * Carga los pagos desde Firestore usando la API
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
   * Carga la utilidad histórica desde Firestore usando la API
   */
  const cargarUtilidadHistorica = useCallback(async () => {
    try {
      const datos = await obtenerUtilidadHistorica();
      setUtilidadHistorica(datos);
      console.log('✅ Utilidad histórica cargada:', datos.length, 'registros');
    } catch (error) {
      console.error('Error al cargar utilidad histórica:', error);
    }
  }, []);

  /**
   * Carga todos los datos necesarios
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
        cargarUtilidadHistorica()
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
    cargarUtilidadHistorica
  ]);

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
   */
  const guardarPago = async (pagoForm, editingId) => {
    try {
      const data = { ...pagoForm, monto: parseFloat(pagoForm.monto) };
      
      if (editingId) {
        await actualizarPagoAPI(editingId, data);
      } else {
        await crearPagoAPI(data);
      }
      
      await cargarPagos();
      return { success: true };
    } catch (error) {
      console.error('Error al guardar pago:', error);
      return { success: false, error };
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
    if (!window.confirm('¿Eliminar terapeuta?')) return { success: false, cancelled: true };
    
    try {
      await eliminarTerapeutaAPI(id);
      await cargarTerapeutas();
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar terapeuta:', error);
      return { success: false, error };
    }
  };

  /**
   * Elimina un cliente usando la API
   */
  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Eliminar cliente?')) return { success: false, cancelled: true };
    
    try {
      await eliminarClienteAPI(id);
      await cargarClientes();
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      return { success: false, error };
    }
  };

  /**
   * Elimina un pago usando la API
   */
  const eliminarPago = async (id) => {
    if (!window.confirm('¿Eliminar pago?')) return { success: false, cancelled: true };
    
    try {
      await eliminarPagoAPI(id);
      await cargarPagos();
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      return { success: false, error };
    }
  };

  /**
   * Elimina una cita usando la API
   */
  const eliminarCita = async (id) => {
    if (!window.confirm('¿Eliminar esta cita?')) return { success: false, cancelled: true };
    
    try {
      await eliminarCitaAPI(id);
      await cargarCitas();
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      return { success: false, error };
    }
  };

  // ==================== FUNCIONES DE ORDENAMIENTO ====================

  /**
   * Ordena los clientes alfabéticamente o por orden original
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
   * Ordena los terapeutas alfabéticamente o por orden original
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
    cargarUtilidadHistorica,
    cargarTodosLosDatos,
    
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
    getTotales
  };
};