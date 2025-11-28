import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, Users, Plus, Clock, LogOut, Lock, Edit, Calendar, Trash2, Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle, FileText, Download, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { importarUtilidadHistorica } from './api';
import mammoth from 'mammoth';
import moment from 'moment';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getFirestore, updateDoc, doc } from 'firebase/firestore';

// Hooks
import { useAuth } from './hooks/useAuth';  
import { useData } from './hooks/useData';   
import { useReportes } from './hooks/useReportes';  // ← NUEVO IMPORT
import { useCitas } from './hooks/useCitas';
import { useModals } from './hooks/useModals';  // ← NUEVO

// Components
import CalendarioCitas from './components/CalendarioCitas';
import Reportes from './components/Reportes';
import ModalPago from './components/ModalPago';
import { 
  registrarPagoVinculado,
  actualizarPagoVinculado,
  eliminarPagoVinculado 
} from './api/transacciones';
import { crearRecibo } from './api/recibos';
import RecibosGemini from './components/RecibosGemini';
import Sidebar from './components/Sidebar';
import Pagos from './components/pages/Pagos';
import Horas from './components/pages/Horas';
import Terapeutas from './components/pages/Terapeutas';
import Clientes from './components/pages/Clientes';
import BloquesCitas from './components/pages/BloquesCitas';
import Citas from './components/pages/Citas';
import Dashboard from './components/pages/Dashboard';
import EstadoCuentaClientes from './components/pages/EstadoCuentaClientes';
// No necesitas importar ModalRecibo aquí, EstadoCuentaClientes ya lo hace

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Portal from './components/Portal';
import Login from './components/Login';

import GestionUsuarios from './components/pages/GestionUsuarios';
import { obtenerUsuariosPortal } from './api/usuarios';
import { 
  crearUsuarioPortalCloud, 
  activarDesactivarUsuarioCloud, 
  enviarResetPasswordCloud 
} from './api/cloudFunctions';

import GestionComprobantes from './components/pages/GestionComprobantes';
import { 
  obtenerComprobantes, 
  aprobarComprobante, 
  rechazarComprobante 
} from './api/comprobantes';

import CerrarMes from './components/CerrarMes';
import { guardarCierreMes } from './api/utilidadHistorica';
import GestionServicios from './components/pages/GestionServicios';

import { actualizarCita as actualizarCitaDirecta } from './api/citas';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SistemaGestion = () => {
  // Hook de autenticación
  const {
    isLoggedIn,
    currentUser,
    loading,
    loginError,
    loginForm,
    setLoginForm,
    handleLogin,
    handleGoogleLogin,
    handleLogout,
    hasPermission
  } = useAuth();
 
  // Hook de datos - NUEVO
  const {
    clientes,
    terapeutas,
    pagos,
    citas,
    utilidadHistorica,
    recibos,
    cargarRecibos,
    ordenClientes,
    ordenTerapeutas,
    cargarCitas,
    cargarClientes,
    cargarUtilidadHistorica,
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
    getTotales,
    servicios,
    cargarServicios,
    guardarServicio,
    eliminarServicio: eliminarServicioFn,
    activarServicio,
    desactivarServicio,
    obtenerPreciosBase
  } = useData(currentUser, isLoggedIn);

  const [mostrarCerrarMes, setMostrarCerrarMes] = useState(false);

  // ← AQUÍ DEBE IR el useState de usuariosPortal
  const [usuariosPortal, setUsuariosPortal] = useState([]);

  //Funcion para cargar clientes
  // 
  const cargarUsuariosPortal = async () => {
    console.log(">>> cargarUsuariosPortal INICIADO");
    try {
      const usuarios = await obtenerUsuariosPortal();
      console.log(">>> Usuarios obtenidos:", usuarios);
      setUsuariosPortal(usuarios);
    } catch (error) {
      console.error('>>> ERROR cargando usuarios del portal:', error);
    }
  }; 

  // Función auxiliar para actualizar citas
  const actualizarCita = async (citaId, datosActualizados) => {
    try {
      await updateDoc(doc(db, 'citas', citaId), datosActualizados);
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      throw error;
    }
  };

  const [comprobantes, setComprobantes] = useState([]);

  const cargarComprobantes = async () => {
    try {
      const comps = await obtenerComprobantes();
      setComprobantes(comps);
    } catch (error) {
      console.error('Error cargando comprobantes:', error);
    }
  };

  // Hook de modales - NUEVO
  const {
    modals,
    editingId,
    horasForm,
    setHorasForm,
    terapeutaForm,
    setTerapeutaForm,
    clienteForm,
    setClienteForm,
    pagoForm,
    setPagoForm,
    citaForm,
    setCitaForm,
    pestanaCliente,
    setPestanaCliente,
    nuevoPrecio,
    setNuevoPrecio,
    pestanaTerapeuta,
    setPestanaTerapeuta,
    nuevoCostoTerapeuta,
    setNuevoCostoTerapeuta,
    nuevoCostoPorCliente,
    setNuevoCostoPorCliente,
    openModal,
    closeModal,
    agregarPrecioPersonalizado,
    eliminarPrecioPersonalizado,
    agregarCostoTerapeuta,
    eliminarCostoTerapeuta,
    agregarCostoPorCliente,
    eliminarCostoPorCliente
  } = useModals();
  
  const [activeTab, setActiveTab] = useState('dashboard');  

  const [rangoMeses, setRangoMeses] = useState(12); // 6, 12, 24, o 'todo'
  // const [loadingBatch, setLoadingBatch] = useState(false); 
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // ← AGREGAR ESTA LÍNEA
  const [refreshKey, setRefreshKey] = useState(0); // ← NUEVO estado

  const diasSemanaOptions = [
    { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }, { value: 0, label: 'Domingo' }
  ];

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

    // // Hook de reportes - NUEVO
  const {
    mesReporte,
    setMesReporte,
    reporteGenerado,
    setReporteGenerado,
    terapeutaReporte,
    setTerapeutaReporte,
    clienteReporte,
    setClienteReporte,
    generarReporteMensual,
    ordenarCitasReporte,
    renderIndicadorOrden,
    descargarReporte,
    guardarRecibosEnFirebase,  // ← Necesitas esto
    eliminarRecibosPorMes,  // ← AGREGAR ESTA LÍNEA
    guardandoRecibos,          // ← Y esto
  } = useReportes(citas, clientes, meses);

  // Precios base por tipo de terapia (fallback si el cliente no tiene precio personalizado)
  // Precios base ahora vienen de Firestore
  const preciosBasePorTerapia = useMemo(() => {
    if (servicios.length === 0) {
      // Fallback mientras cargan los servicios
      return {
        'Terapia Ocupacional': 950,
        'Servicios de Sombra': 150,
        'Sesión de ABA estándar': 450,
        'Sesión de ABA precio especial': 900,
        'Servicios Administrativos y Reportes': 1200,
        'Servicios de Apoyo y Entrenamiento': 1200,
        'Paquete 4hr/semana': 274,
        'Sesión en casa': 640,
        'Otro': 450
      };
    }
    // Convertir array de servicios a objeto { nombre: precio }
    const precios = {};
    servicios.forEach(s => {
      if (s.activo !== false) {
        precios[s.nombre] = s.precio;
      }
    });
    return precios;
  }, [servicios]);

  // Hook de citas - NUEVO
  const {
    // Estados de filtrado
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterTerapeuta,
    setFilterTerapeuta,
    filterFechaInicio,
    setFilterFechaInicio,
    filterFechaFin,
    setFilterFechaFin,
    showFilters,
    setShowFilters,
    
    // Estados de calendario
    currentDate,
    setCurrentDate,
    vistaCalendario,
    setVistaCalendario,
    
    // Estados de drag & drop
    draggedCita,
    dragOverDay,
    
    // Estados de generación
    horarios,
    setHorarios,
    nuevoHorario,
    setNuevoHorario,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    citasGeneradas,
    mostrarResultado,
    
    // Estados de importación
    importandoWord,
    
    // Funciones
    filtrarCitas,
    limpiarFiltros,
    contarFiltrosActivos,
    abrirCitaDesdeReporte,
    calcularHorasDesdeCitas,
    getCitasDelDia,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragLeave,
    importarDesdeWord,
    agregarHorario,
    eliminarHorario,
    generarCitas,
    guardarCitas
  } = useCitas(citas, terapeutas, clientes, cargarCitas, preciosBasePorTerapia);

  const horasDesdeCitas = useMemo(() => {
    // Convertir objeto a array con estructura esperada
    const citasCompletadas = citas.filter(cita => cita.estado === 'completada');
    const horasPorTerapeutaFecha = {};
    
    citasCompletadas.forEach(cita => {
      const key = `${cita.terapeuta}-${cita.fecha}`;
      
      if (!horasPorTerapeutaFecha[key]) {
        horasPorTerapeutaFecha[key] = {
          terapeuta: cita.terapeuta,
          fecha: cita.fecha,
          cliente: cita.cliente,
          citas: [],
          horasTotal: 0
        };
      }
      
      const inicio = new Date(`2000-01-01T${cita.horaInicio}`);
      const fin = new Date(`2000-01-01T${cita.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      
      horasPorTerapeutaFecha[key].citas.push({
        cliente: cita.cliente,
        horaInicio: cita.horaInicio,
        horaFin: cita.horaFin,
        duracion: duracionHoras
      });
      horasPorTerapeutaFecha[key].horasTotal += duracionHoras;
    });
    
    return Object.values(horasPorTerapeutaFecha).sort((a, b) => 
      new Date(b.fecha) - new Date(a.fecha)
    );
  }, [citas]);

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Precios personalizados por cliente (extraídos de la lista de servicios)
  const preciosInicializacionClientes = {
    'Ana Paulina Plata Luna': {
      'Sesión de ABA estándar': 450
    },
    'Anna Janet Catherman': {
      'Servicios de Sombra': 155
    },
    'Daniel Luna': {
      'Servicios de Sombra': 140,
      'Sesión en casa': 560,
      'Servicios Administrativos y Reportes': 1200
    },
    'Ethan Bronson': {
      'Sesión de ABA estándar': 450,
      'Servicios Administrativos y Reportes': 1200
    },
    'Eva Ferreira': {
      'Servicios de Sombra': 265,
      'Sesión de ABA estándar': 757
    },
    'Gabriel Christian Paredes': {
      'Terapia Ocupacional': 950
    },
    'Helene Stana': {
      'Terapia Ocupacional': 950
    },
    'Isabella Eunsung Cho Kim': {
      'Servicios de Sombra': 150,
      'Sesión de ABA estándar': 450,
      'Servicios de Apoyo y Entrenamiento': 1200
    },
    'Isaiah Bronson': {
      'Sesión de ABA estándar': 450,
      'Sesión de ABA precio especial': 900,
      'Servicios de Apoyo y Entrenamiento': 1200,
      'Servicios Administrativos y Reportes': 1200
    },
    'Luca Pacheco Rozas': {
      'Sesión de ABA estándar': 450,
      'Servicios Administrativos y Reportes': 1200
    },
    'Maite y Luis Robles Gonzáles': {
      'Sesión de ABA estándar': 400,
      'Sesión de ABA precio especial': 900,
      'Servicios de Apoyo y Entrenamiento': 1200,
      'Servicios Administrativos y Reportes': 1200
    },
    'Madelyn Campbell Evans': {
      'Terapia Ocupacional': 950,
      'Servicios Administrativos y Reportes': 1200
    },
    'Matías Santiago Ramírez Reyes': {
      'Paquete 4hr/semana': 274,
      'Sesión en casa': 640,
      'Servicios Administrativos y Reportes': 1200
    },
    'Miguel Ferreira': {
      'Sesión de ABA precio especial': 1200
    },
    'Myra Mestas': {
      'Sesión de ABA precio especial': 900,
      'Servicios de Apoyo y Entrenamiento': 1200
    },
    'Nicolas Yslas Obieta': {
      'Sesión de ABA estándar': 450,
      'Servicios de Apoyo y Entrenamiento': 1200
    },
    'Quinn': {
      'Terapia Ocupacional': 950
    },
    'Río Hardman-Lau': {
      'Sesión de ABA precio especial': 950,
      'Sesión de ABA estándar': 560,
      'Servicios de Apoyo y Entrenamiento': 1200,
      'Servicios Administrativos y Reportes': 1200
    },
    'Roman Lopez Ruzleva': {
      'Servicios de Apoyo y Entrenamiento': 1200
    },
    'Santiago Buerba': {
      'Sesión de ABA precio especial': 900,
      'Sesión de ABA estándar': 450,
      'Servicios de Apoyo y Entrenamiento': 1200
    }
  };

  // Efecto para establecer la pestaña activa según el rol del usuario
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setActiveTab(currentUser.rol === 'terapeuta' ? 'horas' : 'dashboard');
    }
    cargarComprobantes();
  }, [isLoggedIn, currentUser]);

    // Función para obtener precio de un cliente para un tipo de terapia
  const obtenerPrecioCliente = useCallback((nombreCliente, tipoTerapia) => {
    const cliente = clientes.find(c => c.nombre === nombreCliente);
    
    if (cliente && cliente.preciosPersonalizados && cliente.preciosPersonalizados[tipoTerapia]) {
      return {
        precio: cliente.preciosPersonalizados[tipoTerapia],
        esPersonalizado: true
      };
    }
    
    // Si no tiene precio personalizado, usar precio base
    return {
      precio: preciosBasePorTerapia[tipoTerapia] || 450,
      esPersonalizado: false
    };
  }, [clientes, preciosBasePorTerapia]);

  // Función para obtener costo de una terapeuta para un tipo de terapia
  const obtenerCostoTerapeuta = useCallback((nombreTerapeuta, tipoTerapia, nombreCliente = '') => {
    const terapeuta = terapeutas.find(t => t.nombre === nombreTerapeuta);
    
    if (!terapeuta) {
      return { costo: 0, esPersonalizado: false };
    }
    
    // PRIORIDAD 1: Costo por cliente específico (más específico)
    if (nombreCliente && terapeuta.costosPorCliente) {
      const cliente = clientes.find(c => c.nombre === nombreCliente);
      if (cliente && terapeuta.costosPorCliente[cliente.id]) {
        return {
          costo: terapeuta.costosPorCliente[cliente.id],
          esPersonalizado: true,
          tipo: 'cliente'
        };
      }
    }
    
    // PRIORIDAD 2: Costo por servicio
    if (terapeuta.costosPorServicio && terapeuta.costosPorServicio[tipoTerapia]) {
      return {
        costo: terapeuta.costosPorServicio[tipoTerapia],
        esPersonalizado: true,
        tipo: 'servicio'
      };
    }
    
    // Si no tiene costo personalizado, retornar 0 (debe ingresarse manualmente)
    return {
      costo: 0,
      esPersonalizado: false
    };
  }, [terapeutas, clientes]);

  // useEffect para autocompletar precio cuando cambia el cliente o tipo de terapia
  useEffect(() => {
    if (citaForm.cliente && citaForm.tipoTerapia) {
      const precioInfo = obtenerPrecioCliente(citaForm.cliente, citaForm.tipoTerapia);
      setCitaForm(prev => ({
        ...prev,
        costoPorHora: precioInfo.precio
      }));
    }
  }, [citaForm.cliente, citaForm.tipoTerapia, clientes, obtenerPrecioCliente]);

  // useEffect para recalcular costo total (precio al cliente) cuando cambian horas o precio por hora
  useEffect(() => {
    if (citaForm.horaInicio && citaForm.horaFin && citaForm.costoPorHora) {
      const inicio = new Date(`2000-01-01T${citaForm.horaInicio}`);
      const fin = new Date(`2000-01-01T${citaForm.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      const costoTotal = duracionHoras * parseFloat(citaForm.costoPorHora);
      setCitaForm(prev => ({ ...prev, costoTotal: isNaN(costoTotal) ? 0 : costoTotal }));
    }
  }, [citaForm.horaInicio, citaForm.horaFin, citaForm.costoPorHora]);

  // useEffect para recalcular costo de terapeuta total cuando cambian horas o costo
  useEffect(() => {
    if (citaForm.horaInicio && citaForm.horaFin && citaForm.costoTerapeuta) {
      const inicio = new Date(`2000-01-01T${citaForm.horaInicio}`);
      const fin = new Date(`2000-01-01T${citaForm.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      const costoTerapeutaTotal = duracionHoras * parseFloat(citaForm.costoTerapeuta);
      setCitaForm(prev => ({ ...prev, costoTerapeutaTotal: isNaN(costoTerapeutaTotal) ? 0 : costoTerapeutaTotal }));
    }
  }, [citaForm.horaInicio, citaForm.horaFin, citaForm.costoTerapeuta]);

  // useEffect para autocompletar costo de terapeuta cuando cambia la terapeuta, tipo de terapia o cliente
  useEffect(() => {
    if (citaForm.terapeuta && citaForm.tipoTerapia) {
      const costoInfo = obtenerCostoTerapeuta(citaForm.terapeuta, citaForm.tipoTerapia, citaForm.cliente);
      if (costoInfo.esPersonalizado) {
        setCitaForm(prev => ({
          ...prev,
          costoTerapeuta: costoInfo.costo
        }));
      }
    }
  }, [citaForm.terapeuta, citaForm.tipoTerapia, citaForm.cliente, terapeutas, clientes, obtenerCostoTerapeuta]);

  //useEffect para Generar automaticamente reportes cuando cambia el mes
  useEffect(() => {
    if (activeTab === 'reportes') {
      console.log('🔄 Regenerando reporte para:', mesReporte);  // DEBUG
      generarReporteMensual();
    }
  }, [activeTab, mesReporte, terapeutaReporte, clienteReporte]);

  // Cargar usuarios del portal cuando se muestra ese tab
  useEffect(() => {
    console.log("useEffect usuarios - activeTab:", activeTab, "isLoggedIn:", isLoggedIn);
    if (activeTab === 'usuarios' && isLoggedIn) {
      console.log("Llamando a cargarUsuariosPortal...");
      cargarUsuariosPortal();
    }
  }, [activeTab, isLoggedIn]);

  // Función para calcular contribución de ganancias por terapeuta
  const calcularContribucionPorTerapeuta = () => {
    const contribucionPorTerapeuta = {};
    
    // Filtrar solo citas completadas
    const citasCompletadas = citas.filter(c => c.estado === 'completada');
    
    citasCompletadas.forEach(cita => {
      if (!contribucionPorTerapeuta[cita.terapeuta]) {
        contribucionPorTerapeuta[cita.terapeuta] = {
          nombre: cita.terapeuta,
          totalIngresos: 0,
          totalCostos: 0,
          ganancia: 0
        };
      }
      
      // Calcular duración
      const inicio = new Date(`2000-01-01T${cita.horaInicio}`);
      const fin = new Date(`2000-01-01T${cita.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      
      // Calcular ingresos (precio al cliente)
      const ingresos = cita.costoTotal || (cita.costoPorHora * duracionHoras) || 0;
      
      // Calcular costos (lo que se paga a la terapeuta)
      const costos = cita.costoTerapeutaTotal || 0;
      
      contribucionPorTerapeuta[cita.terapeuta].totalIngresos += ingresos;
      contribucionPorTerapeuta[cita.terapeuta].totalCostos += costos;
      contribucionPorTerapeuta[cita.terapeuta].ganancia += (ingresos - costos);
    });
    
    // Calcular total de ganancias para sacar porcentajes
    const gananciaTotal = Object.values(contribucionPorTerapeuta).reduce((sum, t) => sum + t.ganancia, 0);
    
    // Convertir a array y agregar porcentajes
    const arrayContribucion = Object.values(contribucionPorTerapeuta).map(t => ({
      ...t,
      porcentaje: gananciaTotal > 0 ? (t.ganancia / gananciaTotal) * 100 : 0
    }));
    
    // Ordenar de mayor a menor porcentaje
    return arrayContribucion.sort((a, b) => b.porcentaje - a.porcentaje);
  };

  // Función para importar datos históricos de utilidad
  const importarUtilidadHistoricaLocal = async (datosHistoricos) => {
    try {
      console.log('📊 Importando', datosHistoricos.length, 'registros...');
      const registrosImportados = await importarUtilidadHistorica(datosHistoricos);
      console.log('✅ Registros importados:', registrosImportados);
      
      // Recargar datos
      console.log('🔄 Recargando datos históricos...');
      await cargarUtilidadHistorica();

      // Forzar re-render
      setRefreshKey(prev => prev + 1); // ← FORZAR actualización
      
      console.log('📈 Datos actuales:', utilidadHistorica.length, 'registros');
      alert(`✅ Se importaron ${registrosImportados} registros históricos exitosamente`);
    } catch (error) {
      console.error('❌ Error al importar datos históricos:', error);
      alert('Error al importar datos históricos: ' + error.message);
    }
  };

  // Función para calcular evolución mensual de ganancias (histórica + actual)
  const calcularEvolucionMensual = () => {
    const mesesMap = {
      'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
      'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
    };
    
    const evolucion = {};
    
    // 1. Agregar datos históricos
    console.log('📊 Procesando', utilidadHistorica.length, 'registros históricos');
    utilidadHistorica.forEach(registro => {
      const key = `${registro.año}-${String(mesesMap[registro.mes] + 1).padStart(2, '0')}`;
      evolucion[key] = {
        año: registro.año,
        mes: registro.mes,
        mesNum: mesesMap[registro.mes],
        ganancia: registro.utilidad,
        fuente: 'histórico'
      };
    });
    
    // 2. Calcular ganancias del sistema (citas completadas)
    const citasCompletadas = citas.filter(c => c.estado === 'completada');
    
    citasCompletadas.forEach(cita => {
      const fecha = new Date(cita.fecha);
      const año = fecha.getFullYear();
      const mes = fecha.getMonth();
      const key = `${año}-${String(mes + 1).padStart(2, '0')}`;
      
      // Calcular duración
      const inicio = new Date(`2000-01-01T${cita.horaInicio}`);
      const fin = new Date(`2000-01-01T${cita.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      
      // Calcular ganancia
      const ingresos = cita.costoTotal || (cita.costoPorHora * duracionHoras) || 0;
      const costos = cita.costoTerapeutaTotal || 0;
      const ganancia = ingresos - costos;
      
      if (!evolucion[key]) {
        const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        evolucion[key] = {
          año: año,
          mes: mesesNombres[mes],
          mesNum: mes,
          ganancia: 0,
          fuente: 'sistema'
        };
      }
      
      // Si ya existe dato histórico, lo respetamos (no sobreescribimos)
      if (evolucion[key].fuente !== 'histórico') {
        evolucion[key].ganancia += ganancia;
        evolucion[key].fuente = 'sistema';
      }
    });
    
    // Convertir a array y ordenar cronológicamente
    return Object.values(evolucion).sort((a, b) => {
      if (a.año !== b.año) return a.año - b.año;
      return a.mesNum - b.mesNum;
    });
  };

  // Función para calcular KPIs de crecimiento anual
  const calcularKPIsAnuales = () => {
    const evolucion = calcularEvolucionMensual();
    
    if (evolucion.length === 0) return null;
    
    // Agrupar por año
    const porAño = {};
    evolucion.forEach(mes => {
      if (!porAño[mes.año]) {
        porAño[mes.año] = [];
      }
      porAño[mes.año].push(mes.ganancia);
    });
    
    // Calcular promedios por año
    const promediosAnuales = Object.entries(porAño).map(([año, ganancias]) => ({
      año: parseInt(año),
      promedio: ganancias.reduce((sum, g) => sum + g, 0) / ganancias.length,
      total: ganancias.reduce((sum, g) => sum + g, 0),
      meses: ganancias.length
    })).sort((a, b) => a.año - b.año);
    
    // Calcular crecimientos
    const crecimientos = [];
    for (let i = 1; i < promediosAnuales.length; i++) {
      const añoAnterior = promediosAnuales[i - 1];
      const añoActual = promediosAnuales[i];
      const crecimiento = ((añoActual.promedio - añoAnterior.promedio) / añoAnterior.promedio) * 100;
      crecimientos.push({
        año: añoActual.año,
        crecimiento: crecimiento
      });
    }
    
    // Mejor y peor año
    const mejorAño = promediosAnuales.reduce((max, año) => año.promedio > max.promedio ? año : max);
    const peorAño = promediosAnuales.reduce((min, año) => año.promedio < min.promedio ? año : min);
    
    return {
      promediosAnuales,
      crecimientos,
      mejorAño,
      peorAño
    };
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const cambiarMes = (direccion) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direccion);
    setCurrentDate(newDate);
  };

  const esHoy = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  };

  // Función para parsear fechas del Word
  const parsearFechaWord = (fechaStr) => {
    try {
      if (!fechaStr || fechaStr === '----------') return null;
      
      const partes = fechaStr.trim().split('-');
      if (partes.length !== 3) return null;
      
      const dia = partes[0].padStart(2, '0');
      const mes = partes[1].padStart(2, '0');
      const anioCorto = partes[2];
      
      const anioCompleto = anioCorto.length === 2 ? `20${anioCorto}` : anioCorto;
      
      return `${anioCompleto}-${mes}-${dia}`;
    } catch (error) {
      console.error('Error parseando fecha:', fechaStr, error);
      return null;
    }
  };

  // Función para parsear horas del Word
  const parsearHoraWord = (horaStr) => {
    try {
      if (!horaStr || horaStr === '----------') return null;
      
      const hora = horaStr.trim().toLowerCase();
      const partes = hora.split(':');
      if (partes.length !== 2) return null;
      
      let horas = parseInt(partes[0]);
      const minutosMatch = partes[1].match(/\d+/);
      if (!minutosMatch) return null;
      const minutos = minutosMatch[0].padStart(2, '0');
      
      const ampm = hora.includes('pm') ? 'pm' : 'am';
      
      if (ampm === 'pm' && horas !== 12) {
        horas += 12;
      } else if (ampm === 'am' && horas === 12) {
        horas = 0;
      }
      
      return `${horas.toString().padStart(2, '0')}:${minutos}`;
    } catch (error) {
      console.error('Error parseando hora:', horaStr, error);
      return null;
    }
  };

  // Función para importar precios automáticamente a clientes existentes
  const importarPreciosAutomaticamente = async () => {
    const confirmacion = window.confirm(
      '¿Estás seguro de que deseas importar los precios automáticamente?\n\n' +
      'Esto agregará precios personalizados a los clientes que coincidan con la lista.\n' +
      'Los precios existentes no se sobrescribirán, solo se agregarán nuevos.'
    );

    if (!confirmacion) return;

    try {
      let clientesActualizados = 0;
      let preciosAgregados = 0;

      const actualizaciones = await Promise.all(
        clientes.map(async (cliente) => {
          const preciosParaCliente = preciosInicializacionClientes[cliente.nombre];
          
          if (!preciosParaCliente) {
            return { actualizado: false, preciosNuevos: 0 };
          }

          // Combinar precios existentes con nuevos (sin sobrescribir)
          const preciosActuales = cliente.preciosPersonalizados || {};
          const preciosNuevos = { ...preciosParaCliente };
          
          // Solo agregar precios que no existan
          let contadorNuevos = 0;
          Object.keys(preciosNuevos).forEach(tipo => {
            if (!preciosActuales[tipo]) {
              preciosActuales[tipo] = preciosNuevos[tipo];
              contadorNuevos++;
            }
          });

          if (contadorNuevos > 0) {
            // Actualizar en Firebase
            await updateDoc(doc(db, 'clientes', cliente.id), {
              preciosPersonalizados: preciosActuales
            });
            return { actualizado: true, preciosNuevos: contadorNuevos };
          }

          return { actualizado: false, preciosNuevos: 0 };
        })
      );

      // Contar resultados
      clientesActualizados = actualizaciones.filter(r => r.actualizado).length;
      preciosAgregados = actualizaciones.reduce((sum, r) => sum + r.preciosNuevos, 0);

      // Recargar clientes
      await cargarClientes();

      alert(
        `✅ Importación completada!\n\n` +
        `Clientes actualizados: ${clientesActualizados}\n` +
        `Precios agregados: ${preciosAgregados}`
      );
    } catch (error) {
      console.error('Error al importar precios:', error);
      alert('❌ Error al importar precios. Revisa la consola para más detalles.');
    }
  };

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
      } else if (!result.cancelled) {
        alert('Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar');
    }
  };

  const toggleDia = (dia) => {
    setNuevoHorario(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia]
    }));
  };

  // ========================================
  // HANDLERS PARA CALENDARIO
  // ========================================
  
  /**
   * Handler cuando se selecciona una cita en el calendario
   */
  const handleCalendarioSelectCita = useCallback((cita) => {
    openModal('cita', cita);
  }, [openModal]);

  /**
   * Handler cuando se selecciona un slot vacío en el calendario
   */
  const handleCalendarioSelectSlot = useCallback((slotInfo) => {
    const fecha = moment(slotInfo.start).format('YYYY-MM-DD');
    const horaInicio = moment(slotInfo.start).format('HH:mm');
    const horaFin = moment(slotInfo.end).format('HH:mm');
    
    // Pre-llenar el formulario con la fecha/hora seleccionada
    setCitaForm({
      ...citaForm,
      fecha,
      horaInicio,
      horaFin
    });
    
    openModal('cita');
  }, [openModal, citaForm, setCitaForm]);

  /**
   * Handler cuando se mueve una cita (drag & drop)
   */
  const handleCalendarioEventDrop = useCallback(async (cita, start, end) => {
    const nuevaFecha = moment(start).format('YYYY-MM-DD');
    const nuevaHoraInicio = moment(start).format('HH:mm');
    const nuevaHoraFin = moment(end).format('HH:mm');
    
    try {
      await actualizarCita(cita.id, {
        ...cita,
        fecha: nuevaFecha,
        horaInicio: nuevaHoraInicio,
        horaFin: nuevaHoraFin
      });
      
      await cargarCitas();
      alert(`✅ Cita movida a ${nuevaFecha} ${nuevaHoraInicio}-${nuevaHoraFin}`);
    } catch (error) {
      console.error('Error al mover cita:', error);
      alert('❌ Error al mover la cita');
    }
  }, [cargarCitas]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-96">
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
          {loginError && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{loginError}</div>)}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" value={loginForm.email} onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} required />
            <input type="password" placeholder="Contraseña" className="w-full p-3 border rounded-lg" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} required />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">Ingresar</button>
          </form>
          <div className="mt-4">
            <button onClick={handleGoogleLogin} className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuar con Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { totalHoras, totalPagos } = getTotales();
  // const citasFiltradas = filtrarCitas(); // No usado directamente
  // const filtrosActivos = contarFiltrosActivos(); // No usado directamente
  const horasDesdeCitasObj = calcularHorasDesdeCitas();

  return (
      <Router>
    <Routes>
      {/* Ruta del Portal de Clientes */}
      <Route 
        path="/portal" 
        element={
          <Portal 
            recibos={recibos}
            pagos={pagos}
            citas={citas}
          />
        } 
      />

      {/* Ruta principal - Sistema Administrativo */}
      <Route 
        path="/*" 
        element={
          <div className="min-h-screen bg-gray-50">
            {/* TODO tu código actual va aquí */}
            {!isLoggedIn ? (
              <Login onLogin={handleLogin} />
            ) : (
              <div className="min-h-screen bg-gray-100 flex">
                  {/* Sidebar Colapsable */}
                  <Sidebar
                    currentUser={currentUser}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                    hasPermission={hasPermission}
                    handleLogout={handleLogout} 
                    onCerrarMes={() => setMostrarCerrarMes(true)}
                  />

                  {/* Contenido Principal - Se ajusta según el sidebar */}
                  <main className={`${sidebarCollapsed ? 'ml-20' : 'ml-64'} flex-1 p-8 transition-all duration-300`}>
                    {activeTab === 'dashboard' && hasPermission('dashboard') && (
                      <Dashboard
                        citas={citas}
                        clientes={clientes}
                        utilidadHistorica={utilidadHistorica}
                        totalHoras={totalHoras}
                        totalPagos={totalPagos}
                        rangoMeses={rangoMeses}
                        setRangoMeses={setRangoMeses}
                        refreshKey={refreshKey}
                        setRefreshKey={setRefreshKey}
                        cargarUtilidadHistorica={cargarUtilidadHistorica} 
                        onCerrarMes={() => setMostrarCerrarMes(true)}
                        />
                    )}

                    {activeTab === 'servicios' && hasPermission('servicios') && (
                      <GestionServicios
                        servicios={servicios}
                        onCrear={async (datos) => {
                          const result = await guardarServicio(datos);
                          return result;
                        }}
                        onActualizar={async (id, datos) => {
                          const result = await guardarServicio(datos, id);
                          return result;
                        }}
                        onEliminar={async (id) => {
                          await eliminarServicioFn(id);
                        }}
                        onActivar={async (id) => {
                          await activarServicio(id);
                        }}
                        onDesactivar={async (id) => {
                          await desactivarServicio(id);
                        }}
                      />
                    )}

                    {/* SECCIÓN DE HORAS (código igual que antes, omitido por brevedad) */}
                    {activeTab === 'horas' && hasPermission('horas') && (
                      <Horas
                        horasDesdeCitas={horasDesdeCitas} />
                    )}

                    {/* ============================================
                        PESTAÑA: REPORTES
                      ============================================ */}
                    {activeTab === 'reportes' && (
                      <Reportes
                        citas={citas}
                        clientes={clientes}
                        terapeutas={terapeutas}
                        meses={meses}
                        guardarRecibosEnFirebase={guardarRecibosEnFirebase} // ← AGREGAR
                        eliminarRecibosPorMes={eliminarRecibosPorMes} // ← AGREGAR ESTA LÍNEA
                        guardandoRecibos={guardandoRecibos} // ← AGREGAR
                        reporteGenerado={reporteGenerado} // ← AGREGAR
                      />
                    )}

                    {activeTab === 'bloques' && hasPermission('bloques') && (
                      <BloquesCitas
                        terapeutas={terapeutas}
                        clientes={clientes}
                        diasSemanaOptions={diasSemanaOptions}
                        nuevoHorario={nuevoHorario}
                        setNuevoHorario={setNuevoHorario}
                        horarios={horarios}
                        fechaInicio={fechaInicio}
                        setFechaInicio={setFechaInicio}
                        fechaFin={fechaFin}
                        setFechaFin={setFechaFin}
                        citasGeneradas={citasGeneradas}
                        mostrarResultado={mostrarResultado}
                        toggleDia={toggleDia}
                        agregarHorario={agregarHorario}
                        eliminarHorario={eliminarHorario}
                        generarCitas={generarCitas}
                        guardarCitas={guardarCitas} />
                    )}

                    {activeTab === 'citas' && hasPermission('citas') && (
                      <Citas
                        citas={citas}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        filterEstado={filterEstado}
                        setFilterEstado={setFilterEstado}
                        filterTerapeuta={filterTerapeuta}
                        setFilterTerapeuta={setFilterTerapeuta}
                        filterFechaInicio={filterFechaInicio}
                        setFilterFechaInicio={setFilterFechaInicio}
                        filterFechaFin={filterFechaFin}
                        setFilterFechaFin={setFilterFechaFin}
                        vistaCalendario={vistaCalendario}
                        setVistaCalendario={setVistaCalendario}
                        importandoWord={importandoWord}
                        filtrarCitas={filtrarCitas}
                        contarFiltrosActivos={contarFiltrosActivos}
                        limpiarFiltros={limpiarFiltros}
                        openModal={openModal}
                        eliminarCita={eliminarCita}
                        importarDesdeWord={importarDesdeWord}
                        handleCalendarioSelectCita={handleCalendarioSelectCita}
                        handleCalendarioSelectSlot={handleCalendarioSelectSlot}
                        handleCalendarioEventDrop={handleCalendarioEventDrop} />
                    )}

                    {/* RESTO DE SECCIONES (omitidas por brevedad - igual que antes) */}
                    {activeTab === 'terapeutas' && hasPermission('terapeutas') && (
                      <Terapeutas
                        terapeutas={terapeutas}
                        ordenTerapeutas={ordenTerapeutas}
                        ordenarTerapeutas={ordenarTerapeutas}
                        openModal={openModal}
                        eliminarTerapeuta={eliminarTerapeuta} />
                    )}

                    {activeTab === 'clientes' && hasPermission('clientes') && (
                      <Clientes
                        clientes={clientes}
                        ordenClientes={ordenClientes}
                        ordenarClientes={ordenarClientes}
                        openModal={openModal}
                        eliminarCliente={eliminarCliente}
                        importarPreciosAutomaticamente={importarPreciosAutomaticamente} />
                    )}

                    {activeTab === 'pagos' && hasPermission('pagos') && (
                      <EstadoCuentaClientes
                        clientes={clientes}
                        recibos={recibos}
                        pagos={pagos}
                        onRegistrarPago={(cliente) => {
                          openModal('pago');
                          setPagoForm({
                            ...pagoForm,
                            cliente: cliente.nombre
                          });
                        } }
                        onEliminarRecibo={async (reciboId) => {
                          try {
                            // Importar función de eliminación
                            const { eliminarRecibo } = await import('./api/recibos');

                            // Eliminar de Firebase
                            await eliminarRecibo(reciboId);

                            // Recargar datos
                            // // Asumiendo que tienes una función para cargar recibos
                            // // Si no la tienes, avísame y la creamos
                            // if (typeof cargarRecibos === 'function') {
                            //   await cargarRecibos();
                            // }
                            // Recargar página para actualizar datos
                            window.location.reload();

                            return { success: true };
                          } catch (error) {
                            console.error('Error al eliminar recibo:', error);
                            throw error;
                          }
                        } } />
                    )}

                    {/* NUEVO: Tu componente de Recibos Gemini */}
                    {activeTab === 'recibos-gemini' && (
                      <RecibosGemini
                        citas={citas}
                        clientes={clientes}
                        terapeutas={terapeutas}
                        servicios={servicios}
                        recibos={recibos}  // ← AGREGAR
                        meses={meses}
                        onAgregarCita={async (datosCita) => {
                          try {
                            await guardarCita(datosCita);
                            await cargarCitas();
                          } catch (error) {
                            console.error('Error agregando cita:', error);
                            throw error;
                          }
                        }}
                        onEditarCita={async (citaId, datosCita) => {
                          try {
                            await actualizarCitaDirecta(citaId, datosCita);
                            await cargarCitas();
                          } catch (error) {
                            console.error('Error editando cita:', error);
                            throw error;
                          }
                        }}
                        onEliminarCita={async (citaId) => {
                          try {
                            await eliminarCita(citaId);
                            await cargarCitas();
                          } catch (error) {
                            console.error('Error eliminando cita:', error);
                            throw error;
                          }
                        }}
                        onGenerarRecibo={async (datosRecibo) => {  // ← AGREGAR
                          try {
                            await crearRecibo(datosRecibo);
                            await cargarRecibos();  // Recargar recibos
                            console.log('✅ Recibo generado:', datosRecibo.reciboId);
                          } catch (error) {
                            console.error('Error generando recibo:', error);
                            throw error;
                          }
                        }}
                      />
                    )}

                    {/* NUEVO: Tu componente de Gestion de Usuarios */}
                    {activeTab === 'usuarios' && hasPermission('usuarios') && (
                      <GestionUsuarios
                        clientes={clientes}
                        usuarios={usuariosPortal}
                        onCrearUsuario={async (datos) => {
                          const resultado = await crearUsuarioPortalCloud(datos);
                          if (resultado.success) {
                            await cargarUsuariosPortal();
                          }
                          return resultado;
                        }}
                        onActivarDesactivar={async (userId, activo) => {
                          const resultado = await activarDesactivarUsuarioCloud(userId, activo);
                          if (resultado.success) {
                            await cargarUsuariosPortal();
                          }
                          return resultado;
                        }}
                        onResetPassword={enviarResetPasswordCloud}
                      />
                    )}

                    {activeTab === 'comprobantes' && hasPermission('comprobantes') && (
                      <GestionComprobantes
                        comprobantes={comprobantes}
                        clientes={clientes}
                        recibos={recibos}
                        onAprobar={async (comprobante) => {
                          const resultado = await aprobarComprobante(comprobante, currentUser.uid);
                          if (resultado.success) {
                            await cargarComprobantes();
                          }
                          return resultado;
                        }}
                        onRechazar={async (comprobante, motivo) => {
                          const resultado = await rechazarComprobante(comprobante, motivo, currentUser.uid);
                          if (resultado.success) {
                            await cargarComprobantes();
                          }
                          return resultado;
                        }}
                        onRecargar={cargarComprobantes}
                      />
                    )}
                  </main>

                  {/* MODALES (igual que antes - código omitido) */}
                  {modals.cita && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Cita' : 'Nueva Cita'}</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Terapeuta</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              value={citaForm.terapeuta}
                              onChange={(e) => setCitaForm({ ...citaForm, terapeuta: e.target.value })}
                            >
                              <option value="">Seleccionar terapeuta</option>
                              {terapeutas.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              value={citaForm.cliente}
                              onChange={(e) => setCitaForm({ ...citaForm, cliente: e.target.value })}
                            >
                              <option value="">Seleccionar cliente</option>
                              {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              value={citaForm.fecha}
                              onChange={(e) => setCitaForm({ ...citaForm, fecha: e.target.value })} />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Hora inicio</label>
                              <input
                                type="time"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={citaForm.horaInicio}
                                onChange={(e) => setCitaForm({ ...citaForm, horaInicio: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Hora fin</label>
                              <input
                                type="time"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={citaForm.horaFin}
                                onChange={(e) => setCitaForm({ ...citaForm, horaFin: e.target.value })} />
                            </div>
                          </div>

                          {/* Nuevo campo: Tipo de Terapia */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Terapia</label>
                            <select
                              value={citaForm.tipoTerapia || 'Sesión de ABA estándar'}
                              onChange={(e) => setCitaForm({ ...citaForm, tipoTerapia: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              {/* <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                              <option value="Servicios de Sombra">Servicios de Sombra</option>
                              <option value="Sesión de ABA estándar">Sesión de ABA estándar</option>
                              <option value="Sesión de ABA precio especial">Sesión de ABA precio especial</option>
                              <option value="Servicios Administrativos y Reportes">Servicios Administrativos y Reportes</option>
                              <option value="Servicios de Apoyo y Entrenamiento">Servicios de Apoyo y Entrenamiento</option>
                              <option value="Paquete 4hr/semana">Paquete 4hr/semana</option>
                              <option value="Sesión en casa">Sesión en casa</option>
                              <option value="Otro">Otro</option> */}
                              {servicios
                                .filter(s => s.activo !== false)
                                .sort((a, b) => (a.orden || 99) - (b.orden || 99))
                                .map(servicio => (
                                  <option key={servicio.id} value={servicio.nombre}>
                                    {servicio.nombre}
                                  </option>
                                ))
                              }
                            </select>
                          </div>

                          {/* Campos de Precio */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Precio por hora ($)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={citaForm.costoPorHora}
                                onChange={(e) => setCitaForm({
                                  ...citaForm,
                                  costoPorHora: parseFloat(e.target.value) || 0
                                })} />
                              {/* Indicador de precio personalizado */}
                              {citaForm.cliente && citaForm.tipoTerapia && (() => {
                                const precioInfo = obtenerPrecioCliente(citaForm.cliente, citaForm.tipoTerapia);
                                return (
                                  <p className={`text-xs mt-1 ${precioInfo.esPersonalizado ? 'text-green-600' : 'text-gray-500'}`}>
                                    {precioInfo.esPersonalizado ? (
                                      <>✅ Precio personalizado del cliente</>
                                    ) : (
                                      <>💡 Usando precio base</>
                                    )}
                                  </p>
                                );
                              })()}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Precio total ($)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={citaForm.costoTotal}
                                onChange={(e) => setCitaForm({
                                  ...citaForm,
                                  costoTotal: parseFloat(e.target.value) || 0
                                })} />
                            </div>
                          </div>

                          {/* Separador visual */}
                          <div className="border-t pt-4 mt-2"></div>

                          {/* Campos de Costo Terapeuta */}
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-orange-900 mb-3">
                              💼 Costo Terapeuta (Lo que pagas)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Costo por hora ($)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  value={citaForm.costoTerapeuta}
                                  onChange={(e) => setCitaForm({
                                    ...citaForm,
                                    costoTerapeuta: parseFloat(e.target.value) || 0
                                  })}
                                  placeholder="200" />
                                {/* Indicador de costo de terapeuta */}
                                {citaForm.terapeuta && citaForm.tipoTerapia && (() => {
                                  const costoInfo = obtenerCostoTerapeuta(citaForm.terapeuta, citaForm.tipoTerapia);
                                  return (
                                    <p className={`text-xs mt-1 ${costoInfo.esPersonalizado ? 'text-green-600' : 'text-gray-500'}`}>
                                      {costoInfo.esPersonalizado ? (
                                        <>✅ Costo configurado para esta terapeuta</>
                                      ) : (
                                        <>💡 Sin costo configurado - ingresar manualmente</>
                                      )}
                                    </p>
                                  );
                                })()}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Costo total ($)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                  value={citaForm.costoTerapeutaTotal}
                                  readOnly
                                  placeholder="Se calcula automáticamente" />
                              </div>
                            </div>
                          </div>

                          {/* Cálculo de Margen de Ganancia */}
                          {citaForm.costoTotal > 0 && citaForm.costoTerapeutaTotal > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-green-900 mb-3">
                                💰 Margen de Ganancia
                              </h4>
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Ganancia por hora</p>
                                  <p className="text-lg font-bold text-green-700">
                                    ${(citaForm.costoPorHora - citaForm.costoTerapeuta).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Ganancia total</p>
                                  <p className="text-lg font-bold text-green-700">
                                    ${(citaForm.costoTotal - citaForm.costoTerapeutaTotal).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Margen %</p>
                                  <p className="text-lg font-bold text-green-700">
                                    {citaForm.costoTotal > 0 ? (((citaForm.costoTotal - citaForm.costoTerapeutaTotal) / citaForm.costoTotal) * 100).toFixed(1) : 0}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              value={citaForm.estado}
                              onChange={(e) => setCitaForm({ ...citaForm, estado: e.target.value })}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="confirmada">Confirmada</option>
                              <option value="cancelada">Cancelada</option>
                              <option value="completada">Completada</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                          <button onClick={() => closeModal('cita')} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
                          <button onClick={() => save('cita')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingId ? 'Actualizar' : 'Crear'}</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal de Pago */}
                  {/* {modals.pago && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Pago' : 'Registrar Pago'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={pagoForm.clienteId}
                onChange={(e) => setPagoForm({...pagoForm, clienteId: e.target.value})}
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto ($)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={pagoForm.monto}
                onChange={(e) => setPagoForm({...pagoForm, monto: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Concepto</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={pagoForm.concepto}
                onChange={(e) => setPagoForm({...pagoForm, concepto: e.target.value})}
                placeholder="Descripción del pago"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={pagoForm.metodo}
                onChange={(e) => setPagoForm({...pagoForm, metodo: e.target.value})}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={pagoForm.fecha}
                onChange={(e) => setPagoForm({...pagoForm, fecha: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => closeModal('pago')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => save('pago')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {editingId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )} */}
                  <ModalPago
                    isOpen={modals.pago}
                    onClose={() => closeModal('pago')}
                    onSave={() => save('pago')}
                    pagoForm={pagoForm}
                    setPagoForm={setPagoForm}
                    clientes={clientes}
                    recibos={recibos}
                    editingId={editingId} />

                  {/* MODAL DE TERAPEUTA */}
                  {modals.terapeuta && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                        {/* Pestañas */}
                        <div className="flex border-b mb-6">
                          <button
                            onClick={() => setPestanaTerapeuta('datos')}
                            className={`px-6 py-3 font-medium transition-colors ${pestanaTerapeuta === 'datos'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Datos Básicos
                          </button>
                          <button
                            onClick={() => setPestanaTerapeuta('costos')}
                            className={`px-6 py-3 font-medium transition-colors ${pestanaTerapeuta === 'costos'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Costos por Servicio
                          </button>
                        </div>

                        <h3 className="text-lg font-bold mb-4">
                          {editingId ? 'Editar Terapeuta' : 'Nueva Terapeuta'}
                        </h3>

                        {/* Pestaña de Datos Básicos */}
                        {pestanaTerapeuta === 'datos' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre completo
                              </label>
                              <input
                                type="text"
                                placeholder="Nombre completo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={terapeutaForm.nombre}
                                onChange={(e) => setTerapeutaForm({ ...terapeutaForm, nombre: e.target.value })} />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Especialidad
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: Terapia ABA"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={terapeutaForm.especialidad}
                                onChange={(e) => setTerapeutaForm({ ...terapeutaForm, especialidad: e.target.value })} />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono
                              </label>
                              <input
                                type="tel"
                                placeholder="5512345678"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={terapeutaForm.telefono}
                                onChange={(e) => setTerapeutaForm({ ...terapeutaForm, telefono: e.target.value })} />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                              </label>
                              <input
                                type="email"
                                placeholder="terapeuta@ejemplo.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={terapeutaForm.email}
                                onChange={(e) => setTerapeutaForm({ ...terapeutaForm, email: e.target.value })} />
                            </div>
                          </div>
                        )}

                        {/* Pestaña de Costos por Servicio */}
                        {pestanaTerapeuta === 'costos' && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Costos por Servicio para {terapeutaForm.nombre || 'esta terapeuta'}
                            </h3>

                            {/* Lista de costos actuales */}
                            {Object.keys(terapeutaForm.costosPorServicio || {}).length > 0 ? (
                              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2 text-sm font-semibold text-gray-700">Tipo de Servicio</th>
                                      <th className="text-right py-2 text-sm font-semibold text-gray-700">Costo/Hora</th>
                                      <th className="text-center py-2 text-sm font-semibold text-gray-700">Acción</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(terapeutaForm.costosPorServicio || {}).map(([tipo, costo]) => (
                                      <tr key={tipo} className="border-b last:border-0">
                                        <td className="py-3 text-sm text-gray-900">{tipo}</td>
                                        <td className="py-3 text-sm text-right text-gray-900 font-medium">${costo}</td>
                                        <td className="py-3 text-center">
                                          <button
                                            onClick={() => eliminarCostoTerapeuta(tipo)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-yellow-800">
                                  Esta terapeuta no tiene costos configurados. Los costos deberán ingresarse manualmente en cada cita.
                                </p>
                              </div>
                            )}

                            {/* Formulario para agregar nuevo costo */}
                            <div className="border-t pt-4">
                              <h4 className="text-md font-medium text-gray-700 mb-3">Agregar Costo por Servicio</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Servicio</label>
                                  <select
                                    value={nuevoCostoTerapeuta.tipoTerapia}
                                    onChange={(e) => setNuevoCostoTerapeuta({ ...nuevoCostoTerapeuta, tipoTerapia: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  >
                                    {/* <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                                    <option value="Servicios de Sombra">Servicios de Sombra</option>
                                    <option value="Sesión de ABA estándar">Sesión de ABA estándar</option>
                                    <option value="Sesión de ABA precio especial">Sesión de ABA precio especial</option>
                                    <option value="Servicios Administrativos y Reportes">Servicios Administrativos y Reportes</option>
                                    <option value="Servicios de Apoyo y Entrenamiento">Servicios de Apoyo y Entrenamiento</option>
                                    <option value="Paquete 4hr/semana">Paquete 4hr/semana</option>
                                    <option value="Sesión en casa">Sesión en casa</option>
                                    <option value="Otro">Otro</option> */}
                                    {servicios
                                      .filter(s => s.activo !== false)
                                      .sort((a, b) => (a.orden || 99) - (b.orden || 99))
                                      .map(servicio => (
                                        <option key={servicio.id} value={servicio.nombre}>
                                          {servicio.nombre}
                                        </option>
                                      ))
                                    }
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Costo por Hora ($)</label>
                                  <input
                                    type="number"
                                    value={nuevoCostoTerapeuta.costo}
                                    onChange={(e) => setNuevoCostoTerapeuta({ ...nuevoCostoTerapeuta, costo: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="200" />
                                </div>
                              </div>
                              <button
                                onClick={agregarCostoTerapeuta}
                                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                              >
                                <Plus size={16} />
                                Agregar Costo
                              </button>
                            </div>

                            {/* Sección de Costos por Cliente */}
                            <div className="mt-6 pt-6 border-t">
                              <h4 className="text-md font-medium text-gray-700 mb-3">💰 Costos Personalizados por Cliente</h4>
                              <p className="text-sm text-gray-600 mb-4">
                                Define cuánto le pagas a esta terapeuta por cada cliente específico. Estos costos tienen prioridad sobre los costos por servicio.
                              </p>

                              {/* Tabla de costos por cliente existentes */}
                              {terapeutaForm.costosPorCliente && Object.keys(terapeutaForm.costosPorCliente).length > 0 ? (
                                <div className="mb-4 border rounded-lg overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo por Hora</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {Object.entries(terapeutaForm.costosPorCliente).map(([clienteId, costo]) => {
                                        const cliente = clientes.find(c => c.id === clienteId);
                                        return (
                                          <tr key={clienteId}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                              {cliente ? cliente.nombre : 'Cliente no encontrado'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                              ${costo}/hora
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                              <button
                                                onClick={() => eliminarCostoPorCliente(clienteId)}
                                                className="text-red-600 hover:text-red-800"
                                              >
                                                <Trash2 size={16} />
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                  <p className="text-sm text-blue-800">
                                    💡 No hay costos personalizados por cliente. El sistema usará los costos por servicio.
                                  </p>
                                </div>
                              )}

                              {/* Formulario para agregar nuevo costo por cliente */}
                              <div className="border-t pt-4">
                                <h4 className="text-md font-medium text-gray-700 mb-3">Agregar Costo por Cliente</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                                    <select
                                      value={nuevoCostoPorCliente.clienteId}
                                      onChange={(e) => setNuevoCostoPorCliente({ ...nuevoCostoPorCliente, clienteId: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="">Seleccionar cliente...</option>
                                      {clientes.map(cliente => (
                                        <option key={cliente.id} value={cliente.id}>
                                          {cliente.nombre}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Costo por Hora ($)</label>
                                    <input
                                      type="number"
                                      value={nuevoCostoPorCliente.costo}
                                      onChange={(e) => setNuevoCostoPorCliente({ ...nuevoCostoPorCliente, costo: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      placeholder="200" />
                                  </div>
                                </div>
                                <button
                                  onClick={agregarCostoPorCliente}
                                  className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                                >
                                  <Plus size={16} />
                                  Agregar Costo por Cliente
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex justify-end space-x-2 mt-6">
                          <button
                            onClick={() => closeModal('terapeuta')}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => save('terapeuta')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            {editingId ? 'Actualizar' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODAL DE CLIENTE */}
                  {modals.cliente && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                        {/* Pestañas */}
                        <div className="flex border-b mb-6">
                          <button
                            onClick={() => setPestanaCliente('datos')}
                            className={`px-6 py-3 font-medium transition-colors ${pestanaCliente === 'datos'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Datos Básicos
                          </button>
                          <button
                            onClick={() => setPestanaCliente('precios')}
                            className={`px-6 py-3 font-medium transition-colors ${pestanaCliente === 'precios'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Precios Personalizados
                          </button>
                        </div>

                        <h3 className="text-lg font-bold mb-4">
                          {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </h3>

                        {/* Pestaña de Datos Básicos */}
                        {pestanaCliente === 'datos' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del paciente
                              </label>
                              <input
                                type="text"
                                placeholder="Nombre del paciente"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={clienteForm.nombre}
                                onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })} />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Código del cliente
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: CLI001"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={clienteForm.codigo}
                                onChange={(e) => setClienteForm({ ...clienteForm, codigo: e.target.value })} />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email de contacto
                              </label>
                              <input
                                type="email"
                                placeholder="contacto@ejemplo.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={clienteForm.email}
                                onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })} />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono
                              </label>
                              <input
                                type="tel"
                                placeholder="5512345678"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={clienteForm.telefono}
                                onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })} />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Empresa/Institución (opcional)
                              </label>
                              <input
                                type="text"
                                placeholder="Nombre de la empresa"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={clienteForm.empresa}
                                onChange={(e) => setClienteForm({ ...clienteForm, empresa: e.target.value })} />
                            </div>
                          </div>
                        )}

                        {/* Pestaña de Precios Personalizados */}
                        {pestanaCliente === 'precios' && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Precios Personalizados para {clienteForm.nombre || 'este cliente'}
                            </h3>

                            {/* Lista de precios actuales */}
                            {Object.keys(clienteForm.preciosPersonalizados || {}).length > 0 ? (
                              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2 text-sm font-semibold text-gray-700">Tipo de Terapia</th>
                                      <th className="text-right py-2 text-sm font-semibold text-gray-700">Precio/Hora</th>
                                      <th className="text-center py-2 text-sm font-semibold text-gray-700">Acción</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(clienteForm.preciosPersonalizados || {}).map(([tipo, precio]) => (
                                      <tr key={tipo} className="border-b last:border-0">
                                        <td className="py-3 text-sm text-gray-900">{tipo}</td>
                                        <td className="py-3 text-sm text-right text-gray-900 font-medium">${precio}</td>
                                        <td className="py-3 text-center">
                                          <button
                                            onClick={() => eliminarPrecioPersonalizado(tipo)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-yellow-800">
                                  ⚠️ Este cliente no tiene precios personalizados. Se usarán los precios base por defecto.
                                </p>
                              </div>
                            )}

                            {/* Formulario para agregar nuevo precio */}
                            <div className="border-t pt-4">
                              <h4 className="text-md font-medium text-gray-700 mb-3">Agregar Precio Personalizado</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Terapia</label>
                                  <select
                                    value={nuevoPrecio.tipoTerapia}
                                    onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, tipoTerapia: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  >
                                    {/* <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                                    <option value="Servicios de Sombra">Servicios de Sombra</option>
                                    <option value="Sesión de ABA estándar">Sesión de ABA estándar</option>
                                    <option value="Sesión de ABA precio especial">Sesión de ABA precio especial</option>
                                    <option value="Servicios Administrativos y Reportes">Servicios Administrativos y Reportes</option>
                                    <option value="Servicios de Apoyo y Entrenamiento">Servicios de Apoyo y Entrenamiento</option>
                                    <option value="Paquete 4hr/semana">Paquete 4hr/semana</option>
                                    <option value="Sesión en casa">Sesión en casa</option>
                                    <option value="Otro">Otro</option> */}
                                      {servicios
                                        .filter(s => s.activo !== false)
                                        .sort((a, b) => (a.orden || 99) - (b.orden || 99))
                                        .map(servicio => (
                                          <option key={servicio.id} value={servicio.nombre}>
                                            {servicio.nombre}
                                          </option>
                                        ))
                                      }
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio por Hora ($)</label>
                                  <input
                                    type="number"
                                    value={nuevoPrecio.precio}
                                    onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, precio: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="450" />
                                </div>
                              </div>
                              <button
                                onClick={agregarPrecioPersonalizado}
                                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                              >
                                <Plus size={16} />
                                Agregar Precio
                              </button>
                            </div>

                            {/* Referencia de precios base */}
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Precios Base (por defecto)</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                                {Object.entries(preciosBasePorTerapia).map(([tipo, precio]) => (
                                  <div key={tipo} className="flex justify-between">
                                    <span>{tipo}:</span>
                                    <span className="font-medium">${precio}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex justify-end space-x-2 mt-6">
                          <button
                            onClick={() => closeModal('cliente')}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => save('cliente')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            {editingId ? 'Actualizar' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
            {/* Modal Cerrar Mes */}
            {mostrarCerrarMes && (
              <CerrarMes
                pagos={pagos}
                utilidadHistorica={utilidadHistorica}
                onGuardar={async (datos) => {
                  const resultado = await guardarCierreMes(datos);
                  if (resultado.success) {
                    await cargarUtilidadHistorica();
                  }
                  return resultado;
                }}
                onCerrar={() => setMostrarCerrarMes(false)}
              />
            )}
          </div>
        } 
      />
    </Routes>
  </Router>
  )
};

export default SistemaGestion;