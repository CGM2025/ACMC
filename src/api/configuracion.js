// src/api/configuracion.js
//
// API para gestión de configuración de empresa
// Ahora usa la colección organizations en lugar de configuracion
//

import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Configuración por defecto para nuevas organizaciones
 */
const CONFIG_DEFAULT = {
  logoUrl: null,
  colores: {
    primario: '#2563eb',    // blue-600
    secundario: '#1e40af',  // blue-800
    acento: '#10b981'       // green-500
  }
};

/**
 * Obtiene la configuración de una organización
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Object>} - Configuración de la organización
 */
export const obtenerConfiguracion = async (organizationId) => {
  try {
    if (!organizationId) {
      console.warn('No se proporcionó organizationId, usando configuración por defecto');
      return CONFIG_DEFAULT;
    }

    const orgRef = doc(db, 'organizations', organizationId);
    const orgSnap = await getDoc(orgRef);
    
    if (orgSnap.exists()) {
      const orgData = orgSnap.data();
      
      // Retornar la configuración embebida o valores por defecto
      return {
        nombreEmpresa: orgData.nombre || orgData.nombreCorto || 'Mi Empresa',
        logoUrl: orgData.configuracion?.logoUrl || null,
        colores: orgData.configuracion?.colores || CONFIG_DEFAULT.colores
      };
    } else {
      console.warn('Organización no encontrada:', organizationId);
      return CONFIG_DEFAULT;
    }
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return CONFIG_DEFAULT;
  }
};

/**
 * Guarda la configuración de una organización
 * @param {Object} config - Configuración a guardar
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<void>}
 */
export const guardarConfiguracion = async (config, organizationId) => {
  try {
    if (!organizationId) {
      throw new Error('Se requiere organizationId para guardar configuración');
    }

    const orgRef = doc(db, 'organizations', organizationId);
    
    // Actualizar solo los campos de configuración dentro del documento de organización
    await updateDoc(orgRef, {
      nombre: config.nombreEmpresa,
      'configuracion.logoUrl': config.logoUrl,
      'configuracion.colores': config.colores,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Configuración guardada en organizations/', organizationId);
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    throw error;
  }
};

/**
 * Sube el logo de la empresa a Firebase Storage
 * @param {File} archivo - Archivo de imagen
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<string>} - URL del logo subido
 */
export const subirLogo = async (archivo, organizationId) => {
  try {
    if (!organizationId) {
      throw new Error('Se requiere organizationId para subir logo');
    }

    // Validar tipo de archivo
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      throw new Error('Tipo de archivo no permitido. Use PNG, JPG o WEBP.');
    }
    
    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (archivo.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 2MB.');
    }
    
    // Crear referencia con nombre único por organización
    const extension = archivo.name.split('.').pop();
    const storageRef = ref(storage, `organizations/${organizationId}/logo.${extension}`);
    
    // Subir archivo
    await uploadBytes(storageRef, archivo);
    
    // Obtener URL de descarga
    const url = await getDownloadURL(storageRef);
    
    // Actualizar configuración con la nueva URL
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, {
      'configuracion.logoUrl': url,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Logo subido:', url);
    return url;
  } catch (error) {
    console.error('Error al subir logo:', error);
    throw error;
  }
};

/**
 * Elimina el logo de la empresa
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<void>}
 */
export const eliminarLogo = async (organizationId) => {
  try {
    if (!organizationId) {
      throw new Error('Se requiere organizationId para eliminar logo');
    }

    // Obtener configuración actual para saber la URL del logo
    const config = await obtenerConfiguracion(organizationId);
    
    if (config.logoUrl) {
      // Intentar eliminar el archivo de Storage
      try {
        // Extraer la ruta del archivo de la URL
        const url = new URL(config.logoUrl);
        const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        console.log('✅ Archivo de logo eliminado de Storage');
      } catch (storageError) {
        // Si el archivo no existe, continuar sin error
        console.warn('No se pudo eliminar archivo de Storage:', storageError);
      }
    }
    
    // Actualizar configuración para quitar la URL
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, {
      'configuracion.logoUrl': null,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Logo eliminado de la configuración');
  } catch (error) {
    console.error('Error al eliminar logo:', error);
    throw error;
  }
};
