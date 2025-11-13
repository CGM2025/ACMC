# Guía de Refactorización: Implementar useAuth Custom Hook

## 📁 Estructura de archivos

Crea esta estructura en tu proyecto:

```
src/
├── hooks/
│   └── useAuth.js          (archivo nuevo - ya creado)
├── App.js                   (modificar)
└── firebase.js              (sin cambios)
```

## 📝 PASO 1: Crear la carpeta hooks y agregar el archivo

1. Crea una carpeta llamada `hooks` dentro de `src/`
2. Copia el archivo `useAuth.js` que te proporcioné en esa carpeta

---

## 📝 PASO 2: Modificar App.js

### 2.1 Actualizar los imports (línea 1-7)

**ANTES:**
```javascript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, Users, Plus, Clock, LogOut, Lock, Edit, Calendar, Trash2, Save, Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle, FileText, Download, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, writeBatch, query, orderBy, where, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import mammoth from 'mammoth';
```

**DESPUÉS:**
```javascript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, Users, Plus, Clock, LogOut, Lock, Edit, Calendar, Trash2, Save, Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle, FileText, Download, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, writeBatch, query, orderBy, where, getDoc, setDoc } from 'firebase/firestore';
import mammoth from 'mammoth';
import { useAuth } from './hooks/useAuth';  // ← NUEVO IMPORT
```

**Cambios:**
- ✅ Agregamos: `import { useAuth } from './hooks/useAuth';`
- ✅ Eliminamos `auth` del import de './firebase' (ahora solo importamos `db`)
- ✅ Eliminamos todo el import de 'firebase/auth' (ya no lo necesitamos aquí)

---

### 2.2 Reemplazar estados de autenticación (línea 9-14)

**ANTES:**
```javascript
const SistemaGestion = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
```

**DESPUÉS:**
```javascript
const SistemaGestion = () => {
  // Hook de autenticación
  const {
    isLoggedIn,
    currentUser,
    loading,
    loginError,
    loginForm,
    setLoginForm,
    setLoginError,
    handleLogin,
    handleGoogleLogin,
    handleLogout,
    hasPermission
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
```

**Cambios:**
- ❌ Eliminamos: Los 5 estados relacionados con autenticación
- ✅ Agregamos: Una sola llamada al hook `useAuth()` que nos da todo

---

### 2.3 Eliminar el useEffect de autenticación (líneas 213-262)

**ELIMINAR este bloque completo:**
```javascript
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              nombre: userData.nombre,
              rol: userData.rol
            });
            setIsLoggedIn(true);
            setActiveTab(userData.rol === 'terapeuta' ? 'horas' : 'dashboard');
          } else {
            const newUserData = {
              nombre: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              rol: 'terapeuta',
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
            setActiveTab('horas');
          }
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error);
          setLoginError('Error al cargar datos del usuario');
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
```

**REEMPLAZAR con este nuevo useEffect más simple:**
```javascript
  // Efecto para establecer la pestaña activa según el rol del usuario
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setActiveTab(currentUser.rol === 'terapeuta' ? 'horas' : 'dashboard');
    }
  }, [isLoggedIn, currentUser]);
```

**Cambios:**
- ❌ Eliminamos: Todo el useEffect complejo de onAuthStateChanged (ahora está en el hook)
- ✅ Agregamos: Un useEffect simple solo para setear activeTab según el rol

---

### 2.4 Eliminar las funciones de login/logout (líneas 1155-1197)

**ELIMINAR estas funciones completas:**
```javascript
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
    } catch (error) {
      setLoginError('Credenciales incorrectas');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          nombre: user.displayName,
          email: user.email,
          rol: 'terapeuta',
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error en login con Google:', error);
      setLoginError('Error al iniciar sesión con Google');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.rol === 'admin') return true;
    if (currentUser.rol === 'terapeuta') return ['horas', 'citas', 'bloques', 'reportes'].includes(permission);
    return false;
  };
```

**Cambios:**
- ❌ Eliminamos: Las 4 funciones completas (handleLogin, handleGoogleLogin, handleLogout, hasPermission)
- ✅ Ya están disponibles: Todas estas funciones vienen del hook useAuth()

---

## ✅ RESUMEN DE CAMBIOS

### Lo que AGREGAMOS:
1. ✅ Import del hook: `import { useAuth } from './hooks/useAuth';`
2. ✅ Una línea que usa el hook: `const { isLoggedIn, currentUser, ... } = useAuth();`
3. ✅ Un useEffect simple para setear activeTab

### Lo que ELIMINAMOS:
1. ❌ 5 estados de autenticación (isLoggedIn, currentUser, loginForm, loginError, loading)
2. ❌ Imports de firebase/auth desde App.js
3. ❌ El useEffect complejo de onAuthStateChanged (~50 líneas)
4. ❌ 4 funciones de autenticación (handleLogin, handleGoogleLogin, handleLogout, hasPermission)

### Resultado:
- **Reducción:** ~90 líneas de código eliminadas de App.js
- **Beneficios:** 
  - Código más limpio y organizado
  - Lógica de autenticación reutilizable
  - Más fácil de testear
  - Más fácil de mantener

---

## 🧪 Cómo probar que funciona

1. Implementa los cambios
2. Inicia tu aplicación: `npm start`
3. Verifica que:
   - ✅ Puedes hacer login con email/password
   - ✅ Puedes hacer login con Google
   - ✅ Puedes cerrar sesión
   - ✅ Los permisos funcionan correctamente
   - ✅ La pantalla de carga aparece mientras verifica autenticación

---

## 💡 Siguientes pasos de refactorización

Después de implementar `useAuth`, puedes crear más hooks:
- `useData` - Para cargar clientes, terapeutas, citas, etc.
- `useReportes` - Para la lógica de reportes
- `useCitas` - Para la gestión de citas
- `useModals` - Para el control de modales

¿Quieres que continuemos con alguno de estos?
