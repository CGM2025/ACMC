import { db } from '../firebase';
import { 
  collection, 
  getDocs,
  addDoc,
  writeBatch,
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

/**
 * API para gestión de utilidad histórica en Firebase
 * VERSIÓN MULTI-TENANT: Todas las operaciones filtran por organizationId
 */

const COLLECTION_NAME = 'utilidadHistorica';

/**
 * Obtiene toda la utilidad histórica de una organización ordenada por fecha
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de registros históricos
 */
export const obtenerUtilidadHistorica = async (organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        orderBy('año', 'desc'),
        orderBy('mes', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        orderBy('año', 'desc'),
        orderBy('mes', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Si falla por índice, intentar sin ordenar
    console.warn('Intentando sin orderBy:', error.message);
    try {
      let snapshot;
      
      if (organizationId) {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('organizationId', '==', organizationId)
        );
        snapshot = await getDocs(q);
      } else {
        snapshot = await getDocs(collection(db, COLLECTION_NAME));
      }
      
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar en JavaScript
      return datos.sort((a, b) => {
        if (a.año !== b.año) return b.año - a.año;
        return b.mes - a.mes;
      });
    } catch (err) {
      console.error('Error al obtener utilidad histórica:', err);
      throw err;
    }
  }
};

/**
 * Guarda el cierre de mes con todos los detalles
 * @param {Object} datosCierre - Datos del cierre de mes
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const guardarCierreMes = async (datosCierre, organizationId) => {
  try {
    const {
      año,
      mes,
      mesNombre,
      ingresos,
      cantidadPagos,
      gastos,
      totalGastos,
      utilidad,
      notas,
      fechaCierre
    } = datosCierre;

    // Verificar que no exista ya un registro para este mes
    const existente = await verificarMesCerrado(año, mes, organizationId);
    if (existente) {
      throw new Error(`El mes ${mesNombre} ${año} ya ha sido cerrado`);
    }

    // Crear documento con toda la información
    const docData = {
      año,
      mes,
      mesNombre,
      ingresos,
      cantidadPagos,
      gastos: {
        nomina: gastos.nomina || 0,
        pagoTerapeutas: gastos.pagoTerapeutas || 0,
        renta: gastos.renta || 0,
        servicios: gastos.servicios || 0,
        otros: gastos.otros || 0
      },
      totalGastos,
      utilidad,
      notas: notas || '',
      fechaCierre,
      // Campo legacy para compatibilidad
      fechaImportacion: fechaCierre,
      ...(organizationId && { organizationId }),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

    return {
      success: true,
      id: docRef.id,
      message: `Cierre de ${mesNombre} ${año} guardado exitosamente`
    };

  } catch (error) {
    console.error('Error al guardar cierre de mes:', error);
    throw error;
  }
};

/**
 * Verifica si un mes ya ha sido cerrado
 * @param {number} año - Año
 * @param {number} mes - Mes (1-12)
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<boolean>} - True si ya está cerrado
 */
export const verificarMesCerrado = async (año, mes, organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('año', '==', año),
        where('mes', '==', mes)
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('año', '==', año),
        where('mes', '==', mes)
      );
    }
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error verificando mes cerrado:', error);
    return false;
  }
};

/**
 * Obtiene el resumen de utilidad por año
 * @param {number} año - Año a consultar
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Object>} - Resumen del año
 */
export const obtenerResumenAnual = async (año, organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('año', '==', año)
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('año', '==', año)
      );
    }
    
    const snapshot = await getDocs(q);
    
    const meses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const resumen = {
      año,
      mesesCerrados: meses.length,
      totalIngresos: meses.reduce((sum, m) => sum + (m.ingresos || 0), 0),
      totalGastos: meses.reduce((sum, m) => sum + (m.totalGastos || 0), 0),
      totalUtilidad: meses.reduce((sum, m) => sum + (m.utilidad || 0), 0),
      detalleGastos: {
        nomina: meses.reduce((sum, m) => sum + (m.gastos?.nomina || 0), 0),
        pagoTerapeutas: meses.reduce((sum, m) => sum + (m.gastos?.pagoTerapeutas || 0), 0),
        renta: meses.reduce((sum, m) => sum + (m.gastos?.renta || 0), 0),
        servicios: meses.reduce((sum, m) => sum + (m.gastos?.servicios || 0), 0),
        otros: meses.reduce((sum, m) => sum + (m.gastos?.otros || 0), 0)
      },
      meses: meses.sort((a, b) => a.mes - b.mes)
    };

    return resumen;
  } catch (error) {
    console.error('Error obteniendo resumen anual:', error);
    throw error;
  }
};

/**
 * Importa datos históricos en batch (función legacy)
 * @param {Array} datosHistoricos - Array de registros históricos
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<number>} - Número de registros importados
 */
export const importarUtilidadHistorica = async (datosHistoricos, organizationId) => {
  try {
    const batch = writeBatch(db);
    
    datosHistoricos.forEach(dato => {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, {
        año: dato.año,
        mes: dato.mes,
        utilidad: dato.utilidad,
        // Campos adicionales si vienen
        ingresos: dato.ingresos || null,
        totalGastos: dato.totalGastos || null,
        gastos: dato.gastos || null,
        fechaImportacion: new Date().toISOString(),
        ...(organizationId && { organizationId }),
        createdAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    return datosHistoricos.length;
  } catch (error) {
    console.error('Error al importar utilidad histórica:', error);
    throw error;
  }
};
