import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser as deleteAuthUser
} from 'firebase/auth';
import { auth, db } from '../firebase'; // Ajusta la ruta según tu estructura

/**
 * FUNCIONES PARA GESTIÓN DE USUARIOS DEL PORTAL
 */

/**
 * Obtener todos los usuarios del portal
 * @returns {Promise<Array>} Lista de usuarios
 */
export const obtenerUsuariosPortal = async () => {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('rol', '==', 'cliente'), orderBy('fechaCreacion', 'desc'));
    const snapshot = await getDocs(q);
    
    const usuarios = [];
    snapshot.forEach((doc) => {
      usuarios.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return usuarios;
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    throw error;
  }
};

/**
 * Crear usuario del portal
 * IMPORTANTE: Esta función debe ejecutarse desde el lado del servidor o con privilegios de admin
 * Para uso en producción, considera usar Firebase Cloud Functions
 * 
 * @param {Object} datos - Datos del nuevo usuario
 * @param {string} datos.email - Email del usuario
 * @param {string} datos.password - Contraseña temporal
 * @param {string} datos.clienteId - ID del cliente en Firestore
 * @returns {Promise<Object>} Resultado de la creación
 */
export const crearUsuarioPortal = async ({ email, password, clienteId }) => {
  try {
    // Validaciones
    if (!email || !password || !clienteId) {
      throw new Error('Faltan datos requeridos');
    }

    // Verificar que el cliente existe
    const clienteRef = doc(db, 'clientes', clienteId);
    const clienteSnap = await getDoc(clienteRef);
    
    if (!clienteSnap.exists()) {
      throw new Error('El cliente no existe');
    }

    // Verificar que no existe ya un usuario para este cliente
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('clienteId', '==', clienteId));
    const existingUsers = await getDocs(q);
    
    if (!existingUsers.empty) {
      throw new Error('Ya existe un usuario para este cliente');
    }

    // NOTA IMPORTANTE:
    // createUserWithEmailAndPassword crea el usuario EN LA SESIÓN ACTUAL
    // Esto cerrará la sesión del admin
    // 
    // SOLUCIÓN RECOMENDADA:
    // Usar Firebase Admin SDK desde Cloud Functions
    // O usar la API REST de Firebase Authentication
    
    // Por ahora, para desarrollo local, documentamos el flujo:
    console.log('⚠️ ADVERTENCIA: Esta función debe ejecutarse desde Firebase Cloud Functions');
    console.log('Para uso en producción, implementa esto con Firebase Admin SDK');

    // Aquí iría el código con Admin SDK:
    /*
    const admin = require('firebase-admin');
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false
    });
    
    const uid = userRecord.uid;
    */

    // Por ahora, simulamos la creación (TEMPORAL - SOLO DESARROLLO)
    // En producción, esto debe ser una Cloud Function
    const uid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear documento en Firestore
    const userData = {
      email: email,
      rol: 'cliente',
      clienteId: clienteId,
      activo: true,
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: null,
      passwordCambiada: false
    };

    await setDoc(doc(db, 'usuarios', uid), userData);

    return {
      success: true,
      uid: uid,
      message: 'Usuario creado exitosamente'
    };

  } catch (error) {
    console.error('Error creando usuario:', error);
    return {
      success: false,
      error: error.message || 'Error al crear usuario'
    };
  }
};

/**
 * Activar o desactivar usuario
 * @param {string} userId - ID del usuario
 * @param {boolean} activo - Estado activo/inactivo
 * @returns {Promise<Object>} Resultado de la operación
 */
export const activarDesactivarUsuario = async (userId, activo) => {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      activo: activo,
      fechaModificacion: new Date().toISOString()
    });

    // Si se desactiva, también deshabilitar en Auth (requiere Admin SDK)
    // admin.auth().updateUser(userId, { disabled: !activo });

    return {
      success: true,
      message: activo ? 'Usuario activado' : 'Usuario desactivado'
    };
  } catch (error) {
    console.error('Error al activar/desactivar usuario:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enviar email de reseteo de contraseña
 * @param {string} email - Email del usuario
 * @returns {Promise<Object>} Resultado del envío
 */
export const enviarResetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    
    return {
      success: true,
      message: 'Email de recuperación enviado'
    };
  } catch (error) {
    console.error('Error enviando reset password:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtener usuario por clienteId
 * @param {string} clienteId - ID del cliente
 * @returns {Promise<Object|null>} Usuario o null
 */
export const obtenerUsuarioPorCliente = async (clienteId) => {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('clienteId', '==', clienteId), where('rol', '==', 'cliente'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error obteniendo usuario por cliente:', error);
    throw error;
  }
};

/**
 * Eliminar usuario (requiere permisos de admin)
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export const eliminarUsuarioPortal = async (userId) => {
  try {
    // Eliminar de Firestore
    await deleteDoc(doc(db, 'usuarios', userId));

    // Eliminar de Auth (requiere Admin SDK)
    // await admin.auth().deleteUser(userId);

    return {
      success: true,
      message: 'Usuario eliminado'
    };
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Registrar último acceso del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export const registrarUltimoAcceso = async (userId) => {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      ultimoAcceso: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error registrando último acceso:', error);
    // No lanzamos error para no interrumpir el flujo de login
  }
};

/**
 * Marcar que el usuario cambió su contraseña
 * @param {string} userId - ID del usuario  
 * @returns {Promise<void>}
 */
export const marcarPasswordCambiada = async (userId) => {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      passwordCambiada: true,
      fechaModificacion: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marcando password cambiada:', error);
  }
};
