// src/api/horariosRecurrentes.js
//
// API para gestionar horarios recurrentes en Firebase
//

import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';

const COLLECTION_NAME = 'horariosRecurrentes';

/**
 * Obtiene todos los horarios recurrentes de una organización
 */
export const obtenerHorariosRecurrentes = async (organizationId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('activo', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener horarios recurrentes:', error);
    throw error;
  }
};

/**
 * Crea un nuevo horario recurrente
 */
export const crearHorarioRecurrente = async (datos, organizationId) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...datos,
      organizationId,
      activo: true,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al crear horario recurrente:', error);
    throw error;
  }
};

/**
 * Actualiza un horario recurrente existente
 */
export const actualizarHorarioRecurrente = async (horarioId, datos) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, horarioId);
    await updateDoc(docRef, {
      ...datos,
      actualizadoEn: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al actualizar horario recurrente:', error);
    throw error;
  }
};

/**
 * Elimina (desactiva) un horario recurrente
 */
export const eliminarHorarioRecurrente = async (horarioId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, horarioId);
    await updateDoc(docRef, {
      activo: false,
      eliminadoEn: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al eliminar horario recurrente:', error);
    throw error;
  }
};

/**
 * Elimina permanentemente un horario recurrente
 */
export const eliminarHorarioRecurrentePermanente = async (horarioId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, horarioId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error al eliminar horario recurrente permanentemente:', error);
    throw error;
  }
};
