import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { obtenerPagos } from './pagos';

/**
 * API para gestión de recibos en Firebase
 * VERSIÓN MULTI-TENANT: Todas las operaciones filtran por organizationId
 */

const COLLECTION_NAME = 'recibos';

/**
 * Obtiene todos los recibos de una organización ordenados por fecha
 * Usa orderBy nativo de Firestore para mejor rendimiento
 * NOTA: Requiere índice compuesto (organizationId + fechaGeneracion) en Firestore
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de recibos
 */
export const obtenerRecibos = async (organizationId) => {
  try {
    let q;

    if (organizationId) {
      // Consulta optimizada con índice compuesto
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        orderBy('fechaGeneracion', 'desc')
      );
    } else {
      // Fallback sin filtro de organización
      q = query(
        collection(db, COLLECTION_NAME),
        orderBy('fechaGeneracion', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Si falla por falta de índice, hacer fallback a ordenamiento manual
    if (error.code === 'failed-precondition') {
      console.warn('Índice no encontrado, usando ordenamiento manual. Crea el índice para mejor rendimiento.');
      const fallbackQuery = organizationId
        ? query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId))
        : collection(db, COLLECTION_NAME);

      const snapshot = await getDocs(fallbackQuery);
      const recibos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return recibos.sort((a, b) => {
        const dateA = new Date(a.fechaGeneracion || 0);
        const dateB = new Date(b.fechaGeneracion || 0);
        return dateB - dateA;
      });
    }
    console.error('Error al obtener recibos:', error);
    throw error;
  }
};

/**
 * Obtiene los recibos de un cliente específico
 * @param {string} clienteNombre - Nombre del cliente
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de recibos del cliente
 */
export const obtenerRecibosPorCliente = async (clienteNombre, organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('clienteNombre', '==', clienteNombre)
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('clienteNombre', '==', clienteNombre)
      );
    }
    
    const snapshot = await getDocs(q);
    
    // Ordenar manualmente
    const recibos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return recibos.sort((a, b) => {
      const dateA = new Date(a.fechaGeneracion || 0);
      const dateB = new Date(b.fechaGeneracion || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error al obtener recibos por cliente:', error);
    throw error;
  }
};

/**
 * Obtiene los recibos de un mes específico
 * @param {string} mes - Mes en formato YYYY-MM
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de recibos del mes
 */
export const obtenerRecibosPorMes = async (mes, organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('mes', '==', mes)
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('mes', '==', mes)
      );
    }
    
    const snapshot = await getDocs(q);
    
    // Ordenar manualmente por nombre de cliente
    const recibos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return recibos.sort((a, b) => 
      (a.clienteNombre || '').localeCompare(b.clienteNombre || '')
    );
  } catch (error) {
    console.error('Error al obtener recibos por mes:', error);
    throw error;
  }
};

/**
 * Crea un nuevo recibo
 * @param {Object} reciboData - Datos del recibo
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<string>} - ID del recibo creado
 */
export const crearRecibo = async (reciboData, organizationId) => {
  try {
    // Validar que tenga los campos obligatorios
    if (!reciboData.reciboId || !reciboData.mes || !reciboData.clienteNombre) {
      throw new Error('Faltan campos obligatorios: reciboId, mes, clienteNombre');
    }

    // Establecer valores por defecto
    const reciboCompleto = {
      ...reciboData,
      montoPagado: reciboData.montoPagado || 0,
      estadoPago: reciboData.estadoPago || 'pendiente',
      fechaGeneracion: reciboData.fechaGeneracion || new Date().toISOString(),
      ...(organizationId && { organizationId }),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), reciboCompleto);
    console.log('✅ Recibo creado:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear recibo:', error);
    throw error;
  }
};

/**
 * Actualiza un recibo existente
 * @param {string} reciboId - ID del recibo en Firebase
 * @param {Object} reciboData - Nuevos datos del recibo
 * @returns {Promise<void>}
 */
export const actualizarRecibo = async (reciboId, reciboData) => {
  try {
    const dataConTimestamp = {
      ...reciboData,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, COLLECTION_NAME, reciboId), dataConTimestamp);
    console.log('✅ Recibo actualizado:', reciboId);
  } catch (error) {
    console.error('Error al actualizar recibo:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de pago de un recibo
 * Calcula automáticamente el estado basado en el monto pagado
 * @param {string} reciboId - ID del recibo en Firebase
 * @param {number} montoPagado - Monto total pagado hasta ahora
 * @param {number} totalGeneral - Total del recibo
 * @returns {Promise<void>}
 */
export const actualizarEstadoPagoRecibo = async (reciboId, montoPagado, totalGeneral) => {
  try {
    let estadoPago = 'pendiente';
    
    if (montoPagado >= totalGeneral) {
      estadoPago = 'pagado';
    } else if (montoPagado > 0) {
      estadoPago = 'parcial';
    }

    await updateDoc(doc(db, COLLECTION_NAME, reciboId), {
      montoPagado,
      estadoPago,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Estado de pago actualizado:', { reciboId, montoPagado, estadoPago });
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    throw error;
  }
};

/**
 * Elimina un recibo
 * @param {string} reciboId - ID del recibo en Firebase
 * @returns {Promise<void>}
 */
export const eliminarRecibo = async (reciboId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, reciboId));
    console.log('✅ Recibo eliminado:', reciboId);
  } catch (error) {
    console.error('Error al eliminar recibo:', error);
    throw error;
  }
};

/**
 * Genera un ID único para un recibo
 * Formato: REC-YYYY-MM-CODIGOCLIENTE
 * Ejemplo: REC-2025-01-CLI001
 * @param {string} mes - Mes en formato YYYY-MM
 * @param {string} clienteCodigo - Código del cliente
 * @returns {string} - ID único del recibo
 */
export const generarReciboId = (mes, clienteCodigo) => {
  const [year, month] = mes.split('-');
  return `REC-${year}-${month}-${clienteCodigo}`;
};

/**
 * Recalcula y corrige los saldos de todos los recibos basándose en los pagos reales.
 * Útil para corregir inconsistencias de datos históricos.
 * ADVERTENCIA: Solo ejecutar como administrador o en mantenimiento.
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Object>} - Resultado con cantidad de recibos corregidos
 */
export const recalcularSaldosRecibos = async (organizationId) => {
  try {
    // Obtener todos los recibos y pagos
    const recibos = await obtenerRecibos(organizationId);
    const pagos = await obtenerPagos(); // pagos.js no filtra por org aún

    const batch = writeBatch(db);
    let corregidos = 0;
    const detalles = [];

    for (const recibo of recibos) {
      // Sumar pagos vinculados a este recibo
      const pagosDelRecibo = pagos.filter(p => p.reciboFirebaseId === recibo.id);
      const totalPagadoReal = pagosDelRecibo.reduce((sum, p) => sum + Number(p.monto || 0), 0);

      // Determinar estado correcto
      let estadoReal = 'pendiente';
      const totalGeneral = Number(recibo.totalGeneral || 0);
      if (totalPagadoReal >= totalGeneral - 0.01) {
        estadoReal = 'pagado';
      } else if (totalPagadoReal > 0.01) {
        estadoReal = 'parcial';
      }

      // Verificar si hay discrepancia
      const montoPagadoActual = Number(recibo.montoPagado || 0);
      const hayDiscrepanciaMonto = Math.abs(totalPagadoReal - montoPagadoActual) > 0.01;
      const hayDiscrepanciaEstado = recibo.estadoPago !== estadoReal;

      if (hayDiscrepanciaMonto || hayDiscrepanciaEstado) {
        const docRef = doc(db, COLLECTION_NAME, recibo.id);
        batch.update(docRef, {
          montoPagado: totalPagadoReal,
          estadoPago: estadoReal,
          fechaUltimaActualizacion: new Date().toISOString()
        });

        detalles.push({
          reciboId: recibo.reciboId,
          antes: { montoPagado: montoPagadoActual, estadoPago: recibo.estadoPago },
          despues: { montoPagado: totalPagadoReal, estadoPago: estadoReal }
        });

        corregidos++;
      }
    }

    if (corregidos > 0) {
      await batch.commit();
      console.log(`Se corrigieron ${corregidos} recibos desincronizados.`);
    } else {
      console.log('Todos los recibos están correctos.');
    }

    return {
      exito: true,
      totalRevisados: recibos.length,
      corregidos,
      detalles
    };
  } catch (error) {
    console.error('Error al recalcular saldos:', error);
    return {
      exito: false,
      error: error.message
    };
  }
};
