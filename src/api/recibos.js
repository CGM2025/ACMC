import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc,
  deleteDoc, 
  doc,
  query,
  where
} from 'firebase/firestore';

/**
 * API para gestión de recibos en Firebase
 * VERSIÓN MULTI-TENANT: Todas las operaciones filtran por organizationId
 */

const COLLECTION_NAME = 'recibos';

/**
 * Obtiene todos los recibos de una organización ordenados por fecha
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de recibos
 */
export const obtenerRecibos = async (organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId)
      );
    } else {
      // Fallback para compatibilidad (sin filtro)
      q = collection(db, COLLECTION_NAME);
    }
    
    const snapshot = await getDocs(q);
    
    // Ordenar manualmente en JavaScript
    const recibos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return recibos.sort((a, b) => {
      const dateA = new Date(a.fechaGeneracion || 0);
      const dateB = new Date(b.fechaGeneracion || 0);
      return dateB - dateA; // Descendente (más reciente primero)
    });
  } catch (error) {
    console.error('Error al obtener recibos:', error);
    throw error;
  }
};

/**
 * Obtiene los recibos de un cliente específico
 * @param {string} clienteNombre - Nombre del cliente
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de recibos del cliente
 */
export const obtenerRecibosPorCliente = async (clienteNombre, organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('clienteNombre', '==', clienteNombre)
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('clienteNombre', '==', clienteNombre)
      );
    }
    
    const snapshot = await getDocs(q);
    
    // Ordenar manualmente
    const recibos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return recibos.sort((a, b) => {
      const dateA = new Date(a.fechaGeneracion || 0);
      const dateB = new Date(b.fechaGeneracion || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error al obtener recibos por cliente:', error);
    throw error;
  }
};

/**
 * Obtiene los recibos de un mes específico
 * @param {string} mes - Mes en formato YYYY-MM
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de recibos del mes
 */
export const obtenerRecibosPorMes = async (mes, organizationId) => {
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
    
    // Ordenar manualmente por nombre de cliente
    const recibos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return recibos.sort((a, b) => 
      (a.clienteNombre || '').localeCompare(b.clienteNombre || '')
    );
  } catch (error) {
    console.error('Error al obtener recibos por mes:', error);
    throw error;
  }
};

/**
 * Crea un nuevo recibo
 * @param {Object} reciboData - Datos del recibo
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<string>} - ID del recibo creado
 */
export const crearRecibo = async (reciboData, organizationId) => {
  try {
    // Validar que tenga los campos obligatorios
    if (!reciboData.reciboId || !reciboData.mes || !reciboData.clienteNombre) {
      throw new Error('Faltan campos obligatorios: reciboId, mes, clienteNombre');
    }

    // Establecer valores por defecto
    const reciboCompleto = {
      ...reciboData,
      montoPagado: reciboData.montoPagado || 0,
      estadoPago: reciboData.estadoPago || 'pendiente',
      fechaGeneracion: reciboData.fechaGeneracion || new Date().toISOString(),
      ...(organizationId && { organizationId }),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), reciboCompleto);
    console.log('✅ Recibo creado:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear recibo:', error);
    throw error;
  }
};

/**
 * Actualiza un recibo existente
 * @param {string} reciboId - ID del recibo en Firebase
 * @param {Object} reciboData - Nuevos datos del recibo
 * @returns {Promise<void>}
 */
export const actualizarRecibo = async (reciboId, reciboData) => {
  try {
    const dataConTimestamp = {
      ...reciboData,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, COLLECTION_NAME, reciboId), dataConTimestamp);
    console.log('✅ Recibo actualizado:', reciboId);
  } catch (error) {
    console.error('Error al actualizar recibo:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de pago de un recibo
 * Calcula automáticamente el estado basado en el monto pagado
 * @param {string} reciboId - ID del recibo en Firebase
 * @param {number} montoPagado - Monto total pagado hasta ahora
 * @param {number} totalGeneral - Total del recibo
 * @returns {Promise<void>}
 */
export const actualizarEstadoPagoRecibo = async (reciboId, montoPagado, totalGeneral) => {
  try {
    let estadoPago = 'pendiente';
    
    if (montoPagado >= totalGeneral) {
      estadoPago = 'pagado';
    } else if (montoPagado > 0) {
      estadoPago = 'parcial';
    }

    await updateDoc(doc(db, COLLECTION_NAME, reciboId), {
      montoPagado,
      estadoPago,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Estado de pago actualizado:', { reciboId, montoPagado, estadoPago });
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    throw error;
  }
};

/**
 * Elimina un recibo
 * @param {string} reciboId - ID del recibo en Firebase
 * @returns {Promise<void>}
 */
export const eliminarRecibo = async (reciboId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, reciboId));
    console.log('✅ Recibo eliminado:', reciboId);
  } catch (error) {
    console.error('Error al eliminar recibo:', error);
    throw error;
  }
};

/**
 * Genera un ID único para un recibo
 * Formato: REC-YYYY-MM-CODIGOCLIENTE
 * Ejemplo: REC-2025-01-CLI001
 * @param {string} mes - Mes en formato YYYY-MM
 * @param {string} clienteCodigo - Código del cliente
 * @returns {string} - ID único del recibo
 */
export const generarReciboId = (mes, clienteCodigo) => {
  const [year, month] = mes.split('-');
  return `REC-${year}-${month}-${clienteCodigo}`;
};
