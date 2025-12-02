// src/api/configuracion.js
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';

/**
 * API para gestión de configuración de empresa
 */

const COLLECTION_NAME = 'configuracion';
const DOC_ID = 'empresa';

/**
 * Obtiene la configuración de la empresa
 * @returns {Promise<Object>} - Configuración de la empresa
 */
export const obtenerConfiguracion = async () => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // Configuración por defecto si no existe
    return {
      nombreEmpresa: 'ACMC',
      logoUrl: null,
      colores: {
        primario: '#2563eb',    // blue-600
        secundario: '#1e40af',  // blue-800
        acento: '#10b981'       // green-500
      },
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    throw error;
  }
};

/**
 * Guarda la configuración de la empresa
 * @param {Object} config - Configuración a guardar
 * @returns {Promise<void>}
 */
export const guardarConfiguracion = async (config) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    throw error;
  }
};

/**
 * Sube el logo de la empresa a Firebase Storage
 * @param {File} archivo - Archivo de imagen
 * @returns {Promise<string>} - URL del logo subido
 */
export const subirLogo = async (archivo) => {
  try {
    // Validar tipo de archivo
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      throw new Error('Tipo de archivo no permitido. Use PNG, JPG o WEBP.');
    }
    
    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (archivo.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 2MB.');
    }
    
    const storage = getStorage();
    const extension = archivo.name.split('.').pop();
    const nombreArchivo = `logo_empresa.${extension}`;
    const storageRef = ref(storage, `configuracion/${nombreArchivo}`);
    
    // Subir archivo
    await uploadBytes(storageRef, archivo);
    
    // Obtener URL de descarga
    const url = await getDownloadURL(storageRef);
    
    // Guardar URL en configuración
    await guardarConfiguracion({ logoUrl: url });
    
    return url;
  } catch (error) {
    console.error('Error al subir logo:', error);
    throw error;
  }
};

/**
 * Elimina el logo de la empresa
 * @returns {Promise<void>}
 */
export const eliminarLogo = async () => {
  try {
    const config = await obtenerConfiguracion();
    
    if (config.logoUrl) {
      const storage = getStorage();
      // Extraer la referencia del URL
      const storageRef = ref(storage, `configuracion/logo_empresa`);
      
      try {
        await deleteObject(storageRef);
      } catch (e) {
        // Si no existe, no hay problema
        console.log('Logo no encontrado en storage');
      }
    }
    
    // Actualizar configuración sin logo
    await guardarConfiguracion({ logoUrl: null });
  } catch (error) {
    console.error('Error al eliminar logo:', error);
    throw error;
  }
};
