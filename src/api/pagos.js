import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy
} from 'firebase/firestore';

/**
 * API para gestión de pagos en Firebase
 */

const COLLECTION_NAME = 'pagos';

/**
 * Obtiene todos los pagos ordenados por fecha
 * @returns {Promise<Array>} - Array de pagos
 */
export const obtenerPagos = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('fecha', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    throw error;
  }
};

/**
 * Crea un nuevo pago
 * @param {Object} pagoData - Datos del pago
 * @returns {Promise<string>} - ID del pago creado
 */
export const crearPago = async (pagoData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), pagoData);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear pago:', error);
    throw error;
  }
};

/**
 * Actualiza un pago existente
 * @param {string} pagoId - ID del pago
 * @param {Object} pagoData - Nuevos datos del pago
 * @returns {Promise<void>}
 */
export const actualizarPago = async (pagoId, pagoData) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, pagoId), pagoData);
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    throw error;
  }
};

/**
 * Elimina un pago
 * @param {string} pagoId - ID del pago
 * @returns {Promise<void>}
 */
export const eliminarPago = async (pagoId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, pagoId));
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    throw error;
  }
};