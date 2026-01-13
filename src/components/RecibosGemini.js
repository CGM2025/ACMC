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
  CheckCircle,
  Square,
  CheckSquare,
  Layers
} from 'lucide-react';
import ModalCargoSombra from './ModalCargoSombra';

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
  onGenerarRecibo,
    // Nuevos props para cargos de sombra
  cargosSombra = [],
  onAgregarCargoSombra,
  onEditarCargoSombra,
  onEliminarCargoSombra,
  // Nuevo prop para contratos mensuales
  contratosMensuales = []
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

  // Estados para selección de citas
  const [citasSeleccionadas, setCitasSeleccionadas] = useState(new Set());

  // Estados para modal de cargo de sombra
  const [mostrarModalSombra, setMostrarModalSombra] = useState(false);
  const [cargoSombraEditando, setCargoSombraEditando] = useState(null);

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
   * Filtra los cargos de sombra del mes seleccionado
   */
  const cargosSombraDelMes = useMemo(() => {
    return cargosSombra.filter(cargo => cargo.mes === mesSeleccionado);
  }, [cargosSombra, mesSeleccionado]);

  /**
   * Obtiene los cargos de sombra del cliente seleccionado
   */
  const cargosSombraCliente = useMemo(() => {
    if (!clienteSeleccionado) return [];
    return cargosSombraDelMes.filter(
      cargo => cargo.clienteId === clienteSeleccionado.clienteId
    );
  }, [cargosSombraDelMes, clienteSeleccionado]);

  /**
   * Calcula el total de cargos de sombra del cliente
   */
  const totalCargosSombra = useMemo(() => {
    return cargosSombraCliente.reduce((acc, cargo) => {
      return {
        montoCliente: acc.montoCliente + (cargo.montoCliente || 0),
        montoTerapeuta: acc.montoTerapeuta + (cargo.montoTerapeuta || 0),
        utilidad: acc.utilidad + (cargo.utilidad || 0),
        iva: acc.iva + ((cargo.montoCliente || 0) * 0.16),
        total: acc.total + ((cargo.montoCliente || 0) * 1.16)
      };
    }, { montoCliente: 0, montoTerapeuta: 0, utilidad: 0, iva: 0, total: 0 });
  }, [cargosSombraCliente]);

  /**
   * Detecta contratos mensuales activos del cliente seleccionado
   */
  const contratosClienteActivos = useMemo(() => {
    if (!clienteSeleccionado || !contratosMensuales || contratosMensuales.length === 0) {
      return [];
    }
    
    return contratosMensuales.filter(contrato => {
      // Comparación flexible de cliente
      const clienteIdMatch = contrato.clienteId === clienteSeleccionado.clienteId;
      const nombreMatch = contrato.clienteNombre?.toLowerCase().trim() === 
                          clienteSeleccionado.nombre?.toLowerCase().trim();
      const nombreParcialMatch = contrato.clienteNombre?.toLowerCase().includes(
        clienteSeleccionado.nombre?.toLowerCase().split(' ')[0]
      );
      
      const matchCliente = clienteIdMatch || nombreMatch || nombreParcialMatch;
      const activo = contrato.activo !== false;
      
      return matchCliente && activo;
    });
  }, [clienteSeleccionado, contratosMensuales]);

  /**
   * Contratos que aún no tienen cargo de sombra aplicado este mes
   */
  const contratosSinCargo = useMemo(() => {
    if (contratosClienteActivos.length === 0) return [];
    
    return contratosClienteActivos.filter(contrato => {
      const yaTieneCargo = cargosSombraCliente.some(
        cargo => cargo.contratoId === contrato.id
      );
      return !yaTieneCargo;
    });
  }, [contratosClienteActivos, cargosSombraCliente]);

  /**
   * Calcula información de contratos desglosados con descuentos por cancelaciones
   * Solo aplica para contratos tipo 'desglosado' con montoMensualBase
   */
  const contratosDesglosadosInfo = useMemo(() => {
    if (!clienteSeleccionado || contratosClienteActivos.length === 0) return [];

    const [year, month] = mesSeleccionado.split('-');

    return contratosClienteActivos
      .filter(c => c.tipoContrato === 'desglosado' && c.montoMensualBase > 0)
      .map(contrato => {
        // Obtener IDs de terapeutas del contrato
        const terapeutaIds = contrato.terapeutas?.map(t => t.id) || [];
        const terapeutaNombres = contrato.terapeutas?.map(t => t.nombre) || [];

        // Obtener el servicio del contrato para filtrar citas
        const servicioContrato = (contrato.servicio || '').toLowerCase();

        // Filtrar citas del mes para este cliente, terapeutas del contrato Y servicio del contrato
        const citasDelContrato = citas.filter(cita => {
          const [citaYear, citaMonth] = cita.fecha.split('-');
          if (citaYear !== year || citaMonth !== month) return false;

          // Verificar que sea del cliente
          const esDelCliente = cita.cliente === clienteSeleccionado.nombre ||
                               cita.clienteId === clienteSeleccionado.clienteId;
          if (!esDelCliente) return false;

          // Verificar que sea de una terapeuta del contrato
          const esDeTerapeutaContrato = terapeutaIds.includes(cita.terapeutaId) ||
                                        terapeutaNombres.some(nombre =>
                                          cita.terapeuta?.toLowerCase().includes(nombre.toLowerCase().split(' ')[0])
                                        );
          if (!esDeTerapeutaContrato) return false;

          // Verificar que sea del servicio del contrato
          const tipoCita = (cita.tipoTerapia || cita.servicio || '').toLowerCase();
          const esDelServicioContrato = tipoCita === servicioContrato ||
                                        tipoCita.includes(servicioContrato) ||
                                        servicioContrato.includes(tipoCita);

          return esDelServicioContrato;
        });

        // Separar por estado
        const citasCompletadas = citasDelContrato.filter(c => c.estado === 'completada');
        const citasCanceladas = citasDelContrato.filter(c => c.estado === 'cancelada');
        const citasProgramadas = citasDelContrato.length; // Total de citas que se agendaron

        // Calcular valores
        const montoBase = contrato.montoMensualBase || 0;
        const precioPorCita = citasProgramadas > 0 ? montoBase / citasProgramadas : 0;
        const descuento = citasCanceladas.length * precioPorCita;
        const montoFinal = montoBase - descuento;

        // Calcular horas para el desglose
        const horasCompletadas = citasCompletadas.reduce((sum, c) => {
          const [h1, m1] = c.horaInicio.split(':').map(Number);
          const [h2, m2] = c.horaFin.split(':').map(Number);
          return sum + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
        }, 0);

        const precioPorHora = contrato.cobroCliente?.montoPorHora || 0;

        return {
          contratoId: contrato.id,
          contrato,
          montoBase,
          citasProgramadas,
          citasCompletadas: citasCompletadas.length,
          citasCanceladas: citasCanceladas.length,
          citasCanceladasDetalle: citasCanceladas,
          precioPorCita,
          descuento,
          montoFinal,
          horasCompletadas,
          precioPorHora,
          terapeutas: contrato.terapeutas
        };
      });
  }, [clienteSeleccionado, contratosClienteActivos, citas, mesSeleccionado]);

  /**
   * Agrega automáticamente un cargo de sombra basado en un contrato mensual
   */
  const agregarCargoDesdeContrato = async (contrato) => {
    if (!clienteSeleccionado || !contrato) return;
    
    // Obtener nombre del mes para la descripción
    const [year, month] = mesSeleccionado.split('-');
    const nombreMes = meses[parseInt(month) - 1]?.toLowerCase() || 'mes';
    
    // Crear descripción basada en el contrato
    const descripcion = contrato.descripcionRecibo || 
      `${contrato.servicio} - mes de ${nombreMes}`;
    
    // Obtener el monto mensual del cobro al cliente
    const montoCliente = contrato.cobroCliente?.montoMensual || 0;
    
    // Calcular pago a terapeutas (suma de todos los pagos)
    let montoTerapeuta = 0;
    let terapeutaNombre = '';
    
    if (contrato.terapeutas && contrato.terapeutas.length > 0) {
      // Si tienen tarifas individuales
      if (contrato.terapeutas[0].pagoMonto) {
        contrato.terapeutas.forEach(t => {
          if (t.pagoTipo === 'mensual') {
            montoTerapeuta += t.pagoMonto || 0;
          } else {
            // Por hora: estimar con horas del contrato
            const horasPorTerapeuta = (contrato.horasEstimadas || 0) / contrato.terapeutas.length;
            montoTerapeuta += (t.pagoMonto || 0) * horasPorTerapeuta;
          }
        });
        terapeutaNombre = contrato.terapeutas.map(t => t.nombre).join(', ');
      } else {
        // Estructura anterior (pago global)
        if (contrato.pagoTerapeuta?.tipo === 'mensual') {
          montoTerapeuta = contrato.pagoTerapeuta.montoMensual || 0;
        } else if (contrato.pagoTerapeuta?.montoPorHora) {
          montoTerapeuta = (contrato.pagoTerapeuta.montoPorHora || 0) * (contrato.horasEstimadas || 0);
        }
        terapeutaNombre = contrato.terapeutas.map(t => t.nombre || t).join(', ');
      }
    }
    
    const utilidad = montoCliente - montoTerapeuta;
    
    const cargoData = {
      clienteId: clienteSeleccionado.clienteId,
      clienteNombre: clienteSeleccionado.nombre,
      terapeutaId: contrato.terapeutas?.[0]?.id || null,
      terapeutaNombre: terapeutaNombre || 'Por definir',
      mes: mesSeleccionado,
      descripcion,
      montoCliente,
      montoTerapeuta,
      utilidad,
      // Vincular con el contrato para evitar duplicados
      contratoId: contrato.id,
      tipoContrato: contrato.tipoContrato,
      servicio: contrato.servicio
    };
    
    try {
      await onAgregarCargoSombra(cargoData);
    } catch (error) {
      console.error('Error al agregar cargo desde contrato:', error);
      alert('Error al agregar el cargo: ' + error.message);
    }
  };

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
   * Limpiar selección cuando cambia el cliente o el mes
   */
  useEffect(() => {
    setCitasSeleccionadas(new Set());
  }, [clienteSeleccionado?.nombre, mesSeleccionado]);

  /**
   * Calcula totales de citas seleccionadas
   */
  const totalesSeleccionados = useMemo(() => {
    if (!clienteSeleccionado || citasSeleccionadas.size === 0) {
      return null;
    }

    let totalCitas = 0;
    let totalHoras = 0;
    let totalPrecio = 0;
    let totalIva = 0;

    clienteSeleccionado.citas.forEach(cita => {
      if (citasSeleccionadas.has(cita.id) && !cita.cortesia) {
        totalCitas++;
        totalHoras += cita.duracion;
        totalPrecio += cita.precio;
        totalIva += cita.iva;
      }
    });

    return {
      totalCitas,
      totalHoras,
      totalPrecio,
      totalIva,
      totalGeneral: totalPrecio + totalIva
    };
  }, [clienteSeleccionado, citasSeleccionadas]);

  /**
   * Toggle selección de una cita
   */
  const toggleSeleccionCita = (citaId) => {
    setCitasSeleccionadas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(citaId)) {
        nuevo.delete(citaId);
      } else {
        nuevo.add(citaId);
      }
      return nuevo;
    });
  };

  /**
   * Seleccionar todas las citas (no cortesía)
   */
  const seleccionarTodas = () => {
    if (!clienteSeleccionado) return;
    const ids = clienteSeleccionado.citas
      .filter(c => !c.cortesia)
      .map(c => c.id);
    setCitasSeleccionadas(new Set(ids));
  };

  /**
   * Deseleccionar todas las citas
   */
  const deseleccionarTodas = () => {
    setCitasSeleccionadas(new Set());
  };

  /**
   * Seleccionar solo citas de Sombra
   */
  const seleccionarSoloSombra = () => {
    if (!clienteSeleccionado) return;
    const ids = clienteSeleccionado.citas
      .filter(c => !c.cortesia && c.tipoTerapia === 'Servicios de Sombra')
      .map(c => c.id);
    setCitasSeleccionadas(new Set(ids));
  };

  /**
   * Seleccionar todo excepto Sombra
   */
  const seleccionarExceptoSombra = () => {
    if (!clienteSeleccionado) return;
    const ids = clienteSeleccionado.citas
      .filter(c => !c.cortesia && c.tipoTerapia !== 'Servicios de Sombra')
      .map(c => c.id);
    setCitasSeleccionadas(new Set(ids));
  };

  /**
   * Abre modal para agregar cargo de sombra
   */
  const abrirModalAgregarSombra = () => {
    setCargoSombraEditando(null);
    setMostrarModalSombra(true);
  };

  /**
   * Abre modal para editar cargo de sombra
   */
  const abrirModalEditarSombra = (cargo) => {
    setCargoSombraEditando(cargo);
    setMostrarModalSombra(true);
  };

  /**
   * Guarda cargo de sombra (crear o actualizar)
   */
  const guardarCargoSombra = async (cargoData, cargoId) => {
    try {
      if (cargoId) {
        // Actualizar existente
        await onEditarCargoSombra(cargoId, cargoData);
      } else {
        // Crear nuevo
        await onAgregarCargoSombra(cargoData);
      }
      setMostrarModalSombra(false);
      setCargoSombraEditando(null);
    } catch (error) {
      console.error('Error al guardar cargo de sombra:', error);
      throw error;
    }
  };

  /**
   * Elimina cargo de sombra
   */
  const eliminarCargoSombra = async (cargoId) => {
    if (!window.confirm('¿Estás seguro de eliminar este cargo de sombra?')) return;
    
    try {
      await onEliminarCargoSombra(cargoId);
    } catch (error) {
      console.error('Error al eliminar cargo de sombra:', error);
      alert('Error al eliminar el cargo');
    }
  };

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
    if (!clienteSeleccionado) {
      alert('Selecciona un cliente primero');
      return;
    }

    // Si hay citas seleccionadas, verificar que haya al menos una
    if (citasSeleccionadas.size > 0) {
      const citasValidas = clienteSeleccionado.citas.filter(
        c => citasSeleccionadas.has(c.id) && !c.cortesia
      );
      if (citasValidas.length === 0) {
        alert('No hay citas facturables seleccionadas (las cortesías no cuentan)');
        return;
      }
    } else {
      // Si no hay selección, verificar que haya citas facturables
      if (clienteSeleccionado.totalCitas === 0) {
        alert('No hay citas facturables para generar el recibo');
        return;
      }
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

      // Determinar qué citas incluir
      let citasParaRecibo;
      if (citasSeleccionadas.size > 0) {
        // Usar solo las seleccionadas (y que no sean cortesía)
        citasParaRecibo = clienteSeleccionado.citas.filter(
          c => citasSeleccionadas.has(c.id) && !c.cortesia
        );
      } else {
        // Usar todas las facturables
        citasParaRecibo = clienteSeleccionado.citas.filter(c => !c.cortesia);
      }

      // Calcular totales de las citas a incluir
      const totalCitasCount = citasParaRecibo.length;
      const totalHorasCitas = citasParaRecibo.reduce((sum, c) => sum + c.duracion, 0);
      const subtotalCitas = citasParaRecibo.reduce((sum, c) => sum + c.precio, 0);
      const ivaCitas = citasParaRecibo.reduce((sum, c) => sum + c.iva, 0);

      // Calcular totales de cargos de sombra
      const subtotalSombra = totalCargosSombra.montoCliente;
      const ivaSombra = totalCargosSombra.iva;

      // Calcular totales de contratos desglosados (con descuentos por cancelaciones)
      let subtotalDesglosado = 0;
      let ivaDesglosado = 0;
      let contratosDesglosadosParaRecibo = [];

      if (contratosDesglosadosInfo.length > 0) {
        contratosDesglosadosInfo.forEach(info => {
          subtotalDesglosado += info.montoFinal;
          ivaDesglosado += info.montoFinal * 0.16;
          contratosDesglosadosParaRecibo.push({
            contratoId: info.contratoId,
            servicio: info.contrato.servicio,
            descripcionRecibo: info.contrato.descripcionRecibo || null,
            terapeutas: info.contrato.terapeutas?.map(t => t.nombre || t).join(', '),
            montoBase: info.montoBase,
            citasProgramadas: info.citasProgramadas,
            citasCompletadas: info.citasCompletadas,
            citasCanceladas: info.citasCanceladas,
            precioPorCita: info.precioPorCita,
            descuento: info.descuento,
            montoFinal: info.montoFinal,
            horasCompletadas: info.horasCompletadas,
            precioPorHora: info.precioPorHora,
            citasCanceladasDetalle: info.citasCanceladasDetalle.map(c => ({
              fecha: c.fecha,
              horaInicio: c.horaInicio,
              horaFin: c.horaFin
            }))
          });
        });
      }

      // Totales generales (citas + sombra + desglosados)
      // NOTA: Si hay contrato desglosado, las citas individuales ya están incluidas en el cálculo del contrato
      // Por lo tanto, usamos el monto del contrato desglosado EN LUGAR de las citas individuales
      const tieneContratoDesglosado = contratosDesglosadosParaRecibo.length > 0;
      const totalPrecio = tieneContratoDesglosado
        ? subtotalDesglosado + subtotalSombra  // Usar monto del contrato (ya incluye las citas)
        : subtotalCitas + subtotalSombra;       // Usar citas individuales
      const totalIva = tieneContratoDesglosado
        ? ivaDesglosado + ivaSombra
        : ivaCitas + ivaSombra;
      const totalGeneral = totalPrecio + totalIva;

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
        
        // Totales de citas
        totalCitas: totalCitasCount,
        totalHoras: totalHorasCitas,
        subtotalCitas,
        ivaCitas,
        
        // Totales de sombra
        cargosSombra: cargosSombraCliente.map(cargo => ({
          id: cargo.id,
          descripcion: cargo.descripcion,
          terapeutaId: cargo.terapeutaId,
          terapeutaNombre: cargo.terapeutaNombre,
          montoCliente: cargo.montoCliente,
          montoTerapeuta: cargo.montoTerapeuta,
          utilidad: cargo.utilidad
        })),
        subtotalSombra,
        ivaSombra,

        // Contratos desglosados (con descuentos por cancelaciones)
        contratosDesglosados: contratosDesglosadosParaRecibo,
        subtotalDesglosado,
        ivaDesglosado,
        tieneContratoDesglosado,

        // Totales generales
        totalPrecio,
        totalIva,
        totalGeneral,

        // Info adicional
        esReciboPartial: citasSeleccionadas.size > 0,
        tieneCargosSombra: cargosSombraCliente.length > 0,
        
        // Citas incluidas
        citas: citasParaRecibo.map(c => ({
          id: c.id,
          fecha: c.fecha,
          horaInicio: c.horaInicio,
          horaFin: c.horaFin,
          terapeuta: c.terapeuta,
          tipoTerapia: c.tipoTerapia,
          duracion: c.duracion,
          precio: c.precio
        })),
        
        // IDs de citas para referencia
        citasIds: citasParaRecibo.map(c => c.id),
        
        // Metadata
        fechaGeneracion: new Date().toISOString(),
        estadoPago: 'pendiente',
        montoPagado: 0
      };

      await onGenerarRecibo(datosRecibo);
      
      // Limpiar selección después de generar
      setCitasSeleccionadas(new Set());
      
      setMostrarModalRecibo(false);
      
      // Mensaje de éxito con info de sombra si aplica
      let mensaje = `✅ Recibo ${reciboId} generado con ${totalCitasCount} citas`;
      if (cargosSombraCliente.length > 0) {
        mensaje += ` y ${cargosSombraCliente.length} cargo(s) de sombra`;
      }
      alert(mensaje);
      
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
                  <button
                    onClick={abrirModalAgregarSombra}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus size={20} />
                    Cargo Sombra
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

              {/* Banner de Contratos Desglosados con Descuentos */}
              {contratosDesglosadosInfo.length > 0 && (
                <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-amber-100 p-1.5 rounded-lg">
                      <FileText size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900">
                        Contrato Desglosado (para Aseguradora)
                      </h3>
                      <p className="text-xs text-amber-600">
                        Monto fijo con descuento automático por citas canceladas
                      </p>
                    </div>
                  </div>
                  {contratosDesglosadosInfo.map(info => (
                    <div key={info.contratoId} className="bg-white rounded-lg p-4 border border-amber-100">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{info.contrato.servicio}</p>
                          <p className="text-sm text-gray-500">
                            {info.contrato.terapeutas?.map(t => t.nombre || t).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Monto Base</p>
                          <p className="font-semibold text-gray-800">
                            ${info.montoBase.toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>

                      {/* Resumen de citas */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-blue-600">Programadas</p>
                          <p className="font-bold text-blue-800">{info.citasProgramadas}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-green-600">Completadas</p>
                          <p className="font-bold text-green-800">{info.citasCompletadas}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-red-600">Canceladas</p>
                          <p className="font-bold text-red-800">{info.citasCanceladas}</p>
                        </div>
                      </div>

                      {/* Cálculo del descuento */}
                      {info.citasCanceladas > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">Descuento por cancelaciones:</span>
                            {' '}{info.citasCanceladas} citas × ${info.precioPorCita.toLocaleString('es-MX', { maximumFractionDigits: 2 })}/cita
                            {' '}= <span className="font-bold">-${info.descuento.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span>
                          </p>
                          {info.citasCanceladasDetalle.length > 0 && (
                            <div className="mt-2 text-xs text-red-600">
                              <p className="font-medium mb-1">Citas canceladas:</p>
                              {info.citasCanceladasDetalle.map((cita, idx) => (
                                <p key={idx}>• {cita.fecha} - {cita.horaInicio} a {cita.horaFin}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Total a cobrar */}
                      <div className="flex justify-between items-center pt-3 border-t">
                        <div>
                          <p className="text-sm text-gray-500">Total a cobrar (sin IVA)</p>
                          <p className="text-xs text-gray-400">
                            {info.horasCompletadas.toFixed(1)} hrs × ${info.precioPorHora}/hr para desglose
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-700">
                            ${info.montoFinal.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-500">
                            +IVA: ${(info.montoFinal * 0.16).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Banner de Contratos Mensuales sin Cargo (excepto desglosados con monto base) */}
              {contratosSinCargo.filter(c => c.tipoContrato !== 'desglosado' || !c.montoMensualBase).length > 0 && (
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-1.5 rounded-lg">
                        <FileText size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          Contrato Mensual Activo
                        </h3>
                        <p className="text-xs text-blue-600">
                          {contratosSinCargo.length === 1 
                            ? 'Este cliente tiene un contrato pendiente de aplicar'
                            : `${contratosSinCargo.length} contratos pendientes de aplicar`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {contratosSinCargo.filter(c => c.tipoContrato !== 'desglosado' || !c.montoMensualBase).map(contrato => (
                      <div
                        key={contrato.id}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{contrato.servicio}</p>
                          <p className="text-sm text-gray-500">
                            {contrato.tipoContrato === 'mensual_fijo' && 'Mensual Fijo'}
                            {contrato.tipoContrato === 'hibrido' && 'Híbrido'}
                            {contrato.tipoContrato === 'paquete' && 'Paquete'}
                            {contrato.tipoContrato === 'desglosado' && 'Desglosado'}
                            {' • '}
                            {contrato.terapeutas?.map(t => t.nombre || t).join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-blue-700">
                              ${contrato.cobroCliente?.montoMensual?.toLocaleString('es-MX') || '0'}
                            </p>
                            <p className="text-xs text-gray-500">cobro mensual</p>
                          </div>
                          <button
                            onClick={() => agregarCargoDesdeContrato(contrato)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Plus size={16} />
                            Aplicar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cargos de Sombra del Cliente */}
              {cargosSombraCliente.length > 0 && (
                <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                      <Layers size={18} />
                      Cargos de Sombra ({cargosSombraCliente.length})
                    </h3>
                    <span className="text-purple-700 font-bold">
                      ${totalCargosSombra.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {cargosSombraCliente.map(cargo => (
                      <div 
                        key={cargo.id} 
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{cargo.descripcion}</p>
                          <p className="text-sm text-gray-500">
                            Terapeuta: {cargo.terapeutaNombre}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-purple-700">
                              ${cargo.montoCliente?.toLocaleString('es-MX')}
                            </p>
                            <p className="text-xs text-gray-500">
                              +IVA: ${(cargo.montoCliente * 0.16).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => abrirModalEditarSombra(cargo)}
                              className="p-1.5 hover:bg-purple-100 rounded text-purple-600"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => eliminarCargoSombra(cargo.id)}
                              className="p-1.5 hover:bg-red-100 rounded text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabla de Citas */}
            <div className="flex-1 overflow-y-auto bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Detalle de Citas
                </h2>
                
                {/* Barra de selección */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 mr-2">
                    <Layers size={16} className="inline mr-1" />
                    Selección:
                  </span>
                  <button
                    onClick={seleccionarTodas}
                    className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Todas
                  </button>
                  <button
                    onClick={deseleccionarTodas}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Ninguna
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button
                    onClick={seleccionarSoloSombra}
                    className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    Solo Sombra
                  </button>
                  <button
                    onClick={seleccionarExceptoSombra}
                    className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Excepto Sombra
                  </button>
                </div>
              </div>

              {/* Indicador de selección */}
              {citasSeleccionadas.size > 0 && totalesSeleccionados && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-blue-900">
                      <CheckSquare size={16} className="inline mr-1" />
                      {citasSeleccionadas.size} citas seleccionadas
                    </span>
                    <span className="text-blue-700">
                      {totalesSeleccionados.totalHoras.toFixed(1)}h
                    </span>
                    <span className="text-blue-700">
                      Subtotal: ${totalesSeleccionados.totalPrecio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="font-semibold text-blue-900">
                      Total: ${totalesSeleccionados.totalGeneral.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <button
                    onClick={abrirModalGenerarRecibo}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Generar Recibo con Selección
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-gray-200 bg-gray-50">
                    <tr className="text-left text-gray-600">
                      <th className="py-3 px-2 font-semibold text-center w-10">
                        <button
                          onClick={() => {
                            if (citasSeleccionadas.size === clienteSeleccionado.citas.filter(c => !c.cortesia).length) {
                              deseleccionarTodas();
                            } else {
                              seleccionarTodas();
                            }
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Seleccionar/Deseleccionar todas"
                        >
                          {citasSeleccionadas.size === clienteSeleccionado.citas.filter(c => !c.cortesia).length ? (
                            <CheckSquare size={18} className="text-blue-600" />
                          ) : (
                            <Square size={18} className="text-gray-400" />
                          )}
                        </button>
                      </th>
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
                            : citasSeleccionadas.has(cita.id)
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-2 text-center">
                          {!cita.cortesia ? (
                            <button
                              onClick={() => toggleSeleccionCita(cita.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {citasSeleccionadas.has(cita.id) ? (
                                <CheckSquare size={18} className="text-blue-600" />
                              ) : (
                                <Square size={18} className="text-gray-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
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
                        <td></td>
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
                      <td></td>
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
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Resumen del Recibo</h4>
                  {contratosDesglosadosInfo.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      Contrato Desglosado
                    </span>
                  )}
                  {citasSeleccionadas.size > 0 && contratosDesglosadosInfo.length === 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Selección parcial
                    </span>
                  )}
                </div>

                {/* Usar totales de selección si hay, si no usar todos */}
                {(() => {
                  const datos = citasSeleccionadas.size > 0 && totalesSeleccionados
                    ? totalesSeleccionados
                    : clienteSeleccionado;

                  // Si hay contrato desglosado, usar esos totales
                  const tieneDesglosado = contratosDesglosadosInfo.length > 0;
                  const infoDesglosado = tieneDesglosado ? contratosDesglosadosInfo[0] : null;

                  // Calcular totales
                  const subtotalSombra = totalCargosSombra.montoCliente;

                  if (tieneDesglosado && infoDesglosado) {
                    // Mostrar info del contrato desglosado
                    const subtotalDesglosado = infoDesglosado.montoFinal;
                    const ivaDesglosado = subtotalDesglosado * 0.16;
                    const subtotalGeneral = subtotalDesglosado + subtotalSombra;
                    const ivaTotal = ivaDesglosado + totalCargosSombra.iva;
                    const granTotal = subtotalGeneral + ivaTotal;

                    return (
                      <>
                        <div className="bg-amber-50 -mx-4 px-4 py-2 mb-2 rounded">
                          <p className="text-xs text-amber-700 font-medium mb-1">Contrato: {infoDesglosado.contrato.servicio}</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-amber-700">Monto base:</span>
                            <span className="font-medium text-amber-800">${infoDesglosado.montoBase.toLocaleString('es-MX')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-amber-700">Citas: {infoDesglosado.citasCompletadas}/{infoDesglosado.citasProgramadas}</span>
                            <span className="font-medium text-amber-800">{infoDesglosado.horasCompletadas.toFixed(1)}h</span>
                          </div>
                          {infoDesglosado.citasCanceladas > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                              <span>Descuento ({infoDesglosado.citasCanceladas} canceladas):</span>
                              <span className="font-medium">-${infoDesglosado.descuento.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm pt-1 border-t border-amber-200 mt-1">
                            <span className="text-amber-800 font-medium">Subtotal contrato:</span>
                            <span className="font-bold text-amber-800">${subtotalDesglosado.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>

                        {/* Mostrar cargos de sombra si hay */}
                        {cargosSombraCliente.length > 0 && (
                          <div className="flex justify-between text-sm text-purple-700 bg-purple-50 -mx-4 px-4 py-1">
                            <span>Cargos de Sombra ({cargosSombraCliente.length}):</span>
                            <span className="font-medium">${subtotalSombra.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">IVA (16%):</span>
                          <span className="font-medium">${ivaTotal.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-900">Total:</span>
                          <span className="font-bold text-green-600 text-lg">
                            ${granTotal.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </>
                    );
                  }

                  // Sin contrato desglosado - mostrar citas normales
                  const subtotalCitas = datos.totalPrecio;
                  const subtotalGeneral = subtotalCitas + subtotalSombra;
                  const ivaTotal = datos.totalIva + totalCargosSombra.iva;
                  const granTotal = datos.totalGeneral + totalCargosSombra.total;

                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Citas a incluir:</span>
                        <span className="font-medium">{datos.totalCitas}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total horas:</span>
                        <span className="font-medium">{datos.totalHoras.toFixed(2)}h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal citas:</span>
                        <span className="font-medium">${subtotalCitas.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                      </div>

                      {/* Mostrar cargos de sombra si hay */}
                      {cargosSombraCliente.length > 0 && (
                        <>
                          <div className="flex justify-between text-sm text-purple-700 bg-purple-50 -mx-4 px-4 py-1">
                            <span>Cargos de Sombra ({cargosSombraCliente.length}):</span>
                            <span className="font-medium">${subtotalSombra.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal general:</span>
                            <span className="font-medium">${subtotalGeneral.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">IVA (16%):</span>
                        <span className="font-medium">${ivaTotal.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="font-bold text-green-600 text-lg">
                          ${granTotal.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </>
                  );
                })()}
                
                {/* Info de citas seleccionadas */}
                {citasSeleccionadas.size > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <CheckSquare size={14} />
                      Solo se incluirán las {citasSeleccionadas.size} citas seleccionadas
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Las citas restantes podrán incluirse en otro recibo
                    </p>
                  </div>
                )}
                
                {/* Info de cortesías si hay y no hay selección */}
                {citasSeleccionadas.size === 0 && clienteSeleccionado.totalCortesias > 0 && (
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

      {/* Modal de Cargo de Sombra */}
      <ModalCargoSombra
        isOpen={mostrarModalSombra}
        onClose={() => {
          setMostrarModalSombra(false);
          setCargoSombraEditando(null);
        }}
        onSave={guardarCargoSombra}
        clientes={clientes}
        terapeutas={terapeutas}
        cargoExistente={cargoSombraEditando}
        mesActual={mesSeleccionado}
      />
    </div>
  );
};

export default RecibosGemini;
