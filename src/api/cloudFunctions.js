import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase';

const functions = getFunctions(auth.app, 'us-central1');

export const crearUsuarioPortalCloud = async ({ email, password, clienteId }) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'No hay usuario autenticado. Por favor, inicia sesión de nuevo.'
      };
    }

    const idToken = await auth.currentUser.getIdToken(true);
    
    console.log('Usuario:', auth.currentUser.email);
    console.log('Token obtenido:', idToken ? 'Sí' : 'No');
    
    // DEBUG: Ver qué datos se envían
    const datosEnviar = { 
      email: email, 
      password: password, 
      clienteId: clienteId,
      idToken: idToken
    };
    console.log('Datos a enviar:', JSON.stringify(datosEnviar, null, 2));

    const crearUsuario = httpsCallable(functions, 'crearUsuarioPortal');
    const result = await crearUsuario(datosEnviar);
    
    console.log('Resultado:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error:', error.code, error.message);
    
    let errorMessage = 'Error al crear usuario';
    
    if (error.code === 'functions/unauthenticated') {
      errorMessage = 'Debes estar autenticado como administrador';
    } else if (error.code === 'functions/permission-denied') {
      errorMessage = 'No tienes permisos para crear usuarios';
    } else if (error.code === 'functions/already-exists') {
      errorMessage = error.message || 'Ya existe un usuario para este cliente o email';
    } else if (error.code === 'functions/not-found') {
      errorMessage = 'El cliente no existe';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
};

export const activarDesactivarUsuarioCloud = async (userId, activo) => {
  try {
    if (!auth.currentUser) return { success: false, error: 'No autenticado' };
    
    const idToken = await auth.currentUser.getIdToken(true);
    const fn = httpsCallable(functions, 'activarDesactivarUsuario');
    const result = await fn({ userId, activo, idToken });
    return result.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const enviarResetPasswordCloud = async (email) => {
  try {
    if (!auth.currentUser) return { success: false, error: 'No autenticado' };

    const idToken = await auth.currentUser.getIdToken(true);
    const fn = httpsCallable(functions, 'enviarResetPassword');
    const result = await fn({ email, idToken });

    if (result.data.link) {
      alert('Link de reset:\n' + result.data.link);
    }
    return result.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Crear usuario del sistema (admin, asistente, terapeuta)
 * @param {Object} datos - Datos del nuevo usuario
 * @param {string} datos.email - Email del usuario
 * @param {string} datos.password - Contraseña
 * @param {string} datos.nombre - Nombre del usuario
 * @param {string} datos.rol - Rol: 'admin' | 'asistente' | 'terapeuta'
 * @param {string} [datos.terapeutaId] - ID del terapeuta (solo si rol es 'terapeuta')
 * @param {string} [datos.organizationId] - ID de la organización
 * @returns {Promise<Object>} Resultado de la creación
 */
export const crearUsuarioSistemaCloud = async ({ email, password, nombre, rol, terapeutaId, organizationId }) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'No hay usuario autenticado. Por favor, inicia sesión de nuevo.'
      };
    }

    const idToken = await auth.currentUser.getIdToken(true);

    const datosEnviar = {
      email,
      password,
      nombre,
      rol,
      terapeutaId: terapeutaId || null,
      organizationId: organizationId || 'org_acmc_001', // Default organization
      idToken
    };

    console.log('Creando usuario del sistema:', { email, nombre, rol });

    const crearUsuario = httpsCallable(functions, 'crearUsuarioSistema');
    const result = await crearUsuario(datosEnviar);

    console.log('Resultado:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error:', error.code, error.message);

    let errorMessage = 'Error al crear usuario';

    if (error.code === 'functions/unauthenticated') {
      errorMessage = 'Debes estar autenticado como administrador';
    } else if (error.code === 'functions/permission-denied') {
      errorMessage = 'No tienes permisos para crear usuarios del sistema';
    } else if (error.code === 'functions/already-exists') {
      errorMessage = error.message || 'Ya existe un usuario con este email';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Actualizar el rol de un usuario del sistema
 * @param {string} userId - ID del usuario en Firestore
 * @param {string} nuevoRol - Nuevo rol: 'admin' | 'asistente' | 'terapeuta'
 * @returns {Promise<Object>} Resultado de la actualización
 */
export const actualizarRolUsuarioCloud = async (userId, nuevoRol) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'No hay usuario autenticado. Por favor, inicia sesión de nuevo.'
      };
    }

    // Importar Firestore dinámicamente para actualizar el rol
    const { doc, updateDoc, getFirestore } = await import('firebase/firestore');
    const db = getFirestore(auth.app);

    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      rol: nuevoRol,
      updatedAt: new Date().toISOString()
    });

    console.log(`Rol actualizado: ${userId} -> ${nuevoRol}`);
    return { success: true };
  } catch (error) {
    console.error('Error actualizando rol:', error);
    return { success: false, error: error.message || 'Error al actualizar rol' };
  }
};