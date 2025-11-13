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
    costosPorServicio: {},
    costosPorCliente: {}
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
    fecha: ''
  });

  const [citaForm, setCitaForm] = useState({
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
            costosPorServicio: item.costosPorServicio || {},
            costosPorCliente: item.costosPorCliente || {}
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
      costosPorServicio: {},
      costosPorCliente: {}
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
      fecha: ''
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

  /**
   * Elimina un precio personalizado del cliente
   */
  const eliminarPrecioPersonalizado = (tipoTerapia) => {
    const preciosActualizados = { ...clienteForm.preciosPersonalizados };
    delete preciosActualizados[tipoTerapia];
    
    setClienteForm({
      ...clienteForm,
      preciosPersonalizados: preciosActualizados
    });
  };

  /**
   * Agrega un costo por servicio a la terapeuta
   */
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

  /**
   * Elimina un costo por servicio de la terapeuta
   */
  const eliminarCostoTerapeuta = (tipoTerapia) => {
    const costosActualizados = { ...terapeutaForm.costosPorServicio };
    delete costosActualizados[tipoTerapia];
    
    setTerapeutaForm({
      ...terapeutaForm,
      costosPorServicio: costosActualizados
    });
  };

  /**
   * Agrega un costo por cliente a la terapeuta
   */
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

  /**
   * Elimina un costo por cliente de la terapeuta
   */
  const eliminarCostoPorCliente = (clienteId) => {
    const costosActualizados = { ...terapeutaForm.costosPorCliente };
    delete costosActualizados[clienteId];
    
    setTerapeutaForm({
      ...terapeutaForm,
      costosPorCliente: costosActualizados
    });
  };

  // ========================================
  // RETURN: EXPORTAR TODO
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
    
    // Funciones principales
    openModal,
    closeModal,
    
    // Funciones auxiliares
    agregarPrecioPersonalizado,
    eliminarPrecioPersonalizado,
    agregarCostoTerapeuta,
    eliminarCostoTerapeuta,
    agregarCostoPorCliente,
    eliminarCostoPorCliente
  };
};