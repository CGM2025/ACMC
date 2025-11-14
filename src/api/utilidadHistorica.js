import { db } from '../firebase';
import { 
  collection, 
  getDocs,
  writeBatch,
  doc
} from 'firebase/firestore';

/**
 * API para gestión de utilidad histórica en Firebase
 */

const COLLECTION_NAME = 'utilidadHistorica';

/**
 * Obtiene toda la utilidad histórica
 * @returns {Promise<Array>} - Array de registros históricos
 */
export const obtenerUtilidadHistorica = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener utilidad histórica:', error);
    throw error;
  }
};

/**
 * Importa datos históricos en batch
 * @param {Array} datosHistoricos - Array de registros históricos
 * @returns {Promise<number>} - Número de registros importados
 */
export const importarUtilidadHistorica = async (datosHistoricos) => {
  try {
    const batch = writeBatch(db);
    
    datosHistoricos.forEach(dato => {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, {
        año: dato.año,
        mes: dato.mes,
        utilidad: dato.utilidad,
        fechaImportacion: new Date().toISOString()
      });
    });
    
    await batch.commit();
    return datosHistoricos.length;
  } catch (error) {
    console.error('Error al importar utilidad histórica:', error);
    throw error;
  }
};