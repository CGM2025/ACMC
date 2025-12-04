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
 * @param {string} solicitud.citaId - ID de la cita
 * @param {string} solicitud.tipo - 'cambio_horario' o 'transferencia'
 * @param {string} solicitud.terapeutaId - ID del terapeuta que solicita
 * @param {string} solicitud.terapeutaNombre - Nombre del terapeuta
 * @param {string} solicitud.clienteNombre - Nombre del cliente
 * @param {Object} solicitud.citaActual - Datos actuales de la cita
 * @param {Object} solicitud.datosPropuestos - Nuevos datos propuestos
 * @param {string} solicitud.motivo - Razón del cambio
 * @param {string} solicitud.organizationId - ID de la organización
 */
export const crearSolicitudCambio = async (solicitud) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...solicitud,
      estado: 'pendiente', // pendiente, aprobada, rechazada
      fechaSolicitud: serverTimestamp(),
      fechaRespuesta: null,
      respuestaAdmin: null
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
      fechaSolicitud: doc.data().fechaSolicitud?.toDate?.() || new Date()
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
      fechaSolicitud: doc.data().fechaSolicitud?.toDate?.() || new Date()
    }));
  } catch (error) {
    console.error('Error al obtener solicitudes del terapeuta:', error);
    throw error;
  }
};

/**
 * Aprobar solicitud de cambio
 */
export const aprobarSolicitud = async (solicitudId, respuestaAdmin = '') => {
  try {
    const docRef = doc(db, COLLECTION_NAME, solicitudId);
    await updateDoc(docRef, {
      estado: 'aprobada',
      fechaRespuesta: serverTimestamp(),
      respuestaAdmin
    });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    throw error;
  }
};

/**
 * Rechazar solicitud de cambio
 */
export const rechazarSolicitud = async (solicitudId, respuestaAdmin = '') => {
  try {
    const docRef = doc(db, COLLECTION_NAME, solicitudId);
    await updateDoc(docRef, {
      estado: 'rechazada',
      fechaRespuesta: serverTimestamp(),
      respuestaAdmin
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
