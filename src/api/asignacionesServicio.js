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

/**
 * API para gestión de asignaciones de servicio
 * Vincula Cliente + Terapeuta → Servicio con precios específicos
 */

const COLLECTION_NAME = 'asignacionesServicio';

/**
 * Obtiene todas las asignaciones de una organización
 */
export const obtenerAsignaciones = async (organizationId) => {
  try {
    if (!organizationId) {
      console.warn('obtenerAsignaciones: organizationId no proporcionado');
      return [];
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId)
    );
    
    const snapshot = await getDocs(q);
    const asignaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('✅ Asignaciones cargadas:', asignaciones.length);
    return asignaciones;
  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    throw error;
  }
};

/**
 * Obtiene asignaciones para un cliente específico
 */
export const obtenerAsignacionesPorCliente = async (clienteId, organizationId) => {
  try {
    if (!organizationId) return [];

    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('clienteId', '==', clienteId),
      where('activo', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener asignaciones por cliente:', error);
    throw error;
  }
};

/**
 * Obtiene asignaciones para una terapeuta específica
 */
export const obtenerAsignacionesPorTerapeuta = async (terapeutaId, organizationId) => {
  try {
    if (!organizationId) return [];

    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('terapeutaId', '==', terapeutaId),
      where('activo', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener asignaciones por terapeuta:', error);
    throw error;
  }
};

/**
 * Busca una asignación específica para Cliente + Terapeuta
 * Opcionalmente filtra por horario o día de semana
 * @param {string} clienteNombre - Nombre del cliente
 * @param {string} terapeutaNombre - Nombre de la terapeuta
 * @param {string} hora - Hora de la cita (formato "HH:MM")
 * @param {string} organizationId - ID de la organización
 * @param {string} fecha - Fecha de la cita (formato "YYYY-MM-DD") para determinar día de semana
 */
export const buscarAsignacion = async (clienteNombre, terapeutaNombre, hora, organizationId, fecha = null) => {
  try {
    if (!organizationId) return null;

    // Primero buscar todas las asignaciones activas para este cliente y terapeuta
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('clienteNombre', '==', clienteNombre),
      where('terapeutaNombre', '==', terapeutaNombre),
      where('activo', '==', true)
    );

    const snapshot = await getDocs(q);
    const asignaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (asignaciones.length === 0) return null;

    // Si solo hay una, retornarla
    if (asignaciones.length === 1) return asignaciones[0];

    // Obtener día de la semana si se proporciona fecha
    let diaSemana = null;
    if (fecha) {
      const fechaObj = new Date(fecha + 'T12:00:00'); // Evitar problemas de zona horaria
      diaSemana = fechaObj.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    }

    // Prioridad 1: Buscar asignación por día de semana
    if (diaSemana !== null) {
      const asigPorDia = asignaciones.find(asig =>
        asig.condicion?.tipo === 'diaSemana' &&
        asig.condicion.diaSemana === diaSemana
      );
      if (asigPorDia) return asigPorDia;
    }

    // Prioridad 2: Buscar asignación por horario
    if (hora) {
      const horaNum = parseInt(hora.split(':')[0]);

      for (const asig of asignaciones) {
        if (asig.condicion?.tipo === 'horario' && asig.condicion.horaInicio && asig.condicion.horaFin) {
          const inicioNum = parseInt(asig.condicion.horaInicio.split(':')[0]);
          const finNum = parseInt(asig.condicion.horaFin.split(':')[0]);

          if (horaNum >= inicioNum && horaNum < finNum) {
            return asig;
          }
        }
      }
    }

    // Prioridad 3: Buscar la que tenga condición "siempre"
    const siempre = asignaciones.find(a => a.condicion?.tipo === 'siempre' || !a.condicion?.tipo);
    if (siempre) return siempre;

    // Retornar la primera como fallback
    return asignaciones[0];
  } catch (error) {
    console.error('Error al buscar asignación:', error);
    return null;
  }
};

/**
 * Crea una nueva asignación
 * @param {Object} asignacionData - Datos de la asignación
 * @param {string} organizationId - ID de la organización
 * @param {Object} usuario - Usuario que realiza la acción (opcional, para historial)
 */
export const crearAsignacion = async (asignacionData, organizationId, usuario = null) => {
  try {
    if (!organizationId) {
      throw new Error('organizationId es requerido');
    }

    const datosCompletos = {
      ...asignacionData,
      activo: true,
      organizationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), datosCompletos);

    // Registrar en historial
    await registrarCambio({
      tipoEntidad: TIPOS_ENTIDAD.ASIGNACION,
      entidadId: docRef.id,
      accion: TIPOS_ACCION.CREAR,
      datosAnteriores: null,
      datosNuevos: { ...asignacionData, id: docRef.id },
      usuario,
      organizationId,
      descripcion: `Nueva asignación: ${asignacionData.clienteNombre} - ${asignacionData.terapeutaNombre}`
    });

    console.log('✅ Asignación creada:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear asignación:', error);
    throw error;
  }
};

/**
 * Actualiza una asignación existente
 * @param {string} asignacionId - ID de la asignación
 * @param {Object} asignacionData - Nuevos datos
 * @param {Object} usuario - Usuario que realiza la acción (opcional, para historial)
 */
export const actualizarAsignacion = async (asignacionId, asignacionData, usuario = null) => {
  try {
    const { organizationId, createdAt, ...datosActualizar } = asignacionData;

    // Obtener datos anteriores para el historial
    const docRef = doc(db, COLLECTION_NAME, asignacionId);
    const docSnap = await getDoc(docRef);
    const datosAnteriores = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;

    await updateDoc(docRef, {
      ...datosActualizar,
      updatedAt: serverTimestamp()
    });

    // Registrar en historial si hay datos anteriores
    if (datosAnteriores) {
      await registrarCambio({
        tipoEntidad: TIPOS_ENTIDAD.ASIGNACION,
        entidadId: asignacionId,
        accion: TIPOS_ACCION.ACTUALIZAR,
        datosAnteriores,
        datosNuevos: { ...datosAnteriores, ...datosActualizar },
        usuario,
        organizationId: datosAnteriores.organizationId,
        descripcion: `Asignación actualizada: ${datosAnteriores.clienteNombre || 'N/A'}`
      });
    }

    console.log('✅ Asignación actualizada:', asignacionId);
  } catch (error) {
    console.error('Error al actualizar asignación:', error);
    throw error;
  }
};

/**
 * Elimina (desactiva) una asignación
 * @param {string} asignacionId - ID de la asignación
 * @param {Object} usuario - Usuario que realiza la acción (opcional, para historial)
 */
export const eliminarAsignacion = async (asignacionId, usuario = null) => {
  try {
    // Obtener datos anteriores para el historial
    const docRef = doc(db, COLLECTION_NAME, asignacionId);
    const docSnap = await getDoc(docRef);
    const datosAnteriores = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;

    // Soft delete - solo desactivar
    await updateDoc(docRef, {
      activo: false,
      updatedAt: serverTimestamp()
    });

    // Registrar en historial
    if (datosAnteriores) {
      await registrarCambio({
        tipoEntidad: TIPOS_ENTIDAD.ASIGNACION,
        entidadId: asignacionId,
        accion: TIPOS_ACCION.DESACTIVAR,
        datosAnteriores,
        datosNuevos: { ...datosAnteriores, activo: false },
        usuario,
        organizationId: datosAnteriores.organizationId,
        descripcion: `Asignación desactivada: ${datosAnteriores.clienteNombre || 'N/A'}`
      });
    }

    console.log('✅ Asignación desactivada:', asignacionId);
  } catch (error) {
    console.error('Error al eliminar asignación:', error);
    throw error;
  }
};

/**
 * Elimina permanentemente una asignación
 */
export const eliminarAsignacionPermanente = async (asignacionId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, asignacionId));
    console.log('✅ Asignación eliminada permanentemente:', asignacionId);
  } catch (error) {
    console.error('Error al eliminar asignación:', error);
    throw error;
  }
};

/**
 * Importa múltiples asignaciones desde un array
 * (Para carga masiva desde Excel)
 */
export const importarAsignaciones = async (asignacionesArray, organizationId) => {
  try {
    if (!organizationId) {
      throw new Error('organizationId es requerido');
    }

    const resultados = {
      exitosos: 0,
      fallidos: 0,
      errores: []
    };

    for (const asig of asignacionesArray) {
      try {
        await addDoc(collection(db, COLLECTION_NAME), {
          clienteId: asig.clienteId || null,
          clienteNombre: asig.clienteNombre || asig.Cliente,
          terapeutaId: asig.terapeutaId || null,
          terapeutaNombre: asig.terapeutaNombre || asig.Terapeuta,
          servicioId: asig.servicioId || null,
          servicioNombre: asig.servicioNombre || asig.Servicio,
          precioCliente: parseFloat(asig.precioCliente || asig.PrecioCliente) || 0,
          pagoTerapeuta: parseFloat(asig.pagoTerapeuta || asig.PagoTerapeuta) || 0,
          condicion: {
            tipo: asig.tipoHorario === 'Fijo' ? 'siempre' : 
                  asig.tipoHorario === 'Mañana' ? 'horario' :
                  asig.tipoHorario === 'Tarde' ? 'horario' :
                  asig.tipoHorario === 'Sábado' ? 'horario' : 'siempre',
            horaInicio: asig.horaInicio || asig.HoraInicio || null,
            horaFin: asig.horaFin || asig.HoraFin || null,
            ubicacion: asig.ubicacion || asig.Ubicacion || null
          },
          notas: asig.notas || asig.Notas || '',
          activo: true,
          organizationId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        resultados.exitosos++;
      } catch (err) {
        resultados.fallidos++;
        resultados.errores.push({
          asignacion: asig,
          error: err.message
        });
      }
    }

    console.log(`✅ Importación completada: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);
    return resultados;
  } catch (error) {
    console.error('Error en importación masiva:', error);
    throw error;
  }
};
