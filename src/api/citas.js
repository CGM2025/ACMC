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
  where,
  writeBatch
} from 'firebase/firestore';

/**
 * API para gestión de citas en Firebase
 * VERSIÓN MULTI-TENANT: Todas las operaciones incluyen organizationId
 */

const COLLECTION_NAME = 'citas';

/**
 * Obtiene todas las citas de una organización ordenadas por fecha
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de citas
 */
export const obtenerCitas = async (organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        orderBy('fecha', 'asc')
      );
    } else {
      // Fallback sin filtro (compatibilidad)
      q = query(collection(db, COLLECTION_NAME), orderBy('fecha', 'asc'));
    }
    
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
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<string>} - ID de la cita creada
 */
export const crearCita = async (citaData, organizationId) => {
  try {
    const dataConOrg = {
      ...citaData,
      ...(organizationId && { organizationId }),
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataConOrg);
    console.log('✅ Cita creada:', docRef.id);
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
    const dataConTimestamp = {
      ...citaData,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, COLLECTION_NAME, citaId), dataConTimestamp);
    console.log('✅ Cita actualizada:', citaId);
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
    console.log('✅ Cita eliminada:', citaId);
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    throw error;
  }
};

/**
 * Crea múltiples citas en batch
 * @param {Array} citasArray - Array de objetos de citas
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<number>} - Número de citas creadas
 */
export const crearCitasEnBatch = async (citasArray, organizationId) => {
  try {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();
    
    citasArray.forEach(cita => {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, {
        ...cita,
        ...(organizationId && { organizationId }),
        createdAt: timestamp
      });
    });
    
    await batch.commit();
    console.log(`✅ ${citasArray.length} citas creadas en batch`);
    return citasArray.length;
  } catch (error) {
    console.error('Error al crear citas en batch:', error);
    throw error;
  }
};
