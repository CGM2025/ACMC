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
 * API para gestión de horas trabajadas en Firebase
 */

const COLLECTION_NAME = 'horasTrabajadas';

/**
 * Obtiene todas las horas trabajadas, opcionalmente filtradas por terapeuta
 * @param {string} terapeutaId - ID del terapeuta (opcional)
 * @returns {Promise<Array>} - Array de horas trabajadas
 */
export const obtenerHorasTrabajadas = async (terapeutaId = null) => {
  try {
    let q;
    
    if (terapeutaId) {
      q = query(
        collection(db, COLLECTION_NAME), 
        where('terapeutaId', '==', terapeutaId),
        orderBy('fecha', 'desc')
      );
    } else {
      q = query(collection(db, COLLECTION_NAME), orderBy('fecha', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener horas trabajadas:', error);
    throw error;
  }
};

/**
 * Crea un nuevo registro de horas trabajadas
 * @param {Object} horasData - Datos de horas trabajadas
 * @returns {Promise<string>} - ID del registro creado
 */
export const crearHorasTrabajadas = async (horasData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), horasData);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear horas trabajadas:', error);
    throw error;
  }
};

/**
 * Actualiza un registro de horas trabajadas
 * @param {string} horasId - ID del registro
 * @param {Object} horasData - Nuevos datos
 * @returns {Promise<void>}
 */
export const actualizarHorasTrabajadas = async (horasId, horasData) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, horasId), horasData);
  } catch (error) {
    console.error('Error al actualizar horas trabajadas:', error);
    throw error;
  }
};

/**
 * Elimina un registro de horas trabajadas
 * @param {string} horasId - ID del registro
 * @returns {Promise<void>}
 */
export const eliminarHorasTrabajadas = async (horasId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, horasId));
  } catch (error) {
    console.error('Error al eliminar horas trabajadas:', error);
    throw error;
  }
};