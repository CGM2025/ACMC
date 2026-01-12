import { useState } from 'react';

/**
 * Custom Hook para manejar la apertura, cierre y estado de modales y formularios
 * 
 * @returns {Object} Estados y funciones para gestionar modales
 */
export const useModals = () => {
  // ========================================
  // ESTADOS DE MODALES
  // ========================================
  const [modals, setModals] = useState({
    horas: false,
    terapeuta: false,
    cliente: false,
    pago: false,
    cita: false
  });

  const [editingId, setEditingId] = useState(null);

  // ========================================
  // ESTADOS DE FORMULARIOS
  // ========================================
  const [horasForm, setHorasForm] = useState({
    terapeutaId: '',
    clienteId: '',
    fecha: '',
    horas: '',
    codigoCliente: '',
    notas: ''
  });

  const [terapeutaForm, setTerapeutaForm] = useState({
    nombre: '',
    especialidad: '',
    telefono: '',
    email: '',
    niveles: [],               // Niveles de terapeuta para filtrar servicios (puede tener varios)
    tipoPago: 'variable',      // 'variable' o 'fijo'
    salarioMensual: '',        // Solo aplica si tipoPago es 'fijo'
    costosPorServicio: {},
    costosPorCliente: {},
    clientesAsignados: []      // IDs de clientes asignados manualmente (sin necesidad de asignación/contrato)
  });

  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    codigo: '',
    preciosPersonalizados: {}
  });

  const [pagoForm, setPagoForm] = useState({
    clienteId: '',
    monto: '',
    concepto: '',
    metodo: 'efectivo',
    fecha: '',
    reciboFirebaseId: '',  // ← NUEVO: ID del recibo en Firebase
    reciboId: ''           // ← NUEVO: ID único del recibo (ej: REC-2025-01-CLI001)
  });

  const [citaForm, setCitaForm] = useState({
    terapeuta: '',
    terapeutaId: '',
    cliente: '',
    clienteId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    estado: 'pendiente',
    costoPorHora: 300,
    costoTotal: 0,
    tipoTerapia: 'Sesión de ABA estándar',
    costoTerapeuta: 0,
    costoTerapeutaTotal: 0
  });

  // ========================================
  // ESTADOS ADICIONALES PARA PRECIOS/COSTOS
  // ========================================
  const [pestanaCliente, setPestanaCliente] = useState('datos');
  const [nuevoPrecio, setNuevoPrecio] = useState({
    tipoTerapia: 'Sesión de ABA estándar',
    precio: 450
  });

  const [pestanaTerapeuta, setPestanaTerapeuta] = useState('datos');
  const [nuevoCostoTerapeuta, setNuevoCostoTerapeuta] = useState({
    tipoTerapia: 'Sesión de ABA estándar',
    costo: 200
  });

  const [nuevoCostoPorCliente, setNuevoCostoPorCliente] = useState({
    clienteId: '',
    costo: 200
  });

  // ========================================
  // FUNCIÓN: ABRIR MODAL
  // ========================================
  const openModal = (type, item = null) => {
    setModals({ ...modals, [type]: true });
    
    if (item) {
      setEditingId(item.id);
      
      switch(type) {
        case 'horas':
          setHorasForm({
            terapeutaId: item.terapeutaId || '',
            clienteId: item.clienteId || '',
            fecha: item.fecha || '',
            horas: item.horas || '',
            codigoCliente: item.codigoCliente || '',
            notas: item.notas || ''
          });
          break;
        case 'terapeuta':
          // Compatibilidad: si existe 'nivel' (string antiguo), convertir a array
          let nivelesArray = item.niveles || [];
          if (!nivelesArray.length && item.nivel) {
            nivelesArray = [item.nivel];
          }
          setTerapeutaForm({
            nombre: item.nombre || '',
            especialidad: item.especialidad || '',
            telefono: item.telefono || '',
            email: item.email || '',
            niveles: nivelesArray,
            tipoPago: item.tipoPago || 'variable',
            salarioMensual: item.salarioMensual || '',
            costosPorServicio: item.costosPorServicio || {},
            costosPorCliente: item.costosPorCliente || {},
            clientesAsignados: item.clientesAsignados || []
          });
          break;
        case 'cliente':
          setClienteForm({
            nombre: item.nombre || '',
            email: item.email || '',
            telefono: item.telefono || '',
            empresa: item.empresa || '',
            codigo: item.codigo || '',
            preciosPersonalizados: item.preciosPersonalizados || {}
          });
          break;
        case 'pago':
          setPagoForm({
            clienteId: item.clienteId || '',
            monto: item.monto || '',
            concepto: item.concepto || '',
            metodo: item.metodo || 'efectivo',
            fecha: item.fecha || '',
            reciboFirebaseId: item.reciboFirebaseId || '', // ← NUEVO
            reciboId: item.reciboId || '' // ← NUEVO
          });
          break;
        case 'cita':
          setCitaForm({
            terapeuta: item.terapeuta || '',
            terapeutaId: item.terapeutaId || '',
            cliente: item.cliente || '',
            clienteId: item.clienteId || '',
            fecha: item.fecha || '',
            horaInicio: item.horaInicio || '',
            horaFin: item.horaFin || '',
            estado: item.estado || 'pendiente',
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

  // ========================================
  // FUNCIÓN: CERRAR MODAL
  // ========================================
  const closeModal = (type) => {
    setModals({ ...modals, [type]: false });
    setEditingId(null);
    
    // Resetear formularios
    setHorasForm({
      terapeutaId: '',
      clienteId: '',
      fecha: '',
      horas: '',
      codigoCliente: '',
      notas: ''
    });
    
    setTerapeutaForm({
      nombre: '',
      especialidad: '',
      telefono: '',
      email: '',
      niveles: [],
      tipoPago: 'variable',
      salarioMensual: '',
      costosPorServicio: {},
      costosPorCliente: {},
      clientesAsignados: []
    });
    
    setClienteForm({
      nombre: '',
      email: '',
      telefono: '',
      empresa: '',
      codigo: '',
      preciosPersonalizados: {}
    });
    
    setPagoForm({
      clienteId: '',
      monto: '',
      concepto: '',
      metodo: 'efectivo',
      fecha: '',
      reciboFirebaseId: '', // ← NUEVO
      reciboId: '' // ← NUEVO
    });
    
    setCitaForm({
      terapeuta: '',
      cliente: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      estado: 'pendiente',
      costoPorHora: 300,
      costoTotal: 0,
      tipoTerapia: 'Sesión de ABA estándar',
      costoTerapeuta: 0,
      costoTerapeutaTotal: 0
    });

    // Resetear estados de precios y costos
    setPestanaCliente('datos');
    setNuevoPrecio({ tipoTerapia: 'Sesión de ABA estándar', precio: 450 });
    setPestanaTerapeuta('datos');
    setNuevoCostoTerapeuta({ tipoTerapia: 'Sesión de ABA estándar', costo: 200 });
    setNuevoCostoPorCliente({ clienteId: '', costo: 200 });
  };

  // ========================================
  // FUNCIONES AUXILIARES PARA PRECIOS
  // ========================================
  
  /**
   * Agrega un precio personalizado al cliente
   */
  const agregarPrecioPersonalizado = () => {
    if (!nuevoPrecio.precio || nuevoPrecio.precio <= 0) {
      alert('Por favor ingresa un precio válido');
      return;
    }

    setClienteForm({
      ...clienteForm,
      preciosPersonalizados: {
        ...clienteForm.preciosPersonalizados,
        [nuevoPrecio.tipoTerapia]: parseFloat(nuevoPrecio.precio)
      }
    });

    // Resetear el formulario de nuevo precio
    setNuevoPrecio({ tipoTerapia: 'Sesión de ABA estándar', precio: 450 });
  };

  /**
   * Elimina un precio personalizado del cliente
   */
  const eliminarPrecioPersonalizado = (tipoTerapia) => {
    const nuevosPrecios = { ...clienteForm.preciosPersonalizados };
    delete nuevosPrecios[tipoTerapia];
    setClienteForm({ ...clienteForm, preciosPersonalizados: nuevosPrecios });
  };

  /**
   * Agrega un costo por servicio a la terapeuta
   */
  const agregarCostoTerapeuta = () => {
    if (!nuevoCostoTerapeuta.costo || nuevoCostoTerapeuta.costo <= 0) {
      alert('Por favor ingresa un costo válido');
      return;
    }

    setTerapeutaForm({
      ...terapeutaForm,
      costosPorServicio: {
        ...terapeutaForm.costosPorServicio,
        [nuevoCostoTerapeuta.tipoTerapia]: parseFloat(nuevoCostoTerapeuta.costo)
      }
    });

    // Resetear el formulario
    setNuevoCostoTerapeuta({ tipoTerapia: 'Sesión de ABA estándar', costo: 200 });
  };

  /**
   * Elimina un costo por servicio de la terapeuta
   */
  const eliminarCostoTerapeuta = (tipoTerapia) => {
    const nuevosCostos = { ...terapeutaForm.costosPorServicio };
    delete nuevosCostos[tipoTerapia];
    setTerapeutaForm({ ...terapeutaForm, costosPorServicio: nuevosCostos });
  };

  /**
   * Agrega un costo específico por cliente para la terapeuta
   */
  const agregarCostoPorCliente = () => {
    if (!nuevoCostoPorCliente.clienteId || !nuevoCostoPorCliente.costo || nuevoCostoPorCliente.costo <= 0) {
      alert('Por favor selecciona un cliente e ingresa un costo válido');
      return;
    }

    setTerapeutaForm({
      ...terapeutaForm,
      costosPorCliente: {
        ...terapeutaForm.costosPorCliente,
        [nuevoCostoPorCliente.clienteId]: parseFloat(nuevoCostoPorCliente.costo)
      }
    });

    // Resetear el formulario
    setNuevoCostoPorCliente({ clienteId: '', costo: 200 });
  };

  /**
   * Elimina un costo por cliente de la terapeuta
   */
  const eliminarCostoPorCliente = (clienteId) => {
    const nuevosCostos = { ...terapeutaForm.costosPorCliente };
    delete nuevosCostos[clienteId];
    setTerapeutaForm({ ...terapeutaForm, costosPorCliente: nuevosCostos });
  };

  // ========================================
  // RETURN
  // ========================================
  return {
    // Estados de modales
    modals,
    editingId,
    
    // Estados de formularios
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
    
    // Estados de pestañas y precios
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
    
    // Funciones de modales
    openModal,
    closeModal,
    
    // Funciones de precios y costos
    agregarPrecioPersonalizado,
    eliminarPrecioPersonalizado,
    agregarCostoTerapeuta,
    eliminarCostoTerapeuta,
    agregarCostoPorCliente,
    eliminarCostoPorCliente
  };
};
