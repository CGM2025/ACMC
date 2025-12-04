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
  serverTimestamp
} from 'firebase/firestore';

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
 * Opcionalmente filtra por horario
 */
export const buscarAsignacion = async (clienteNombre, terapeutaNombre, hora, organizationId) => {
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
    
    // Si hay múltiples, filtrar por horario
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
      
      // Si no encuentra por horario, buscar la que tenga condicion "siempre"
      const siempre = asignaciones.find(a => a.condicion?.tipo === 'siempre' || !a.condicion?.tipo);
      if (siempre) return siempre;
    }
    
    // Retornar la primera como fallback
    return asignaciones[0];
  } catch (error) {
    console.error('Error al buscar asignación:', error);
    return null;
  }
};

/**
 * Crea una nueva asignación
 */
export const crearAsignacion = async (asignacionData, organizationId) => {
  try {
    if (!organizationId) {
      throw new Error('organizationId es requerido');
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...asignacionData,
      activo: true,
      organizationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
 */
export const actualizarAsignacion = async (asignacionId, asignacionData) => {
  try {
    const { organizationId, createdAt, ...datosActualizar } = asignacionData;
    
    await updateDoc(doc(db, COLLECTION_NAME, asignacionId), {
      ...datosActualizar,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Asignación actualizada:', asignacionId);
  } catch (error) {
    console.error('Error al actualizar asignación:', error);
    throw error;
  }
};

/**
 * Elimina (desactiva) una asignación
 */
export const eliminarAsignacion = async (asignacionId) => {
  try {
    // Soft delete - solo desactivar
    await updateDoc(doc(db, COLLECTION_NAME, asignacionId), {
      activo: false,
      updatedAt: serverTimestamp()
    });
    
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
