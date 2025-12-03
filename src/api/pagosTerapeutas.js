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
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

/**
 * API para gestión de pagos a terapeutas en Firebase
 * Registra cuando se paga a una terapeuta por su trabajo del mes
 */

const COLLECTION_NAME = 'pagosTerapeutas';

/**
 * Obtiene todos los pagos a terapeutas de una organización
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de pagos
 */
export const obtenerPagosTerapeutas = async (organizationId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      orderBy('fechaPago', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Si el índice no existe, intentar sin orderBy
    if (error.code === 'failed-precondition') {
      console.warn('Índice no disponible para pagosTerapeutas, cargando sin ordenar...');
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId)
      );
      const snapshot = await getDocs(q);
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return datos.sort((a, b) => {
        const fechaA = a.fechaPago?.toDate?.() || new Date(a.fechaPago);
        const fechaB = b.fechaPago?.toDate?.() || new Date(b.fechaPago);
        return fechaB - fechaA;
      });
    }
    console.error('Error al obtener pagos a terapeutas:', error);
    throw error;
  }
};

/**
 * Obtiene pagos de un mes específico
 * @param {string} mes - Mes en formato YYYY-MM
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de pagos del mes
 */
export const obtenerPagosTerapeutasPorMes = async (mes, organizationId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('mes', '==', mes)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener pagos del mes:', error);
    throw error;
  }
};

/**
 * Obtiene pagos de una terapeuta específica
 * @param {string} terapeutaId - ID de la terapeuta
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de pagos de la terapeuta
 */
export const obtenerPagosPorTerapeuta = async (terapeutaId, organizationId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('terapeutaId', '==', terapeutaId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener pagos de terapeuta:', error);
    throw error;
  }
};

/**
 * Verifica si ya existe un pago para una terapeuta en un mes específico
 * @param {string} terapeutaNombre - Nombre de la terapeuta
 * @param {string} mes - Mes en formato YYYY-MM
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Object|null>} - El pago existente o null
 */
export const verificarPagoExistente = async (terapeutaNombre, mes, organizationId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('terapeutaNombre', '==', terapeutaNombre),
      where('mes', '==', mes)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error al verificar pago existente:', error);
    throw error;
  }
};

/**
 * Registra un nuevo pago a terapeuta
 * @param {Object} pagoData - Datos del pago
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<string>} - ID del pago creado
 */
export const registrarPagoTerapeuta = async (pagoData, organizationId) => {
  try {
    // Verificar si ya existe un pago para este mes
    const pagoExistente = await verificarPagoExistente(
      pagoData.terapeutaNombre,
      pagoData.mes,
      organizationId
    );
    
    if (pagoExistente) {
      throw new Error(`Ya existe un pago registrado para ${pagoData.terapeutaNombre} en ${pagoData.mes}`);
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...pagoData,
      organizationId,
      fechaPago: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Pago a terapeuta registrado:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al registrar pago a terapeuta:', error);
    throw error;
  }
};

/**
 * Actualiza un pago existente
 * @param {string} pagoId - ID del pago
 * @param {Object} pagoData - Nuevos datos del pago
 * @returns {Promise<void>}
 */
export const actualizarPagoTerapeuta = async (pagoId, pagoData) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, pagoId), {
      ...pagoData,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Pago a terapeuta actualizado:', pagoId);
  } catch (error) {
    console.error('Error al actualizar pago a terapeuta:', error);
    throw error;
  }
};

/**
 * Elimina un pago (revierte el estado de "pagado")
 * @param {string} pagoId - ID del pago
 * @returns {Promise<void>}
 */
export const eliminarPagoTerapeuta = async (pagoId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, pagoId));
    console.log('✅ Pago a terapeuta eliminado:', pagoId);
  } catch (error) {
    console.error('Error al eliminar pago a terapeuta:', error);
    throw error;
  }
};
