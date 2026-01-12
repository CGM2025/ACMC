import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

/**
 * API para gestión de terapeutas en Firebase
 */

const COLLECTION_NAME = 'terapeutas';

/**
 * Obtiene todos los terapeutas
 * @returns {Promise<Array>} - Array de terapeutas
 */
export const obtenerTerapeutas = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener terapeutas:', error);
    throw error;
  }
};

/**
 * Crea un nuevo terapeuta
 * @param {Object} terapeutaData - Datos del terapeuta
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<string>} - ID del terapeuta creado
 */
export const crearTerapeuta = async (terapeutaData, organizationId) => {
  try {
    const dataConOrg = {
      ...terapeutaData,
      organizationId,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataConOrg);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear terapeuta:', error);
    throw error;
  }
};

/**
 * Actualiza un terapeuta existente
 * @param {string} terapeutaId - ID del terapeuta
 * @param {Object} terapeutaData - Nuevos datos del terapeuta
 * @returns {Promise<void>}
 */
export const actualizarTerapeuta = async (terapeutaId, terapeutaData) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, terapeutaId), terapeutaData);
  } catch (error) {
    console.error('Error al actualizar terapeuta:', error);
    throw error;
  }
};

/**
 * Elimina un terapeuta
 * @param {string} terapeutaId - ID del terapeuta
 * @returns {Promise<void>}
 */
export const eliminarTerapeuta = async (terapeutaId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, terapeutaId));
  } catch (error) {
    console.error('Error al eliminar terapeuta:', error);
    throw error;
  }
};