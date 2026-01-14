// src/api/contratosMensuales.js
//
// API para gestión de contratos mensuales (sombra y paquetes)
// Maneja cobros fijos mensuales a clientes y pagos a terapeutas
//

import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { registrarCambio, TIPOS_ENTIDAD, TIPOS_ACCION } from './historialCambios';

const COLLECTION_NAME = 'contratosMensuales';

/**
 * Tipos de contrato:
 * - mensual_fijo: Cobro y pago mensual fijo (Anna, Isabella)
 * - hibrido: Cobro mensual fijo, pago por hora (Eva)
 * - paquete: Cobro mensual fijo, pago por hora (Matías)
 * - desglosado: Cobro y pago por hora pero para aseguradora (Daniel)
 */

/**
 * Obtiene todos los contratos de una organización
 */
export const obtenerContratos = async (organizationId) => {
  try {
    if (!organizationId) {
      console.warn('obtenerContratos: organizationId no proporcionado');
      return [];
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId)
    );
    
    const snapshot = await getDocs(q);
    const contratos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('✅ Contratos cargados:', contratos.length);
    return contratos;
  } catch (error) {
    console.error('Error al obtener contratos:', error);
    throw error;
  }
};

/**
 * Obtiene contratos activos de un cliente específico
 */
export const obtenerContratosPorCliente = async (clienteNombre, organizationId) => {
  try {
    if (!organizationId) return [];

    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('clienteNombre', '==', clienteNombre),
      where('activo', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener contratos por cliente:', error);
    throw error;
  }
};

/**
 * Busca un contrato para una combinación Cliente + Terapeuta
 * Útil para determinar si una cita pertenece a un contrato mensual
 */
export const buscarContrato = async (clienteNombre, terapeutaNombre, organizationId) => {
  try {
    if (!organizationId) return null;

    const contratos = await obtenerContratosPorCliente(clienteNombre, organizationId);
    
    // Buscar contrato que incluya a la terapeuta
    const contratoEncontrado = contratos.find(contrato => {
      if (!contrato.terapeutas || !Array.isArray(contrato.terapeutas)) return false;
      
      return contrato.terapeutas.some(t => {
        const nombreTerapeuta = (t.nombre || t).toLowerCase().trim();
        const nombreBuscado = terapeutaNombre.toLowerCase().trim();
        return nombreTerapeuta.includes(nombreBuscado) || nombreBuscado.includes(nombreTerapeuta);
      });
    });

    return contratoEncontrado || null;
  } catch (error) {
    console.error('Error al buscar contrato:', error);
    return null;
  }
};

/**
 * Crea un nuevo contrato mensual
 * @param {Object} contratoData - Datos del contrato
 * @param {string} organizationId - ID de la organización
 * @param {Object} usuario - Usuario que realiza la acción (opcional, para historial)
 */
export const crearContrato = async (contratoData, organizationId, usuario = null) => {
  try {
    if (!organizationId) {
      throw new Error('organizationId es requerido');
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...contratoData,
      activo: true,
      organizationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Registrar en historial
    await registrarCambio({
      tipoEntidad: TIPOS_ENTIDAD.CONTRATO,
      entidadId: docRef.id,
      accion: TIPOS_ACCION.CREAR,
      datosAnteriores: null,
      datosNuevos: { ...contratoData, id: docRef.id },
      usuario,
      organizationId,
      descripcion: `Nuevo contrato: ${contratoData.clienteNombre} - ${contratoData.servicio || 'Sin servicio'}`
    });

    console.log('✅ Contrato creado:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear contrato:', error);
    throw error;
  }
};

/**
 * Actualiza un contrato existente
 * @param {string} contratoId - ID del contrato
 * @param {Object} contratoData - Nuevos datos
 * @param {Object} usuario - Usuario que realiza la acción (opcional, para historial)
 */
export const actualizarContrato = async (contratoId, contratoData, usuario = null) => {
  try {
    const { organizationId, createdAt, ...datosActualizar } = contratoData;

    // Obtener datos anteriores para el historial
    const docRef = doc(db, COLLECTION_NAME, contratoId);
    const docSnap = await getDoc(docRef);
    const datosAnteriores = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;

    await updateDoc(docRef, {
      ...datosActualizar,
      updatedAt: serverTimestamp()
    });

    // Registrar en historial si hay datos anteriores
    if (datosAnteriores) {
      await registrarCambio({
        tipoEntidad: TIPOS_ENTIDAD.CONTRATO,
        entidadId: contratoId,
        accion: TIPOS_ACCION.ACTUALIZAR,
        datosAnteriores,
        datosNuevos: { ...datosAnteriores, ...datosActualizar },
        usuario,
        organizationId: datosAnteriores.organizationId,
        descripcion: `Contrato actualizado: ${datosAnteriores.clienteNombre || 'N/A'}`
      });
    }

    console.log('✅ Contrato actualizado:', contratoId);
  } catch (error) {
    console.error('Error al actualizar contrato:', error);
    throw error;
  }
};

/**
 * Elimina (desactiva) un contrato
 * @param {string} contratoId - ID del contrato
 * @param {Object} usuario - Usuario que realiza la acción (opcional, para historial)
 */
export const eliminarContrato = async (contratoId, usuario = null) => {
  try {
    // Obtener datos anteriores para el historial
    const docRef = doc(db, COLLECTION_NAME, contratoId);
    const docSnap = await getDoc(docRef);
    const datosAnteriores = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;

    await updateDoc(docRef, {
      activo: false,
      updatedAt: serverTimestamp()
    });

    // Registrar en historial
    if (datosAnteriores) {
      await registrarCambio({
        tipoEntidad: TIPOS_ENTIDAD.CONTRATO,
        entidadId: contratoId,
        accion: TIPOS_ACCION.DESACTIVAR,
        datosAnteriores,
        datosNuevos: { ...datosAnteriores, activo: false },
        usuario,
        organizationId: datosAnteriores.organizationId,
        descripcion: `Contrato desactivado: ${datosAnteriores.clienteNombre || 'N/A'}`
      });
    }

    console.log('✅ Contrato desactivado:', contratoId);
  } catch (error) {
    console.error('Error al eliminar contrato:', error);
    throw error;
  }
};

/**
 * Calcula el resumen de un contrato para un mes específico
 * @param {Object} contrato - El contrato
 * @param {Array} citasDelMes - Citas del mes para este contrato
 * @returns {Object} - Resumen con horas, montos, etc.
 */
export const calcularResumenContrato = (contrato, citasDelMes) => {
  const horasTrabajadas = citasDelMes.reduce((total, cita) => {
    return total + (parseFloat(cita.duracion) || 0);
  }, 0);

  const resumen = {
    horasTrabajadas,
    horasEstimadas: contrato.horasEstimadas || 0,
    
    // Cobro al cliente
    cobroCliente: {
      tipo: contrato.cobroCliente?.tipo || 'mensual',
      monto: contrato.cobroCliente?.tipo === 'mensual' 
        ? contrato.cobroCliente.montoMensual 
        : horasTrabajadas * (contrato.cobroCliente?.montoPorHora || 0)
    },
    
    // Pago a terapeutas
    pagoTerapeuta: {
      tipo: contrato.pagoTerapeuta?.tipo || 'mensual',
      monto: contrato.pagoTerapeuta?.tipo === 'mensual'
        ? contrato.pagoTerapeuta.montoMensual
        : horasTrabajadas * (contrato.pagoTerapeuta?.montoPorHora || 0)
    },
    
    // Ganancia
    ganancia: 0
  };

  resumen.ganancia = resumen.cobroCliente.monto - resumen.pagoTerapeuta.monto;

  return resumen;
};

/**
 * Genera la línea de recibo para un contrato mensual
 * @param {Object} contrato - El contrato
 * @param {number} horasTrabajadas - Horas del mes
 * @returns {Object} - Datos para el recibo
 */
export const generarLineaRecibo = (contrato, horasTrabajadas) => {
  let descripcion = '';
  let monto = 0;

  switch (contrato.tipoContrato) {
    case 'mensual_fijo':
      descripcion = contrato.descripcionRecibo || `${contrato.servicio} - ${horasTrabajadas} hrs`;
      monto = contrato.cobroCliente?.montoMensual || 0;
      break;
      
    case 'hibrido':
      descripcion = contrato.descripcionRecibo || `${contrato.servicio} - ${horasTrabajadas} hrs`;
      monto = contrato.cobroCliente?.montoMensual || 0;
      break;
      
    case 'paquete':
      descripcion = contrato.descripcionRecibo || `Paquete ${contrato.servicio} - ${horasTrabajadas} hrs`;
      monto = contrato.cobroCliente?.montoMensual || 0;
      break;
      
    case 'desglosado':
      // Para desglosado, no se usa esta función, se muestran las citas individuales
      descripcion = contrato.descripcionRecibo || contrato.servicio;
      monto = horasTrabajadas * (contrato.cobroCliente?.montoPorHora || 0);
      break;
      
    default:
      descripcion = contrato.servicio;
      monto = contrato.cobroCliente?.montoMensual || 0;
  }

  return {
    descripcion,
    cantidad: horasTrabajadas,
    precioUnitario: monto / horasTrabajadas || 0,
    subtotal: monto,
    esContratoMensual: true,
    contratoId: contrato.id,
    tipoContrato: contrato.tipoContrato
  };
};
