# Guía de Refactorización: Implementar useData Custom Hook

## 📁 Estructura de archivos actualizada

```
src/
├── hooks/
│   ├── useAuth.js          (ya creado)
│   └── useData.js          (archivo nuevo - ya creado)
├── App.js                   (modificar)
└── firebase.js              (sin cambios)
```

---

## 📝 PASO 1: Agregar el archivo useData.js

1. Copia el archivo `useData.js` en la carpeta `src/hooks/`
2. Este hook maneja toda la lógica de datos (CRUD operations)

---

## 📝 PASO 2: Modificar App.js

### 2.1 Actualizar los imports

**AGREGAR este import después de useAuth:**
```javascript
import { useData } from './hooks/useData';
```

**Tu sección de imports debería quedar así:**
```javascript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, Users, Plus, Clock, LogOut, Lock, Edit, Calendar, Trash2, Save, Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle, FileText, Download, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, writeBatch, query, orderBy, where, getDoc, setDoc } from 'firebase/firestore';
import mammoth from 'mammoth';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';  // ← NUEVO
```

---

### 2.2 Agregar el hook useData (después de useAuth)

**Ubicación:** Justo después de donde usas `useAuth()`

**AGREGAR:**
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
  
  // Hook de datos - NUEVO
  const {
    clientes,
    terapeutas,
    horasTrabajadas,
    pagos,
    citas,
    utilidadHistorica,
    loadingCitas,
    loadingData,
    ordenClientes,
    ordenTerapeutas,
    setClientes,
    setTerapeutas,
    setCitas,
    cargarCitas,
    cargarTerapeutas,
    cargarClientes,
    cargarHorasTrabajadas,
    cargarPagos,
    cargarUtilidadHistorica,
    cargarTodosLosDatos,
    guardarHorasTrabajadas,
    guardarTerapeuta,
    guardarCliente,
    guardarPago,
    guardarCita,
    eliminarTerapeuta,
    eliminarCliente,
    eliminarPago,
    eliminarCita,
    ordenarClientes,
    ordenarTerapeutas,
    getNombre,
    getTotales
  } = useData(currentUser, isLoggedIn);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  // ... resto de tus estados
```

---

### 2.3 Eliminar estados de datos (líneas ~17-26)

**ELIMINAR estos estados:**
```javascript
  const [clientes, setClientes] = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [horasTrabajadas, setHorasTrabajadas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [utilidadHistorica, setUtilidadHistorica] = useState([]);
  const [ordenClientes, setOrdenClientes] = useState('original');
  const [ordenTerapeutas, setOrdenTerapeutas] = useState('original');
```

**Razón:** Ahora vienen del hook `useData()`

---

### 2.4 Eliminar el useEffect de carga de datos (líneas ~264-274)

**ELIMINAR este useEffect completo:**
```javascript
  useEffect(() => {
    if (isLoggedIn) {
      cargarCitas();
      cargarTerapeutas();
      cargarClientes();
      cargarHorasTrabajadas();
      cargarPagos();
      cargarUtilidadHistorica();
    }
  }, [isLoggedIn]);
```

**Razón:** El hook `useData` ya tiene este useEffect internamente

---

### 2.5 Eliminar todas las funciones de carga (líneas ~446-636)

**ELIMINAR estas funciones completas:**
```javascript
  const cargarUtilidadHistorica = async () => { ... };
  const cargarCitas = async () => { ... };
  const cargarTerapeutas = async () => { ... };
  const cargarClientes = async () => { ... };
  const cargarHorasTrabajadas = async () => { ... };
  const cargarPagos = async () => { ... };
```

**TAMBIÉN ELIMINAR:**
```javascript
  const ordenarClientes = (orden) => { ... };
  const ordenarTerapeutas = (orden) => { ... };
```

**Razón:** Todas estas funciones ya están en el hook `useData`

---

### 2.6 Modificar la función save() (líneas ~1427-1478)

**ANTES:**
```javascript
  const save = async (type) => {
    try {
      if (type === 'horas') {
        const data = {
          ...horasForm,
          terapeutaId: currentUser.rol === 'admin' ? horasForm.terapeutaId : currentUser.uid,
          horas: parseFloat(horasForm.horas)
        };
        if (editingId) {
          await updateDoc(doc(db, 'horasTrabajadas', editingId), data);
        } else {
          await addDoc(collection(db, 'horasTrabajadas'), data);
        }
        cargarHorasTrabajadas();
      } else if (type === 'terapeuta') {
        if (editingId) {
          await updateDoc(doc(db, 'terapeutas', editingId), terapeutaForm);
        } else {
          await addDoc(collection(db, 'terapeutas'), terapeutaForm);
        }
        cargarTerapeutas();
      } else if (type === 'cliente') {
        if (editingId) {
          await updateDoc(doc(db, 'clientes', editingId), clienteForm);
        } else {
          await addDoc(collection(db, 'clientes'), clienteForm);
        }
        cargarClientes();
      } else if (type === 'pago') {
        const data = { ...pagoForm, monto: parseFloat(pagoForm.monto) };
        if (editingId) {
          await updateDoc(doc(db, 'pagos', editingId), data);
        } else {
          await addDoc(collection(db, 'pagos'), data);
        }
        cargarPagos();
      } else if (type === 'cita') {
        if (editingId) {
          await updateDoc(doc(db, 'citas', editingId), citaForm);
          alert('✅ Cita actualizada correctamente');
        } else {
          await addDoc(collection(db, 'citas'), citaForm);
          alert('✅ Cita creada correctamente');
        }
        cargarCitas();
      }
      closeModal(type);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar');
    }
  };
```

**DESPUÉS (mucho más simple):**
```javascript
  const save = async (type) => {
    let result;
    
    try {
      switch(type) {
        case 'horas':
          result = await guardarHorasTrabajadas(horasForm, editingId);
          break;
        case 'terapeuta':
          result = await guardarTerapeuta(terapeutaForm, editingId);
          break;
        case 'cliente':
          result = await guardarCliente(clienteForm, editingId);
          break;
        case 'pago':
          result = await guardarPago(pagoForm, editingId);
          break;
        case 'cita':
          result = await guardarCita(citaForm, editingId);
          if (result.success) {
            alert(result.isEdit ? '✅ Cita actualizada correctamente' : '✅ Cita creada correctamente');
          }
          break;
        default:
          break;
      }
      
      if (result.success) {
        closeModal(type);
      } else {
        alert('Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar');
    }
  };
```

---

### 2.7 Eliminar funciones de eliminación (líneas ~1480-1506)

**ELIMINAR estas funciones:**
```javascript
  const eliminarTerapeuta = async (id) => { ... };
  const eliminarCliente = async (id) => { ... };
  const eliminarPago = async (id) => { ... };
  const eliminarCita = async (id) => { ... };
```

**Razón:** Ya vienen del hook `useData`

---

### 2.8 Eliminar funciones auxiliares (líneas ~1508-1517)

**ELIMINAR estas funciones:**
```javascript
  const getNombre = (id, lista) => { ... };
  const getTotales = () => { ... };
```

**Razón:** Ya vienen del hook `useData`

---

## ✅ RESUMEN DE CAMBIOS

### Lo que AGREGAMOS:
1. ✅ Import del hook: `import { useData } from './hooks/useData';`
2. ✅ Una línea que usa el hook: `const { clientes, terapeutas, ... } = useData(currentUser, isLoggedIn);`

### Lo que ELIMINAMOS:
1. ❌ 9 estados relacionados con datos
2. ❌ El useEffect de carga inicial
3. ❌ 6 funciones de carga (cargarCitas, cargarTerapeutas, etc.)
4. ❌ 2 funciones de ordenamiento
5. ❌ 4 funciones de eliminación
6. ❌ 2 funciones auxiliares (getNombre, getTotales)
7. ❌ Gran parte de la función `save()` (ahora usa el hook)

### Lo que SIMPLIFICAMOS:
1. ✅ La función `save()` ahora es mucho más simple y limpia

### Resultado:
- **Reducción:** ~250 líneas de código eliminadas de App.js
- **Beneficios:**
  - Separación clara de responsabilidades
  - Código más testeable
  - Más fácil de mantener
  - Reutilizable en otros componentes
  - Menos acoplamiento

---

## 📊 Comparación App.js

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas totales | ~3889 | ~3640 | -250 líneas |
| Estados | 26+ | 17 | -9 estados |
| Funciones de datos | 12+ | 0 | Movidas al hook |
| Complejidad save() | 50+ líneas | 25 líneas | -50% |

---

## 🧪 Cómo probar que funciona

1. Implementa los cambios
2. Inicia tu aplicación: `npm start`
3. Verifica que:
   - ✅ Los datos se cargan correctamente al iniciar sesión
   - ✅ Puedes crear clientes, terapeutas, citas
   - ✅ Puedes editar registros existentes
   - ✅ Puedes eliminar registros
   - ✅ El ordenamiento alfabético funciona
   - ✅ Los filtros y búsquedas funcionan

---

## 🎯 Progreso de Refactorización

### ✅ Completado:
- [x] **useAuth** - Autenticación y permisos (~90 líneas movidas)
- [x] **useData** - CRUD de datos (~250 líneas movidas)

### 🔜 Siguiente:
- [ ] **useReportes** - Lógica de reportes
- [ ] **useCitas** - Gestión avanzada de citas
- [ ] **useModals** - Control de modales

---

## 💡 Ventajas acumuladas hasta ahora

Con `useAuth` + `useData`:
- **~340 líneas** movidas de App.js a hooks reutilizables
- **~14 estados** eliminados de App.js
- **~16 funciones** movidas a hooks
- Código más modular y mantenible
- Más fácil de testear
- Preparado para escalabilidad

¿Listo para continuar con el siguiente hook? 🚀
