import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Calendar,
  Clock,
  User,
  DollarSign,
  Gift,
  FileText,
  CheckCircle
} from 'lucide-react';

/**
 * Componente de Recibos con interfaz estilo Gemini
 * Muestra una lista de clientes en sidebar y detalles del cliente seleccionado
 * Permite agregar, editar y eliminar citas
 */
const RecibosGemini = ({ 
  citas, 
  clientes,
  terapeutas = [],
  servicios = [],
  recibos = [],
  meses,
  onAgregarCita,
  onEditarCita,
  onEliminarCita,
  onGenerarRecibo
}) => {
  // Estados
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7));
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [vistaLista, setVistaLista] = useState(true);
  
  // Estados para modal de cita
  const [mostrarModalCita, setMostrarModalCita] = useState(false);
  const [citaEditando, setCitaEditando] = useState(null);
  const [citaForm, setCitaForm] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    terapeuta: '',
    tipoTerapia: 'Sesión de ABA estándar',
    costoPorHora: 450,
    estado: 'completada',
    cortesia: false
  });
  const [guardando, setGuardando] = useState(false);

  // Estados para confirmación de eliminación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [citaAEliminar, setCitaAEliminar] = useState(null);

  // Estados para modal de generar recibo
  const [mostrarModalRecibo, setMostrarModalRecibo] = useState(false);
  const [numeroRecibo, setNumeroRecibo] = useState('');
  const [generandoRecibo, setGenerandoRecibo] = useState(false);

  // Tipos de terapia desde servicios (prop) con fallback
  const tiposTerapia = useMemo(() => {
    if (servicios.length === 0) {
      // Fallback mientras cargan los servicios
      return [
        { nombre: 'Sesión de ABA estándar', precio: 450 },
        { nombre: 'Sesión de ABA precio especial', precio: 900 },
        { nombre: 'Sesión en casa', precio: 640 },
        { nombre: 'Servicios de Sombra', precio: 150 },
        { nombre: 'Terapia Ocupacional', precio: 950 },
        { nombre: 'Servicios Administrativos y Reportes', precio: 1200 },
        { nombre: 'Servicios de Apoyo y Entrenamiento', precio: 1200 },
        { nombre: 'Paquete 4hr/semana', precio: 274 },
        { nombre: 'Evaluación', precio: 450 },
        { nombre: 'Consulta', precio: 450 },
        { nombre: 'Otro', precio: 450 }
      ];
    }
    return servicios
      .filter(s => s.activo !== false)
      .sort((a, b) => (a.orden || 99) - (b.orden || 99))
      .map(s => ({ nombre: s.nombre, precio: s.precio }));
  }, [servicios]);

  /**
   * Maneja el cambio de tipo de terapia y actualiza el precio
   */
  const handleTipoTerapiaChange = (tipoNombre) => {
    const tipoSeleccionado = tiposTerapia.find(t => t.nombre === tipoNombre);
    setCitaForm({ 
      ...citaForm, 
      tipoTerapia: tipoNombre,
      costoPorHora: tipoSeleccionado?.precio || 450
    });
  };

  /**
   * Navegar al mes anterior
   */
  const mesAnterior = () => {
    const [year, month] = mesSeleccionado.split('-').map(Number);
    let nuevoMes = month - 1;
    let nuevoYear = year;
    
    if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoYear = year - 1;
    }
    
    setMesSeleccionado(`${nuevoYear}-${String(nuevoMes).padStart(2, '0')}`);
    setClienteSeleccionado(null);
  };

  /**
   * Navegar al mes siguiente
   */
  const mesSiguiente = () => {
    const [year, month] = mesSeleccionado.split('-').map(Number);
    let nuevoMes = month + 1;
    let nuevoYear = year;
    
    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoYear = year + 1;
    }
    
    setMesSeleccionado(`${nuevoYear}-${String(nuevoMes).padStart(2, '0')}`);
    setClienteSeleccionado(null);
  };

  /**
   * Calcula duración en horas
   */
  const calcularDuracion = (inicio, fin) => {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
  };

  /**
   * Filtra las citas completadas del mes seleccionado
   */
  const citasDelMes = useMemo(() => {
    const [year, month] = mesSeleccionado.split('-');
    
    return citas.filter(cita => {
      if (cita.estado !== 'completada') return false;
      
      // Comparar directamente con el string de fecha para evitar timezone
      const [citaYear, citaMonth] = cita.fecha.split('-');
      if (citaYear !== year) return false;
      if (citaMonth !== month) return false;
      
      return true;
    });
  }, [citas, mesSeleccionado]);

  /**
   * Agrupa las citas por cliente
   */
  const clientesConCitas = useMemo(() => {
    const clientesMap = {};
    
    citasDelMes.forEach(cita => {
      if (!clientesMap[cita.cliente]) {
        const clienteObj = clientes.find(c => c.nombre === cita.cliente);
        clientesMap[cita.cliente] = {
          nombre: cita.cliente,
          codigo: clienteObj?.codigo || 'N/A',
          clienteId: clienteObj?.id || null,
          citas: [],
          totalHoras: 0,
          totalCitas: 0,
          totalPrecio: 0,
          totalIva: 0,
          totalGeneral: 0,
          // Totales de cortesías (para referencia)
          totalCortesias: 0,
          totalHorasCortesia: 0,
          totalPrecioCortesia: 0
        };
      }
      
      const duracion = calcularDuracion(cita.horaInicio, cita.horaFin);
      const precio = cita.costoTotal || (cita.costoPorHora * duracion) || 0;
      const iva = precio * 0.16;
      const total = precio + iva;
      const esCortesia = cita.cortesia === true;
      
      clientesMap[cita.cliente].citas.push({
        ...cita,
        duracion,
        precio,
        iva,
        total
      });
      
      // Solo sumar a totales facturables si NO es cortesía
      if (!esCortesia) {
        clientesMap[cita.cliente].totalHoras += duracion;
        clientesMap[cita.cliente].totalCitas += 1;
        clientesMap[cita.cliente].totalPrecio += precio;
        clientesMap[cita.cliente].totalIva += iva;
        clientesMap[cita.cliente].totalGeneral += total;
      } else {
        // Sumar a totales de cortesía (para referencia)
        clientesMap[cita.cliente].totalCortesias += 1;
        clientesMap[cita.cliente].totalHorasCortesia += duracion;
        clientesMap[cita.cliente].totalPrecioCortesia += precio;
      }
    });

    return Object.values(clientesMap).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
  }, [citasDelMes, clientes]);

  /**
   * Actualiza clienteSeleccionado cuando cambian las citas
   * Esto asegura que los datos se refresquen sin necesidad de reload
   */
  useEffect(() => {
    if (clienteSeleccionado && clientesConCitas.length > 0) {
      // Buscar el cliente actualizado en la nueva lista
      const clienteActualizado = clientesConCitas.find(
        c => c.nombre === clienteSeleccionado.nombre
      );
      
      if (clienteActualizado) {
        // Actualizar con los datos frescos
        setClienteSeleccionado(clienteActualizado);
      }
    }
  }, [clientesConCitas]); // Solo cuando cambian los clientes con citas

  /**
   * Filtra clientes por búsqueda
   */
  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente) return clientesConCitas;
    
    const busqueda = busquedaCliente.toLowerCase();
    return clientesConCitas.filter(cliente => 
      cliente.nombre.toLowerCase().includes(busqueda) ||
      cliente.codigo.toLowerCase().includes(busqueda)
    );
  }, [clientesConCitas, busquedaCliente]);

  /**
   * Selecciona el primer cliente automáticamente si hay clientes
   */
  useMemo(() => {
    if (clientesFiltrados.length > 0 && !clienteSeleccionado) {
      setClienteSeleccionado(clientesFiltrados[0]);
    }
  }, [clientesFiltrados, clienteSeleccionado]);

  /**
   * Formatea la fecha en español (evitando problemas de timezone)
   */
  const formatearFecha = (fecha) => {
    // Separar la fecha para evitar conversión de timezone
    const [year, month, day] = fecha.split('-');
    const date = new Date(year, month - 1, day); // Crear fecha local
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  /**
   * Obtiene el nombre del mes
   */
  const obtenerNombreMes = (mesISO) => {
    const [year, month] = mesISO.split('-');
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  /**
   * Calcula el siguiente número de recibo para el cliente
   * Formato: CODIGO-NUMERO (ej: 034-037)
   */
  const calcularSiguienteNumeroRecibo = (codigoCliente) => {
    // Buscar recibos del cliente
    const recibosCliente = recibos.filter(r => {
      const reciboId = r.reciboId || '';
      return reciboId.startsWith(codigoCliente + '-');
    });

    if (recibosCliente.length === 0) {
      // Primer recibo del cliente
      return '001';
    }

    // Encontrar el número más alto
    let maxNumero = 0;
    recibosCliente.forEach(r => {
      const reciboId = r.reciboId || '';
      const partes = reciboId.split('-');
      if (partes.length >= 2) {
        const numero = parseInt(partes[partes.length - 1]) || 0;
        if (numero > maxNumero) {
          maxNumero = numero;
        }
      }
    });

    // Incrementar y formatear con ceros
    const siguienteNumero = maxNumero + 1;
    return siguienteNumero.toString().padStart(3, '0');
  };

  /**
   * Abre el modal para generar recibo
   */
  const abrirModalGenerarRecibo = () => {
    if (!clienteSeleccionado || clienteSeleccionado.totalCitas === 0) {
      alert('No hay citas facturables para generar el recibo');
      return;
    }

    const codigo = clienteSeleccionado.codigo || '000';
    const siguienteNumero = calcularSiguienteNumeroRecibo(codigo);
    setNumeroRecibo(siguienteNumero);
    setMostrarModalRecibo(true);
  };

  /**
   * Genera y guarda el recibo
   */
  const generarRecibo = async () => {
    if (!clienteSeleccionado || !onGenerarRecibo) return;

    setGenerandoRecibo(true);

    try {
      const codigo = clienteSeleccionado.codigo || '000';
      const reciboId = `${codigo}-${numeroRecibo}`;
      
      // Obtener mes y año del mes seleccionado
      const [year, month] = mesSeleccionado.split('-');
      const mesNombre = meses[parseInt(month) - 1];

      // Filtrar solo citas NO cortesía para el recibo
      const citasFacturables = clienteSeleccionado.citas.filter(c => !c.cortesia);

      // Preparar datos del recibo
      const datosRecibo = {
        reciboId,
        clienteNombre: clienteSeleccionado.nombre,
        clienteCodigo: codigo,
        clienteId: clienteSeleccionado.clienteId,
        mes: mesNombre,
        año: parseInt(year),
        mesNumero: parseInt(month),
        periodoISO: mesSeleccionado,
        
        // Totales (solo citas facturables, no cortesías)
        totalCitas: clienteSeleccionado.totalCitas,
        totalHoras: clienteSeleccionado.totalHoras,
        totalPrecio: clienteSeleccionado.totalPrecio,
        totalIva: clienteSeleccionado.totalIva,
        totalGeneral: clienteSeleccionado.totalGeneral,
        
        // Info de cortesías para referencia
        totalCortesias: clienteSeleccionado.totalCortesias || 0,
        totalHorasCortesia: clienteSeleccionado.totalHorasCortesia || 0,
        
        // Citas incluidas (solo facturables)
        citas: citasFacturables.map(c => ({
          id: c.id,
          fecha: c.fecha,
          horaInicio: c.horaInicio,
          horaFin: c.horaFin,
          terapeuta: c.terapeuta,
          tipoTerapia: c.tipoTerapia,
          duracion: c.duracion,
          precio: c.precio
        })),
        
        // Metadata
        fechaGeneracion: new Date().toISOString(),
        estadoPago: 'pendiente',
        montoPagado: 0
      };

      await onGenerarRecibo(datosRecibo);
      
      setMostrarModalRecibo(false);
      alert(`✅ Recibo ${reciboId} generado exitosamente`);
      
    } catch (error) {
      console.error('Error generando recibo:', error);
      alert('❌ Error al generar el recibo: ' + error.message);
    } finally {
      setGenerandoRecibo(false);
    }
  };

  /**
   * Abre el modal para agregar cita
   */
  const abrirModalAgregar = () => {
    const [year, month] = mesSeleccionado.split('-');
    setCitaEditando(null);
    setCitaForm({
      fecha: `${year}-${month}-01`,
      horaInicio: '09:00',
      horaFin: '10:00',
      terapeuta: terapeutas[0]?.nombre || '',
      tipoTerapia: 'Sesión de ABA estándar',
      costoPorHora: 450,
      estado: 'completada',
      cortesia: false,
      cliente: clienteSeleccionado?.nombre || ''
    });
    setMostrarModalCita(true);
  };

  /**
   * Abre el modal para editar cita
   */
  const abrirModalEditar = (cita) => {
    // Buscar el precio del tipo de terapia si no tiene costoPorHora
    const tipoTerapiaActual = cita.tipoTerapia || 'Sesión de ABA estándar';
    const tipoEncontrado = tiposTerapia.find(t => t.nombre === tipoTerapiaActual);
    const precioDefault = tipoEncontrado?.precio || 450;
    
    setCitaEditando(cita);
    setCitaForm({
      fecha: cita.fecha,
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      terapeuta: cita.terapeuta,
      tipoTerapia: tipoTerapiaActual,
      costoPorHora: cita.costoPorHora || precioDefault,
      estado: cita.estado || 'completada',
      cortesia: cita.cortesia || false,
      cliente: cita.cliente
    });
    setMostrarModalCita(true);
  };

  /**
   * Cierra el modal de cita
   */
  const cerrarModal = () => {
    setMostrarModalCita(false);
    setCitaEditando(null);
    setCitaForm({
      fecha: '',
      horaInicio: '',
      horaFin: '',
      terapeuta: '',
      tipoTerapia: 'Sesión de ABA estándar',
      costoPorHora: 450,
      estado: 'completada',
      cortesia: false
    });
  };

  /**
   * Guarda la cita (nueva o editada)
   */
  const guardarCita = async () => {
    if (!citaForm.fecha || !citaForm.horaInicio || !citaForm.horaFin || !citaForm.terapeuta) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setGuardando(true);

    try {
      const duracion = calcularDuracion(citaForm.horaInicio, citaForm.horaFin);
      const costoTotal = citaForm.costoPorHora * duracion;

      const datosCita = {
        ...citaForm,
        costoTotal,
        cliente: citaForm.cliente || clienteSeleccionado?.nombre
      };

      if (citaEditando) {
        // Editar cita existente
        if (onEditarCita) {
          await onEditarCita(citaEditando.id, datosCita);
        }
      } else {
        // Agregar nueva cita
        if (onAgregarCita) {
          await onAgregarCita(datosCita);
        }
      }

      cerrarModal();
    } catch (error) {
      console.error('Error guardando cita:', error);
      alert('Error al guardar la cita: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Confirma eliminación de cita
   */
  const confirmarEliminar = (cita) => {
    setCitaAEliminar(cita);
    setMostrarConfirmacion(true);
  };

  /**
   * Elimina la cita
   */
  const eliminarCita = async () => {
    if (!citaAEliminar) return;

    try {
      if (onEliminarCita) {
        await onEliminarCita(citaAEliminar.id);
      }
      setMostrarConfirmacion(false);
      setCitaAEliminar(null);
    } catch (error) {
      console.error('Error eliminando cita:', error);
      alert('Error al eliminar la cita: ' + error.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Lista de Clientes */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recibos Gemini
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVistaLista(true)}
                className={`p-1.5 rounded ${vistaLista ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                <List size={18} className="text-gray-600" />
              </button>
              <button
                onClick={() => setVistaLista(false)}
                className={`p-1.5 rounded ${!vistaLista ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                <Grid size={18} className="text-gray-600" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded">
                <Filter size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Selector de Mes con Flechas */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Período
            </label>
            <div className="flex items-center justify-between bg-gray-100 rounded-lg p-1">
              <button
                onClick={mesAnterior}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              
              <div className="flex-1 text-center">
                <span className="font-semibold text-gray-800">
                  {obtenerNombreMes(mesSeleccionado)}
                </span>
              </div>
              
              <button
                onClick={mesSiguiente}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="flex-1 overflow-y-auto">
          {clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No hay clientes con citas</p>
                <p className="text-sm mt-1">en {obtenerNombreMes(mesSeleccionado)}</p>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Citas completadas: {citasDelMes.length}</p>
              </div>
            </div>
          ) : (
            clientesFiltrados.map((cliente) => (
              <div
                key={cliente.nombre}
                onClick={() => setClienteSeleccionado(cliente)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  clienteSeleccionado?.nombre === cliente.nombre
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{cliente.nombre}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {cliente.codigo} • {cliente.totalCitas} citas
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ${cliente.totalGeneral.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {cliente.totalHoras.toFixed(1)}h
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel Principal - Detalles del Cliente */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!clienteSeleccionado ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <User size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Selecciona un cliente para ver sus citas</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header del Cliente */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {clienteSeleccionado.nombre}
                  </h1>
                  <p className="text-gray-500">
                    {clienteSeleccionado.codigo} • {obtenerNombreMes(mesSeleccionado)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={abrirModalGenerarRecibo}
                    disabled={clienteSeleccionado.totalCitas === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText size={20} />
                    Generar Recibo
                  </button>
                  <button
                    onClick={abrirModalAgregar}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={20} />
                    Agregar Cita
                  </button>
                </div>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium">Citas</p>
                  <p className="text-xl font-bold text-purple-900">{clienteSeleccionado.totalCitas}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Horas</p>
                  <p className="text-xl font-bold text-blue-900">{clienteSeleccionado.totalHoras.toFixed(1)}h</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium">Subtotal</p>
                  <p className="text-xl font-bold text-green-900">
                    ${clienteSeleccionado.totalPrecio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 font-medium">Total + IVA</p>
                  <p className="text-xl font-bold text-amber-900">
                    ${clienteSeleccionado.totalGeneral.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabla de Citas */}
            <div className="flex-1 overflow-y-auto bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Detalle de Citas
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-gray-200 bg-gray-50">
                    <tr className="text-left text-gray-600">
                      <th className="py-3 px-3 font-semibold">Fecha</th>
                      <th className="py-3 px-3 font-semibold">Horario</th>
                      <th className="py-3 px-3 font-semibold">Terapeuta</th>
                      <th className="py-3 px-3 font-semibold">Tipo</th>
                      <th className="py-3 px-3 font-semibold text-center">Duración</th>
                      <th className="py-3 px-3 font-semibold text-right">Precio</th>
                      <th className="py-3 px-3 font-semibold text-right">IVA</th>
                      <th className="py-3 px-3 font-semibold text-right">Total</th>
                      <th className="py-3 px-3 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clienteSeleccionado.citas
                      .sort((a, b) => a.fecha.localeCompare(b.fecha))
                      .map((cita, index) => (
                      <tr 
                        key={cita.id || index} 
                        className={`border-b border-gray-100 ${
                          cita.cortesia 
                            ? 'bg-gray-50 text-gray-400' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {formatearFecha(cita.fecha)}
                            {cita.cortesia && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                                <Gift size={12} />
                                Cortesía
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`py-3 px-3 ${cita.cortesia ? 'text-gray-400' : 'text-gray-600'}`}>
                          {cita.horaInicio} - {cita.horaFin}
                        </td>
                        <td className={`py-3 px-3 ${cita.cortesia ? 'text-gray-400' : ''}`}>{cita.terapeuta}</td>
                        <td className={`py-3 px-3 text-xs ${cita.cortesia ? 'text-gray-400' : 'text-gray-600'}`}>
                          {cita.tipoTerapia || 'ABA'}
                        </td>
                        <td className={`py-3 px-3 text-center ${cita.cortesia ? 'text-gray-400' : ''}`}>
                          {cita.duracion.toFixed(2)}h
                        </td>
                        <td className={`py-3 px-3 text-right ${cita.cortesia ? 'text-gray-400 line-through' : ''}`}>
                          ${cita.precio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </td>
                        <td className={`py-3 px-3 text-right ${cita.cortesia ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                          ${cita.iva.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </td>
                        <td className={`py-3 px-3 text-right font-semibold ${cita.cortesia ? 'text-gray-400 line-through' : ''}`}>
                          ${cita.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => abrirModalEditar(cita)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar cita"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => confirmarEliminar(cita)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar cita"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                    {/* Fila de cortesías si hay alguna */}
                    {clienteSeleccionado.totalCortesias > 0 && (
                      <tr className="text-gray-400 text-sm">
                        <td className="py-2 px-3" colSpan="4">
                          <span className="flex items-center gap-1">
                            <Gift size={14} />
                            Cortesías: {clienteSeleccionado.totalCortesias} citas (no facturadas)
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {clienteSeleccionado.totalHorasCortesia.toFixed(2)}h
                        </td>
                        <td className="py-2 px-3 text-right line-through">
                          ${clienteSeleccionado.totalPrecioCortesia.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right line-through">
                          ${(clienteSeleccionado.totalPrecioCortesia * 0.16).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right line-through">
                          ${(clienteSeleccionado.totalPrecioCortesia * 1.16).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </td>
                        <td></td>
                      </tr>
                    )}
                    {/* Fila de totales facturables */}
                    <tr className="font-semibold">
                      <td className="py-3 px-3" colSpan="4">
                        Total Facturable: {clienteSeleccionado.totalCitas} citas
                      </td>
                      <td className="py-3 px-3 text-center">
                        {clienteSeleccionado.totalHoras.toFixed(2)}h
                      </td>
                      <td className="py-3 px-3 text-right">
                        ${clienteSeleccionado.totalPrecio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        ${clienteSeleccionado.totalIva.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3 text-right text-blue-600">
                        ${clienteSeleccionado.totalGeneral.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal para Agregar/Editar Cita */}
      {mostrarModalCita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {citaEditando ? 'Editar Cita' : 'Agregar Nueva Cita'}
              </h3>
              <button
                onClick={cerrarModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Cliente (solo mostrar, no editar) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" />
                  Cliente
                </label>
                <input
                  type="text"
                  value={citaForm.cliente || clienteSeleccionado?.nombre || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Fecha *
                </label>
                <input
                  type="date"
                  value={citaForm.fecha}
                  onChange={(e) => setCitaForm({ ...citaForm, fecha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Horario */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock size={16} className="inline mr-1" />
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={citaForm.horaInicio}
                    onChange={(e) => setCitaForm({ ...citaForm, horaInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    value={citaForm.horaFin}
                    onChange={(e) => setCitaForm({ ...citaForm, horaFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Terapeuta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terapeuta *
                </label>
                <select
                  value={citaForm.terapeuta}
                  onChange={(e) => setCitaForm({ ...citaForm, terapeuta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar terapeuta...</option>
                  {terapeutas.map(t => (
                    <option key={t.id || t.nombre} value={t.nombre}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Terapia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Terapia
                </label>
                <select
                  value={citaForm.tipoTerapia}
                  onChange={(e) => handleTipoTerapiaChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {tiposTerapia.map(tipo => (
                    <option key={tipo.nombre} value={tipo.nombre}>
                      {tipo.nombre} (${tipo.precio}/hr)
                    </option>
                  ))}
                </select>
              </div>

              {/* Costo por Hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign size={16} className="inline mr-1" />
                  Costo por Hora
                </label>
                <input
                  type="number"
                  value={citaForm.costoPorHora}
                  onChange={(e) => setCitaForm({ ...citaForm, costoPorHora: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="50"
                />
              </div>

              {/* Preview del costo */}
              {citaForm.horaInicio && citaForm.horaFin && (
                <div className={`border rounded-lg p-3 ${citaForm.cortesia ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
                  <p className={`text-sm ${citaForm.cortesia ? 'text-purple-800' : 'text-blue-800'}`}>
                    <strong>Duración:</strong> {calcularDuracion(citaForm.horaInicio, citaForm.horaFin).toFixed(2)} horas
                  </p>
                  <p className={`text-sm ${citaForm.cortesia ? 'text-purple-800 line-through' : 'text-blue-800'}`}>
                    <strong>Costo estimado:</strong> ${(citaForm.costoPorHora * calcularDuracion(citaForm.horaInicio, citaForm.horaFin)).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </p>
                  {citaForm.cortesia && (
                    <p className="text-sm text-purple-600 font-medium mt-1">
                      ✨ No se cobrará al cliente
                    </p>
                  )}
                </div>
              )}

              {/* Checkbox Cortesía */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <input
                  type="checkbox"
                  id="cortesia"
                  checked={citaForm.cortesia}
                  onChange={(e) => setCitaForm({ ...citaForm, cortesia: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="cortesia" className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium text-purple-900">
                    <Gift size={18} />
                    Marcar como Cortesía
                  </span>
                  <span className="text-xs text-purple-600">
                    No se facturará al cliente, pero sí se pagará a la terapeuta
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={cerrarModal}
                disabled={guardando}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCita}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {citaEditando ? 'Guardar Cambios' : 'Agregar Cita'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Eliminar esta cita?
              </h3>
              <p className="text-gray-600 mb-2">
                {citaAEliminar && (
                  <>
                    <strong>{formatearFecha(citaAEliminar.fecha)}</strong>
                    <br />
                    {citaAEliminar.horaInicio} - {citaAEliminar.horaFin}
                    <br />
                    Terapeuta: {citaAEliminar.terapeuta}
                  </>
                )}
              </p>
              <p className="text-sm text-red-600 mb-6">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMostrarConfirmacion(false);
                    setCitaAEliminar(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarCita}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Generar Recibo */}
      {mostrarModalRecibo && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <FileText size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Generar Recibo</h3>
                  <p className="text-green-100 text-sm">{obtenerNombreMes(mesSeleccionado)}</p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              {/* Info del cliente */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold text-gray-900">{clienteSeleccionado.nombre}</p>
                <p className="text-sm text-gray-500">Código: {clienteSeleccionado.codigo}</p>
              </div>

              {/* Número de recibo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Recibo
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-700 font-mono">
                    {clienteSeleccionado.codigo}-
                  </span>
                  <input
                    type="text"
                    value={numeroRecibo}
                    onChange={(e) => setNumeroRecibo(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 font-mono text-center"
                    placeholder="001"
                    maxLength={3}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recibo completo: <strong>{clienteSeleccionado.codigo}-{numeroRecibo}</strong>
                </p>
              </div>

              {/* Resumen del recibo */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900 mb-3">Resumen del Recibo</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Citas facturables:</span>
                  <span className="font-medium">{clienteSeleccionado.totalCitas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total horas:</span>
                  <span className="font-medium">{clienteSeleccionado.totalHoras.toFixed(2)}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${clienteSeleccionado.totalPrecio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (16%):</span>
                  <span className="font-medium">${clienteSeleccionado.totalIva.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-green-600 text-lg">
                    ${clienteSeleccionado.totalGeneral.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                
                {/* Info de cortesías si hay */}
                {clienteSeleccionado.totalCortesias > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-purple-600 flex items-center gap-1">
                      <Gift size={14} />
                      {clienteSeleccionado.totalCortesias} citas de cortesía no incluidas en el recibo
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setMostrarModalRecibo(false)}
                disabled={generandoRecibo}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={generarRecibo}
                disabled={generandoRecibo || !numeroRecibo}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {generandoRecibo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Generar Recibo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecibosGemini;
