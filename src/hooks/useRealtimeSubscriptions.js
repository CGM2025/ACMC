import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Función para ordenar datos localmente
 */
const sortData = (data, field, direction = 'asc') => {
  if (!field) return data;
  return [...data].sort((a, b) => {
    const valA = a[field] || '';
    const valB = b[field] || '';
    if (direction === 'asc') {
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    }
    return valA > valB ? -1 : valA < valB ? 1 : 0;
  });
};

/**
 * Hook para suscripciones en tiempo real a Firestore
 * Automáticamente escucha cambios y actualiza el estado
 *
 * @param {string} organizationId - ID de la organización
 * @param {boolean} isLoggedIn - Si el usuario está autenticado
 * @returns {Object} Datos en tiempo real y funciones de control
 */
export const useRealtimeSubscriptions = (organizationId, isLoggedIn) => {
  // db se importa desde firebase.js

  // Estados para cada colección
  const [citas, setCitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [horasTrabajadas, setHorasTrabajadas] = useState([]);
  const [recibos, setRecibos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargosSombra, setCargosSombra] = useState([]);
  const [pagosTerapeutas, setPagosTerapeutas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [horariosRecurrentes, setHorariosRecurrentes] = useState([]);
  const [utilidadHistorica, setUtilidadHistorica] = useState([]);

  // Estado de carga inicial
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState({});

  // Referencia para las funciones de limpieza de suscripciones
  const unsubscribesRef = useRef([]);

  /**
   * Crea una suscripción en tiempo real a una colección
   * Nota: No usamos orderBy de Firestore para evitar necesitar índices compuestos
   * En su lugar, ordenamos los datos localmente después de recibirlos
   */
  const subscribeToCollection = useCallback((
    collectionName,
    setState,
    options = {}
  ) => {
    if (!organizationId) return () => {};

    const { orderByField = null, orderDirection = 'asc' } = options;

    try {
      const collRef = collection(db, collectionName);

      // Query simple solo con filtro de organizationId (no requiere índice compuesto)
      const q = query(collRef, where('organizationId', '==', organizationId));

      // Marcar como cargando
      setLoadingCollections(prev => ({ ...prev, [collectionName]: true }));

      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          let data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Ordenar localmente si se especificó un campo
          if (orderByField) {
            data = sortData(data, orderByField, orderDirection);
          }

          setState(data);
          setLoadingCollections(prev => ({ ...prev, [collectionName]: false }));
          console.log(`🔄 ${collectionName} actualizado en tiempo real:`, data.length);
        },
        (error) => {
          console.error(`Error en suscripción ${collectionName}:`, error);
          setLoadingCollections(prev => ({ ...prev, [collectionName]: false }));
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error(`Error creando suscripción ${collectionName}:`, error);
      return () => {};
    }
  }, [organizationId]);

  /**
   * Suscripción especial para usuarios (filtro por rol)
   */
  const subscribeToUsuarios = useCallback(() => {
    if (!organizationId) return () => {};

    try {
      const q = query(
        collection(db, 'usuarios'),
        where('organizationId', '==', organizationId)
      );

      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUsuarios(data);
          console.log('🔄 Usuarios actualizados en tiempo real:', data.length);
        },
        (error) => {
          console.error('Error en suscripción usuarios:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error creando suscripción usuarios:', error);
      return () => {};
    }
  }, [organizationId]);

  /**
   * Inicializa todas las suscripciones
   */
  useEffect(() => {
    if (!isLoggedIn || !organizationId) {
      setLoadingInitial(false);
      return;
    }

    console.log('🚀 Iniciando suscripciones en tiempo real para org:', organizationId);
    setLoadingInitial(true);

    // Limpiar suscripciones anteriores
    unsubscribesRef.current.forEach(unsub => unsub());
    unsubscribesRef.current = [];

    // Crear todas las suscripciones
    const subscriptions = [
      // Colecciones principales
      subscribeToCollection('citas', setCitas, { orderByField: 'fecha', orderDirection: 'desc' }),
      subscribeToCollection('clientes', setClientes, { orderByField: 'nombre', orderDirection: 'asc' }),
      subscribeToCollection('terapeutas', setTerapeutas, { orderByField: 'nombre', orderDirection: 'asc' }),
      subscribeToCollection('pagos', setPagos, { orderByField: 'fecha', orderDirection: 'desc' }),
      subscribeToCollection('horasTrabajadas', setHorasTrabajadas, { orderByField: 'fecha', orderDirection: 'desc' }),
      subscribeToCollection('recibos', setRecibos, { orderByField: 'fecha', orderDirection: 'desc' }),
      subscribeToCollection('servicios', setServicios, { orderByField: 'nombre', orderDirection: 'asc' }),
      subscribeToCollection('cargosSombra', setCargosSombra, { orderByField: 'fecha', orderDirection: 'desc' }),
      subscribeToCollection('pagosTerapeutas', setPagosTerapeutas, { orderByField: 'fecha', orderDirection: 'desc' }),
      subscribeToCollection('asignacionesServicio', setAsignaciones, { orderByField: null }),
      subscribeToCollection('contratosMensuales', setContratos, { orderByField: null }),
      subscribeToCollection('horariosRecurrentes', setHorariosRecurrentes, { orderByField: null }),
      subscribeToCollection('utilidadHistorica', setUtilidadHistorica, { orderByField: 'mes', orderDirection: 'desc' }),
      subscribeToUsuarios(),
    ];

    unsubscribesRef.current = subscriptions;

    // Marcar como cargado después de un breve delay
    const timeout = setTimeout(() => {
      setLoadingInitial(false);
    }, 1000);

    // Cleanup al desmontar o cuando cambie organizationId
    return () => {
      clearTimeout(timeout);
      console.log('🧹 Limpiando suscripciones en tiempo real');
      unsubscribesRef.current.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      unsubscribesRef.current = [];
    };
  }, [isLoggedIn, organizationId, subscribeToCollection, subscribeToUsuarios]);

  /**
   * Función para forzar recarga manual (por si acaso)
   */
  const forceRefresh = useCallback(() => {
    // Las suscripciones son automáticas, pero podemos re-suscribir si es necesario
    console.log('🔃 Los datos se actualizan automáticamente en tiempo real');
  }, []);

  return {
    // Datos en tiempo real
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

    // Estados de carga
    loadingInitial,
    loadingCollections,

    // Setters (para ordenamiento local)
    setCitas,
    setClientes,
    setTerapeutas,

    // Control
    forceRefresh,
  };
};
