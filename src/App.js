import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Plus, Clock, LogOut, Lock, Edit, Calendar, Trash2, Save, Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle, FileText, Download, Upload } from 'lucide-react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, writeBatch, query, orderBy, where, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import mammoth from 'mammoth';

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
  const [citaForm, setCitaForm] = useState({ terapeuta: '', cliente: '', fecha: '', horaInicio: '', horaFin: '', estado: 'pendiente', costoPorHora: 300, costoTotal: 0 });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Agrupar por cliente para generar recibos individuales
    const reportePorCliente = {};
    
    citasDelMes.forEach(cita => {
      if (!reportePorCliente[cita.cliente]) {
        // Buscar código del cliente
        const clienteObj = clientes.find(c => c.nombre === cita.cliente);
        reportePorCliente[cita.cliente] = {
          nombre: cita.cliente,
          codigo: clienteObj?.codigo || 'N/A',
          citas: [],
          totalHoras: 0,
          totalCitas: 0
        };
      }
      
      const inicio = new Date(`2000-01-01T${cita.horaInicio}`);
      const fin = new Date(`2000-01-01T${cita.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      
      // Usar el costo real de la cita
      const costoReal = cita.costoTotal || (cita.costoPorHora * duracionHoras) || 0;
      const iva = costoReal * 0.16;
      const totalConIva = costoReal + iva;

      reportePorCliente[cita.cliente].citas.push({
        fecha: cita.fecha,
        terapeuta: cita.terapeuta,
        horaInicio: cita.horaInicio,
        horaFin: cita.horaFin,
        duracion: duracionHoras,
        precio: costoReal,
        iva: iva,
        total: totalConIva
      });
      
      reportePorCliente[cita.cliente].totalHoras += duracionHoras;
      reportePorCliente[cita.cliente].totalCitas += 1;
    });

    // Convertir a array y ordenar citas por fecha
    const recibos = Object.values(reportePorCliente).map(cliente => {
      const citasOrdenadas = cliente.citas.sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
      );
      
      const totalPrecio = citasOrdenadas.reduce((sum, c) => sum + c.precio, 0);
      const totalIva = citasOrdenadas.reduce((sum, c) => sum + c.iva, 0);
      const totalGeneral = citasOrdenadas.reduce((sum, c) => sum + c.total, 0);
      
      return {
        ...cliente,
        citas: citasOrdenadas,
        totalPrecio,
        totalIva,
        totalGeneral
      };
    });

    setReporteGenerado({
      mes: mesReporte,
      nombreMes: `${meses[parseInt(month) - 1]} ${year}`,
      recibos: recibos,
      terapeutaFiltrada: terapeutaReporte,
      totalCitasGeneral: citasDelMes.length,
      totalHorasGeneral: recibos.reduce((sum, r) => sum + r.totalHoras, 0),
      totalIngresos: recibos.reduce((sum, r) => sum + r.totalGeneral, 0)
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
            estado: item.estado,
            costoPorHora: item.costoPorHora || 300,
            costoTotal: item.costoTotal || 0
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
    setTerapeutaForm({ nombre: '', especialidad: '', telefono: '', email: '' });
    setClienteForm({ nombre: '', email: '', telefono: '', empresa: '', codigo: '' });
    setPagoForm({ clienteId: '', monto: '', concepto: '', metodo: 'efectivo', fecha: '' });
    setCitaForm({ terapeuta: '', cliente: '', fecha: '', horaInicio: '', horaFin: '', estado: 'pendiente', costoPorHora: 300, costoTotal: 0 });
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
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Fecha de sesión</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Duración</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Terapeuta</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Precio de la sesión</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">IVA</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
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
                              <td className="px-4 py-3 text-sm text-gray-900">{cita.terapeuta}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{cita.precio.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{cita.iva.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{cita.total.toFixed(2)}</td>
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
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              Suma {recibo.totalPrecio.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              Suma {Math.round(recibo.totalIva.toFixed(2))}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                              Suma {Math.round(recibo.totalGeneral.toFixed(2))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Resumen General */}
                {reporteGenerado.recibos.length > 1 && (
                  <div className="bg-blue-50 rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen General</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Citas</p>
                        <p className="text-2xl font-bold text-blue-600">{reporteGenerado.totalCitasGeneral}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Horas</p>
                        <p className="text-2xl font-bold text-green-600">{reporteGenerado.totalHorasGeneral.toFixed(2)}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Ingresos</p>
                        <p className="text-2xl font-bold text-purple-600">${reporteGenerado.totalIngresos.toFixed(2)}</p>
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
              {<div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Citas Programadas</h2>
                <div className="flex gap-2">
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
                                    onClick={(e) => {
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

              {/* Campos de Costo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo por hora ($)
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo total ($)
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
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? 'Editar Terapeuta' : 'Nueva Terapeuta'}
            </h3>
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
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
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