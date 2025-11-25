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

// Importar storage - necesitarás agregarlo a firebase.js
// import { storage } from '../firebase';

/**
 * FUNCIONES PARA GESTIÓN DE COMPROBANTES DE PAGO
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
 * @param {Object} storage - Instancia de Firebase Storage
 * @returns {Promise<Object>} Resultado de la operación
 */
export const subirComprobante = async (datos, storage) => {
  try {
    const { archivo, reciboId, reciboPeriodo, clienteId, concepto, monto, metodoPago } = datos;

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
      pagoId: null // Se llena cuando se aprueba y se crea el pago
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
 * Obtener todos los comprobantes (para admin)
 * @returns {Promise<Array>} Lista de comprobantes
 */
export const obtenerComprobantes = async () => {
  try {
    const comprobantesRef = collection(db, 'comprobantes');
    const q = query(comprobantesRef, orderBy('fechaSubida', 'desc'));
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
 * @returns {Promise<Array>} Lista de comprobantes del cliente
 */
export const obtenerComprobantesCliente = async (clienteId) => {
  try {
    const comprobantesRef = collection(db, 'comprobantes');
    const q = query(
      comprobantesRef, 
      where('clienteId', '==', clienteId),
      orderBy('fechaSubida', 'desc')
    );
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
      origen: 'portal_cliente'
    };

    const pagoRef = await addDoc(collection(db, 'pagos'), pagoData);

    // 2. Actualizar el comprobante como aprobado
    const comprobanteRef = doc(db, 'comprobantes', comprobante.id);
    await updateDoc(comprobanteRef, {
      estado: 'aprobado',
      fechaRevision: serverTimestamp(),
      revisadoPor: adminId,
      pagoId: pagoRef.id
    });

    // 3. Si hay reciboId, actualizar el recibo con el pago
    if (comprobante.reciboId) {
      try {
        const reciboRef = doc(db, 'recibos', comprobante.reciboId);
        // Podrías actualizar campos del recibo aquí si es necesario
        // Por ejemplo, marcar como pagado parcial o total
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
      motivoRechazo: motivoRechazo
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
 * Obtener comprobantes pendientes (para notificaciones)
 * @returns {Promise<number>} Cantidad de comprobantes pendientes
 */
export const contarComprobantesPendientes = async () => {
  try {
    const comprobantesRef = collection(db, 'comprobantes');
    const q = query(comprobantesRef, where('estado', '==', 'pendiente'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error contando comprobantes:', error);
    return 0;
  }
};
