// src/components/configuracion/AsignacionesServicio.jsx
//
// Componente para administrar las asignaciones Cliente + Terapeuta → Servicio
// Permite crear, editar, eliminar y ver asignaciones con precios personalizados
//

import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Upload,
  Download,
  Users,
  DollarSign,
  Clock,
  MapPin,
  AlertCircle,
  Check,
  Filter,
  FileSpreadsheet,
  Loader
} from 'lucide-react';
import * as XLSX from 'xlsx';

const AsignacionesServicio = ({ 
  asignaciones = [],
  clientes = [],
  terapeutas = [],
  servicios = [],
  citas = [],
  onCrear,
  onActualizar,
  onEliminar,
  onImportar,
  onActualizarCita
}) => {
  // Estados
  const [busqueda, setBusqueda] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroTerapeuta, setFiltroTerapeuta] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [mostrarModalAplicar, setMostrarModalAplicar] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [datosImportar, setDatosImportar] = useState([]);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [citasParaActualizar, setCitasParaActualizar] = useState([]);
  const [resultadoAplicacion, setResultadoAplicacion] = useState(null);
  const fileInputRef = useRef(null);
  
  // Formulario
  const [formulario, setFormulario] = useState({
    clienteId: '',
    clienteNombre: '',
    terapeutaId: '',
    terapeutaNombre: '',
    servicioId: '',
    servicioNombre: '',
    precioCliente: '',
    pagoTerapeuta: '',
    condicionTipo: 'siempre',
    horaInicio: '',
    horaFin: '',
    ubicacion: '',
    notas: ''
  });

  // Filtrar asignaciones activas
  const asignacionesActivas = useMemo(() => {
    return asignaciones.filter(a => a.activo !== false);
  }, [asignaciones]);

  // Asignaciones filtradas
  const asignacionesFiltradas = useMemo(() => {
    return asignacionesActivas.filter(asig => {
      const matchBusqueda = !busqueda || 
        asig.clienteNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        asig.terapeutaNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        asig.servicioNombre?.toLowerCase().includes(busqueda.toLowerCase());
      
      const matchCliente = !filtroCliente || asig.clienteNombre === filtroCliente;
      const matchTerapeuta = !filtroTerapeuta || asig.terapeutaNombre === filtroTerapeuta;
      
      return matchBusqueda && matchCliente && matchTerapeuta;
    });
  }, [asignacionesActivas, busqueda, filtroCliente, filtroTerapeuta]);

  // Agrupar por cliente para mejor visualización
  const asignacionesPorCliente = useMemo(() => {
    const grupos = {};
    asignacionesFiltradas.forEach(asig => {
      const cliente = asig.clienteNombre || 'Sin cliente';
      if (!grupos[cliente]) {
        grupos[cliente] = [];
      }
      grupos[cliente].push(asig);
    });
    return grupos;
  }, [asignacionesFiltradas]);

  // Clientes únicos para filtro
  const clientesUnicos = useMemo(() => {
    return [...new Set(asignacionesActivas.map(a => a.clienteNombre).filter(Boolean))].sort();
  }, [asignacionesActivas]);

  // Terapeutas únicos para filtro
  const terapeutasUnicos = useMemo(() => {
    return [...new Set(asignacionesActivas.map(a => a.terapeutaNombre).filter(Boolean))].sort();
  }, [asignacionesActivas]);

  // Mostrar mensaje temporal
  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  // Abrir modal para nueva asignación
  const nuevaAsignacion = () => {
    setFormulario({
      clienteId: '',
      clienteNombre: '',
      terapeutaId: '',
      terapeutaNombre: '',
      servicioId: '',
      servicioNombre: '',
      precioCliente: '',
      pagoTerapeuta: '',
      condicionTipo: 'siempre',
      horaInicio: '',
      horaFin: '',
      ubicacion: '',
      notas: ''
    });
    setEditando(null);
    setMostrarModal(true);
  };

  // Abrir modal para editar
  const editarAsignacion = (asig) => {
    setFormulario({
      clienteId: asig.clienteId || '',
      clienteNombre: asig.clienteNombre || '',
      terapeutaId: asig.terapeutaId || '',
      terapeutaNombre: asig.terapeutaNombre || '',
      servicioId: asig.servicioId || '',
      servicioNombre: asig.servicioNombre || '',
      precioCliente: asig.precioCliente?.toString() || '',
      pagoTerapeuta: asig.pagoTerapeuta?.toString() || '',
      condicionTipo: asig.condicion?.tipo || 'siempre',
      horaInicio: asig.condicion?.horaInicio || '',
      horaFin: asig.condicion?.horaFin || '',
      ubicacion: asig.condicion?.ubicacion || '',
      notas: asig.notas || ''
    });
    setEditando(asig.id);
    setMostrarModal(true);
  };

  // Manejar cambio de cliente en formulario
  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const cliente = clientes.find(c => c.id === clienteId);
    setFormulario(prev => ({
      ...prev,
      clienteId,
      clienteNombre: cliente?.nombre || ''
    }));
  };

  // Manejar cambio de terapeuta en formulario
  const handleTerapeutaChange = (e) => {
    const terapeutaId = e.target.value;
    const terapeuta = terapeutas.find(t => t.id === terapeutaId);
    setFormulario(prev => ({
      ...prev,
      terapeutaId,
      terapeutaNombre: terapeuta?.nombre || ''
    }));
  };

  // Manejar cambio de servicio en formulario
  const handleServicioChange = (e) => {
    const servicioId = e.target.value;
    const servicio = servicios.find(s => s.id === servicioId);
    setFormulario(prev => ({
      ...prev,
      servicioId,
      servicioNombre: servicio?.nombre || '',
      // Auto-llenar precio base si existe
      precioCliente: prev.precioCliente || servicio?.precioBase?.toString() || ''
    }));
  };

  // Guardar asignación
  const handleGuardar = async () => {
    // Validaciones
    if (!formulario.clienteNombre) {
      mostrarMensaje('Selecciona un cliente', 'error');
      return;
    }
    if (!formulario.terapeutaNombre) {
      mostrarMensaje('Selecciona una terapeuta', 'error');
      return;
    }
    if (!formulario.servicioNombre) {
      mostrarMensaje('Selecciona un servicio', 'error');
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        clienteId: formulario.clienteId,
        clienteNombre: formulario.clienteNombre,
        terapeutaId: formulario.terapeutaId,
        terapeutaNombre: formulario.terapeutaNombre,
        servicioId: formulario.servicioId,
        servicioNombre: formulario.servicioNombre,
        precioCliente: parseFloat(formulario.precioCliente) || 0,
        pagoTerapeuta: parseFloat(formulario.pagoTerapeuta) || 0,
        condicion: {
          tipo: formulario.condicionTipo,
          horaInicio: formulario.horaInicio || null,
          horaFin: formulario.horaFin || null,
          ubicacion: formulario.ubicacion || null
        },
        notas: formulario.notas
      };

      if (editando) {
        await onActualizar(editando, datos);
        mostrarMensaje('Asignación actualizada correctamente');
      } else {
        await onCrear(datos);
        mostrarMensaje('Asignación creada correctamente');
      }

      setMostrarModal(false);
    } catch (error) {
      mostrarMensaje('Error al guardar: ' + error.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar asignación
  const handleEliminar = async (asigId) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return;

    try {
      await onEliminar(asigId);
      mostrarMensaje('Asignación eliminada');
    } catch (error) {
      mostrarMensaje('Error al eliminar: ' + error.message, 'error');
    }
  };

  // Manejar selección de archivo Excel
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Procesar datos
        const datosProcesados = data.map((row, index) => ({
          id: index,
          clienteNombre: row.Cliente || '',
          terapeutaNombre: row.Terapeuta || '',
          servicioNombre: row.Servicio || '',
          precioCliente: parseFloat(row.PrecioCliente) || 0,
          pagoTerapeuta: parseFloat(row.PagoTerapeuta) || 0,
          tipoHorario: row.TipoHorario || 'Fijo',
          horaInicio: row.HoraInicio || '',
          horaFin: row.HoraFin || '',
          ubicacion: row.Ubicacion || '',
          notas: row.Notas || '',
          seleccionado: true
        }));

        setDatosImportar(datosProcesados);
        setMostrarModalImportar(true);
        setResultadoImportacion(null);
      } catch (error) {
        mostrarMensaje('Error al leer el archivo: ' + error.message, 'error');
      }
    };
    reader.readAsBinaryString(file);
    
    // Limpiar input para permitir seleccionar el mismo archivo
    e.target.value = '';
  };

  // Toggle selección de fila para importar
  const toggleSeleccion = (id) => {
    setDatosImportar(prev => prev.map(item => 
      item.id === id ? { ...item, seleccionado: !item.seleccionado } : item
    ));
  };

  // Seleccionar/deseleccionar todos
  const toggleTodos = () => {
    const todosSeleccionados = datosImportar.every(d => d.seleccionado);
    setDatosImportar(prev => prev.map(item => ({ ...item, seleccionado: !todosSeleccionados })));
  };

  // Ejecutar importación
  const ejecutarImportacion = async () => {
    const seleccionados = datosImportar.filter(d => d.seleccionado);
    if (seleccionados.length === 0) {
      mostrarMensaje('Selecciona al menos una asignación para importar', 'error');
      return;
    }

    setImportando(true);
    setResultadoImportacion(null);

    try {
      let exitosos = 0;
      let fallidos = 0;
      const errores = [];

      for (const item of seleccionados) {
        try {
          await onCrear({
            clienteId: null,
            clienteNombre: item.clienteNombre,
            terapeutaId: null,
            terapeutaNombre: item.terapeutaNombre,
            servicioId: null,
            servicioNombre: item.servicioNombre,
            precioCliente: item.precioCliente,
            pagoTerapeuta: item.pagoTerapeuta,
            condicion: {
              tipo: item.tipoHorario === 'Fijo' ? 'siempre' : 'horario',
              horaInicio: item.horaInicio || null,
              horaFin: item.horaFin || null,
              ubicacion: item.ubicacion || null
            },
            notas: item.notas
          });
          exitosos++;
        } catch (err) {
          fallidos++;
          errores.push(`${item.clienteNombre} + ${item.terapeutaNombre}: ${err.message}`);
        }
      }

      setResultadoImportacion({ exitosos, fallidos, errores });
      
      if (exitosos > 0) {
        mostrarMensaje(`${exitosos} asignaciones importadas correctamente`);
      }
    } catch (error) {
      mostrarMensaje('Error en la importación: ' + error.message, 'error');
    } finally {
      setImportando(false);
    }
  };

  // Meses disponibles
  const mesesDisponibles = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  // Años disponibles (últimos 3 años)
  const aniosDisponibles = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2
  ];

  // Buscar asignación para una cita
  const buscarAsignacionParaCita = (cita) => {
    // Normalizar nombres para comparación
    const normalizar = (str) => (str || '').toLowerCase().trim();
    
    // Comparar nombres de forma flexible (uno contiene al otro)
    const nombresCoinciden = (nombre1, nombre2) => {
      const n1 = normalizar(nombre1);
      const n2 = normalizar(nombre2);
      if (!n1 || !n2) return false;
      
      // Comparación exacta
      if (n1 === n2) return true;
      
      // Uno contiene al otro
      if (n1.includes(n2) || n2.includes(n1)) return true;
      
      // Comparar solo primer nombre
      const primerNombre1 = n1.split(' ')[0];
      const primerNombre2 = n2.split(' ')[0];
      if (primerNombre1 === primerNombre2 && primerNombre1.length > 2) return true;
      
      return false;
    };
    
    const asignacionesCoincidentes = asignacionesActivas.filter(asig => {
      const matchCliente = nombresCoinciden(asig.clienteNombre, cita.cliente);
      const matchTerapeuta = nombresCoinciden(asig.terapeutaNombre, cita.terapeuta);
      return matchCliente && matchTerapeuta;
    });

    if (asignacionesCoincidentes.length === 0) return null;
    if (asignacionesCoincidentes.length === 1) return asignacionesCoincidentes[0];

    // Si hay múltiples, intentar filtrar por horario
    const horaInicioCita = cita.horaInicio || cita.hora;
    if (horaInicioCita) {
      const horaNum = parseInt(horaInicioCita.split(':')[0]);
      
      for (const asig of asignacionesCoincidentes) {
        if (asig.condicion?.tipo === 'horario' && asig.condicion.horaInicio && asig.condicion.horaFin) {
          const inicioNum = parseInt(asig.condicion.horaInicio.split(':')[0]);
          const finNum = parseInt(asig.condicion.horaFin.split(':')[0]);
          
          if (horaNum >= inicioNum && horaNum < finNum) {
            return asig;
          }
        }
      }
    }

    // Retornar la primera que tenga condición "siempre" o la primera disponible
    return asignacionesCoincidentes.find(a => !a.condicion?.tipo || a.condicion.tipo === 'siempre') 
      || asignacionesCoincidentes[0];
  };

  // Buscar citas del período seleccionado y compararlas con asignaciones
  const buscarCitasParaActualizar = () => {
    if (!mesSeleccionado) {
      mostrarMensaje('Selecciona un mes', 'error');
      return;
    }

    const citasDelMes = citas.filter(cita => {
      if (!cita.fecha) return false;
      
      // Extraer mes y año directamente del string "YYYY-MM-DD"
      const partes = cita.fecha.split('-');
      if (partes.length < 2) return false;
      
      const anioCita = parseInt(partes[0]);
      const mesCita = partes[1]; // Ya viene como "01", "02", etc.
      
      return mesCita === mesSeleccionado && anioCita === anioSeleccionado;
    });

    const citasConCambios = [];

    citasDelMes.forEach(cita => {
      const asignacion = buscarAsignacionParaCita(cita);
      
      if (asignacion) {
        // Verificar si hay diferencias
        const servicioActual = cita.servicio || cita.tipoServicio || '';
        const precioActual = parseFloat(cita.precioHora || cita.precio || 0);
        const pagoActual = parseFloat(cita.costoTerapeuta || cita.pagoTerapeuta || 0);

        const servicioCambia = servicioActual !== asignacion.servicioNombre;
        const precioCambia = precioActual !== asignacion.precioCliente;
        const pagoCambia = pagoActual !== asignacion.pagoTerapeuta;

        if (servicioCambia || precioCambia || pagoCambia) {
          citasConCambios.push({
            cita,
            asignacion,
            cambios: {
              servicio: servicioCambia ? { de: servicioActual, a: asignacion.servicioNombre } : null,
              precio: precioCambia ? { de: precioActual, a: asignacion.precioCliente } : null,
              pago: pagoCambia ? { de: pagoActual, a: asignacion.pagoTerapeuta } : null
            },
            seleccionado: true
          });
        }
      }
    });

    setCitasParaActualizar(citasConCambios);
    
    if (citasDelMes.length === 0) {
      mostrarMensaje(`No hay citas en ${mesesDisponibles.find(m => m.value === mesSeleccionado)?.label} ${anioSeleccionado}`, 'error');
    } else if (citasConCambios.length === 0) {
      mostrarMensaje('Las citas del mes ya tienen las asignaciones correctas o no tienen asignaciones configuradas', 'error');
    }
  };

  // Toggle selección de cita para actualizar
  const toggleSeleccionCita = (index) => {
    setCitasParaActualizar(prev => prev.map((item, i) => 
      i === index ? { ...item, seleccionado: !item.seleccionado } : item
    ));
  };

  // Seleccionar/deseleccionar todas las citas
  const toggleTodasCitas = () => {
    const todasSeleccionadas = citasParaActualizar.every(c => c.seleccionado);
    setCitasParaActualizar(prev => prev.map(item => ({ ...item, seleccionado: !todasSeleccionadas })));
  };

  // Aplicar cambios a las citas seleccionadas
  const aplicarCambios = async () => {
    const seleccionadas = citasParaActualizar.filter(c => c.seleccionado);
    if (seleccionadas.length === 0) {
      mostrarMensaje('Selecciona al menos una cita para actualizar', 'error');
      return;
    }

    setAplicando(true);
    setResultadoAplicacion(null);

    try {
      let exitosos = 0;
      let fallidos = 0;
      const errores = [];

      for (const item of seleccionadas) {
        try {
          const datosActualizados = {
            servicio: item.asignacion.servicioNombre,
            tipoServicio: item.asignacion.servicioNombre,
            precioHora: item.asignacion.precioCliente,
            precio: item.asignacion.precioCliente,
            costoTerapeuta: item.asignacion.pagoTerapeuta,
            pagoTerapeuta: item.asignacion.pagoTerapeuta
          };

          await onActualizarCita(item.cita.id, datosActualizados);
          exitosos++;
        } catch (err) {
          fallidos++;
          errores.push(`${item.cita.cliente} - ${item.cita.fecha}: ${err.message}`);
        }
      }

      setResultadoAplicacion({ exitosos, fallidos, errores });
      
      if (exitosos > 0) {
        mostrarMensaje(`${exitosos} citas actualizadas correctamente`);
      }
    } catch (error) {
      mostrarMensaje('Error al aplicar cambios: ' + error.message, 'error');
    } finally {
      setAplicando(false);
    }
  };

  // Agrupar citas por cliente para mejor visualización
  const citasAgrupadasPorCliente = useMemo(() => {
    const grupos = {};
    citasParaActualizar.forEach((item, index) => {
      const cliente = item.cita.cliente || 'Sin cliente';
      if (!grupos[cliente]) {
        grupos[cliente] = [];
      }
      grupos[cliente].push({ ...item, index });
    });
    return grupos;
  }, [citasParaActualizar]);

  // Calcular ganancia
  const calcularGanancia = (precioCliente, pagoTerapeuta) => {
    const ganancia = (precioCliente || 0) - (pagoTerapeuta || 0);
    return ganancia;
  };

  return (
    <div className="space-y-6">
      {/* Mensaje de feedback */}
      {mensaje && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          mensaje.tipo === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {mensaje.tipo === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {mensaje.texto}
        </div>
      )}

      {/* Header con estadísticas */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Asignaciones de Servicio</h2>
            <p className="text-blue-100">
              Configura precios personalizados por Cliente + Terapeuta
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => {
                setMostrarModalAplicar(true);
                setCitasParaActualizar([]);
                setResultadoAplicacion(null);
                setMesSeleccionado('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
              title="Aplicar asignaciones a citas existentes"
            >
              <Clock size={20} />
              Aplicar a Citas
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
            >
              <Upload size={20} />
              Importar Excel
            </button>
            <button
              onClick={nuevaAsignacion}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              <Plus size={20} />
              Nueva Asignación
            </button>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{asignacionesActivas.length}</div>
            <div className="text-blue-100 text-sm">Asignaciones</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{clientesUnicos.length}</div>
            <div className="text-blue-100 text-sm">Clientes</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{terapeutasUnicos.length}</div>
            <div className="text-blue-100 text-sm">Terapeutas</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por cliente, terapeuta o servicio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Filtro por cliente */}
          <div className="w-48">
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los clientes</option>
              {clientesUnicos.map(cliente => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro por terapeuta */}
          <div className="w-48">
            <select
              value={filtroTerapeuta}
              onChange={(e) => setFiltroTerapeuta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las terapeutas</option>
              {terapeutasUnicos.map(terapeuta => (
                <option key={terapeuta} value={terapeuta}>{terapeuta}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de asignaciones agrupadas por cliente */}
      <div className="space-y-4">
        {Object.keys(asignacionesPorCliente).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No hay asignaciones configuradas
            </h3>
            <p className="text-gray-500 mb-4">
              Crea asignaciones para vincular clientes con terapeutas y precios específicos
            </p>
            <button
              onClick={nuevaAsignacion}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Crear primera asignación
            </button>
          </div>
        ) : (
          Object.entries(asignacionesPorCliente).sort().map(([cliente, asigs]) => (
            <div key={cliente} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header del cliente */}
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {cliente.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{cliente}</h3>
                  <p className="text-sm text-gray-500">{asigs.length} asignación(es)</p>
                </div>
              </div>
              
              {/* Tabla de asignaciones */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Terapeuta</th>
                      <th className="px-4 py-3 text-left">Servicio</th>
                      <th className="px-4 py-3 text-right">Precio Cliente</th>
                      <th className="px-4 py-3 text-right">Pago Terapeuta</th>
                      <th className="px-4 py-3 text-right">Ganancia</th>
                      <th className="px-4 py-3 text-center">Condición</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {asigs.map(asig => {
                      const ganancia = calcularGanancia(asig.precioCliente, asig.pagoTerapeuta);
                      return (
                        <tr key={asig.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800">
                              {asig.terapeutaNombre}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {asig.servicioNombre}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-800">
                            ${asig.precioCliente?.toLocaleString() || 0}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            ${asig.pagoTerapeuta?.toLocaleString() || 0}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${
                            ganancia >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {ganancia >= 0 ? '+' : ''}${ganancia.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {asig.condicion?.tipo === 'horario' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                                <Clock size={12} />
                                {asig.condicion.horaInicio}-{asig.condicion.horaFin}
                              </span>
                            ) : asig.condicion?.ubicacion ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                <MapPin size={12} />
                                {asig.condicion.ubicacion}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Siempre</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => editarAsignacion(asig)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleEliminar(asig.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de crear/editar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editando ? 'Editar Asignación' : 'Nueva Asignación'}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Formulario */}
            <div className="p-4 space-y-4">
              {/* Cliente y Terapeuta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={formulario.clienteId}
                    onChange={handleClienteChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terapeuta *
                  </label>
                  <select
                    value={formulario.terapeutaId}
                    onChange={handleTerapeutaChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar terapeuta...</option>
                    {terapeutas.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicio *
                </label>
                <select
                  value={formulario.servicioId}
                  onChange={handleServicioChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar servicio...</option>
                  {servicios.filter(s => s.activo !== false).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.precioBase ? `($${s.precioBase})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Precios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Cliente ($/hr)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      value={formulario.precioCliente}
                      onChange={(e) => setFormulario(prev => ({ ...prev, precioCliente: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pago Terapeuta ($/hr)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      value={formulario.pagoTerapeuta}
                      onChange={(e) => setFormulario(prev => ({ ...prev, pagoTerapeuta: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Preview de ganancia */}
              {(formulario.precioCliente || formulario.pagoTerapeuta) && (
                <div className={`p-3 rounded-lg ${
                  calcularGanancia(parseFloat(formulario.precioCliente), parseFloat(formulario.pagoTerapeuta)) >= 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Ganancia por hora:</span>
                    <span className={`font-bold ${
                      calcularGanancia(parseFloat(formulario.precioCliente), parseFloat(formulario.pagoTerapeuta)) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      ${calcularGanancia(parseFloat(formulario.precioCliente) || 0, parseFloat(formulario.pagoTerapeuta) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Condición */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condición de aplicación
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="condicion"
                      value="siempre"
                      checked={formulario.condicionTipo === 'siempre'}
                      onChange={(e) => setFormulario(prev => ({ ...prev, condicionTipo: e.target.value }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Siempre</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="condicion"
                      value="horario"
                      checked={formulario.condicionTipo === 'horario'}
                      onChange={(e) => setFormulario(prev => ({ ...prev, condicionTipo: e.target.value }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Por horario</span>
                  </label>
                </div>
                
                {formulario.condicionTipo === 'horario' && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Hora inicio</label>
                      <input
                        type="time"
                        value={formulario.horaInicio}
                        onChange={(e) => setFormulario(prev => ({ ...prev, horaInicio: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Hora fin</label>
                      <input
                        type="time"
                        value={formulario.horaFin}
                        onChange={(e) => setFormulario(prev => ({ ...prev, horaFin: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación (opcional)
                </label>
                <input
                  type="text"
                  value={formulario.ubicacion}
                  onChange={(e) => setFormulario(prev => ({ ...prev, ubicacion: e.target.value }))}
                  placeholder="Ej: Centro, Casa, Escuela Westhill..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={formulario.notas}
                  onChange={(e) => setFormulario(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Información adicional..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Footer del modal */}
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editando ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de importación */}
      {mostrarModalImportar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-green-600" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Importar Asignaciones desde Excel
                  </h3>
                  <p className="text-sm text-gray-500">
                    {datosImportar.length} registros encontrados
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMostrarModalImportar(false);
                  setDatosImportar([]);
                  setResultadoImportacion(null);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Resultado de importación */}
            {resultadoImportacion && (
              <div className={`mx-4 mt-4 p-4 rounded-lg ${
                resultadoImportacion.fallidos > 0 
                  ? 'bg-amber-50 border border-amber-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check size={20} />
                    <span className="font-medium">{resultadoImportacion.exitosos} importados</span>
                  </div>
                  {resultadoImportacion.fallidos > 0 && (
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle size={20} />
                      <span className="font-medium">{resultadoImportacion.fallidos} fallidos</span>
                    </div>
                  )}
                </div>
                {resultadoImportacion.errores.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    {resultadoImportacion.errores.slice(0, 3).map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                    {resultadoImportacion.errores.length > 3 && (
                      <div>... y {resultadoImportacion.errores.length - 3} más</div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Tabla de preview */}
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={datosImportar.every(d => d.seleccionado)}
                        onChange={toggleTodos}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">Cliente</th>
                    <th className="px-3 py-2 text-left">Terapeuta</th>
                    <th className="px-3 py-2 text-left">Servicio</th>
                    <th className="px-3 py-2 text-right">Precio Cliente</th>
                    <th className="px-3 py-2 text-right">Pago Terapeuta</th>
                    <th className="px-3 py-2 text-right">Ganancia</th>
                    <th className="px-3 py-2 text-center">Horario</th>
                    <th className="px-3 py-2 text-left">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {datosImportar.map((item) => {
                    const ganancia = item.precioCliente - item.pagoTerapeuta;
                    return (
                      <tr 
                        key={item.id} 
                        className={`${item.seleccionado ? 'bg-blue-50' : 'bg-gray-50 opacity-60'}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={item.seleccionado}
                            onChange={() => toggleSeleccion(item.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{item.clienteNombre}</td>
                        <td className="px-3 py-2">{item.terapeutaNombre}</td>
                        <td className="px-3 py-2 text-gray-600">{item.servicioNombre}</td>
                        <td className="px-3 py-2 text-right">${item.precioCliente.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">${item.pagoTerapeuta.toLocaleString()}</td>
                        <td className={`px-3 py-2 text-right font-medium ${
                          ganancia >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {ganancia >= 0 ? '+' : ''}${ganancia.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-500">
                          {item.horaInicio && item.horaFin 
                            ? `${item.horaInicio}-${item.horaFin}` 
                            : '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{item.ubicacion || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Footer del modal */}
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                {datosImportar.filter(d => d.seleccionado).length} de {datosImportar.length} seleccionados
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMostrarModalImportar(false);
                    setDatosImportar([]);
                    setResultadoImportacion(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {resultadoImportacion ? 'Cerrar' : 'Cancelar'}
                </button>
                {!resultadoImportacion && (
                  <button
                    onClick={ejecutarImportacion}
                    disabled={importando || datosImportar.filter(d => d.seleccionado).length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                  >
                    {importando ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Importar {datosImportar.filter(d => d.seleccionado).length} asignaciones
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aplicar a Citas Existentes */}
      {mostrarModalAplicar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <div className="flex items-center gap-3">
                <Clock size={24} />
                <div>
                  <h3 className="text-lg font-semibold">
                    Aplicar Asignaciones a Citas Existentes
                  </h3>
                  <p className="text-amber-100 text-sm">
                    Actualiza servicios y precios de citas pasadas
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMostrarModalAplicar(false);
                  setCitasParaActualizar([]);
                  setResultadoAplicacion(null);
                }}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Selector de período */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                  <select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 w-40"
                  >
                    <option value="">Seleccionar...</option>
                    {mesesDisponibles.map(mes => (
                      <option key={mes.value} value={mes.value}>{mes.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <select
                    value={anioSeleccionado}
                    onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 w-28"
                  >
                    {aniosDisponibles.map(anio => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={buscarCitasParaActualizar}
                  disabled={!mesSeleccionado}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Search size={18} />
                  Buscar Citas
                </button>
              </div>
            </div>

            {/* Resultado de aplicación */}
            {resultadoAplicacion && (
              <div className={`mx-4 mt-4 p-4 rounded-lg ${
                resultadoAplicacion.fallidos > 0 
                  ? 'bg-amber-50 border border-amber-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check size={20} />
                    <span className="font-medium">{resultadoAplicacion.exitosos} citas actualizadas</span>
                  </div>
                  {resultadoAplicacion.fallidos > 0 && (
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle size={20} />
                      <span className="font-medium">{resultadoAplicacion.fallidos} fallidas</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Lista de citas a actualizar */}
            <div className="flex-1 overflow-auto p-4">
              {citasParaActualizar.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="mx-auto mb-4 text-gray-300" size={48} />
                  <p>Selecciona un período y haz clic en "Buscar Citas"</p>
                  <p className="text-sm mt-2">Se mostrarán las citas que tienen asignaciones configuradas y necesitan actualización</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-blue-800">
                          {citasParaActualizar.length} citas encontradas con cambios pendientes
                        </span>
                        <p className="text-sm text-blue-600 mt-1">
                          En {Object.keys(citasAgrupadasPorCliente).length} clientes diferentes
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={citasParaActualizar.every(c => c.seleccionado)}
                          onChange={toggleTodasCitas}
                          className="rounded text-amber-500"
                        />
                        <span className="text-sm text-blue-700">Seleccionar todas</span>
                      </label>
                    </div>
                  </div>

                  {/* Tabla agrupada por cliente */}
                  {Object.entries(citasAgrupadasPorCliente).sort().map(([cliente, items]) => (
                    <div key={cliente} className="bg-white border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 font-medium text-gray-700 flex items-center gap-2">
                        <Users size={16} />
                        {cliente}
                        <span className="text-gray-400 font-normal">({items.length} citas)</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-3 py-2 w-10"></th>
                            <th className="px-3 py-2 text-left">Fecha</th>
                            <th className="px-3 py-2 text-left">Terapeuta</th>
                            <th className="px-3 py-2 text-left">Servicio</th>
                            <th className="px-3 py-2 text-right">Precio Cliente</th>
                            <th className="px-3 py-2 text-right">Pago Terapeuta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {items.map((item) => (
                            <tr 
                              key={item.index}
                              className={item.seleccionado ? 'bg-amber-50' : 'bg-gray-50 opacity-60'}
                            >
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={item.seleccionado}
                                  onChange={() => toggleSeleccionCita(item.index)}
                                  className="rounded text-amber-500"
                                />
                              </td>
                              <td className="px-3 py-2 font-medium">
                                {item.cita.fecha ? new Date(item.cita.fecha).toLocaleDateString('es-MX') : '-'}
                              </td>
                              <td className="px-3 py-2">{item.cita.terapeuta}</td>
                              <td className="px-3 py-2">
                                {item.cambios.servicio ? (
                                  <div>
                                    <span className="line-through text-gray-400">{item.cambios.servicio.de || 'Sin servicio'}</span>
                                    <span className="mx-1">→</span>
                                    <span className="text-green-600 font-medium">{item.cambios.servicio.a}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">{item.asignacion.servicioNombre}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.cambios.precio ? (
                                  <div>
                                    <span className="line-through text-gray-400">${item.cambios.precio.de}</span>
                                    <span className="mx-1">→</span>
                                    <span className="text-green-600 font-medium">${item.cambios.precio.a}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">${item.asignacion.precioCliente}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.cambios.pago ? (
                                  <div>
                                    <span className="line-through text-gray-400">${item.cambios.pago.de}</span>
                                    <span className="mx-1">→</span>
                                    <span className="text-green-600 font-medium">${item.cambios.pago.a}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">${item.asignacion.pagoTerapeuta}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer del modal */}
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                {citasParaActualizar.filter(c => c.seleccionado).length} de {citasParaActualizar.length} citas seleccionadas
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMostrarModalAplicar(false);
                    setCitasParaActualizar([]);
                    setResultadoAplicacion(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {resultadoAplicacion ? 'Cerrar' : 'Cancelar'}
                </button>
                {!resultadoAplicacion && citasParaActualizar.length > 0 && (
                  <button
                    onClick={aplicarCambios}
                    disabled={aplicando || citasParaActualizar.filter(c => c.seleccionado).length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300"
                  >
                    {aplicando ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Aplicar cambios a {citasParaActualizar.filter(c => c.seleccionado).length} citas
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsignacionesServicio;
