import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Plus, Clock, LogOut, Lock, Edit, Calendar, Trash2, Save, Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle, FileText, Download } from 'lucide-react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, writeBatch, query, orderBy, where, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const SistemaGestion = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [clientes, setClientes] = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [horasTrabajadas, setHorasTrabajadas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  const [modals, setModals] = useState({ horas: false, terapeuta: false, cliente: false, pago: false, cita: false });
  const [editingId, setEditingId] = useState(null);
  
  const [horasForm, setHorasForm] = useState({ terapeutaId: '', clienteId: '', fecha: '', horas: '', codigoCliente: '', notas: '' });
  const [terapeutaForm, setTerapeutaForm] = useState({ nombre: '', especialidad: '', telefono: '', email: '' });
  const [clienteForm, setClienteForm] = useState({ nombre: '', email: '', telefono: '', empresa: '', codigo: '' });
  const [pagoForm, setPagoForm] = useState({ clienteId: '', monto: '', concepto: '', metodo: 'efectivo', fecha: '' });
  const [citaForm, setCitaForm] = useState({ terapeuta: '', cliente: '', fecha: '', horaInicio: '', horaFin: '', estado: 'pendiente' });

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
  const [vistaHoras, setVistaHoras] = useState('manual');

  // Estados para reportes
  const [mesReporte, setMesReporte] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reporteGenerado, setReporteGenerado] = useState(null);
  const [terapeutaReporte, setTerapeutaReporte] = useState('todas'); // Nuevo: filtro de terapeuta

  const diasSemanaOptions = [
    { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }, { value: 0, label: 'Domingo' }
  ];

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

  useEffect(() => {
    if (isLoggedIn) {
      cargarCitas();
      cargarTerapeutas();
      cargarClientes();
      cargarHorasTrabajadas();
      cargarPagos();
    }
  }, [isLoggedIn]);

  const cargarCitas = async () => {
    try {
      const q = query(collection(db, 'citas'), orderBy('fecha', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitas(data);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    }
  };

  const cargarTerapeutas = async () => {
    const snapshot = await getDocs(collection(db, 'terapeutas'));
    setTerapeutas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const cargarClientes = async () => {
    const snapshot = await getDocs(collection(db, 'clientes'));
    setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const cargarHorasTrabajadas = async () => {
    try {
      const q = currentUser?.rol === 'terapeuta' 
        ? query(collection(db, 'horasTrabajadas'), where('terapeutaId', '==', currentUser.uid), orderBy('fecha', 'desc'))
        : query(collection(db, 'horasTrabajadas'), orderBy('fecha', 'desc'));
      const snapshot = await getDocs(q);
      setHorasTrabajadas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarPagos = async () => {
    const snapshot = await getDocs(query(collection(db, 'pagos'), orderBy('fecha', 'desc')));
    setPagos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  // Función para generar reporte mensual
  const generarReporteMensual = () => {
    const [year, month] = mesReporte.split('-');
    const citasDelMes = citas.filter(cita => {
      if (cita.estado !== 'completada') return false;
      const fechaCita = new Date(cita.fecha);
      const cumpleMes = fechaCita.getFullYear() === parseInt(year) && 
             fechaCita.getMonth() === parseInt(month) - 1;
      
      // Filtrar por terapeuta si no es "todas"
      if (terapeutaReporte !== 'todas') {
        return cumpleMes && cita.terapeuta === terapeutaReporte;
      }
      return cumpleMes;
    });

    // Agrupar por terapeuta
    const reportePorTerapeuta = {};
    
    citasDelMes.forEach(cita => {
      if (!reportePorTerapeuta[cita.terapeuta]) {
        reportePorTerapeuta[cita.terapeuta] = {
          nombre: cita.terapeuta,
          totalHoras: 0,
          totalCitas: 0,
          detallesPorDia: {},
          clientes: new Set()
        };
      }
      
      const inicio = new Date(`2000-01-01T${cita.horaInicio}`);
      const fin = new Date(`2000-01-01T${cita.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      
      reportePorTerapeuta[cita.terapeuta].totalHoras += duracionHoras;
      reportePorTerapeuta[cita.terapeuta].totalCitas += 1;
      reportePorTerapeuta[cita.terapeuta].clientes.add(cita.cliente);
      
      if (!reportePorTerapeuta[cita.terapeuta].detallesPorDia[cita.fecha]) {
        reportePorTerapeuta[cita.terapeuta].detallesPorDia[cita.fecha] = {
          fecha: cita.fecha,
          horas: 0,
          citas: []
        };
      }
      
      reportePorTerapeuta[cita.terapeuta].detallesPorDia[cita.fecha].horas += duracionHoras;
      reportePorTerapeuta[cita.terapeuta].detallesPorDia[cita.fecha].citas.push({
        cliente: cita.cliente,
        horaInicio: cita.horaInicio,
        horaFin: cita.horaFin,
        duracion: duracionHoras
      });
    });

    // Convertir a array y calcular estadísticas
    const reporte = Object.values(reportePorTerapeuta).map(terapeuta => ({
      ...terapeuta,
      clientes: Array.from(terapeuta.clientes),
      totalClientes: terapeuta.clientes.size,
      detallesPorDia: Object.values(terapeuta.detallesPorDia).sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
      ),
      promedioDiario: terapeuta.totalHoras / Object.keys(terapeuta.detallesPorDia).length || 0
    }));

    setReporteGenerado({
      mes: mesReporte,
      nombreMes: `${meses[parseInt(month) - 1]} ${year}`,
      terapeutas: reporte,
      terapeutaFiltrada: terapeutaReporte,
      totalGeneral: reporte.reduce((sum, t) => sum + t.totalHoras, 0),
      totalCitasGeneral: reporte.reduce((sum, t) => sum + t.totalCitas, 0)
    });
  };

  // Función para descargar reporte como texto
  const descargarReporte = () => {
    if (!reporteGenerado) return;

    let contenido = `REPORTE DE HORAS TRABAJADAS\n`;
    contenido += `Período: ${reporteGenerado.nombreMes}\n`;
    contenido += `Generado: ${new Date().toLocaleDateString()}\n`;
    contenido += `${'='.repeat(80)}\n\n`;

    reporteGenerado.terapeutas.forEach(terapeuta => {
      contenido += `TERAPEUTA: ${terapeuta.nombre}\n`;
      contenido += `${'-'.repeat(80)}\n`;
      contenido += `Total de Horas: ${terapeuta.totalHoras.toFixed(2)}h\n`;
      contenido += `Total de Citas: ${terapeuta.totalCitas}\n`;
      contenido += `Clientes Atendidos: ${terapeuta.totalClientes}\n`;
      contenido += `Promedio Diario: ${terapeuta.promedioDiario.toFixed(2)}h\n\n`;
      
      contenido += `Desglose por Día:\n`;
      terapeuta.detallesPorDia.forEach(dia => {
        contenido += `  ${dia.fecha} - ${dia.horas.toFixed(2)}h (${dia.citas.length} citas)\n`;
        dia.citas.forEach(cita => {
          contenido += `    • ${cita.cliente}: ${cita.horaInicio} - ${cita.horaFin} (${cita.duracion.toFixed(2)}h)\n`;
        });
      });
      contenido += `\n${'='.repeat(80)}\n\n`;
    });

    contenido += `RESUMEN GENERAL\n`;
    contenido += `${'-'.repeat(80)}\n`;
    contenido += `Total de Horas (Todos): ${reporteGenerado.totalGeneral.toFixed(2)}h\n`;
    contenido += `Total de Citas (Todas): ${reporteGenerado.totalCitasGeneral}\n`;

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_horas_${mesReporte}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          setTerapeutaForm(item);
          break;
        case 'cliente':
          setClienteForm(item);
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
            estado: item.estado
          });
          break;
      }
    }
  };

  const closeModal = (type) => {
    setModals({ ...modals, [type]: false });
    setEditingId(null);
    setHorasForm({ terapeutaId: '', clienteId: '', fecha: '', horas: '', codigoCliente: '', notas: '' });
    setTerapeutaForm({ nombre: '', especialidad: '', telefono: '', email: '' });
    setClienteForm({ nombre: '', email: '', telefono: '', empresa: '', codigo: '' });
    setPagoForm({ clienteId: '', monto: '', concepto: '', metodo: 'efectivo', fecha: '' });
    setCitaForm({ terapeuta: '', cliente: '', fecha: '', horaInicio: '', horaFin: '', estado: 'pendiente' });
  };

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

  const eliminarHoras = async (id) => {
    if (window.confirm('¿Eliminar este registro?')) {
      await deleteDoc(doc(db, 'horasTrabajadas', id));
      cargarHorasTrabajadas();
    }
  };

  const eliminarTerapeuta = async (id) => {
    if (window.confirm('¿Eliminar terapeuta?')) {
      await deleteDoc(doc(db, 'terapeutas', id));
      cargarTerapeutas();
    }
  };

  const eliminarCliente = async (id) => {
    if (window.confirm('¿Eliminar cliente?')) {
      await deleteDoc(doc(db, 'clientes', id));
      cargarClientes();
    }
  };

  const eliminarPago = async (id) => {
    if (window.confirm('¿Eliminar pago?')) {
      await deleteDoc(doc(db, 'pagos', id));
      cargarPagos();
    }
  };

  const eliminarCita = async (id) => {
    if (window.confirm('¿Eliminar esta cita?')) {
      await deleteDoc(doc(db, 'citas', id));
      cargarCitas();
    }
  };

  const getNombre = (id, lista) => {
    const item = lista.find(x => x.id === id);
    return item?.nombre || 'Sin asignar';
  };

  const getTotales = () => {
    const totalHoras = horasTrabajadas.reduce((acc, h) => acc + parseFloat(h.horas || 0), 0);
    const totalPagos = pagos.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);
    return { totalHoras, totalPagos };
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
    setLoadingCitas(true);
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
    setLoadingCitas(false);
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
  const citasFiltradas = filtrarCitas();
  const filtrosActivos = contarFiltrosActivos();
  const horasDesdeCitas = calcularHorasDesdeCitas();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Gestión</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{currentUser.nombre} ({currentUser.rol})</span>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><LogOut className="w-4 h-4" />Salir</button>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {hasPermission('dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`py-4 px-2 border-b-2 font-medium ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Dashboard</button>}
            {hasPermission('horas') && <button onClick={() => setActiveTab('horas')} className={`py-4 px-2 border-b-2 font-medium ${activeTab === 'horas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Horas</button>}
            {hasPermission('reportes') && <button onClick={() => setActiveTab('reportes')} className={`py-4 px-2 border-b-2 font-medium ${activeTab === 'reportes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Reportes</button>}
            {hasPermission('terapeutas') && <button onClick={() => setActiveTab('terapeutas')} className={`py-4 px-2 border-b-2 font-medium ${activeTab === 'terapeutas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Terapeutas</button>}
            {hasPermission('bloques') && <button onClick={() => setActiveTab('bloques')} className={`py-4 px-2 border-b-2 font-medium ${activeTab === 'bloques' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Bloques de Citas</button>}
            {hasPermission('citas') && <button onClick={() => setActiveTab('citas')} className={`py-4 px-2 border-b-2 font-medium ${activeTab === 'citas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Citas</button>}
            {hasPermission('clientes') && <button onClick={() => setActiveTab('clientes')} className={`py-4 px-2 border-b-2 font-medium ${activeTab === 'clientes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Clientes</button>}
            {hasPermission('pagos') && <button onClick={() => setActiveTab('pagos')} className={`py-4 px-2 border-b-2 font-medium ${activeTab === 'pagos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Pagos</button>}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && hasPermission('dashboard') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-gray-600 text-sm">Total Horas</p><p className="text-3xl font-bold">{totalHoras.toFixed(1)}</p></div><Clock className="w-12 h-12 text-blue-500" /></div></div>
            <div className="bg-white p-6 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-gray-600 text-sm">Total Pagos</p><p className="text-3xl font-bold">${totalPagos.toLocaleString()}</p></div><DollarSign className="w-12 h-12 text-green-500" /></div></div>
            <div className="bg-white p-6 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-gray-600 text-sm">Clientes</p><p className="text-3xl font-bold">{clientes.length}</p></div><Users className="w-12 h-12 text-purple-500" /></div></div>
          </div>
        )}

        {/* SECCIÓN DE HORAS (código igual que antes, omitido por brevedad) */}
        {activeTab === 'horas' && hasPermission('horas') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Horas Trabajadas</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setVistaHoras('citas')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${vistaHoras === 'citas' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <CheckCircle size={18} />
                  Desde Citas
                </button>
                <button
                  onClick={() => setVistaHoras('manual')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${vistaHoras === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <Edit size={18} />
                  Manual
                </button>
                {vistaHoras === 'manual' && (
                  <button onClick={() => openModal('horas')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                    <Plus className="w-4 h-4 mr-2" />Nueva
                  </button>
                )}
              </div>
            </div>

            {vistaHoras === 'citas' ? (
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
            ) : (
              <div className="bg-white shadow rounded-md">
                <ul className="divide-y">
                  {horasTrabajadas.map(h => (
                    <li key={h.id} className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{getNombre(h.clienteId, clientes)} ({h.codigoCliente})</p>
                          <p className="text-sm text-gray-600">{h.fecha} - {h.horas}h</p>
                          {h.notas && <p className="text-sm text-gray-500 italic">{h.notas}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openModal('horas', h)} className="text-blue-600 hover:text-blue-800">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => eliminarHoras(h.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
            {reporteGenerado && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b bg-blue-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Reporte: {reporteGenerado.nombreMes}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {reporteGenerado.terapeutaFiltrada !== 'todas' ? (
                        <>Terapeuta: <span className="font-semibold">{reporteGenerado.terapeutaFiltrada}</span> | </>
                      ) : (
                        <>Todas las terapeutas | </>
                      )}
                      Total: {reporteGenerado.totalGeneral.toFixed(2)} horas | {reporteGenerado.totalCitasGeneral} citas
                    </p>
                  </div>
                  <button
                    onClick={descargarReporte}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download size={18} />
                    Descargar
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {reporteGenerado.terapeutas.map((terapeuta, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">{terapeuta.nombre}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            <div>
                              <p className="text-xs text-gray-500">Total Horas</p>
                              <p className="text-xl font-bold text-blue-600">{terapeuta.totalHoras.toFixed(2)}h</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Total Citas</p>
                              <p className="text-xl font-bold text-green-600">{terapeuta.totalCitas}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Clientes</p>
                              <p className="text-xl font-bold text-purple-600">{terapeuta.totalClientes}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Promedio/Día</p>
                              <p className="text-xl font-bold text-orange-600">{terapeuta.promedioDiario.toFixed(2)}h</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desglose por día */}
                      <div className="mt-4">
                        <h5 className="font-semibold text-gray-700 mb-2">Desglose Diario:</h5>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {terapeuta.detallesPorDia.map((dia, idx) => (
                            <div key={idx} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-800">{dia.fecha}</span>
                                <span className="text-blue-600 font-bold">{dia.horas.toFixed(2)}h</span>
                              </div>
                              <div className="space-y-1">
                                {dia.citas.map((cita, citaIdx) => (
                                  <div key={citaIdx} className="text-sm text-gray-600 pl-4">
                                    • {cita.cliente}: {cita.horaInicio} - {cita.horaFin} ({cita.duracion.toFixed(2)}h)
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!reporteGenerado && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">Selecciona un mes y genera el reporte</p>
                <p className="text-gray-400 mt-2">
                  El reporte mostrará las horas trabajadas por cada terapeuta basado en citas completadas
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <button onClick={guardarCitas} disabled={loadingCitas} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400">
                    <Save size={20} />{loadingCitas ? 'Guardando...' : `Guardar ${citasGeneradas.length} Citas`}
                  </button>
                </div>
              )}
            </div>
          )}


          {activeTab === 'citas' && hasPermission('citas') && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Citas Programadas</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVistaCalendario('lista')}
                    className={`px-4 py-2 rounded-lg transition-all ${vistaCalendario === 'lista' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => setVistaCalendario('calendario')}
                    className={`px-4 py-2 rounded-lg transition-all ${vistaCalendario === 'calendario' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Calendario
                  </button>
                </div>
              </div>

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
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-24 p-2 border rounded-lg ${
                            !fecha ? 'bg-gray-50' : 
                            isToday ? 'bg-blue-50 border-blue-500' : 
                            'bg-white hover:bg-gray-50'
                          } transition-all`}
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
                                    className={`text-xs p-1 rounded cursor-pointer ${
                                      cita.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                      cita.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                                      cita.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}
                                    onClick={() => openModal('cita', cita)}
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
              <button onClick={() => openModal('terapeuta')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><Plus className="w-4 h-4 mr-2" />Nuevo</button>
            </div>
            <div className="bg-white shadow rounded-md"><ul className="divide-y">{terapeutas.map(t => (<li key={t.id} className="px-6 py-4"><div className="flex justify-between items-center"><div><p className="font-medium">{t.nombre}</p><p className="text-sm text-gray-600">{t.especialidad}</p></div><div className="flex gap-2"><button onClick={() => openModal('terapeuta', t)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button><button onClick={() => eliminarTerapeuta(t.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button></div></div></li>))}</ul></div>
          </div>
        )}

        {activeTab === 'clientes' && hasPermission('clientes') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Clientes</h2>
              <button onClick={() => openModal('cliente')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><Plus className="w-4 h-4 mr-2" />Nuevo</button>
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
    </div>
  );
};

export default SistemaGestion;