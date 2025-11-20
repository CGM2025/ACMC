import { db } from '../firebase';
import { runTransaction, collection, doc, getDoc } from 'firebase/firestore';

/**
 * API para transacciones atómicas de pagos y recibos
 * Asegura integridad de datos usando runTransaction de Firestore
 */

/**
 * Registra un pago y actualiza el recibo vinculado de manera atómica
 * Si cualquier operación falla, ambas se revierten
 * 
 * @param {Object} pagoData - Datos del pago a registrar
 * @param {string} pagoData.clienteId - ID del cliente
 * @param {number} pagoData.monto - Monto del pago
 * @param {string} pagoData.concepto - Concepto del pago
 * @param {string} pagoData.metodo - Método de pago (efectivo, transferencia, etc.)
 * @param {string} pagoData.fecha - Fecha del pago
 * @param {string|null} reciboFirebaseId - ID del recibo en Firebase (opcional)
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const registrarPagoVinculado = async (pagoData, reciboFirebaseId = null) => {
  try {
    const resultado = await runTransaction(db, async (transaction) => {
      // 1. Crear referencia para el nuevo pago
      const nuevoPagoRef = doc(collection(db, 'pagos'));
      
      // 2. Si hay recibo vinculado, leer y actualizar
      let reciboActualizado = null;
      
      if (reciboFirebaseId) {
        const reciboRef = doc(db, 'recibos', reciboFirebaseId);
        
        // Leer el recibo (debe hacerse antes de cualquier escritura)
        const reciboDoc = await transaction.get(reciboRef);
        
        if (!reciboDoc.exists()) {
          throw new Error(`El recibo con ID ${reciboFirebaseId} no existe.`);
        }
        
        const reciboData = reciboDoc.data();
        
        // 3. Calcular nuevos valores
        const montoActual = Number(reciboData.montoPagado || 0);
        const montoPago = Number(pagoData.monto);
        const nuevoMontoPagado = montoActual + montoPago;
        const totalGeneral = Number(reciboData.totalGeneral || 0);
        
        // Calcular nuevo estado (con tolerancia para errores de punto flotante)
        let nuevoEstado = 'parcial';
        if (nuevoMontoPagado < 0.01) {
          nuevoEstado = 'pendiente';
        } else if (nuevoMontoPagado >= (totalGeneral - 0.01)) {
          nuevoEstado = 'pagado';
        }
        
        // 4. Actualizar el recibo
        transaction.update(reciboRef, {
          montoPagado: nuevoMontoPagado,
          estadoPago: nuevoEstado,
          fechaUltimaActualizacion: new Date().toISOString()
        });
        
        reciboActualizado = {
          id: reciboFirebaseId,
          reciboId: reciboData.reciboId,
          nuevoMontoPagado,
          nuevoEstado,
          totalGeneral
        };
      }
      
      // 5. Crear el pago
      const pagoCompleto = {
        ...pagoData,
        monto: Number(pagoData.monto),
        reciboFirebaseId: reciboFirebaseId || null,
        fechaRegistro: new Date().toISOString()
      };
      
      transaction.set(nuevoPagoRef, pagoCompleto);
      
      return {
        pagoId: nuevoPagoRef.id,
        reciboActualizado
      };
    });
    
    console.log('✅ Transacción exitosa:', resultado);
    
    return {
      exito: true,
      pagoId: resultado.pagoId,
      mensaje: reciboFirebaseId 
        ? `Pago registrado y recibo ${resultado.reciboActualizado.reciboId} actualizado exitosamente.`
        : 'Pago registrado exitosamente (sin recibo vinculado).',
      reciboActualizado: resultado.reciboActualizado
    };
    
  } catch (error) {
    console.error('❌ Error en transacción de pago:', error);
    
    return {
      exito: false,
      mensaje: `Error al registrar pago: ${error.message}`,
      error: error.message
    };
  }
};

/**
 * Actualiza un pago existente y recalcula el estado del recibo vinculado
 * Maneja la transición entre recibos si se cambia la vinculación
 * 
 * @param {string} pagoId - ID del pago a actualizar
 * @param {Object} nuevosDatos - Nuevos datos del pago
 * @param {string|null} reciboFirebaseIdAnterior - ID del recibo anterior (puede ser null)
 * @param {string|null} reciboFirebaseIdNuevo - ID del nuevo recibo (puede ser null)
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const actualizarPagoVinculado = async (
  pagoId, 
  nuevosDatos, 
  reciboFirebaseIdAnterior = null, 
  reciboFirebaseIdNuevo = null
) => {
  try {
    const resultado = await runTransaction(db, async (transaction) => {
      const pagoRef = doc(db, 'pagos', pagoId);
      
      // Leer el pago actual
      const pagoDoc = await transaction.get(pagoRef);
      if (!pagoDoc.exists()) {
        throw new Error(`El pago con ID ${pagoId} no existe.`);
      }
      
      const pagoActual = pagoDoc.data();
      const montoAnterior = Number(pagoActual.monto || 0);
      const montoNuevo = Number(nuevosDatos.monto);
      
      // Si había un recibo anterior, revertir su monto
      if (reciboFirebaseIdAnterior) {
        const reciboAnteriorRef = doc(db, 'recibos', reciboFirebaseIdAnterior);
        const reciboAnteriorDoc = await transaction.get(reciboAnteriorRef);
        
        if (reciboAnteriorDoc.exists()) {
          const reciboAnteriorData = reciboAnteriorDoc.data();
          const nuevoMontoPagadoAnterior = Number(reciboAnteriorData.montoPagado || 0) - montoAnterior;
          
          let estadoAnterior = 'pendiente';
          if (nuevoMontoPagadoAnterior > 0.01) {
            estadoAnterior = nuevoMontoPagadoAnterior >= (reciboAnteriorData.totalGeneral - 0.01) 
              ? 'pagado' 
              : 'parcial';
          }
          
          transaction.update(reciboAnteriorRef, {
            montoPagado: Math.max(0, nuevoMontoPagadoAnterior),
            estadoPago: estadoAnterior,
            fechaUltimaActualizacion: new Date().toISOString()
          });
        }
      }
      
      // Si hay un recibo nuevo, aplicar el monto
      if (reciboFirebaseIdNuevo) {
        const reciboNuevoRef = doc(db, 'recibos', reciboFirebaseIdNuevo);
        const reciboNuevoDoc = await transaction.get(reciboNuevoRef);
        
        if (!reciboNuevoDoc.exists()) {
          throw new Error(`El recibo con ID ${reciboFirebaseIdNuevo} no existe.`);
        }
        
        const reciboNuevoData = reciboNuevoDoc.data();
        const nuevoMontoPagado = Number(reciboNuevoData.montoPagado || 0) + montoNuevo;
        
        let estadoNuevo = 'parcial';
        if (nuevoMontoPagado < 0.01) {
          estadoNuevo = 'pendiente';
        } else if (nuevoMontoPagado >= (reciboNuevoData.totalGeneral - 0.01)) {
          estadoNuevo = 'pagado';
        }
        
        transaction.update(reciboNuevoRef, {
          montoPagado: nuevoMontoPagado,
          estadoPago: estadoNuevo,
          fechaUltimaActualizacion: new Date().toISOString()
        });
      }
      
      // Actualizar el pago
      transaction.update(pagoRef, {
        ...nuevosDatos,
        monto: montoNuevo,
        reciboFirebaseId: reciboFirebaseIdNuevo || null,
        fechaActualizacion: new Date().toISOString()
      });
      
      return { pagoId };
    });
    
    console.log('✅ Pago actualizado exitosamente:', resultado);
    
    return {
      exito: true,
      pagoId: resultado.pagoId,
      mensaje: 'Pago actualizado y recibos recalculados exitosamente.'
    };
    
  } catch (error) {
    console.error('❌ Error al actualizar pago:', error);
    
    return {
      exito: false,
      mensaje: `Error al actualizar pago: ${error.message}`,
      error: error.message
    };
  }
};

/**
 * Elimina un pago y revierte el monto en el recibo vinculado
 * 
 * @param {string} pagoId - ID del pago a eliminar
 * @param {string|null} reciboFirebaseId - ID del recibo vinculado (opcional)
 * @param {number} montoPago - Monto del pago a revertir
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const eliminarPagoVinculado = async (pagoId, reciboFirebaseId = null, montoPago = 0) => {
  try {
    await runTransaction(db, async (transaction) => {
      const pagoRef = doc(db, 'pagos', pagoId);
      
      // Si hay recibo vinculado, revertir el monto
      if (reciboFirebaseId) {
        const reciboRef = doc(db, 'recibos', reciboFirebaseId);
        const reciboDoc = await transaction.get(reciboRef);
        
        if (reciboDoc.exists()) {
          const reciboData = reciboDoc.data();
          const nuevoMontoPagado = Math.max(0, Number(reciboData.montoPagado || 0) - Number(montoPago));
          
          let nuevoEstado = 'pendiente';
          if (nuevoMontoPagado > 0.01) {
            nuevoEstado = nuevoMontoPagado >= (reciboData.totalGeneral - 0.01) 
              ? 'pagado' 
              : 'parcial';
          }
          
          transaction.update(reciboRef, {
            montoPagado: nuevoMontoPagado,
            estadoPago: nuevoEstado,
            fechaUltimaActualizacion: new Date().toISOString()
          });
        }
      }
      
      // Eliminar el pago
      transaction.delete(pagoRef);
    });
    
    console.log('✅ Pago eliminado y recibo actualizado exitosamente');
    
    return {
      exito: true,
      mensaje: 'Pago eliminado y recibo actualizado exitosamente.'
    };
    
  } catch (error) {
    console.error('❌ Error al eliminar pago:', error);
    
    return {
      exito: false,
      mensaje: `Error al eliminar pago: ${error.message}`,
      error: error.message
    };
  }
};
