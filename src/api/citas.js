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
  writeBatch
} from 'firebase/firestore';

/**
 * API para gestión de citas en Firebase
 */

const COLLECTION_NAME = 'citas';

/**
 * Obtiene todas las citas ordenadas por fecha
 * @returns {Promise<Array>} - Array de citas
 */
export const obtenerCitas = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('fecha', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener citas:', error);
    throw error;
  }
};

/**
 * Crea una nueva cita
 * @param {Object} citaData - Datos de la cita
 * @returns {Promise<string>} - ID de la cita creada
 */
export const crearCita = async (citaData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), citaData);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear cita:', error);
    throw error;
  }
};

/**
 * Actualiza una cita existente
 * @param {string} citaId - ID de la cita
 * @param {Object} citaData - Nuevos datos de la cita
 * @returns {Promise<void>}
 */
export const actualizarCita = async (citaId, citaData) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, citaId), citaData);
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    throw error;
  }
};

/**
 * Elimina una cita
 * @param {string} citaId - ID de la cita
 * @returns {Promise<void>}
 */
export const eliminarCita = async (citaId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, citaId));
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    throw error;
  }
};

/**
 * Crea múltiples citas en batch
 * @param {Array} citasArray - Array de objetos de citas
 * @returns {Promise<number>} - Número de citas creadas
 */
export const crearCitasEnBatch = async (citasArray) => {
  try {
    const batch = writeBatch(db);
    
    citasArray.forEach(cita => {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, cita);
    });
    
    await batch.commit();
    return citasArray.length;
  } catch (error) {
    console.error('Error al crear citas en batch:', error);
    throw error;
  }
};