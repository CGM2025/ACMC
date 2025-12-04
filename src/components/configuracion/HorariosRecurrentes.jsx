// src/components/configuracion/HorariosRecurrentes.jsx
//
// Sistema de horarios recurrentes (plantillas semanales)
// Permite definir horarios por cliente y generar citas mensuales
// Incluye importación desde Excel
//

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Calendar,
  Clock,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle,
  Check,
  Repeat,
  CalendarPlus,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Días de la semana
const DIAS_SEMANA = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' }
];

// Mapeo de nombres de días a valores
const DIAS_MAP = {
  'lunes': 1,
  'martes': 2,
  'miércoles': 3,
  'miercoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sábado': 6,
  'sabado': 6,
  'domingo': 0
};

const HorariosRecurrentes = ({ 
  horarios = [],
  clientes = [],
  terapeutas = [],
  asignaciones = [],
  onCrear,
  onActualizar,
  onEliminar,
  onGenerarCitas
}) => {
  // Estados principales
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Estados para modal de sesión
  const [mostrarModalSesion, setMostrarModalSesion] = useState(false);
  const [sesionEditando, setSesionEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  
  // Estados para modal de generación
  const [mostrarModalGenerar, setMostrarModalGenerar] = useState(false);
  const [mesGenerar, setMesGenerar] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });
  const [semanasSeleccionadas, setSemanasSeleccionadas] = useState([1, 2, 3, 4, 5]);
  const [generando, setGenerando] = useState(false);
  
  // Estados para importación de Excel
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [datosImportar, setDatosImportar] = useState([]);
  const [erroresImportar, setErroresImportar] = useState([]);
  const [importando, setImportando] = useState(false);
  const [archivoNombre, setArchivoNombre] = useState('');
  const fileInputRef = useRef(null);
  
  // Formulario de sesión
  const [formulario, setFormulario] = useState({
    terapeutaId: '',
    terapeutaNombre: '',
    diaSemana: 1,
    horaInicio: '09:00',
    horaFin: '10:00',
    notas: ''
  });
  
  // Mensaje de feedback
  const [mensaje, setMensaje] = useState(null);
  
  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  // Buscar cliente por nombre (flexible)
  const buscarCliente = (nombreBuscado) => {
    if (!nombreBuscado) return null;
    const nombreLower = nombreBuscado.toLowerCase().trim();
    
    // Búsqueda exacta primero
    let cliente = clientes.find(c => 
      c.nombre?.toLowerCase().trim() === nombreLower
    );
    
    // Búsqueda parcial si no encuentra
    if (!cliente) {
      cliente = clientes.find(c => 
        c.nombre?.toLowerCase().includes(nombreLower) ||
        nombreLower.includes(c.nombre?.toLowerCase())
      );
    }
    
    // Búsqueda por palabras clave
    if (!cliente) {
      const palabras = nombreLower.split(' ').filter(p => p.length > 2);
      cliente = clientes.find(c => {
        const nombreCliente = c.nombre?.toLowerCase() || '';
        return palabras.every(p => nombreCliente.includes(p));
      });
    }
    
    return cliente;
  };

  // Buscar terapeuta por nombre (flexible)
  const buscarTerapeuta = (nombreBuscado) => {
    if (!nombreBuscado) return null;
    const nombreLower = nombreBuscado.toLowerCase().trim();
    
    // Búsqueda exacta primero
    let terapeuta = terapeutas.find(t => 
      t.nombre?.toLowerCase().trim() === nombreLower
    );
    
    // Búsqueda parcial
    if (!terapeuta) {
      terapeuta = terapeutas.find(t => 
        t.nombre?.toLowerCase().includes(nombreLower) ||
        nombreLower.includes(t.nombre?.toLowerCase())
      );
    }
    
    // Búsqueda por primer nombre
    if (!terapeuta) {
      const primerNombre = nombreLower.split(' ')[0];
      if (primerNombre.length > 2) {
        terapeuta = terapeutas.find(t => 
          t.nombre?.toLowerCase().startsWith(primerNombre)
        );
      }
    }
    
    return terapeuta;
  };

  // Convertir hora a formato HH:MM
  const normalizarHora = (hora) => {
    if (!hora) return null;
    
    let horaStr = String(hora).trim();
    
    // Si es número decimal (Excel time), convertir
    if (typeof hora === 'number' && hora < 1) {
      const totalMinutos = Math.round(hora * 24 * 60);
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    }
    
    // Formatos comunes: "9:00", "09:00", "9.00", "9:00 am", "14:30"
    horaStr = horaStr.toLowerCase().replace(/\s*(am|pm)\s*/gi, (match, period) => {
      return period.toLowerCase() === 'pm' ? ' pm' : ' am';
    });
    
    // Extraer horas y minutos
    const match = horaStr.match(/(\d{1,2})[:\.](\d{2})/);
    if (match) {
      let horas = parseInt(match[1]);
      const minutos = match[2];
      
      // Ajustar PM
      if (horaStr.includes('pm') && horas < 12) {
        horas += 12;
      }
      if (horaStr.includes('am') && horas === 12) {
        horas = 0;
      }
      
      return `${String(horas).padStart(2, '0')}:${minutos}`;
    }
    
    // Solo hora sin minutos
    const matchSoloHora = horaStr.match(/^(\d{1,2})$/);
    if (matchSoloHora) {
      return `${String(matchSoloHora[1]).padStart(2, '0')}:00`;
    }
    
    return null;
  };

  // Procesar archivo Excel
  const procesarExcel = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Buscar hoja "Horarios" o usar la primera
        const sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('horario')
        ) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          mostrarMensaje('El archivo está vacío', 'error');
          return;
        }
        
        // Procesar y validar cada fila
        const procesados = [];
        const errores = [];
        
        jsonData.forEach((fila, index) => {
          const numFila = index + 2; // +2 porque Excel empieza en 1 y tiene header
          
          // Obtener valores (flexibles con nombres de columna)
          const clienteNombre = fila.Cliente || fila.cliente || fila.CLIENTE || '';
          const terapeutaNombre = fila.Terapeuta || fila.terapeuta || fila.TERAPEUTA || '';
          const diaStr = fila.Día || fila.Dia || fila.dia || fila.DIA || '';
          const horaInicioRaw = fila.HoraInicio || fila.horaInicio || fila.HORAINICIO || fila['Hora Inicio'] || '';
          const horaFinRaw = fila.HoraFin || fila.horaFin || fila.HORAFIN || fila['Hora Fin'] || '';
          const notas = fila.Notas || fila.notas || fila.NOTAS || '';
          
          // Validar cliente
          const cliente = buscarCliente(clienteNombre);
          if (!cliente) {
            errores.push({
              fila: numFila,
              tipo: 'cliente',
              mensaje: `Cliente no encontrado: "${clienteNombre}"`
            });
          }
          
          // Validar terapeuta
          const terapeuta = buscarTerapeuta(terapeutaNombre);
          if (!terapeuta) {
            errores.push({
              fila: numFila,
              tipo: 'terapeuta',
              mensaje: `Terapeuta no encontrado: "${terapeutaNombre}"`
            });
          }
          
          // Validar día
          const diaSemana = DIAS_MAP[diaStr.toLowerCase().trim()];
          if (diaSemana === undefined) {
            errores.push({
              fila: numFila,
              tipo: 'dia',
              mensaje: `Día inválido: "${diaStr}"`
            });
          }
          
          // Validar horas
          const horaInicio = normalizarHora(horaInicioRaw);
          const horaFin = normalizarHora(horaFinRaw);
          
          if (!horaInicio) {
            errores.push({
              fila: numFila,
              tipo: 'hora',
              mensaje: `Hora inicio inválida: "${horaInicioRaw}"`
            });
          }
          
          if (!horaFin) {
            errores.push({
              fila: numFila,
              tipo: 'hora',
              mensaje: `Hora fin inválida: "${horaFinRaw}"`
            });
          }
          
          if (horaInicio && horaFin && horaInicio >= horaFin) {
            errores.push({
              fila: numFila,
              tipo: 'hora',
              mensaje: `Hora fin (${horaFin}) debe ser mayor que hora inicio (${horaInicio})`
            });
          }
          
          // Si todo está bien, agregar a procesados
          if (cliente && terapeuta && diaSemana !== undefined && horaInicio && horaFin && horaInicio < horaFin) {
            procesados.push({
              fila: numFila,
              clienteId: cliente.id,
              clienteNombre: cliente.nombre,
              terapeutaId: terapeuta.id,
              terapeutaNombre: terapeuta.nombre,
              diaSemana,
              diaNombre: DIAS_SEMANA.find(d => d.value === diaSemana)?.label || '',
              horaInicio,
              horaFin,
              notas: notas || '',
              valido: true
            });
          }
        });
        
        setDatosImportar(procesados);
        setErroresImportar(errores);
        setArchivoNombre(file.name);
        setMostrarModalImportar(true);
        
      } catch (error) {
        console.error('Error al procesar Excel:', error);
        mostrarMensaje('Error al leer el archivo Excel', 'error');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      procesarExcel(file);
    }
    // Limpiar input para permitir seleccionar el mismo archivo
    e.target.value = '';
  };

  // Ejecutar importación
  const ejecutarImportacion = async () => {
    if (datosImportar.length === 0) {
      mostrarMensaje('No hay datos válidos para importar', 'error');
      return;
    }
    
    setImportando(true);
    let creados = 0;
    let erroresCreacion = 0;
    
    try {
      for (const item of datosImportar) {
        try {
          await onCrear({
            clienteId: item.clienteId,
            clienteNombre: item.clienteNombre,
            terapeutaId: item.terapeutaId,
            terapeutaNombre: item.terapeutaNombre,
            diaSemana: item.diaSemana,
            horaInicio: item.horaInicio,
            horaFin: item.horaFin,
            notas: item.notas,
            activo: true
          });
          creados++;
        } catch (err) {
          console.error('Error al crear horario:', err);
          erroresCreacion++;
        }
      }
      
      if (erroresCreacion > 0) {
        mostrarMensaje(`Importados ${creados} horarios (${erroresCreacion} errores)`, 'error');
      } else {
        mostrarMensaje(`${creados} horarios importados correctamente`);
      }
      
      setMostrarModalImportar(false);
      setDatosImportar([]);
      setErroresImportar([]);
      
    } catch (error) {
      mostrarMensaje('Error durante la importación: ' + error.message, 'error');
    } finally {
      setImportando(false);
    }
  };

  // Agrupar horarios por cliente
  const clientesConHorarios = useMemo(() => {
    const mapa = {};
    
    // Inicializar con todos los clientes
    clientes.forEach(cliente => {
      mapa[cliente.id] = {
        id: cliente.id,
        nombre: cliente.nombre,
        codigo: cliente.codigo,
        sesiones: [],
        horasSemana: 0
      };
    });
    
    // Agregar horarios
    horarios.forEach(horario => {
      if (mapa[horario.clienteId]) {
        mapa[horario.clienteId].sesiones.push(horario);
        // Calcular horas
        const [h1, m1] = horario.horaInicio.split(':').map(Number);
        const [h2, m2] = horario.horaFin.split(':').map(Number);
        const duracion = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
        mapa[horario.clienteId].horasSemana += duracion;
      }
    });
    
    return Object.values(mapa).sort((a, b) => 
      b.sesiones.length - a.sesiones.length || a.nombre.localeCompare(b.nombre)
    );
  }, [clientes, horarios]);

  // Filtrar clientes por búsqueda
  const clientesFiltrados = useMemo(() => {
    if (!busqueda) return clientesConHorarios;
    const busquedaLower = busqueda.toLowerCase();
    return clientesConHorarios.filter(c => 
      c.nombre.toLowerCase().includes(busquedaLower) ||
      c.codigo?.toLowerCase().includes(busquedaLower)
    );
  }, [clientesConHorarios, busqueda]);

  // Sesiones del cliente seleccionado organizadas por día
  const sesionesPorDia = useMemo(() => {
    if (!clienteSeleccionado) return {};
    
    const porDia = {};
    DIAS_SEMANA.forEach(dia => {
      porDia[dia.value] = [];
    });
    
    clienteSeleccionado.sesiones.forEach(sesion => {
      if (porDia[sesion.diaSemana] !== undefined) {
        porDia[sesion.diaSemana].push(sesion);
      }
    });
    
    // Ordenar por hora
    Object.keys(porDia).forEach(dia => {
      porDia[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    });
    
    return porDia;
  }, [clienteSeleccionado]);

  // Abrir modal para nueva sesión
  const nuevaSesion = () => {
    if (!clienteSeleccionado) return;
    setFormulario({
      terapeutaId: '',
      terapeutaNombre: '',
      diaSemana: 1,
      horaInicio: '09:00',
      horaFin: '10:00',
      notas: ''
    });
    setSesionEditando(null);
    setMostrarModalSesion(true);
  };

  // Abrir modal para editar sesión
  const editarSesion = (sesion) => {
    setFormulario({
      terapeutaId: sesion.terapeutaId || '',
      terapeutaNombre: sesion.terapeutaNombre || '',
      diaSemana: sesion.diaSemana,
      horaInicio: sesion.horaInicio,
      horaFin: sesion.horaFin,
      notas: sesion.notas || ''
    });
    setSesionEditando(sesion.id);
    setMostrarModalSesion(true);
  };

  // Manejar cambio de terapeuta
  const handleTerapeutaChange = (e) => {
    const terapeutaId = e.target.value;
    const terapeuta = terapeutas.find(t => t.id === terapeutaId);
    setFormulario(prev => ({
      ...prev,
      terapeutaId,
      terapeutaNombre: terapeuta?.nombre || ''
    }));
  };

  // Guardar sesión
  const handleGuardarSesion = async () => {
    if (!formulario.terapeutaId) {
      mostrarMensaje('Selecciona un terapeuta', 'error');
      return;
    }
    if (formulario.horaInicio >= formulario.horaFin) {
      mostrarMensaje('La hora de fin debe ser mayor que la de inicio', 'error');
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        clienteId: clienteSeleccionado.id,
        clienteNombre: clienteSeleccionado.nombre,
        terapeutaId: formulario.terapeutaId,
        terapeutaNombre: formulario.terapeutaNombre,
        diaSemana: formulario.diaSemana,
        horaInicio: formulario.horaInicio,
        horaFin: formulario.horaFin,
        notas: formulario.notas,
        activo: true
      };

      if (sesionEditando) {
        await onActualizar(sesionEditando, datos);
        mostrarMensaje('Sesión actualizada');
      } else {
        await onCrear(datos);
        mostrarMensaje('Sesión agregada');
      }
      
      setMostrarModalSesion(false);
    } catch (error) {
      mostrarMensaje('Error: ' + error.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar sesión
  const handleEliminarSesion = async (sesionId) => {
    if (!window.confirm('¿Eliminar esta sesión recurrente?')) return;
    
    try {
      await onEliminar(sesionId);
      mostrarMensaje('Sesión eliminada');
    } catch (error) {
      mostrarMensaje('Error: ' + error.message, 'error');
    }
  };

  // Calcular semanas del mes
  const semanasDelMes = useMemo(() => {
    if (!mesGenerar) return [];
    
    const [year, month] = mesGenerar.split('-').map(Number);
    const primerDia = new Date(year, month - 1, 1);
    const ultimoDia = new Date(year, month, 0);
    
    const semanas = [];
    let semanaActual = 1;
    let diaActual = new Date(primerDia);
    
    while (diaActual <= ultimoDia) {
      const inicioSemana = new Date(diaActual);
      const finSemana = new Date(diaActual);
      
      // Ir al domingo de esa semana
      while (finSemana.getDay() !== 0 && finSemana <= ultimoDia) {
        finSemana.setDate(finSemana.getDate() + 1);
      }
      
      if (finSemana > ultimoDia) {
        finSemana.setTime(ultimoDia.getTime());
      }
      
      semanas.push({
        numero: semanaActual,
        inicio: new Date(inicioSemana),
        fin: new Date(finSemana),
        label: `${inicioSemana.getDate()} - ${finSemana.getDate()}`
      });
      
      // Siguiente semana
      diaActual = new Date(finSemana);
      diaActual.setDate(diaActual.getDate() + 1);
      semanaActual++;
    }
    
    return semanas;
  }, [mesGenerar]);

  // Toggle semana seleccionada
  const toggleSemana = (numeroSemana) => {
    setSemanasSeleccionadas(prev => {
      if (prev.includes(numeroSemana)) {
        return prev.filter(s => s !== numeroSemana);
      } else {
        return [...prev, numeroSemana].sort((a, b) => a - b);
      }
    });
  };

  // Obtener nombre del mes
  const obtenerNombreMes = (mesISO) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const [year, month] = mesISO.split('-');
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  // Navegar mes
  const cambiarMes = (direccion) => {
    const [year, month] = mesGenerar.split('-').map(Number);
    let nuevoMes = month + direccion;
    let nuevoYear = year;
    
    if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoYear--;
    } else if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoYear++;
    }
    
    setMesGenerar(`${nuevoYear}-${String(nuevoMes).padStart(2, '0')}`);
    setSemanasSeleccionadas([1, 2, 3, 4, 5]); // Reset semanas
  };

  // Calcular preview de citas a generar
  const previewCitas = useMemo(() => {
    if (!mostrarModalGenerar) return { total: 0, clientes: 0 };
    
    let total = 0;
    const clientesSet = new Set();
    
    horarios.forEach(horario => {
      if (horario.activo === false) return;
      
      semanasDelMes.forEach(semana => {
        if (!semanasSeleccionadas.includes(semana.numero)) return;
        
        // Verificar si el día cae en esta semana
        let fecha = new Date(semana.inicio);
        while (fecha <= semana.fin) {
          if (fecha.getDay() === horario.diaSemana) {
            total++;
            clientesSet.add(horario.clienteId);
          }
          fecha.setDate(fecha.getDate() + 1);
        }
      });
    });
    
    return { total, clientes: clientesSet.size };
  }, [horarios, semanasDelMes, semanasSeleccionadas, mostrarModalGenerar]);

  // Generar citas
  const handleGenerarCitas = async () => {
    if (semanasSeleccionadas.length === 0) {
      mostrarMensaje('Selecciona al menos una semana', 'error');
      return;
    }

    setGenerando(true);
    try {
      const citasAGenerar = [];
      
      horarios.forEach(horario => {
        if (horario.activo === false) return;
        
        // Buscar asignación para obtener precios
        const asignacion = asignaciones.find(a => 
          a.clienteId === horario.clienteId && 
          a.terapeutaId === horario.terapeutaId
        );
        
        semanasDelMes.forEach(semana => {
          if (!semanasSeleccionadas.includes(semana.numero)) return;
          
          let fecha = new Date(semana.inicio);
          while (fecha <= semana.fin) {
            if (fecha.getDay() === horario.diaSemana) {
              citasAGenerar.push({
                fecha: fecha.toISOString().split('T')[0],
                horaInicio: horario.horaInicio,
                horaFin: horario.horaFin,
                cliente: horario.clienteNombre,
                clienteId: horario.clienteId,
                terapeuta: horario.terapeutaNombre,
                terapeutaId: horario.terapeutaId,
                tipoTerapia: asignacion?.servicioNombre || 'Sesión de ABA estándar',
                costoPorHora: asignacion?.precioCliente || 450,
                costoTerapeuta: asignacion?.pagoTerapeuta || 200,
                estado: 'programada',
                creadoDesdeHorario: true,
                horarioRecurrenteId: horario.id
              });
            }
            fecha.setDate(fecha.getDate() + 1);
          }
        });
      });

      if (citasAGenerar.length === 0) {
        mostrarMensaje('No hay citas para generar', 'error');
        return;
      }

      await onGenerarCitas(citasAGenerar);
      mostrarMensaje(`${citasAGenerar.length} citas generadas correctamente`);
      setMostrarModalGenerar(false);
    } catch (error) {
      mostrarMensaje('Error: ' + error.message, 'error');
    } finally {
      setGenerando(false);
    }
  };

  // Estadísticas de importación
  const statsImportar = useMemo(() => {
    const porCliente = {};
    datosImportar.forEach(item => {
      porCliente[item.clienteNombre] = (porCliente[item.clienteNombre] || 0) + 1;
    });
    
    return {
      totalSesiones: datosImportar.length,
      totalClientes: Object.keys(porCliente).length,
      totalErrores: erroresImportar.length
    };
  }, [datosImportar, erroresImportar]);

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
      {/* Input oculto para archivo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls"
        className="hidden"
      />
      
      {/* Mensaje de feedback */}
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          mensaje.tipo === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {mensaje.tipo === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          {mensaje.texto}
        </div>
      )}

      {/* Sidebar - Lista de Clientes */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Repeat size={20} className="text-indigo-600" />
              Horarios
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
                title="Importar desde Excel"
              >
                <Upload size={16} />
              </button>
              <button
                onClick={() => setMostrarModalGenerar(true)}
                disabled={horarios.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CalendarPlus size={16} />
                Generar
              </button>
            </div>
          </div>
          
          {/* Búsqueda */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="flex-1 overflow-y-auto">
          {clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No hay clientes</p>
            </div>
          ) : (
            clientesFiltrados.map(cliente => (
              <div
                key={cliente.id}
                onClick={() => setClienteSeleccionado(cliente)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  clienteSeleccionado?.id === cliente.id
                    ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{cliente.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      {cliente.codigo} • {cliente.sesiones.length} sesiones
                    </p>
                  </div>
                  {cliente.horasSemana > 0 && (
                    <span className="text-sm font-medium text-indigo-600">
                      {cliente.horasSemana.toFixed(1)}h/sem
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con estadísticas */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total clientes:</span>
            <span className="font-medium">{clientesFiltrados.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Con horarios:</span>
            <span className="font-medium text-indigo-600">
              {clientesFiltrados.filter(c => c.sesiones.length > 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Panel Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!clienteSeleccionado ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <User size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Selecciona un cliente para ver sus horarios</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                <Upload size={18} />
                Importar desde Excel
              </button>
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
                    {clienteSeleccionado.codigo} • {clienteSeleccionado.horasSemana.toFixed(1)} horas/semana
                  </p>
                </div>
                <button
                  onClick={nuevaSesion}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={20} />
                  Agregar Sesión
                </button>
              </div>

              {/* Vista de Semana */}
              <div className="grid grid-cols-7 gap-2">
                {DIAS_SEMANA.map(dia => (
                  <div 
                    key={dia.value}
                    className={`text-center p-2 rounded-lg ${
                      sesionesPorDia[dia.value]?.length > 0 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <div className="font-medium text-sm">{dia.short}</div>
                    <div className="text-xs mt-1">
                      {sesionesPorDia[dia.value]?.length || 0} sesión(es)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de Sesiones */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} />
                Sesiones Recurrentes
              </h2>

              {clienteSeleccionado.sesiones.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No hay sesiones configuradas</p>
                  <button
                    onClick={nuevaSesion}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Agregar primera sesión
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {DIAS_SEMANA.map(dia => {
                    const sesiones = sesionesPorDia[dia.value] || [];
                    if (sesiones.length === 0) return null;
                    
                    return (
                      <div key={dia.value} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h3 className="font-medium text-gray-700">{dia.label}</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {sesiones.map(sesion => (
                            <div 
                              key={sesion.id}
                              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-sm font-semibold text-indigo-600">
                                    {sesion.horaInicio}
                                  </div>
                                  <div className="text-xs text-gray-400">a</div>
                                  <div className="text-sm font-semibold text-indigo-600">
                                    {sesion.horaFin}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {sesion.terapeutaNombre}
                                  </p>
                                  {sesion.notas && (
                                    <p className="text-sm text-gray-500">{sesion.notas}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => editarSesion(sesion)}
                                  className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleEliminarSesion(sesion.id)}
                                  className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de Sesión */}
      {mostrarModalSesion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Clock size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {sesionEditando ? 'Editar Sesión' : 'Nueva Sesión'}
                  </h3>
                  <p className="text-indigo-100 text-sm">{clienteSeleccionado?.nombre}</p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Terapeuta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terapeuta
                </label>
                <select
                  value={formulario.terapeutaId}
                  onChange={handleTerapeutaChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar terapeuta...</option>
                  {terapeutas.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Día de la semana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Día de la Semana
                </label>
                <select
                  value={formulario.diaSemana}
                  onChange={(e) => setFormulario(prev => ({ 
                    ...prev, 
                    diaSemana: parseInt(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {DIAS_SEMANA.map(dia => (
                    <option key={dia.value} value={dia.value}>{dia.label}</option>
                  ))}
                </select>
              </div>

              {/* Horario */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={formulario.horaInicio}
                    onChange={(e) => setFormulario(prev => ({ 
                      ...prev, 
                      horaInicio: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={formulario.horaFin}
                    onChange={(e) => setFormulario(prev => ({ 
                      ...prev, 
                      horaFin: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={formulario.notas}
                  onChange={(e) => setFormulario(prev => ({ 
                    ...prev, 
                    notas: e.target.value 
                  }))}
                  placeholder="Ej: Supervisora Claudia"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setMostrarModalSesion(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarSesion}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Generar Citas */}
      {mostrarModalGenerar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <CalendarPlus size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Generar Citas</h3>
                  <p className="text-green-100 text-sm">Crear citas desde horarios recurrentes</p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              {/* Selector de Mes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes a Generar
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarMes(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex-1 text-center font-semibold text-lg">
                    {obtenerNombreMes(mesGenerar)}
                  </div>
                  <button
                    onClick={() => cambiarMes(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Selector de Semanas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semanas a Incluir
                </label>
                <div className="space-y-2">
                  {semanasDelMes.map(semana => (
                    <div
                      key={semana.numero}
                      onClick={() => toggleSemana(semana.numero)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        semanasSeleccionadas.includes(semana.numero)
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {semanasSeleccionadas.includes(semana.numero) ? (
                        <CheckSquare size={20} className="text-green-600" />
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                      <div className="flex-1">
                        <span className="font-medium">Semana {semana.numero}</span>
                        <span className="text-gray-500 ml-2">
                          ({semana.inicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - {semana.fin.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-medium text-indigo-900 mb-2">📊 Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-indigo-600">Citas a generar:</span>
                    <span className="font-bold text-indigo-900 ml-2">{previewCitas.total}</span>
                  </div>
                  <div>
                    <span className="text-indigo-600">Clientes:</span>
                    <span className="font-bold text-indigo-900 ml-2">{previewCitas.clientes}</span>
                  </div>
                  <div>
                    <span className="text-indigo-600">Semanas activas:</span>
                    <span className="font-bold text-indigo-900 ml-2">{semanasSeleccionadas.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setMostrarModalGenerar(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerarCitas}
                disabled={generando || previewCitas.total === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {generando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <CalendarPlus size={18} />
                    Generar {previewCitas.total} Citas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importar Excel */}
      {mostrarModalImportar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 rounded-t-xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <FileSpreadsheet size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Importar Horarios</h3>
                    <p className="text-amber-100 text-sm">{archivoNombre}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMostrarModalImportar(false);
                    setDatosImportar([]);
                    setErroresImportar([]);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Resumen */}
            <div className="px-6 py-4 border-b flex-shrink-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <CheckCircle size={24} className="mx-auto mb-1 text-green-600" />
                  <div className="text-2xl font-bold text-green-700">{statsImportar.totalSesiones}</div>
                  <div className="text-sm text-green-600">Sesiones válidas</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <Users size={24} className="mx-auto mb-1 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-700">{statsImportar.totalClientes}</div>
                  <div className="text-sm text-blue-600">Clientes</div>
                </div>
                <div className={`rounded-lg p-3 text-center ${
                  statsImportar.totalErrores > 0 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <AlertTriangle size={24} className={`mx-auto mb-1 ${
                    statsImportar.totalErrores > 0 ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-2xl font-bold ${
                    statsImportar.totalErrores > 0 ? 'text-red-700' : 'text-gray-500'
                  }`}>{statsImportar.totalErrores}</div>
                  <div className={`text-sm ${
                    statsImportar.totalErrores > 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>Errores</div>
                </div>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Errores */}
              {erroresImportar.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Errores encontrados ({erroresImportar.length})
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {erroresImportar.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-700">
                        <span className="font-medium">Fila {error.fila}:</span> {error.mensaje}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview de datos */}
              {datosImportar.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Vista previa ({datosImportar.length} sesiones)
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Cliente</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Terapeuta</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Día</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Horario</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {datosImportar.slice(0, 20).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{item.clienteNombre}</td>
                            <td className="px-3 py-2">{item.terapeutaNombre}</td>
                            <td className="px-3 py-2">{item.diaNombre}</td>
                            <td className="px-3 py-2">
                              <span className="font-mono text-indigo-600">
                                {item.horaInicio} - {item.horaFin}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">{item.notas || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {datosImportar.length > 20 && (
                      <div className="px-3 py-2 bg-gray-50 text-center text-sm text-gray-500">
                        ... y {datosImportar.length - 20} sesiones más
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
              <button
                onClick={() => {
                  setMostrarModalImportar(false);
                  setDatosImportar([]);
                  setErroresImportar([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarImportacion}
                disabled={importando || datosImportar.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {importando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Importar {datosImportar.length} Sesiones
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

export default HorariosRecurrentes;
