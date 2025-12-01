import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PERMISOS = {
  admin: ['dashboard', 'horas', 'reportes', 'terapeutas', 'bloques', 'citas', 'clientes', 'pagos', 'usuarios', 'comprobantes', 'utilidad', 'servicios'],
  // ... otros roles
};
/**
 * Custom Hook para manejar la autenticación de usuarios
 * 
 * @returns {Object} Estado y funciones de autenticación
 * - isLoggedIn: boolean - Indica si el usuario está autenticado
 * - currentUser: Object|null - Datos del usuario actual
 * - loading: boolean - Indica si está cargando la autenticación
 * - loginError: string - Mensaje de error de login
 * - loginForm: Object - Estado del formulario de login
 * - setLoginForm: Function - Setter para el formulario de login
 * - handleLogin: Function - Función para login con email/password
 * - handleGoogleLogin: Function - Función para login con Google
 * - handleLogout: Function - Función para cerrar sesión
 * - hasPermission: Function - Función para verificar permisos
 */
export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Efecto para escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // Usuario ya existe en Firestore
            const userData = userDoc.data();
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              nombre: userData.nombre,
              rol: userData.rol,
              terapeutaId: userData.terapeutaId || null  // ← AGREGAR ESTA LÍNEA
            });
            setIsLoggedIn(true);
          } else {
            // Usuario nuevo - crear documento en Firestore
            const newUserData = {
              nombre: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              rol: 'terapeuta', // Rol por defecto
              createdAt: new Date().toISOString()
            };
            
            await setDoc(userDocRef, newUserData);
            
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              nombre: newUserData.nombre,
              rol: newUserData.rol
            });
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error);
          setLoginError('Error al cargar datos del usuario');
          await signOut(auth);
        }
      } else {
        // Usuario no autenticado
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
      setLoading(false);
    });

    // Cleanup: desuscribirse del listener
    return () => unsubscribe();
  }, []);

  /**
   * Maneja el login con email y contraseña
   * @param {Event} e - Evento del formulario
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      // El onAuthStateChanged se encargará de actualizar el estado
    } catch (error) {
      console.error('Error en login:', error);
      setLoginError('Credenciales incorrectas');
    }
  };

  /**
   * Maneja el login con Google
   */
  const handleGoogleLogin = async () => {
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verificar si el usuario ya existe en Firestore
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Crear nuevo usuario en Firestore
        await setDoc(userDocRef, {
          nombre: user.displayName,
          email: user.email,
          rol: 'terapeuta', // Rol por defecto
          createdAt: new Date().toISOString()
        });
      }
      // El onAuthStateChanged se encargará de actualizar el estado
    } catch (error) {
      console.error('Error en login con Google:', error);
      setLoginError('Error al iniciar sesión con Google');
    }
  };

  /**
   * Cierra la sesión del usuario
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // El onAuthStateChanged se encargará de limpiar el estado
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permission - Nombre del permiso a verificar
   * @returns {boolean} - True si tiene permiso, False si no
   */
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    // Admin tiene todos los permisos
    if (currentUser.rol === 'admin') return true;
    
    // Terapeuta tiene permisos limitados
    if (currentUser.rol === 'terapeuta') {
      return ['horas', 'citas', 'bloques', 'reportes'].includes(permission);
    }
    
    return false;
  };

  return {
    // Estados
    isLoggedIn,
    currentUser,
    loading,
    loginError,
    loginForm,
    
    // Setters
    setLoginForm,
    setLoginError,
    
    // Funciones
    handleLogin,
    handleGoogleLogin,
    handleLogout,
    hasPermission
  };
};
