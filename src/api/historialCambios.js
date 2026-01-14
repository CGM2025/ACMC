// src/api/historialCambios.js
//
// API para gestión del historial de cambios (audit log)
// Registra cambios en asignaciones, contratos y otros documentos importantes
//

import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'historialCambios';

/**
 * Tipos de entidad que se pueden rastrear
 */
export const TIPOS_ENTIDAD = {
  ASIGNACION: 'asignacion',
  CONTRATO: 'contrato',
  TERAPEUTA: 'terapeuta',
  CLIENTE: 'cliente'
};

/**
 * Tipos de acción
 */
export const TIPOS_ACCION = {
  CREAR: 'crear',
  ACTUALIZAR: 'actualizar',
  ELIMINAR: 'eliminar',
  DESACTIVAR: 'desactivar',
  REACTIVAR: 'reactivar'
};

/**
 * Compara dos objetos y retorna las diferencias
 * @param {Object} anterior - Objeto anterior
 * @param {Object} nuevo - Objeto nuevo
 * @returns {Array} - Array de cambios [{campo, valorAnterior, valorNuevo}]
 */
export const detectarCambios = (anterior, nuevo) => {
  const cambios = [];
  const camposIgnorar = ['id', 'createdAt', 'updatedAt', 'organizationId'];

  // Obtener todos los campos únicos de ambos objetos
  const todosCampos = new Set([
    ...Object.keys(anterior || {}),
    ...Object.keys(nuevo || {})
  ]);

  for (const campo of todosCampos) {
    if (camposIgnorar.includes(campo)) continue;

    const valorAnterior = anterior?.[campo];
    const valorNuevo = nuevo?.[campo];

    // Comparar valores (convertir a JSON para comparar objetos/arrays)
    const anteriorStr = JSON.stringify(valorAnterior);
    const nuevoStr = JSON.stringify(valorNuevo);

    if (anteriorStr !== nuevoStr) {
      cambios.push({
        campo,
        valorAnterior: valorAnterior,
        valorNuevo: valorNuevo
      });
    }
  }

  return cambios;
};

/**
 * Formatea un campo para mostrar de manera legible
 */
const formatearCampo = (campo) => {
  const mapeo = {
    precioCliente: 'Precio Cliente',
    pagoTerapeuta: 'Pago Terapeuta',
    clienteNombre: 'Cliente',
    terapeutaNombre: 'Terapeuta',
    servicioNombre: 'Servicio',
    cobroCliente: 'Cobro al Cliente',
    pagoTerapeutas: 'Pago a Terapeutas',
    horasEstimadas: 'Horas Estimadas',
    horasSemanales: 'Horas Semanales',
    montoMensual: 'Monto Mensual',
    montoPorHora: 'Monto por Hora',
    tarifaPorHora: 'Tarifa por Hora',
    activo: 'Estado Activo',
    terapeutas: 'Terapeutas',
    servicio: 'Servicio',
    tipoContrato: 'Tipo de Contrato',
    descripcionRecibo: 'Descripción para Recibo',
    condicion: 'Condición/Horario'
  };

  return mapeo[campo] || campo.charAt(0).toUpperCase() + campo.slice(1);
};

// Mapeo de días de la semana
const DIAS_SEMANA_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Formatea un valor para mostrar de manera legible
 */
const formatearValor = (valor) => {
  if (valor === null || valor === undefined) return '(vacío)';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'number') {
    // Si parece un monto de dinero
    if (valor >= 100) {
      return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    }
    return valor.toString();
  }
  if (Array.isArray(valor)) {
    if (valor.length === 0) return '(ninguno)';
    // Si es array de terapeutas
    if (valor[0]?.nombre) {
      return valor.map(t => t.nombre).join(', ');
    }
    return valor.join(', ');
  }
  if (typeof valor === 'object') {
    // Cobro al cliente u objeto similar
    if (valor.montoMensual !== undefined) {
      return `$${valor.montoMensual?.toLocaleString('es-MX') || 0}/mes`;
    }
    if (valor.montoPorHora !== undefined) {
      return `$${valor.montoPorHora?.toLocaleString('es-MX') || 0}/hr`;
    }
    // Condición de asignación
    if (valor.tipo) {
      if (valor.tipo === 'diaSemana' && valor.diaSemana !== null && valor.diaSemana !== undefined) {
        return `Por día: ${DIAS_SEMANA_NOMBRES[valor.diaSemana] || valor.diaSemana}`;
      }
      if (valor.tipo === 'horario' && valor.horaInicio && valor.horaFin) {
        return `Por horario: ${valor.horaInicio}-${valor.horaFin}`;
      }
      if (valor.tipo === 'siempre') {
        return 'Siempre';
      }
      return valor.tipo;
    }
    return JSON.stringify(valor);
  }
  return String(valor);
};

/**
 * Registra un cambio en el historial
 * @param {Object} params
 * @param {string} params.tipoEntidad - Tipo de entidad (asignacion, contrato, etc.)
 * @param {string} params.entidadId - ID del documento
 * @param {string} params.accion - Tipo de acción (crear, actualizar, eliminar)
 * @param {Object} params.datosAnteriores - Estado anterior del documento (null si es creación)
 * @param {Object} params.datosNuevos - Estado nuevo del documento (null si es eliminación)
 * @param {Object} params.usuario - Usuario que realizó el cambio {id, nombre, email}
 * @param {string} params.organizationId - ID de la organización
 * @param {string} params.descripcion - Descripción adicional del cambio (opcional)
 */
export const registrarCambio = async ({
  tipoEntidad,
  entidadId,
  accion,
  datosAnteriores,
  datosNuevos,
  usuario,
  organizationId,
  descripcion = ''
}) => {
  try {
    if (!organizationId) {
      console.warn('registrarCambio: organizationId no proporcionado');
      return null;
    }

    // Detectar cambios específicos si es una actualización
    let cambiosDetectados = [];
    if (accion === TIPOS_ACCION.ACTUALIZAR && datosAnteriores && datosNuevos) {
      cambiosDetectados = detectarCambios(datosAnteriores, datosNuevos);

      // Si no hay cambios reales, no registrar
      if (cambiosDetectados.length === 0) {
        console.log('No se detectaron cambios, omitiendo registro');
        return null;
      }
    }

    // Generar resumen legible de los cambios
    let resumenCambios = '';
    if (cambiosDetectados.length > 0) {
      resumenCambios = cambiosDetectados.map(c =>
        `${formatearCampo(c.campo)}: ${formatearValor(c.valorAnterior)} → ${formatearValor(c.valorNuevo)}`
      ).join(' | ');
    }

    // Generar nombre de referencia (cliente, terapeuta, etc.)
    const nombreReferencia = datosNuevos?.clienteNombre ||
                            datosAnteriores?.clienteNombre ||
                            datosNuevos?.nombre ||
                            datosAnteriores?.nombre ||
                            'N/A';

    const registro = {
      tipoEntidad,
      entidadId,
      accion,
      nombreReferencia,

      // Datos completos (para poder ver el estado exacto)
      datosAnteriores: datosAnteriores || null,
      datosNuevos: datosNuevos || null,

      // Cambios específicos detectados
      cambios: cambiosDetectados,
      resumenCambios,

      // Info del usuario
      usuarioId: usuario?.id || usuario?.uid || null,
      usuarioNombre: usuario?.nombre || usuario?.email || 'Sistema',
      usuarioEmail: usuario?.email || null,

      // Descripción adicional
      descripcion,

      // Metadata
      organizationId,
      fecha: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), registro);
    console.log(`✅ Cambio registrado en historial: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error al registrar cambio en historial:', error);
    // No lanzar error para no interrumpir la operación principal
    return null;
  }
};

/**
 * Obtiene el historial de cambios de una entidad específica
 * @param {string} entidadId - ID del documento
 * @param {string} organizationId - ID de la organización
 * @returns {Array} - Lista de cambios ordenados por fecha descendente
 */
export const obtenerHistorialEntidad = async (entidadId, organizationId) => {
  try {
    if (!organizationId || !entidadId) return [];

    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('entidadId', '==', entidadId),
      orderBy('fecha', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().fecha?.toDate?.() || new Date()
    }));
  } catch (error) {
    console.error('Error al obtener historial de entidad:', error);
    return [];
  }
};

/**
 * Obtiene el historial de cambios por tipo de entidad
 * @param {string} tipoEntidad - Tipo de entidad (asignacion, contrato, etc.)
 * @param {string} organizationId - ID de la organización
 * @param {number} limite - Número máximo de registros (default 50)
 * @returns {Array} - Lista de cambios
 */
export const obtenerHistorialPorTipo = async (tipoEntidad, organizationId, limite = 50) => {
  try {
    if (!organizationId) return [];

    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('tipoEntidad', '==', tipoEntidad),
      orderBy('fecha', 'desc'),
      limit(limite)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().fecha?.toDate?.() || new Date()
    }));
  } catch (error) {
    console.error('Error al obtener historial por tipo:', error);
    return [];
  }
};

/**
 * Obtiene todo el historial de cambios de una organización
 * @param {string} organizationId - ID de la organización
 * @param {number} limite - Número máximo de registros (default 100)
 * @returns {Array} - Lista de cambios
 */
export const obtenerHistorialCompleto = async (organizationId, limite = 100) => {
  try {
    if (!organizationId) return [];

    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      orderBy('fecha', 'desc'),
      limit(limite)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().fecha?.toDate?.() || new Date()
    }));
  } catch (error) {
    console.error('Error al obtener historial completo:', error);
    return [];
  }
};
