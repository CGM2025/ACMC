import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';

/**
 * API para gestión de cargos de sombra (servicios mensuales)
 * Estos son cargos fijos mensuales que no se registran como citas individuales
 */

const COLLECTION_NAME = 'cargosSombra';

/**
 * Obtiene todos los cargos de sombra de una organización
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de cargos
 */
export const obtenerCargosSombra = async (organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        orderBy('mes', 'desc')
      );
    } else {
      q = query(collection(db, COLLECTION_NAME), orderBy('mes', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Si falla por índice, intentar sin orderBy
    if (error.code === 'failed-precondition') {
      console.warn('Índice no disponible, cargando sin ordenar...');
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId)
      );
      const snapshot = await getDocs(q);
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return datos.sort((a, b) => b.mes.localeCompare(a.mes));
    }
    console.error('Error al obtener cargos de sombra:', error);
    throw error;
  }
};

/**
 * Obtiene cargos de sombra por mes
 * @param {string} mes - Mes en formato "YYYY-MM"
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de cargos del mes
 */
export const obtenerCargosSombraPorMes = async (mes, organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('mes', '==', mes)
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('mes', '==', mes)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener cargos de sombra por mes:', error);
    throw error;
  }
};

/**
 * Obtiene cargos de sombra por cliente
 * @param {string} clienteId - ID del cliente
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de cargos del cliente
 */
export const obtenerCargosSombraPorCliente = async (clienteId, organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('clienteId', '==', clienteId),
        orderBy('mes', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('clienteId', '==', clienteId)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Si falla por índice, intentar sin orderBy
    if (error.code === 'failed-precondition') {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('clienteId', '==', clienteId)
      );
      const snapshot = await getDocs(q);
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return datos.sort((a, b) => b.mes.localeCompare(a.mes));
    }
    console.error('Error al obtener cargos de sombra por cliente:', error);
    throw error;
  }
};

/**
 * Obtiene cargos de sombra por terapeuta
 * @param {string} terapeutaId - ID del terapeuta
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de cargos del terapeuta
 */
export const obtenerCargosSombraPorTerapeuta = async (terapeutaId, organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('terapeutaId', '==', terapeutaId),
        orderBy('mes', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('terapeutaId', '==', terapeutaId)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Si falla por índice, intentar sin orderBy
    if (error.code === 'failed-precondition') {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('terapeutaId', '==', terapeutaId)
      );
      const snapshot = await getDocs(q);
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return datos.sort((a, b) => b.mes.localeCompare(a.mes));
    }
    console.error('Error al obtener cargos de sombra por terapeuta:', error);
    throw error;
  }
};

/**
 * Crea un nuevo cargo de sombra
 * @param {Object} cargoData - Datos del cargo
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<string>} - ID del cargo creado
 */
export const crearCargoSombra = async (cargoData, organizationId) => {
  try {
    // Calcular utilidad
    const utilidad = (cargoData.montoCliente || 0) - (cargoData.montoTerapeuta || 0);
    
    const dataConOrg = {
      ...cargoData,
      utilidad,
      tipo: 'sombra',
      ...(organizationId && { organizationId }),
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataConOrg);
    console.log('✅ Cargo de sombra creado:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear cargo de sombra:', error);
    throw error;
  }
};

/**
 * Actualiza un cargo de sombra existente
 * @param {string} cargoId - ID del cargo
 * @param {Object} cargoData - Nuevos datos del cargo
 * @returns {Promise<void>}
 */
export const actualizarCargoSombra = async (cargoId, cargoData) => {
  try {
    // Recalcular utilidad si se actualizan montos
    let dataActualizada = { ...cargoData };
    
    if (cargoData.montoCliente !== undefined || cargoData.montoTerapeuta !== undefined) {
      const utilidad = (cargoData.montoCliente || 0) - (cargoData.montoTerapeuta || 0);
      dataActualizada.utilidad = utilidad;
    }
    
    dataActualizada.updatedAt = new Date().toISOString();
    
    await updateDoc(doc(db, COLLECTION_NAME, cargoId), dataActualizada);
    console.log('✅ Cargo de sombra actualizado:', cargoId);
  } catch (error) {
    console.error('Error al actualizar cargo de sombra:', error);
    throw error;
  }
};

/**
 * Elimina un cargo de sombra
 * @param {string} cargoId - ID del cargo
 * @returns {Promise<void>}
 */
export const eliminarCargoSombra = async (cargoId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, cargoId));
    console.log('✅ Cargo de sombra eliminado:', cargoId);
  } catch (error) {
    console.error('Error al eliminar cargo de sombra:', error);
    throw error;
  }
};

/**
 * Verifica si ya existe un cargo de sombra para un cliente/terapeuta/mes específico
 * @param {string} clienteId - ID del cliente
 * @param {string} terapeutaId - ID del terapeuta
 * @param {string} mes - Mes en formato "YYYY-MM"
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Object|null>} - Cargo existente o null
 */
export const verificarCargoExistente = async (clienteId, terapeutaId, mes, organizationId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('clienteId', '==', clienteId),
      where('terapeutaId', '==', terapeutaId),
      where('mes', '==', mes)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Error al verificar cargo existente:', error);
    throw error;
  }
};
