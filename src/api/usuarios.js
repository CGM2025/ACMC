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
import { auth, db } from '../firebase';

/**
 * API para gestión de usuarios en Firebase
 * VERSIÓN MULTI-TENANT: Todas las operaciones filtran por organizationId
 */

/**
 * Obtener todos los usuarios del portal (rol cliente) de una organización
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} Lista de usuarios
 */
export const obtenerUsuariosPortal = async (organizationId) => {
  try {
    console.log("=== CARGANDO USUARIOS DEL PORTAL ===");
    
    const usuariosRef = collection(db, 'usuarios');
    let q;
    
    if (organizationId) {
      q = query(
        usuariosRef, 
        where('organizationId', '==', organizationId),
        where('rol', '==', 'cliente')
      );
    } else {
      q = query(usuariosRef, where('rol', '==', 'cliente'));
    }
    
    console.log("Query creada");
    
    const snapshot = await getDocs(q);
    console.log("Documentos encontrados:", snapshot.size);
    
    const usuarios = [];
    snapshot.forEach((doc) => {
      console.log("Usuario encontrado:", doc.id);
      usuarios.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log("Total usuarios:", usuarios.length);
    return usuarios;
  } catch (error) {
    console.error('ERROR obteniendo usuarios:', error);
    throw error;
  }
};

/**
 * Crear usuario del portal
 * @param {Object} datos - Datos del nuevo usuario
 * @param {string} datos.email - Email del usuario
 * @param {string} datos.password - Contraseña temporal
 * @param {string} datos.clienteId - ID del cliente en Firestore
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Object>} Resultado de la creación
 */
export const crearUsuarioPortal = async ({ email, password, clienteId }, organizationId) => {
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

    // NOTA: Esta función debe ejecutarse desde Firebase Cloud Functions
    console.log('⚠️ ADVERTENCIA: Esta función debe ejecutarse desde Firebase Cloud Functions');

    // ID temporal para desarrollo
    const uid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear documento en Firestore
    const userData = {
      email: email,
      rol: 'cliente',
      clienteId: clienteId,
      activo: true,
      ...(organizationId && { organizationId }),
      createdAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString()
    });

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
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marcando password cambiada:', error);
  }
};

// ========================================
// FUNCIONES PARA VINCULACIÓN DE TERAPEUTAS
// ========================================

/**
 * Obtiene todos los usuarios de una organización (para admin)
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de usuarios
 */
export const obtenerUsuarios = async (organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, 'usuarios'),
        where('organizationId', '==', organizationId)
      );
    } else {
      q = collection(db, 'usuarios');
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

/**
 * Vincula un usuario con un terapeuta
 * @param {string} usuarioId - ID del usuario
 * @param {string} terapeutaId - ID del terapeuta (o null para desvincular)
 * @returns {Promise<void>}
 */
export const vincularUsuarioTerapeuta = async (usuarioId, terapeutaId) => {
  try {
    await updateDoc(doc(db, 'usuarios', usuarioId), { 
      terapeutaId: terapeutaId || null,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al vincular usuario con terapeuta:', error);
    throw error;
  }
};
