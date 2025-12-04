// src/api/solicitudesCambio.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'solicitudesCambio';

/**
 * Crear una solicitud de cambio de cita
 * @param {Object} solicitud - Datos de la solicitud
 */
export const crearSolicitudCambio = async (solicitud) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...solicitud,
      estado: 'pendiente', // pendiente, aprobada, rechazada
      fechaSolicitud: serverTimestamp(),
      fechaRespuesta: null,
      respuestaAdmin: null,
      adminId: null,
      adminNombre: null
    });
    return { id: docRef.id, ...solicitud };
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    throw error;
  }
};

/**
 * Obtener solicitudes por organización
 */
export const obtenerSolicitudes = async (organizationId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      orderBy('fechaSolicitud', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaSolicitud: doc.data().fechaSolicitud?.toDate?.() || new Date(),
      fechaRespuesta: doc.data().fechaRespuesta?.toDate?.() || null
    }));
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    throw error;
  }
};

/**
 * Obtener solicitudes pendientes
 */
export const obtenerSolicitudesPendientes = async (organizationId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('estado', '==', 'pendiente'),
      orderBy('fechaSolicitud', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaSolicitud: doc.data().fechaSolicitud?.toDate?.() || new Date()
    }));
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    throw error;
  }
};

/**
 * Obtener solicitudes de un terapeuta específico
 */
export const obtenerSolicitudesTerapeuta = async (terapeutaId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('terapeutaId', '==', terapeutaId),
      orderBy('fechaSolicitud', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaSolicitud: doc.data().fechaSolicitud?.toDate?.() || new Date(),
      fechaRespuesta: doc.data().fechaRespuesta?.toDate?.() || null
    }));
  } catch (error) {
    console.error('Error al obtener solicitudes del terapeuta:', error);
    throw error;
  }
};

/**
 * Aprobar solicitud de cambio
 * @param {string} solicitudId - ID de la solicitud
 * @param {Object} adminInfo - { adminId, adminNombre }
 * @param {string} respuestaAdmin - Mensaje opcional
 */
export const aprobarSolicitud = async (solicitudId, adminInfo, respuestaAdmin = '') => {
  try {
    const docRef = doc(db, COLLECTION_NAME, solicitudId);
    await updateDoc(docRef, {
      estado: 'aprobada',
      fechaRespuesta: serverTimestamp(),
      respuestaAdmin,
      adminId: adminInfo.adminId,
      adminNombre: adminInfo.adminNombre
    });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    throw error;
  }
};

/**
 * Rechazar solicitud de cambio
 * @param {string} solicitudId - ID de la solicitud
 * @param {Object} adminInfo - { adminId, adminNombre }
 * @param {string} respuestaAdmin - Mensaje de rechazo
 */
export const rechazarSolicitud = async (solicitudId, adminInfo, respuestaAdmin = '') => {
  try {
    const docRef = doc(db, COLLECTION_NAME, solicitudId);
    await updateDoc(docRef, {
      estado: 'rechazada',
      fechaRespuesta: serverTimestamp(),
      respuestaAdmin,
      adminId: adminInfo.adminId,
      adminNombre: adminInfo.adminNombre
    });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    throw error;
  }
};

/**
 * Eliminar solicitud
 */
export const eliminarSolicitud = async (solicitudId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, solicitudId));
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    throw error;
  }
};

/**
 * Contar solicitudes pendientes (para badge)
 */
export const contarSolicitudesPendientes = async (organizationId) => {
  try {
    const solicitudes = await obtenerSolicitudesPendientes(organizationId);
    return solicitudes.length;
  } catch (error) {
    console.error('Error al contar solicitudes:', error);
    return 0;
  }
};
