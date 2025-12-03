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
  serverTimestamp
} from 'firebase/firestore';

/**
 * API para gestión de clientes en Firebase
 * Con soporte multi-tenant (organizationId)
 */

const COLLECTION_NAME = 'clientes';

/**
 * Obtiene todos los clientes de una organización
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de clientes
 */
export const obtenerClientes = async (organizationId) => {
  try {
    if (!organizationId) {
      console.warn('obtenerClientes: organizationId no proporcionado');
      return [];
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
};

/**
 * Crea un nuevo cliente
 * @param {Object} clienteData - Datos del cliente
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<string>} - ID del cliente creado
 */
export const crearCliente = async (clienteData, organizationId) => {
  try {
    if (!organizationId) {
      throw new Error('organizationId es requerido para crear un cliente');
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...clienteData,
      organizationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Cliente creado:', docRef.id);
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
    // Remover organizationId si viene en los datos para evitar modificarlo
    const { organizationId, ...datosActualizar } = clienteData;
    
    await updateDoc(doc(db, COLLECTION_NAME, clienteId), {
      ...datosActualizar,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Cliente actualizado:', clienteId);
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
    console.log('✅ Cliente eliminado:', clienteId);
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    throw error;
  }
};
