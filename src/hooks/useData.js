import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';

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
   * Carga las citas desde Firestore
   */
  const cargarCitas = useCallback(async () => {
    try {
      setLoadingCitas(true);
      const q = query(collection(db, 'citas'), orderBy('fecha', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitas(data);
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
      const snapshot = await getDocs(collection(db, 'terapeutas'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTerapeutas(data);
    } catch (error) {
      console.error('Error al cargar terapeutas:', error);
    }
  }, []);

  /**
   * Carga los clientes desde Firestore
   */
  const cargarClientes = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'clientes'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  }, []);

  /**
   * Carga las horas trabajadas desde Firestore
   * Si el usuario es terapeuta, solo carga sus propias horas
   */
  const cargarHorasTrabajadas = useCallback(async () => {
    try {
      const q = currentUser?.rol === 'terapeuta' 
        ? query(
            collection(db, 'horasTrabajadas'), 
            where('terapeutaId', '==', currentUser.uid), 
            orderBy('fecha', 'desc')
          )
        : query(collection(db, 'horasTrabajadas'), orderBy('fecha', 'desc'));
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHorasTrabajadas(data);
    } catch (error) {
      console.error('Error al cargar horas trabajadas:', error);
    }
  }, [currentUser]);

  /**
   * Carga los pagos desde Firestore
   */
  const cargarPagos = useCallback(async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'pagos'), orderBy('fecha', 'desc'))
      );
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPagos(data);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    }
  }, []);

  /**
   * Carga la utilidad histórica desde Firestore
   */
  const cargarUtilidadHistorica = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'utilidadHistorica'));
      const datos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUtilidadHistorica(datos);
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
   * Guarda o actualiza horas trabajadas
   */
  const guardarHorasTrabajadas = async (horasForm, editingId) => {
    try {
      const data = {
        ...horasForm,
        terapeutaId: currentUser.rol === 'admin' ? horasForm.terapeutaId : currentUser.uid,
        horas: parseFloat(horasForm.horas)
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'horasTrabajadas', editingId), data);
      } else {
        await addDoc(collection(db, 'horasTrabajadas'), data);
      }
      
      await cargarHorasTrabajadas();
      return { success: true };
    } catch (error) {
      console.error('Error al guardar horas:', error);
      return { success: false, error };
    }
  };

  /**
   * Guarda o actualiza un terapeuta
   */
  const guardarTerapeuta = async (terapeutaForm, editingId) => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'terapeutas', editingId), terapeutaForm);
      } else {
        await addDoc(collection(db, 'terapeutas'), terapeutaForm);
      }
      
      await cargarTerapeutas();
      return { success: true };
    } catch (error) {
      console.error('Error al guardar terapeuta:', error);
      return { success: false, error };
    }
  };

  /**
   * Guarda o actualiza un cliente
   */
  const guardarCliente = async (clienteForm, editingId) => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'clientes', editingId), clienteForm);
      } else {
        await addDoc(collection(db, 'clientes'), clienteForm);
      }
      
      await cargarClientes();
      return { success: true };
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      return { success: false, error };
    }
  };

  /**
   * Guarda o actualiza un pago
   */
  const guardarPago = async (pagoForm, editingId) => {
    try {
      const data = { ...pagoForm, monto: parseFloat(pagoForm.monto) };
      
      if (editingId) {
        await updateDoc(doc(db, 'pagos', editingId), data);
      } else {
        await addDoc(collection(db, 'pagos'), data);
      }
      
      await cargarPagos();
      return { success: true };
    } catch (error) {
      console.error('Error al guardar pago:', error);
      return { success: false, error };
    }
  };

  /**
   * Guarda o actualiza una cita
   */
  const guardarCita = async (citaForm, editingId) => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'citas', editingId), citaForm);
      } else {
        await addDoc(collection(db, 'citas'), citaForm);
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
   * Elimina un terapeuta
   */
  const eliminarTerapeuta = async (id) => {
    if (!window.confirm('¿Eliminar terapeuta?')) return { success: false, cancelled: true };
    
    try {
      await deleteDoc(doc(db, 'terapeutas', id));
      await cargarTerapeutas();
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar terapeuta:', error);
      return { success: false, error };
    }
  };

  /**
   * Elimina un cliente
   */
  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Eliminar cliente?')) return { success: false, cancelled: true };
    
    try {
      await deleteDoc(doc(db, 'clientes', id));
      await cargarClientes();
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      return { success: false, error };
    }
  };

  /**
   * Elimina un pago
   */
  const eliminarPago = async (id) => {
    if (!window.confirm('¿Eliminar pago?')) return { success: false, cancelled: true };
    
    try {
      await deleteDoc(doc(db, 'pagos', id));
      await cargarPagos();
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      return { success: false, error };
    }
  };

  /**
   * Elimina una cita
   */
  const eliminarCita = async (id) => {
    if (!window.confirm('¿Eliminar esta cita?')) return { success: false, cancelled: true };
    
    try {
      await deleteDoc(doc(db, 'citas', id));
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
