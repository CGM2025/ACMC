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
 * API para gestión de clientes en Firebase
 */

const COLLECTION_NAME = 'clientes';

/**
 * Obtiene todos los clientes
 * @returns {Promise<Array>} - Array de clientes
 */
export const obtenerClientes = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
};

/**
 * Crea un nuevo cliente
 * @param {Object} clienteData - Datos del cliente
 * @returns {Promise<string>} - ID del cliente creado
 */
export const crearCliente = async (clienteData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), clienteData);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
};

/**
 * Actualiza un cliente existente
 * @param {string} clienteId - ID del cliente
 * @param {Object} clienteData - Nuevos datos del cliente
 * @returns {Promise<void>}
 */
export const actualizarCliente = async (clienteId, clienteData) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, clienteId), clienteData);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
};

/**
 * Elimina un cliente
 * @param {string} clienteId - ID del cliente
 * @returns {Promise<void>}
 */
export const eliminarCliente = async (clienteId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, clienteId));
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    throw error;
  }
};