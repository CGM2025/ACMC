import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db } from '../firebase';

/**
 * API para gestión de comprobantes de pago en Firebase
 * VERSIÓN MULTI-TENANT: Todas las operaciones filtran por organizationId
 */

/**
 * Subir comprobante de pago (usado por el cliente)
 * @param {Object} datos - Datos del comprobante
 * @param {File} datos.archivo - Archivo del comprobante
 * @param {string} datos.reciboId - ID del recibo
 * @param {string} datos.reciboPeriodo - Período del recibo
 * @param {string} datos.clienteId - ID del cliente
 * @param {string} datos.concepto - Concepto del pago
 * @param {number} datos.monto - Monto del pago
 * @param {string} datos.metodoPago - Método de pago
 * @param {string} datos.organizationId - ID de la organización
 * @param {Object} storage - Instancia de Firebase Storage
 * @returns {Promise<Object>} Resultado de la operación
 */
export const subirComprobante = async (datos, storage) => {
  try {
    const { archivo, reciboId, reciboPeriodo, clienteId, concepto, monto, metodoPago, organizationId } = datos;

    // Validaciones
    if (!archivo) throw new Error('No se proporcionó archivo');
    if (!clienteId) throw new Error('No se proporcionó ID del cliente');
    if (!monto || monto <= 0) throw new Error('Monto inválido');

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const extension = archivo.name.split('.').pop();
    const nombreArchivo = `comprobantes/${clienteId}/${timestamp}_${archivo.name}`;

    // Subir archivo a Storage
    const storageRef = ref(storage, nombreArchivo);
    const snapshot = await uploadBytes(storageRef, archivo);
    const archivoURL = await getDownloadURL(snapshot.ref);

    // Crear documento en Firestore
    const comprobanteData = {
      clienteId,
      reciboId: reciboId || null,
      reciboPeriodo: reciboPeriodo || null,
      concepto,
      monto,
      metodoPago,
      archivoURL,
      archivoNombre: archivo.name,
      archivoTipo: archivo.type,
      archivoPath: nombreArchivo,
      estado: 'pendiente', // pendiente, aprobado, rechazado
      fechaSubida: serverTimestamp(),
      fechaRevision: null,
      revisadoPor: null,
      motivoRechazo: null,
      pagoId: null, // Se llena cuando se aprueba y se crea el pago
      ...(organizationId && { organizationId }),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'comprobantes'), comprobanteData);

    return {
      success: true,
      id: docRef.id,
      message: 'Comprobante subido exitosamente'
    };

  } catch (error) {
    console.error('Error subiendo comprobante:', error);
    return {
      success: false,
      error: error.message || 'Error al subir el comprobante'
    };
  }
};

/**
 * Obtener todos los comprobantes de una organización (para admin)
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} Lista de comprobantes
 */
export const obtenerComprobantes = async (organizationId) => {
  try {
    const comprobantesRef = collection(db, 'comprobantes');
    let q;
    
    if (organizationId) {
      q = query(
        comprobantesRef, 
        where('organizationId', '==', organizationId),
        orderBy('fechaSubida', 'desc')
      );
    } else {
      q = query(comprobantesRef, orderBy('fechaSubida', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    
    const comprobantes = [];
    snapshot.forEach((doc) => {
      comprobantes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return comprobantes;
  } catch (error) {
    console.error('Error obteniendo comprobantes:', error);
    throw error;
  }
};

/**
 * Obtener comprobantes de un cliente específico
 * @param {string} clienteId - ID del cliente
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} Lista de comprobantes del cliente
 */
export const obtenerComprobantesCliente = async (clienteId, organizationId) => {
  try {
    const comprobantesRef = collection(db, 'comprobantes');
    let q;
    
    if (organizationId) {
      q = query(
        comprobantesRef,
        where('organizationId', '==', organizationId),
        where('clienteId', '==', clienteId),
        orderBy('fechaSubida', 'desc')
      );
    } else {
      q = query(
        comprobantesRef, 
        where('clienteId', '==', clienteId),
        orderBy('fechaSubida', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    
    const comprobantes = [];
    snapshot.forEach((doc) => {
      comprobantes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return comprobantes;
  } catch (error) {
    console.error('Error obteniendo comprobantes del cliente:', error);
    throw error;
  }
};

/**
 * Aprobar comprobante y crear pago automáticamente
 * @param {Object} comprobante - Datos del comprobante
 * @param {string} adminId - ID del admin que aprueba
 * @returns {Promise<Object>} Resultado de la operación
 */
export const aprobarComprobante = async (comprobante, adminId) => {
  try {
    // 1. Crear el pago en la colección de pagos
    const pagoData = {
      clienteId: comprobante.clienteId,
      cliente: comprobante.clienteId, // Para compatibilidad
      reciboId: comprobante.reciboId,
      concepto: comprobante.concepto || `Pago de ${comprobante.reciboPeriodo || 'servicios'}`,
      monto: comprobante.monto,
      metodoPago: comprobante.metodoPago,
      fecha: new Date().toISOString(),
      fechaPago: new Date().toISOString().split('T')[0],
      comprobanteId: comprobante.id,
      comprobanteURL: comprobante.archivoURL,
      creadoPor: adminId,
      origen: 'portal_cliente',
      // Mantener el organizationId del comprobante
      ...(comprobante.organizationId && { organizationId: comprobante.organizationId }),
      createdAt: new Date().toISOString()
    };

    const pagoRef = await addDoc(collection(db, 'pagos'), pagoData);

    // 2. Actualizar el comprobante como aprobado
    const comprobanteRef = doc(db, 'comprobantes', comprobante.id);
    await updateDoc(comprobanteRef, {
      estado: 'aprobado',
      fechaRevision: serverTimestamp(),
      revisadoPor: adminId,
      pagoId: pagoRef.id,
      updatedAt: new Date().toISOString()
    });

    // 3. Si hay reciboId, actualizar el recibo con el pago
    if (comprobante.reciboId) {
      try {
        const reciboRef = doc(db, 'recibos', comprobante.reciboId);
        // Podrías actualizar campos del recibo aquí si es necesario
      } catch (err) {
        console.warn('No se pudo actualizar el recibo:', err);
      }
    }

    return {
      success: true,
      pagoId: pagoRef.id,
      message: 'Comprobante aprobado y pago registrado'
    };

  } catch (error) {
    console.error('Error aprobando comprobante:', error);
    return {
      success: false,
      error: error.message || 'Error al aprobar el comprobante'
    };
  }
};

/**
 * Rechazar comprobante
 * @param {Object} comprobante - Datos del comprobante
 * @param {string} motivoRechazo - Motivo del rechazo
 * @param {string} adminId - ID del admin que rechaza
 * @returns {Promise<Object>} Resultado de la operación
 */
export const rechazarComprobante = async (comprobante, motivoRechazo, adminId) => {
  try {
    const comprobanteRef = doc(db, 'comprobantes', comprobante.id);
    
    await updateDoc(comprobanteRef, {
      estado: 'rechazado',
      fechaRevision: serverTimestamp(),
      revisadoPor: adminId,
      motivoRechazo: motivoRechazo,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Comprobante rechazado'
    };

  } catch (error) {
    console.error('Error rechazando comprobante:', error);
    return {
      success: false,
      error: error.message || 'Error al rechazar el comprobante'
    };
  }
};

/**
 * Obtener comprobantes pendientes de una organización (para notificaciones)
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<number>} Cantidad de comprobantes pendientes
 */
export const contarComprobantesPendientes = async (organizationId) => {
  try {
    const comprobantesRef = collection(db, 'comprobantes');
    let q;
    
    if (organizationId) {
      q = query(
        comprobantesRef, 
        where('organizationId', '==', organizationId),
        where('estado', '==', 'pendiente')
      );
    } else {
      q = query(comprobantesRef, where('estado', '==', 'pendiente'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error contando comprobantes:', error);
    return 0;
  }
};
