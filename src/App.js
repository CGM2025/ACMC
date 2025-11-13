import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, Users, Plus, Clock, LogOut, Lock, Edit, Calendar, Trash2, Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle, FileText, Download, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { db } from './firebase';
import { collection, doc, writeBatch, updateDoc } from 'firebase/firestore';
import mammoth from 'mammoth';
import { useAuth } from './hooks/useAuth';  
import { useData } from './hooks/useData';   
import { useReportes } from './hooks/useReportes';  // ← NUEVO IMPORT

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
    getTotales
  } = useData(currentUser, isLoggedIn);

  
  const [activeTab, setActiveTab] = useState('dashboard');  

  const [rangoMeses, setRangoMeses] = useState(12); // 6, 12, 24, o 'todo'
  const [loadingBatch, setLoadingBatch] = useState(false); // ← AGREGAR ESTA LÍNEA


  const [modals, setModals] = useState({ horas: false, terapeuta: false, cliente: false, pago: false, cita: false });
  const [editingId, setEditingId] = useState(null);
  
  const [horasForm, setHorasForm] = useState({ terapeutaId: '', clienteId: '', fecha: '', horas: '', codigoCliente: '', notas: '' });
  const [terapeutaForm, setTerapeutaForm] = useState({ nombre: '', especialidad: '', telefono: '', email: '', costosPorServicio: {}, costosPorCliente: {} });
  const [clienteForm, setClienteForm] = useState({ nombre: '', email: '', telefono: '', empresa: '', codigo: '', preciosPersonalizados: {} });
  const [pagoForm, setPagoForm] = useState({ clienteId: '', monto: '', concepto: '', metodo: 'efectivo', fecha: '' });
  const [citaForm, setCitaForm] = useState({ terapeuta: '', cliente: '', fecha: '', horaInicio: '', horaFin: '', estado: 'pendiente', costoPorHora: 300, costoTotal: 0, tipoTerapia: 'Sesión de ABA estándar', costoTerapeuta: 0, costoTerapeutaTotal: 0 });

  const [horarios, setHorarios] = useState([]);
  const [nuevoHorario, setNuevoHorario] = useState({ terapeuta: '', cliente: '', diasSemana: [], horaInicio: '08:00', horaFin: '12:00' });
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [citasGeneradas, setCitasGeneradas] = useState([]);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  // Estados para filtros y búsqueda de citas
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTerapeuta, setFilterTerapeuta] = useState('todos');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para el calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState('lista');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Estado para sidebar colapsado
  
  // Estados para drag and drop
  const [draggedCita, setDraggedCita] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [importandoWord, setImportandoWord] = useState(false);

  // Estados para gestión de precios por cliente
  const [pestanaCliente, setPestanaCliente] = useState('datos'); // 'datos' o 'precios'
  const [nuevoPrecio, setNuevoPrecio] = useState({ tipoTerapia: 'Sesión de ABA estándar', precio: 450 });

  // Estados para gestión de costos por terapeuta
  const [pestanaTerapeuta, setPestanaTerapeuta] = useState('datos'); // 'datos' o 'costos'
  const [nuevoCostoTerapeuta, setNuevoCostoTerapeuta] = useState({ tipoTerapia: 'Sesión de ABA estándar', costo: 200 });
  const [nuevoCostoPorCliente, setNuevoCostoPorCliente] = useState({ clienteId: '', costo: 200 });

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
    descargarReporte
  } = useReportes(citas, clientes, meses);

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Precios base por tipo de terapia (fallback si el cliente no tiene precio personalizado)
  const preciosBasePorTerapia = useMemo(() => ({
    'Terapia Ocupacional': 950,
    'Servicios de Sombra': 150,
    'Sesión de ABA estándar': 450,
    'Sesión de ABA precio especial': 900,
    'Servicios Administrativos y Reportes': 1200,
    'Servicios de Apoyo y Entrenamiento': 1200,
    'Paquete 4hr/semana': 274,
    'Sesión en casa': 640,
    'Otro': 450
  }), []);
  
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

  // NUEVA FUNCIÓN: Abrir modal de edición de cita desde el reporte
  const abrirCitaDesdeReporte = (fecha, terapeuta, cliente, horaInicio, horaFin) => {
    // Buscar la cita original en el arreglo de citas
    const citaOriginal = citas.find(c => 
      c.fecha === fecha && 
      c.terapeuta === terapeuta && 
      c.cliente === cliente &&
      c.horaInicio === horaInicio &&
      c.horaFin === horaFin
    );

    if (citaOriginal) {
      // Cargar los datos de la cita en el formulario
      setCitaForm(citaOriginal);
      setEditingId(citaOriginal.id);
      setModals({ ...modals, cita: true });
      // Cambiar a la pestaña de citas para mejor UX
      // setActiveTab('citas');
    } else {
      alert('No se pudo encontrar la cita original');
    }
  };

  // Efecto para establecer la pestaña activa según el rol del usuario
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setActiveTab(currentUser.rol === 'terapeuta' ? 'horas' : 'dashboard');
    }
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
  const importarUtilidadHistorica = async (datosHistoricos) => {
    try {
      const batch = writeBatch(db);
      
      datosHistoricos.forEach(dato => {
        const docRef = doc(collection(db, 'utilidadHistorica'));
        batch.set(docRef, {
          año: dato.año,
          mes: dato.mes,
          utilidad: dato.utilidad,
          fechaImportacion: new Date().toISOString()
        });
      });
      
      await batch.commit();
      alert(`✅ Se importaron ${datosHistoricos.length} registros históricos exitosamente`);
    } catch (error) {
      console.error('Error al importar datos históricos:', error);
      alert('Error al importar datos históricos');
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

  // Función para calcular horas desde citas completadas
  const calcularHorasDesdeCitas = () => {
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

  const getCitasDelDia = (fecha) => {
    if (!fecha) return [];
    const fechaStr = fecha.toISOString().split('T')[0];
    return filtrarCitas().filter(cita => cita.fecha === fechaStr);
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

  // Funciones de Drag & Drop para el calendario
  const handleDragStart = (e, cita) => {
    setDraggedCita(cita);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, fecha) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (fecha) {
      setDragOverDay(fecha.toISOString().split('T')[0]);
    }
  };

  const handleDrop = async (e, nuevaFecha) => {
    e.preventDefault();
    
    if (!draggedCita || !nuevaFecha) {
      setDraggedCita(null);
      setDragOverDay(null);
      return;
    }

    const nuevaFechaStr = nuevaFecha.toISOString().split('T')[0];
    
    if (draggedCita.fecha === nuevaFechaStr) {
      setDraggedCita(null);
      setDragOverDay(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'citas', draggedCita.id), {
        fecha: nuevaFechaStr
      });
      
      await cargarCitas();
      alert(`✅ Cita movida al ${nuevaFechaStr}`);
    } catch (error) {
      console.error('Error al mover cita:', error);
      alert('❌ Error al mover la cita');
    }
    
    setDraggedCita(null);
    setDragOverDay(null);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
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

  // Función principal de importación
  const importarDesdeWord = async (file) => {
    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setImportandoWord(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const texto = result.value;
      
      let nombreTerapeuta = '';
      const lineas = texto.split('\n');
      
      for (const linea of lineas) {
        if (linea.includes('Nombre de Terapeuta:')) {
          nombreTerapeuta = linea.split(':')[1].trim();
          break;
        }
      }
      
      if (!nombreTerapeuta) {
        alert('No se pudo extraer el nombre de la terapeuta del documento');
        setImportandoWord(false);
        return;
      }
      
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      const parser = new DOMParser();
      const docHtml = parser.parseFromString(htmlResult.value, 'text/html');
      const tabla = docHtml.querySelector('table');
      
      if (!tabla) {
        alert('No se encontró una tabla en el documento');
        setImportandoWord(false);
        return;
      }
      
      const filas = Array.from(tabla.querySelectorAll('tr'));
      const citasNuevas = [];
      
      for (let i = 1; i < filas.length; i++) {
        const celdas = Array.from(filas[i].querySelectorAll('td, th')).map(c => c.textContent.trim());
        
        if (celdas[0] === 'TOTAL' || celdas[0] === '----------') continue;
        
        const fecha = parsearFechaWord(celdas[0]);
        const horaInicio = parsearHoraWord(celdas[1]);
        const horaFin = parsearHoraWord(celdas[2]);
        const costoPorHora = parseFloat(celdas[4]?.replace(',', '')) || 300;
        const costoTotal = parseFloat(celdas[5]?.replace(',', '')) || 0;
        const paciente = celdas[6];
        
        if (fecha && horaInicio && horaFin && paciente) {
          citasNuevas.push({
            terapeuta: nombreTerapeuta,
            cliente: paciente,
            fecha: fecha,
            horaInicio: horaInicio,
            horaFin: horaFin,
            estado: 'completada',
            costoPorHora: costoPorHora,
            costoTotal: costoTotal
          });
        }
      }
      
      if (citasNuevas.length > 0) {
        const batch = writeBatch(db);
        citasNuevas.forEach(cita => {
          const docRef = doc(collection(db, 'citas'));
          batch.set(docRef, cita);
        });
        
        await batch.commit();
        await cargarCitas();
        
        alert(`✅ Se importaron ${citasNuevas.length} citas de ${nombreTerapeuta}`);
      } else {
        alert('⚠️ No se encontraron citas válidas en el documento');
      }
      
    } catch (error) {
      console.error('Error importando archivo:', error);
      alert('❌ Error al importar el archivo. Verifica que sea un documento Word válido.\n\nDetalle: ' + error.message);
    }
    
    setImportandoWord(false);
  };

  const filtrarCitas = () => {
    return citas.filter(cita => {
      const matchSearch = searchTerm === '' || 
        cita.terapeuta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.fecha?.includes(searchTerm);

      const matchEstado = filterEstado === 'todos' || cita.estado === filterEstado;
      const matchTerapeuta = filterTerapeuta === 'todos' || cita.terapeuta === filterTerapeuta;
      const matchFecha = (!filterFechaInicio || cita.fecha >= filterFechaInicio) &&
                        (!filterFechaFin || cita.fecha <= filterFechaFin);

      return matchSearch && matchEstado && matchTerapeuta && matchFecha;
    });
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterEstado('todos');
    setFilterTerapeuta('todos');
    setFilterFechaInicio('');
    setFilterFechaFin('');
  };

  const contarFiltrosActivos = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filterEstado !== 'todos') count++;
    if (filterTerapeuta !== 'todos') count++;
    if (filterFechaInicio) count++;
    if (filterFechaFin) count++;
    return count;
  };

  const openModal = (type, item = null) => {
    setEditingId(item?.id || null);
    setModals({ ...modals, [type]: true });
    if (item) {
      switch(type) {
        case 'horas':
          setHorasForm({
            terapeutaId: item.terapeutaId,
            clienteId: item.clienteId,
            fecha: item.fecha,
            horas: item.horas,
            codigoCliente: item.codigoCliente,
            notas: item.notas || ''
          });
          break;
        case 'terapeuta':
          setTerapeutaForm({
            ...item,
            costosPorServicio: item.costosPorServicio || {}
          });
          break;
        case 'cliente':
          setClienteForm({
            ...item,
            preciosPersonalizados: item.preciosPersonalizados || {}
          });
          break;
        case 'pago':
          setPagoForm(item);
          break;
        case 'cita':
          setCitaForm({
            terapeuta: item.terapeuta,
            cliente: item.cliente,
            fecha: item.fecha,
            horaInicio: item.horaInicio,
            horaFin: item.horaFin,
            estado: item.estado,
            costoPorHora: item.costoPorHora || 300,
            costoTotal: item.costoTotal || 0,
            tipoTerapia: item.tipoTerapia || 'Sesión de ABA estándar',
            costoTerapeuta: item.costoTerapeuta || 0,
            costoTerapeutaTotal: item.costoTerapeutaTotal || 0
          });
          break;
        default:
          break;
      }
    }
  };

  const closeModal = (type) => {
    setModals({ ...modals, [type]: false });
    setEditingId(null);
    setHorasForm({ terapeutaId: '', clienteId: '', fecha: '', horas: '', codigoCliente: '', notas: '' });
    setTerapeutaForm({ nombre: '', especialidad: '', telefono: '', email: '', costosPorServicio: {} });
    setClienteForm({ nombre: '', email: '', telefono: '', empresa: '', codigo: '', preciosPersonalizados: {}  });
    setPagoForm({ clienteId: '', monto: '', concepto: '', metodo: 'efectivo', fecha: '' });
    setCitaForm({ terapeuta: '', cliente: '', fecha: '', horaInicio: '', horaFin: '', estado: 'pendiente', costoPorHora: 300, costoTotal: 0, tipoTerapia: 'Sesión de ABA estándar', costoTerapeuta: 0, costoTerapeutaTotal: 0 });

    // Resetear estados de precios y costos
    setPestanaCliente('datos');
    setNuevoPrecio({ tipoTerapia: 'Sesión de ABA estándar', precio: 450 });
    setPestanaTerapeuta('datos');
    setNuevoCostoTerapeuta({ tipoTerapia: 'Sesión de ABA estándar', costo: 200 });
  };

  // Función para agregar precio personalizado al cliente
  const agregarPrecioPersonalizado = () => {
    if (!nuevoPrecio.tipoTerapia || !nuevoPrecio.precio) {
      alert('Por favor completa todos los campos');
      return;
    }

    const preciosActualizados = {
      ...clienteForm.preciosPersonalizados,
      [nuevoPrecio.tipoTerapia]: parseFloat(nuevoPrecio.precio)
    };

    setClienteForm({
      ...clienteForm,
      preciosPersonalizados: preciosActualizados
    });

    // Resetear el formulario de nuevo precio
    setNuevoPrecio({ tipoTerapia: 'Sesión de ABA estándar', precio: 450 });
  };

  // Función para eliminar precio personalizado
  const eliminarPrecioPersonalizado = (tipoTerapia) => {
    const preciosActualizados = { ...clienteForm.preciosPersonalizados };
    delete preciosActualizados[tipoTerapia];
    
    setClienteForm({
      ...clienteForm,
      preciosPersonalizados: preciosActualizados
    });
  };

  // Función para agregar costo personalizado a la terapeuta
  const agregarCostoTerapeuta = () => {
    if (!nuevoCostoTerapeuta.tipoTerapia || !nuevoCostoTerapeuta.costo) {
      alert('Por favor completa todos los campos');
      return;
    }

    const costosActualizados = {
      ...terapeutaForm.costosPorServicio,
      [nuevoCostoTerapeuta.tipoTerapia]: parseFloat(nuevoCostoTerapeuta.costo)
    };

    setTerapeutaForm({
      ...terapeutaForm,
      costosPorServicio: costosActualizados
    });

    // Resetear el formulario de nuevo costo
    setNuevoCostoTerapeuta({ tipoTerapia: 'Sesión de ABA estándar', costo: 200 });
  };

  // Función para eliminar costo personalizado de terapeuta
  const eliminarCostoTerapeuta = (tipoTerapia) => {
    const costosActualizados = { ...terapeutaForm.costosPorServicio };
    delete costosActualizados[tipoTerapia];
    
    setTerapeutaForm({
      ...terapeutaForm,
      costosPorServicio: costosActualizados
    });
  };

  // Función para agregar costo personalizado por cliente
  const agregarCostoPorCliente = () => {
    if (!nuevoCostoPorCliente.clienteId || !nuevoCostoPorCliente.costo) {
      alert('Por favor completa todos los campos');
      return;
    }

    const costosActualizados = {
      ...terapeutaForm.costosPorCliente,
      [nuevoCostoPorCliente.clienteId]: parseFloat(nuevoCostoPorCliente.costo)
    };

    setTerapeutaForm({
      ...terapeutaForm,
      costosPorCliente: costosActualizados
    });

    // Resetear el formulario
    setNuevoCostoPorCliente({ clienteId: '', costo: 200 });
  };

  // Función para eliminar costo personalizado por cliente
  const eliminarCostoPorCliente = (clienteId) => {
    const costosActualizados = { ...terapeutaForm.costosPorCliente };
    delete costosActualizados[clienteId];
    
    setTerapeutaForm({
      ...terapeutaForm,
      costosPorCliente: costosActualizados
    });
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

  const agregarHorario = () => {
    if (!nuevoHorario.terapeuta || !nuevoHorario.cliente || nuevoHorario.diasSemana.length === 0) {
      alert('Por favor completa todos los campos');
      return;
    }
    setHorarios([...horarios, { ...nuevoHorario, id: Date.now() }]);
    setNuevoHorario({ terapeuta: '', cliente: '', diasSemana: [], horaInicio: '08:00', horaFin: '12:00' });
  };

  const eliminarHorario = (id) => {
    setHorarios(horarios.filter(h => h.id !== id));
  };

  const toggleDia = (dia) => {
    setNuevoHorario(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia]
    }));
  };

  const generarCitas = () => {
    if (!fechaInicio || !fechaFin || horarios.length === 0) {
      alert('Configura horarios y fechas');
      return;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const nuevasCitas = [];

    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay();
      const fechaStr = d.toISOString().split('T')[0];

      horarios.forEach(horario => {
        if (horario.diasSemana.includes(diaSemana)) {
          nuevasCitas.push({
            terapeuta: horario.terapeuta,
            cliente: horario.cliente,
            fecha: fechaStr,
            diaSemana: diasSemanaOptions.find(opt => opt.value === diaSemana)?.label || '',
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            estado: 'pendiente'
          });
        }
      });
    }

    setCitasGeneradas(nuevasCitas);
    setMostrarResultado(true);
  };

  const guardarCitas = async () => {
    setLoadingBatch(true); // ← Cambio aquí
    try {
      const batch = writeBatch(db);
      citasGeneradas.forEach(cita => {
        const docRef = doc(collection(db, 'citas'));
        batch.set(docRef, cita);
      });
      await batch.commit();
      alert(`✅ ${citasGeneradas.length} citas guardadas`);
      setCitasGeneradas([]);
      setMostrarResultado(false);
      cargarCitas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar citas');
    }
    setLoadingBatch(false); // ← Cambio aquí
  };

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
  const horasDesdeCitas = calcularHorasDesdeCitas();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Colapsable */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg fixed h-full transition-all duration-300 ease-in-out flex flex-col`}>
        {/* Logo/Header del Sidebar */}
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-800">Sistema de Gestión</h1>
                <p className="text-sm text-gray-500 mt-1">{currentUser.nombre}</p>
                <p className="text-xs text-gray-400">{currentUser.rol}</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>

        {/* Menú de Navegación con Scroll */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {hasPermission('dashboard') && (
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? 'Dashboard' : ''}
              >
                <DollarSign size={20} />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </button>
            )}
            
            {hasPermission('horas') && (
              <button 
                onClick={() => setActiveTab('horas')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'horas' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? 'Horas' : ''}
              >
                <Clock size={20} />
                {!sidebarCollapsed && <span>Horas</span>}
              </button>
            )}
            
            {hasPermission('reportes') && (
              <button 
                onClick={() => setActiveTab('reportes')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'reportes' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? 'Reportes' : ''}
              >
                <FileText size={20} />
                {!sidebarCollapsed && <span>Reportes</span>}
              </button>
            )}
            
            {hasPermission('terapeutas') && (
              <button 
                onClick={() => setActiveTab('terapeutas')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'terapeutas' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? 'Terapeutas' : ''}
              >
                <Users size={20} />
                {!sidebarCollapsed && <span>Terapeutas</span>}
              </button>
            )}
            
            {hasPermission('bloques') && (
              <button 
                onClick={() => setActiveTab('bloques')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'bloques' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? 'Bloques de Citas' : ''}
              >
                <Calendar size={20} />
                {!sidebarCollapsed && <span>Bloques de Citas</span>}
              </button>
            )}
            
            {hasPermission('citas') && (
              <button 
                onClick={() => setActiveTab('citas')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'citas' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? 'Citas' : ''}
              >
                <Calendar size={20} />
                {!sidebarCollapsed && <span>Citas</span>}
              </button>
            )}
            
            {hasPermission('clientes') && (
              <button 
                onClick={() => setActiveTab('clientes')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'clientes' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? 'Clientes' : ''}
              >
                <Users size={20} />
                {!sidebarCollapsed && <span>Clientes</span>}
              </button>
            )}
            
            {hasPermission('pagos') && (
              <button 
                onClick={() => setActiveTab('pagos')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'pagos' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? 'Pagos' : ''}
              >
                <DollarSign size={20} />
                {!sidebarCollapsed && <span>Pagos</span>}
              </button>
            )}
          </div>
        </nav>

        {/* Botón de Logout - Ahora dentro del flujo normal, no absolute */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          <button 
            onClick={handleLogout} 
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center gap-2'} px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium`}
            title={sidebarCollapsed ? 'Cerrar Sesión' : ''}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenido Principal - Se ajusta según el sidebar */}
      <main className={`${sidebarCollapsed ? 'ml-20' : 'ml-64'} flex-1 p-8 transition-all duration-300`}>
        {activeTab === 'dashboard' && hasPermission('dashboard') && (
          <div className="space-y-6">
            {/* Botón de Importación (solo si no hay datos históricos) */}
            {utilidadHistorica.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-yellow-900">📊 Importar Datos Históricos</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Importa tu historial de ganancias desde el archivo JSON para ver la evolución completa
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          try {
                            const datos = JSON.parse(event.target.result);
                            await importarUtilidadHistorica(datos);
                            await cargarUtilidadHistorica();
                          } catch (error) {
                            alert('Error al leer el archivo JSON');
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="hidden"
                    id="importar-historico"
                  />
                  <label
                    htmlFor="importar-historico"
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 cursor-pointer flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Importar JSON
                  </label>
                </div>
              </div>
            )}
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Horas</p>
                    <p className="text-3xl font-bold">{totalHoras.toFixed(1)}</p>
                  </div>
                  <Clock className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Pagos</p>
                    <p className="text-3xl font-bold">${totalPagos.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Clientes</p>
                    <p className="text-3xl font-bold">{clientes.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Gráfica de Contribución por Terapeuta */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                💰 Contribución de Ganancias por Terapeuta
              </h3>
              
              {(() => {
                const contribuciones = calcularContribucionPorTerapeuta();
                const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
                
                if (contribuciones.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No hay citas completadas aún para mostrar contribuciones</p>
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Gráfica de Pie */}
                    <div className="flex items-center justify-center">
                      <PieChart width={400} height={400}>
                        <Pie
                          data={contribuciones}
                          cx={200}
                          cy={200}
                          labelLine={true}
                          label={({ porcentaje }) => `${porcentaje.toFixed(1)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="ganancia"
                        >
                          {contribuciones.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `$${Math.round(value).toLocaleString()}`,
                            props.payload.nombre
                          ]}
                        />
                      </PieChart>
                    </div>

                    {/* Tabla de detalles */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Terapeuta</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Ganancia</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {contribuciones.map((t, index) => (
                            <tr key={t.nombre} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  ></div>
                                  <span className="text-sm font-medium text-gray-900">{t.nombre}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                                ${Math.round(t.ganancia).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                                {t.porcentaje.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2">
                          <tr>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                              ${Math.round(contribuciones.reduce((sum, t) => sum + t.ganancia, 0)).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">100%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Gráfica de Evolución Mensual de Ganancias */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  📈 Evolución Mensual de Ganancias
                </h3>
                
                {/* Selector de Rango */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setRangoMeses(6)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      rangoMeses === 6
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    6 meses
                  </button>
                  <button
                    onClick={() => setRangoMeses(12)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      rangoMeses === 12
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    12 meses
                  </button>
                  <button
                    onClick={() => setRangoMeses(24)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      rangoMeses === 24
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    24 meses
                  </button>
                  <button
                    onClick={() => setRangoMeses('todo')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      rangoMeses === 'todo'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todo
                  </button>
                </div>
              </div>
              
              {(() => {
                const kpis = calcularKPIsAnuales();
                
                // Mostrar KPIs de Crecimiento Anual
                if (kpis && kpis.promediosAnuales.length > 1) {
                  return (
                    <div className="mb-6">
                      {/* Tarjetas de Crecimiento - Ahora en 3 columnas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        
                        {/* Promedios Mensuales por Año */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-purple-900 mb-3">📊 Promedio Mensual por Año</h4>
                          <div className="space-y-2">
                            {kpis.promediosAnuales.map(año => {
                              const esAñoActual = año.año === new Date().getFullYear();
                              const esAñoCompleto = año.meses >= 12;
                              return (
                                <div key={año.año} className="flex justify-between items-center">
                                  <span className="text-sm text-purple-800">
                                    {año.año}{esAñoActual && !esAñoCompleto ? ` (YTD - ${año.meses} meses)` : ''}:
                                  </span>
                                  <span className="text-sm font-bold text-purple-900">
                                    ${Math.round(año.promedio).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Crecimiento Anual */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-blue-900 mb-3">📈 Crecimiento Anual</h4>
                          <div className="space-y-2">
                            {kpis.crecimientos.map(c => {
                              const esAñoActual = c.año === new Date().getFullYear();
                              const añoData = kpis.promediosAnuales.find(a => a.año === c.año);
                              const esAñoCompleto = añoData && añoData.meses >= 12;
                              
                              return (
                                <div key={c.año} className="flex justify-between items-center">
                                  <span className="text-sm text-blue-800">
                                    {c.año - 1} → {c.año}{esAñoActual && !esAñoCompleto ? '*' : ''}:
                                  </span>
                                  <span className={`text-sm font-bold ${c.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {c.crecimiento >= 0 ? '↑' : '↓'} {Math.abs(c.crecimiento).toFixed(1)}%
                                  </span>
                                </div>
                              );
                            })}
                            {kpis.crecimientos.some(c => {
                              const esAñoActual = c.año === new Date().getFullYear();
                              const añoData = kpis.promediosAnuales.find(a => a.año === c.año);
                              const esAñoCompleto = añoData && añoData.meses >= 12;
                              return esAñoActual && !esAñoCompleto;
                            }) && (
                              <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">
                                * Año en progreso, sujeto a cambios
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Mejor Año */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-green-900 mb-3">💰 Análisis Histórico</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-green-700">Mejor Año</p>
                              <p className="text-lg font-bold text-green-900">
                                {kpis.mejorAño.año}: ${Math.round(kpis.mejorAño.promedio).toLocaleString()}/mes
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-green-700">Promedio Histórico</p>
                              <p className="text-lg font-bold text-green-900">
                                ${Math.round(kpis.promediosAnuales.reduce((sum, a) => sum + a.promedio, 0) / kpis.promediosAnuales.length).toLocaleString()}/mes
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-green-700">Crecimiento Total</p>
                              <p className="text-lg font-bold text-green-900">
                                {(() => {
                                  const primerAño = kpis.promediosAnuales[0];
                                  const ultimoAño = kpis.promediosAnuales[kpis.promediosAnuales.length - 1];
                                  const crecimientoTotal = ((ultimoAño.promedio - primerAño.promedio) / primerAño.promedio) * 100;
                                  return `${crecimientoTotal >= 0 ? '+' : ''}${crecimientoTotal.toFixed(1)}%`;
                                })()}
                              </p>
                              <p className="text-xs text-green-600">
                                {kpis.promediosAnuales[0].año} → {kpis.promediosAnuales[kpis.promediosAnuales.length - 1].año}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })()}

              {(() => {
                const evolucion = calcularEvolucionMensual();
                
                // Filtrar según el rango seleccionado
                const datosFiltrados = rangoMeses === 'todo' 
                  ? evolucion 
                  : evolucion.slice(-rangoMeses);
                
                if (datosFiltrados.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No hay datos suficientes para mostrar la evolución</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {utilidadHistorica.length === 0 ? 'Importa tus datos históricos para ver la gráfica' : 'Completa algunas citas para ver datos del sistema'}
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    <LineChart width={1000} height={400} data={datosFiltrados}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${Math.round(value).toLocaleString()}`, 'Ganancia']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return `${payload[0].payload.mes} ${payload[0].payload.año}`;
                          }
                          return label;
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="ganancia" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="Ganancia Mensual"
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                    
                    {/* Estadísticas del período actual */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Ganancia Promedio</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${Math.round(datosFiltrados.reduce((sum, m) => sum + m.ganancia, 0) / datosFiltrados.length).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {rangoMeses === 'todo' ? 'Histórico' : `Últimos ${rangoMeses} meses`}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Mejor Mes</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${Math.round(Math.max(...datosFiltrados.map(m => m.ganancia))).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(() => {
                            const mejor = datosFiltrados.reduce((max, m) => m.ganancia > max.ganancia ? m : max);
                            return `${mejor.mes} ${mejor.año}`;
                          })()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Período</p>
                        <p className="text-2xl font-bold text-purple-600">
                          ${Math.round(datosFiltrados.reduce((sum, m) => sum + m.ganancia, 0)).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {datosFiltrados.length} meses
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* SECCIÓN DE HORAS (código igual que antes, omitido por brevedad) */}
        {activeTab === 'horas' && hasPermission('horas') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Horas Trabajadas</h2>
            </div>

            <div className="bg-white shadow rounded-md">
              {horasDesdeCitas.length > 0 ? (
                <>
                  <div className="px-6 py-4 bg-green-50 border-b">
                    <p className="text-sm text-green-800">
                      <CheckCircle className="inline w-4 h-4 mr-2" />
                      Mostrando horas calculadas desde {horasDesdeCitas.length} días con citas completadas
                    </p>
                  </div>
                  <ul className="divide-y">
                    {horasDesdeCitas.map((registro, index) => (
                      <li key={index} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-lg">{registro.terapeuta}</p>
                            <p className="text-sm text-gray-600">{registro.fecha}</p>
                            <div className="mt-2 space-y-1">
                              {registro.citas.map((cita, idx) => (
                                <div key={idx} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                  <span className="font-medium">{cita.cliente}</span>
                                  <span className="text-gray-500 ml-2">
                                    {cita.horaInicio} - {cita.horaFin} ({cita.duracion.toFixed(1)}h)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {registro.horasTotal.toFixed(1)}h
                            </p>
                            <p className="text-xs text-gray-500">
                              {registro.citas.length} {registro.citas.length === 1 ? 'cita' : 'citas'}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="px-6 py-12 text-center">
                  <CheckCircle className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg">No hay citas completadas aún</p>
                  <p className="text-gray-400 mt-2">
                    Las citas con estado "Completada" aparecerán aquí automáticamente
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN DE REPORTES */}
        {activeTab === 'reportes' && hasPermission('reportes') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Reportes Mensuales</h2>
            </div>

            {/* Selector de mes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Generar Reporte</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona el mes
                  </label>
                  <input
                    type="month"
                    value={mesReporte}
                    onChange={(e) => setMesReporte(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona terapeuta
                  </label>
                  <select
                    value={terapeutaReporte}
                    onChange={(e) => setTerapeutaReporte(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="todas">Todas las terapeutas</option>
                    {/* Obtener lista única de terapeutas de las citas */}
                    {Array.from(new Set(citas.map(c => c.terapeuta))).sort().map((terapeuta, idx) => (
                      <option key={idx} value={terapeuta}>{terapeuta}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona cliente
                  </label>
                  <select
                    value={clienteReporte}
                    onChange={(e) => setClienteReporte(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="todos">Todos los clientes</option>
                    {/* Obtener lista única de clientes de las citas */}
                    {Array.from(new Set(citas.map(c => c.cliente))).sort().map((cliente, idx) => (
                      <option key={idx} value={cliente}>{cliente}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={generarReporteMensual}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
              >
                <FileText size={20} />
                Generar Reporte
              </button>
            </div>

            {/* Reporte generado */}
            {reporteGenerado && reporteGenerado.recibos && reporteGenerado.recibos.length > 0 && (
              <div className="space-y-6">
                {reporteGenerado.recibos.map((recibo, reciboIdx) => (
                  <div key={reciboIdx} className="bg-white rounded-lg shadow">
                    {/* Encabezado del Recibo */}
                    <div className="px-6 py-4 border-b bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Client Name</p>
                          <p className="text-lg font-bold text-gray-800">{recibo.nombre}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Client ID</p>
                          <p className="text-lg font-bold text-gray-800">{recibo.codigo}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mes para Recibo</p>
                        <p className="text-md font-semibold text-gray-700">{reporteGenerado.nombreMes}</p>
                      </div>
                    </div>

                    {/* Título del Recibo */}
                    <div className="px-6 py-3 bg-white border-b">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">Recibo</h3>
                        <button
                          onClick={descargarReporte}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-2 text-sm"
                        >
                          <Download size={16} />
                          Descargar
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Terapias ABA ACMC</p>
                    </div>

                    {/* Tabla de Citas */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100 border-b-2 border-gray-300">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">#</th>
                            <th 
                              onClick={() => {
                                const citasOrdenadas = ordenarCitasReporte(recibo.citas, 'fecha');
                                recibo.citas = citasOrdenadas;
                                setReporteGenerado({...reporteGenerado});
                              }}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                              Fecha de sesión {renderIndicadorOrden('fecha')}
                            </th>
                            <th 
                              onClick={() => {
                                const citasOrdenadas = ordenarCitasReporte(recibo.citas, 'duracion');
                                recibo.citas = citasOrdenadas;
                                setReporteGenerado({...reporteGenerado});
                              }}
                              className="px-4 py-3 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                              Duración {renderIndicadorOrden('duracion')}
                            </th>
                            <th 
                              onClick={() => {
                                const citasOrdenadas = ordenarCitasReporte(recibo.citas, 'tipoTerapia');
                                recibo.citas = citasOrdenadas;
                                setReporteGenerado({...reporteGenerado});
                              }}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                              Tipo de Terapia {renderIndicadorOrden('tipoTerapia')}
                            </th>
                            <th 
                              onClick={() => {
                                const citasOrdenadas = ordenarCitasReporte(recibo.citas, 'terapeuta');
                                recibo.citas = citasOrdenadas;
                                setReporteGenerado({...reporteGenerado});
                              }}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                              Terapeuta {renderIndicadorOrden('terapeuta')}
                            </th>
                            <th 
                              onClick={() => {
                                const citasOrdenadas = ordenarCitasReporte(recibo.citas, 'precio');
                                recibo.citas = citasOrdenadas;
                                setReporteGenerado({...reporteGenerado});
                              }}
                              className="px-4 py-3 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                              Precio de la sesión {renderIndicadorOrden('precio')}
                            </th>
                            <th 
                              onClick={() => {
                                const citasOrdenadas = ordenarCitasReporte(recibo.citas, 'iva');
                                recibo.citas = citasOrdenadas;
                                setReporteGenerado({...reporteGenerado});
                              }}
                              className="px-4 py-3 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                              IVA {renderIndicadorOrden('iva')}
                            </th>
                            <th 
                              onClick={() => {
                                const citasOrdenadas = ordenarCitasReporte(recibo.citas, 'total');
                                recibo.citas = citasOrdenadas;
                                setReporteGenerado({...reporteGenerado});
                              }}
                              className="px-4 py-3 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                              Total {renderIndicadorOrden('total')}
                            </th>
                            <th 
                              onClick={() => {
                                const citasOrdenadas = ordenarCitasReporte(recibo.citas, 'costoTerapeuta');
                                recibo.citas = citasOrdenadas;
                                setReporteGenerado({...reporteGenerado});
                              }}
                              className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
                            >
                              Costo Terapeuta {renderIndicadorOrden('costoTerapeuta')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {recibo.citas.map((cita, idx) => (
                            // <tr key={idx} className="hover:bg-gray-50">
                            <tr 
                              key={idx} 
                              onClick={() => abrirCitaDesdeReporte(cita.fecha, cita.terapeuta, recibo.nombre, cita.horaInicio, cita.horaFin)}
                              className="hover:bg-blue-50 cursor-pointer transition-colors"
                              title="Click para ver/editar esta cita"
                            >
                              <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{cita.fecha}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-900">{cita.duracion.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{cita.tipoTerapia}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{cita.terapeuta}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{cita.precio.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{cita.iva.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{cita.total.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600 bg-orange-50">${(cita.costoTerapeuta || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                          <tr>
                            <td colSpan="2" className="px-4 py-3 text-sm font-bold text-gray-900">
                              {recibo.totalCitas} citas
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                              Suma {recibo.totalHoras.toFixed(2)}
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              Suma {recibo.totalPrecio.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              Suma {Math.round(recibo.totalIva.toFixed(2))}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                              Suma {Math.round(recibo.totalGeneral.toFixed(2))}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-orange-600 bg-orange-50">
                              Suma ${Math.round(recibo.totalCostoTerapeutas || 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Resumen General */}
                {reporteGenerado.recibos.length > 0 && (
                  <div className="bg-blue-50 rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen General</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Columna de Ingresos */}
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Ingresos</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Citas:</span>
                            <span className="font-semibold">{reporteGenerado.totalCitasGeneral}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Horas:</span>
                            <span className="font-semibold">{reporteGenerado.totalHorasGeneral.toFixed(2)}h</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-bold text-gray-700">Ingresos Totales:</span>
                            <span className="text-lg font-bold text-blue-600">${Math.round(reporteGenerado.totalIngresos).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Columna de Ganancias */}
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 Ganancias</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Costos Terapeutas:</span>
                            <span className="font-semibold text-orange-600">
                              ${Math.round(reporteGenerado.recibos.reduce((sum, r) => sum + (r.totalCostoTerapeutas || 0), 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Ganancia Neta:</span>
                            <span className="font-semibold text-green-600">
                              ${Math.round(reporteGenerado.recibos.reduce((sum, r) => sum + (r.gananciaTotal || 0), 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-bold text-gray-700">Margen Promedio:</span>
                            <span className="text-lg font-bold text-green-600">
                              {reporteGenerado.recibos.length > 0 
                                ? (reporteGenerado.recibos.reduce((sum, r) => sum + (r.margenPorcentaje || 0), 0) / reporteGenerado.recibos.length).toFixed(1)
                                : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje cuando no hay datos */}
            {reporteGenerado && reporteGenerado.recibos && reporteGenerado.recibos.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">No hay citas completadas en este período</p>
                <p className="text-gray-400 mt-2">
                  Asegúrate de que las citas tengan el estado "Completada" para que aparezcan en el reporte
                </p>
              </div>
            )}

            {!reporteGenerado && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">Selecciona un mes y genera el reporte</p>
                <p className="text-gray-400 mt-2">
                  El reporte mostrará los recibos por cliente basado en citas completadas
                </p>
              </div>
            )}
          </div>
        )}

          {activeTab === 'bloques' && hasPermission('bloques') && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Bloques de Citas</h2>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Configurar Horarios</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <select className="px-4 py-2 border border-gray-300 rounded-lg" value={nuevoHorario.terapeuta} onChange={(e) => setNuevoHorario({...nuevoHorario, terapeuta: e.target.value})}>
                      <option value="">Seleccionar terapeuta</option>
                      {terapeutas.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                    </select>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg" value={nuevoHorario.cliente} onChange={(e) => setNuevoHorario({...nuevoHorario, cliente: e.target.value})}>
                      <option value="">Seleccionar cliente</option>
                      {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Días de la semana</p>
                    <div className="flex flex-wrap gap-2">
                      {diasSemanaOptions.map(dia => (
                        <button 
                          key={dia.value} 
                          onClick={() => toggleDia(dia.value)} 
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                            nuevoHorario.diasSemana.includes(dia.value) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {dia.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hora de inicio</label>
                      <input type="time" value={nuevoHorario.horaInicio} onChange={(e) => setNuevoHorario({...nuevoHorario, horaInicio: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hora de fin</label>
                      <input type="time" value={nuevoHorario.horaFin} onChange={(e) => setNuevoHorario({...nuevoHorario, horaFin: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  
                  <button onClick={agregarHorario} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <Plus size={20} />Agregar Horario
                  </button>
                </div>
              </div>

              {horarios.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Horarios Configurados</h3>
                  <div className="space-y-2">
                    {horarios.map((horario) => (
                      <div key={horario.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{horario.terapeuta} - {horario.cliente}</p>
                          <p className="text-sm text-gray-600">{horario.diasSemana.map(d => diasSemanaOptions.find(opt => opt.value === d)?.label).join(', ')}</p>
                          <p className="text-sm text-blue-600">{horario.horaInicio} - {horario.horaFin}</p>
                        </div>
                        <button onClick={() => eliminarHorario(horario.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Selecciona el período</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio</label>
                    <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de fin</label>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <button onClick={generarCitas} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                  <Calendar size={20} />Generar Citas
                </button>
              </div>

              {mostrarResultado && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">✨ Se generarán {citasGeneradas.length} citas</h3>
                  <div className="max-h-96 overflow-y-auto mb-4 space-y-2">
                    {citasGeneradas.slice(0, 10).map((cita, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{cita.terapeuta} con {cita.cliente}</p>
                            <p className="text-sm text-gray-600">{cita.diaSemana}, {cita.fecha} | {cita.horaInicio} - {cita.horaFin}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {citasGeneradas.length > 10 && (
                      <p className="text-center text-gray-600 text-sm py-2">... y {citasGeneradas.length - 10} citas más</p>
                    )}
                  </div>
                  <button 
                    onClick={guardarCitas}
                    disabled={loadingBatch}
                    className={`px-4 py-2 rounded transition-colors ${
                      loadingBatch 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {loadingBatch ? 'Guardando...' : 'Guardar Citas'}
                  </button>
                </div>
              )}
            </div>
          )}


          {activeTab === 'citas' && hasPermission('citas') && (
            <div className="space-y-6">
              {<div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Citas Programadas</h2>
                <div className="flex gap-2">
                  {/* Botón de Nueva Cita Manual */}
                    <button
                      onClick={() => openModal('cita')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Nueva Cita
                    </button>
                  {/* Botón de Importar Word */}
                  <label className={`px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                    importandoWord 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}>
                    <Upload size={18} />
                    {importandoWord ? 'Importando...' : 'Importar Word'}
                    <input
                      type="file"
                      accept=".docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          importarDesdeWord(file);
                        }
                        e.target.value = '';
                      }}
                      disabled={importandoWord}
                    />
                  </label>
                  
                  {/* Botones existentes de Lista/Calendario */}
                  <button
                    onClick={() => setVistaCalendario('lista')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      vistaCalendario === 'lista' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => setVistaCalendario('calendario')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      vistaCalendario === 'calendario' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Calendario
                  </button>
                </div>
              </div>}

              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Buscar por terapeuta, cliente o fecha..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Filter size={20} />
                    Filtros
                    {contarFiltrosActivos() > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {contarFiltrosActivos()}
                      </span>
                    )}
                  </button>
                  {contarFiltrosActivos() > 0 && (
                    <button
                      onClick={limpiarFiltros}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                    >
                      <X size={20} />
                      Limpiar
                    </button>
                  )}
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="todos">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cancelada">Cancelada</option>
                        <option value="completada">Completada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Terapeuta</label>
                      <select
                        value={filterTerapeuta}
                        onChange={(e) => setFilterTerapeuta(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="todos">Todos</option>
                        {[...new Set(citas.map(c => c.terapeuta))].map((terapeuta, index) => (
                          <option key={index} value={terapeuta}>{terapeuta}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                      <input
                        type="date"
                        value={filterFechaInicio}
                        onChange={(e) => setFilterFechaInicio(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                      <input
                        type="date"
                        value={filterFechaFin}
                        onChange={(e) => setFilterFechaFin(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                  <span>Mostrando {filtrarCitas().length} de {citas.length} citas</span>
                  {contarFiltrosActivos() > 0 && (
                    <span className="text-blue-600 font-medium">{contarFiltrosActivos()} filtro(s) activo(s)</span>
                  )}
                </div>
              </div>

              {vistaCalendario === 'calendario' ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <button 
                      onClick={() => cambiarMes(-1)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-2xl font-bold">
                      {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h3>
                    <button 
                      onClick={() => cambiarMes(1)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {diasSemana.map(dia => (
                      <div key={dia} className="text-center font-semibold text-gray-600 py-2">
                        {dia}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {getDaysInMonth(currentDate).map((fecha, index) => {
                      const citasDelDia = getCitasDelDia(fecha);
                      const isToday = esHoy(fecha);
                      const isDragOver = dragOverDay === fecha?.toISOString().split('T')[0];
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-24 p-2 border rounded-lg transition-all ${
                            !fecha ? 'bg-gray-50' : 
                            isToday ? 'bg-blue-50 border-blue-500' : 
                            isDragOver ? 'bg-green-100 border-green-500 border-2' :
                            'bg-white hover:bg-gray-50'
                          }`}
                          onDragOver={(e) => handleDragOver(e, fecha)}
                          onDrop={(e) => handleDrop(e, fecha)}
                          onDragLeave={handleDragLeave}
                        >
                          {fecha && (
                            <>
                              <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                {fecha.getDate()}
                              </div>
                              <div className="space-y-1">
                                {citasDelDia.slice(0, 2).map((cita) => (
                                  <div
                                    key={cita.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, cita)}
                                    className={`text-xs p-1 rounded cursor-move ${
                                      cita.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                      cita.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                                      cita.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                                      'bg-blue-100 text-blue-800'
                                    } hover:opacity-75 transition-opacity`}
                                    onClick={() => {
                                      if (!draggedCita) {
                                        openModal('cita', cita);
                                      }
                                    }}
                                  >
                                    <div className="font-medium truncate">{cita.terapeuta}</div>
                                    <div className="truncate">{cita.horaInicio}</div>
                                  </div>
                                ))}
                                {citasDelDia.length > 2 && (
                                  <div className="text-xs text-gray-500 text-center">
                                    +{citasDelDia.length - 2} más
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 mt-6 justify-center flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                      <span className="text-sm">Pendiente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                      <span className="text-sm">Confirmada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                      <span className="text-sm">Cancelada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                      <span className="text-sm">Completada</span>
                    </div>
                    {/* Instrucción de uso */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Arrastra las citas con el mouse para moverlas a otro día
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {filtrarCitas().length > 0 ? (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4">Citas ({filtrarCitas().length})</h3>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {filtrarCitas().map((cita) => (
                          <div key={cita.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200 flex justify-between items-center hover:bg-blue-100 transition-all">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{cita.terapeuta} con {cita.cliente}</p>
                              <p className="text-sm text-gray-600">{cita.fecha} | {cita.horaInicio} - {cita.horaFin}</p>
                              <p className="text-sm text-gray-600 mt-1">📋 {cita.tipoTerapia || 'No especificado'}</p>
                              <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full font-medium ${
                                cita.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                cita.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                                cita.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {cita.estado}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => openModal('cita', cita)} 
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => eliminarCita(cita.id)} 
                                className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                      <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                      <p className="text-gray-500 text-lg">No se encontraron citas</p>
                      <p className="text-gray-400 mt-2">
                        {contarFiltrosActivos() > 0 ? 'Intenta ajustar los filtros' : 'Ve a "Bloques de Citas" para generar nuevas citas'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}




        {/* RESTO DE SECCIONES (omitidas por brevedad - igual que antes) */}
        {activeTab === 'terapeutas' && hasPermission('terapeutas') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Terapeutas</h2>
              <div className="flex gap-3 items-center">
                {/* Botones de ordenamiento */}
                <div className="flex gap-2 mr-2">
                  <button
                    onClick={() => ordenarTerapeutas('original')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ordenTerapeutas === 'original'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="Orden original"
                  >
                    📋 Original
                  </button>
                  <button
                    onClick={() => ordenarTerapeutas('alfabetico')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ordenTerapeutas === 'alfabetico'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="Orden alfabético"
                  >
                    🔤 A-Z
                  </button>
                </div>
                
                {/* Botón nuevo */}
                <button 
                  onClick={() => openModal('terapeuta')} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </button>
              </div>
            </div>
            <div className="bg-white shadow rounded-md"><ul className="divide-y">{terapeutas.map(t => (<li key={t.id} className="px-6 py-4"><div className="flex justify-between items-center"><div><p className="font-medium">{t.nombre}</p><p className="text-sm text-gray-600">{t.especialidad}</p></div><div className="flex gap-2"><button onClick={() => openModal('terapeuta', t)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button><button onClick={() => eliminarTerapeuta(t.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button></div></div></li>))}</ul></div>
          </div>
        )}

        {activeTab === 'clientes' && hasPermission('clientes') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Clientes</h2>
              <div className="flex gap-3 items-center">
                {/* Botones de ordenamiento */}
                <div className="flex gap-2 mr-2">
                  <button
                    onClick={() => ordenarClientes('original')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ordenClientes === 'original'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="Orden original"
                  >
                    📋 Original
                  </button>
                  <button
                    onClick={() => ordenarClientes('alfabetico')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ordenClientes === 'alfabetico'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="Orden alfabético"
                  >
                    🔤 A-Z
                  </button>
                </div>
                
                {/* Botones de acción */}
                <button 
                  onClick={importarPreciosAutomaticamente} 
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Precios
                </button>
                <button 
                  onClick={() => openModal('cliente')} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </button>
              </div>
            </div>
            <div className="bg-white shadow rounded-md"><ul className="divide-y">{clientes.map(c => (<li key={c.id} className="px-6 py-4"><div className="flex justify-between items-center"><div><p className="font-medium">{c.nombre}</p><p className="text-sm text-gray-600">{c.email}</p><p className="text-sm text-blue-600">Código: {c.codigo}</p></div><div className="flex gap-2"><button onClick={() => openModal('cliente', c)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button><button onClick={() => eliminarCliente(c.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button></div></div></li>))}</ul></div>
          </div>
        )}

        {activeTab === 'pagos' && hasPermission('pagos') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Pagos</h2>
              <button onClick={() => openModal('pago')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"><Plus className="w-4 h-4 mr-2" />Registrar</button>
            </div>
            <div className="bg-white shadow rounded-md"><ul className="divide-y">{pagos.map(p => (<li key={p.id} className="px-6 py-4"><div className="flex justify-between items-center"><div><p className="font-medium">{getNombre(p.clienteId, clientes)}</p><p className="text-sm text-gray-600">{p.concepto}</p></div><div className="flex items-center space-x-4"><p className="text-xl font-bold text-green-600">${p.monto.toLocaleString()}</p><button onClick={() => openModal('pago', p)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button><button onClick={() => eliminarPago(p.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button></div></div></li>))}</ul></div>
          </div>
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
                  onChange={(e) => setCitaForm({...citaForm, terapeuta: e.target.value})}
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
                  onChange={(e) => setCitaForm({...citaForm, cliente: e.target.value})}
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
                  onChange={(e) => setCitaForm({...citaForm, fecha: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora inicio</label>
                  <input 
                    type="time" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                    value={citaForm.horaInicio} 
                    onChange={(e) => setCitaForm({...citaForm, horaInicio: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora fin</label>
                  <input 
                    type="time" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                    value={citaForm.horaFin} 
                    onChange={(e) => setCitaForm({...citaForm, horaFin: e.target.value})} 
                  />
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
                  <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                  <option value="Servicios de Sombra">Servicios de Sombra</option>
                  <option value="Sesión de ABA estándar">Sesión de ABA estándar</option>
                  <option value="Sesión de ABA precio especial">Sesión de ABA precio especial</option>
                  <option value="Servicios Administrativos y Reportes">Servicios Administrativos y Reportes</option>
                  <option value="Servicios de Apoyo y Entrenamiento">Servicios de Apoyo y Entrenamiento</option>
                  <option value="Paquete 4hr/semana">Paquete 4hr/semana</option>
                  <option value="Sesión en casa">Sesión en casa</option>
                  <option value="Otro">Otro</option>
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
                    })} 
                  />
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
                    })} 
                  />
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
                      placeholder="200"
                    />
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
                      placeholder="Se calcula automáticamente"
                    />
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
                  onChange={(e) => setCitaForm({...citaForm, estado: e.target.value})}
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
      {/* MODAL DE TERAPEUTA */}
      {modals.terapeuta && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            
            {/* Pestañas */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => setPestanaTerapeuta('datos')}
                className={`px-6 py-3 font-medium transition-colors ${
                  pestanaTerapeuta === 'datos'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Datos Básicos
              </button>
              <button
                onClick={() => setPestanaTerapeuta('costos')}
                className={`px-6 py-3 font-medium transition-colors ${
                  pestanaTerapeuta === 'costos'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
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
                    onChange={(e) => setTerapeutaForm({...terapeutaForm, nombre: e.target.value})} 
                  />
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
                    onChange={(e) => setTerapeutaForm({...terapeutaForm, especialidad: e.target.value})} 
                  />
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
                    onChange={(e) => setTerapeutaForm({...terapeutaForm, telefono: e.target.value})} 
                  />
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
                    onChange={(e) => setTerapeutaForm({...terapeutaForm, email: e.target.value})} 
                  />
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
                        <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                        <option value="Servicios de Sombra">Servicios de Sombra</option>
                        <option value="Sesión de ABA estándar">Sesión de ABA estándar</option>
                        <option value="Sesión de ABA precio especial">Sesión de ABA precio especial</option>
                        <option value="Servicios Administrativos y Reportes">Servicios Administrativos y Reportes</option>
                        <option value="Servicios de Apoyo y Entrenamiento">Servicios de Apoyo y Entrenamiento</option>
                        <option value="Paquete 4hr/semana">Paquete 4hr/semana</option>
                        <option value="Sesión en casa">Sesión en casa</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Costo por Hora ($)</label>
                      <input
                        type="number"
                        value={nuevoCostoTerapeuta.costo}
                        onChange={(e) => setNuevoCostoTerapeuta({ ...nuevoCostoTerapeuta, costo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="200"
                      />
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
                          placeholder="200"
                        />
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
                className={`px-6 py-3 font-medium transition-colors ${
                  pestanaCliente === 'datos'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Datos Básicos
              </button>
              <button
                onClick={() => setPestanaCliente('precios')}
                className={`px-6 py-3 font-medium transition-colors ${
                  pestanaCliente === 'precios'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
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
                    onChange={(e) => setClienteForm({...clienteForm, nombre: e.target.value})} 
                  />
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
                    onChange={(e) => setClienteForm({...clienteForm, codigo: e.target.value})} 
                  />
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
                    onChange={(e) => setClienteForm({...clienteForm, email: e.target.value})} 
                  />
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
                    onChange={(e) => setClienteForm({...clienteForm, telefono: e.target.value})} 
                  />
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
                    onChange={(e) => setClienteForm({...clienteForm, empresa: e.target.value})} 
                  />
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
                        <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                        <option value="Servicios de Sombra">Servicios de Sombra</option>
                        <option value="Sesión de ABA estándar">Sesión de ABA estándar</option>
                        <option value="Sesión de ABA precio especial">Sesión de ABA precio especial</option>
                        <option value="Servicios Administrativos y Reportes">Servicios Administrativos y Reportes</option>
                        <option value="Servicios de Apoyo y Entrenamiento">Servicios de Apoyo y Entrenamiento</option>
                        <option value="Paquete 4hr/semana">Paquete 4hr/semana</option>
                        <option value="Sesión en casa">Sesión en casa</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Precio por Hora ($)</label>
                      <input
                        type="number"
                        value={nuevoPrecio.precio}
                        onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, precio: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="450"
                      />
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
  );
};

export default SistemaGestion;