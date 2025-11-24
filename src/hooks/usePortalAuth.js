import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Ajusta la ruta según tu estructura

/**
 * Hook personalizado para manejar autenticación del portal de clientes
 * Gestiona login, logout, y verificación de rol de usuario
 */
export const usePortalAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Obtiene los datos del usuario desde Firestore
   * Verifica el rol y obtiene información del cliente vinculado
   */
  const obtenerDatosUsuario = useCallback(async (uid) => {
    try {
      // Buscar documento de usuario
      const userDoc = await getDoc(doc(db, 'usuarios', uid));
      
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado en la base de datos');
      }

      const userData = userDoc.data();
      setUserRole(userData.rol);

      // Si es cliente, obtener sus datos completos
      if (userData.rol === 'cliente' && userData.clienteId) {
        const clienteDoc = await getDoc(doc(db, 'clientes', userData.clienteId));
        
        if (clienteDoc.exists()) {
          setClienteData({
            id: clienteDoc.id,
            ...clienteDoc.data()
          });
        }
      }

      return userData;
    } catch (err) {
      console.error('Error obteniendo datos de usuario:', err);
      throw err;
    }
  }, []);

  /**
   * Inicia sesión con email y contraseña
   */
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Obtener datos del usuario
      const userData = await obtenerDatosUsuario(user.uid);

      // Verificar que el usuario es un cliente
      if (userData.rol !== 'cliente') {
        await signOut(auth);
        throw new Error('Esta cuenta no tiene acceso al portal de clientes');
      }

      // Verificar que la cuenta está activa
      if (userData.activo === false) {
        await signOut(auth);
        throw new Error('Tu cuenta ha sido desactivada. Contacta con ACMC.');
      }

      console.log('✅ Login exitoso');
      return user;
    } catch (err) {
      console.error('Error en login:', err);
      
      // Mensajes de error amigables
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con ese correo electrónico';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'Esta cuenta ha sido deshabilitada';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [obtenerDatosUsuario]);

  /**
   * Cierra la sesión del usuario
   */
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      setClienteData(null);
      console.log('✅ Logout exitoso');
    } catch (err) {
      console.error('Error en logout:', err);
      throw err;
    }
  }, []);

  /**
   * Escucha cambios en el estado de autenticación
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          await obtenerDatosUsuario(user.uid);
        } catch (err) {
          console.error('Error cargando datos de usuario:', err);
          setError(err.message);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setClienteData(null);
      }
      setLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, [obtenerDatosUsuario]);

  return {
    currentUser,
    userRole,
    clienteData,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!currentUser,
    isCliente: userRole === 'cliente'
  };
};
