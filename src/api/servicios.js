import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  where
} from 'firebase/firestore';

/**
 * API para gestión de servicios/tipos de terapia en Firebase
 * VERSIÓN MULTI-TENANT: Todas las operaciones filtran por organizationId
 */

const COLLECTION_NAME = 'servicios';

/**
 * Obtiene todos los servicios de una organización ordenados
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de servicios
 */
export const obtenerServicios = async (organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        orderBy('orden', 'asc')
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME), 
        orderBy('orden', 'asc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Si falla el orderBy (falta índice), intentar sin ordenar
    console.warn('Obteniendo servicios sin ordenar:', error.message);
    
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
    
    const servicios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Ordenar en JavaScript
    return servicios.sort((a, b) => (a.orden || 99) - (b.orden || 99));
  }
};

/**
 * Obtiene solo los servicios activos de una organización
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Array>} - Array de servicios activos
 */
export const obtenerServiciosActivos = async (organizationId) => {
  try {
    let q;
    
    if (organizationId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('activo', '==', true),
        orderBy('orden', 'asc')
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('activo', '==', true),
        orderBy('orden', 'asc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Fallback: obtener todos y filtrar
    console.warn('Obteniendo servicios activos sin índice:', error.message);
    const todos = await obtenerServicios(organizationId);
    return todos.filter(s => s.activo !== false);
  }
};

/**
 * Crea un nuevo servicio
 * @param {Object} servicioData - Datos del servicio
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<string>} - ID del servicio creado
 */
export const crearServicio = async (servicioData, organizationId) => {
  try {
    // Validar datos requeridos
    if (!servicioData.nombre || servicioData.precio === undefined) {
      throw new Error('Nombre y precio son requeridos');
    }

    const datos = {
      nombre: servicioData.nombre.trim(),
      precio: parseFloat(servicioData.precio) || 0,
      activo: servicioData.activo !== false,
      orden: servicioData.orden || 99,
      descripcion: servicioData.descripcion || '',
      ...(organizationId && { organizationId }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), datos);
    console.log('✅ Servicio creado:', datos.nombre);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear servicio:', error);
    throw error;
  }
};

/**
 * Actualiza un servicio existente
 * @param {string} servicioId - ID del servicio
 * @param {Object} servicioData - Nuevos datos del servicio
 * @returns {Promise<void>}
 */
export const actualizarServicio = async (servicioId, servicioData) => {
  try {
    const datos = {
      ...servicioData,
      updatedAt: new Date().toISOString()
    };

    // Asegurar tipos correctos
    if (datos.precio !== undefined) {
      datos.precio = parseFloat(datos.precio) || 0;
    }
    if (datos.orden !== undefined) {
      datos.orden = parseInt(datos.orden) || 99;
    }
    if (datos.nombre) {
      datos.nombre = datos.nombre.trim();
    }

    await updateDoc(doc(db, COLLECTION_NAME, servicioId), datos);
    console.log('✅ Servicio actualizado:', servicioId);
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    throw error;
  }
};

/**
 * Elimina un servicio
 * @param {string} servicioId - ID del servicio
 * @returns {Promise<void>}
 */
export const eliminarServicio = async (servicioId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, servicioId));
    console.log('✅ Servicio eliminado:', servicioId);
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    throw error;
  }
};

/**
 * Desactiva un servicio (soft delete)
 * @param {string} servicioId - ID del servicio
 * @returns {Promise<void>}
 */
export const desactivarServicio = async (servicioId) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, servicioId), {
      activo: false,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Servicio desactivado:', servicioId);
  } catch (error) {
    console.error('Error al desactivar servicio:', error);
    throw error;
  }
};

/**
 * Activa un servicio
 * @param {string} servicioId - ID del servicio
 * @returns {Promise<void>}
 */
export const activarServicio = async (servicioId) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, servicioId), {
      activo: true,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Servicio activado:', servicioId);
  } catch (error) {
    console.error('Error al activar servicio:', error);
    throw error;
  }
};

/**
 * Inicializa la colección con los servicios por defecto
 * Solo usar una vez para migrar datos existentes
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<number>} - Número de servicios creados
 */
export const inicializarServiciosPorDefecto = async (organizationId) => {
  const serviciosPorDefecto = [
    { nombre: 'Sesión de ABA estándar', precio: 450, orden: 1 },
    { nombre: 'Sesión de ABA precio especial', precio: 900, orden: 2 },
    { nombre: 'Sesión en casa', precio: 640, orden: 3 },
    { nombre: 'Servicios de Sombra', precio: 150, orden: 4 },
    { nombre: 'Terapia Ocupacional', precio: 950, orden: 5 },
    { nombre: 'Servicios Administrativos y Reportes', precio: 1200, orden: 6 },
    { nombre: 'Servicios de Apoyo y Entrenamiento', precio: 1200, orden: 7 },
    { nombre: 'Paquete 4hr/semana', precio: 274, orden: 8 },
    { nombre: 'Evaluación', precio: 450, orden: 9 },
    { nombre: 'Consulta', precio: 450, orden: 10 },
    { nombre: 'Otro', precio: 450, orden: 99 }
  ];

  try {
    // Verificar si ya existen servicios
    const existentes = await obtenerServicios(organizationId);
    if (existentes.length > 0) {
      console.log('⚠️ Ya existen servicios en la colección. No se inicializará.');
      return 0;
    }

    // Crear servicios
    let creados = 0;
    for (const servicio of serviciosPorDefecto) {
      await crearServicio({
        ...servicio,
        activo: true,
        descripcion: ''
      }, organizationId);
      creados++;
    }

    console.log(`✅ ${creados} servicios inicializados`);
    return creados;
  } catch (error) {
    console.error('Error al inicializar servicios:', error);
    throw error;
  }
};

/**
 * Convierte el array de servicios a un objeto { nombre: precio }
 * Útil para compatibilidad con el código existente
 * @param {Array} servicios - Array de servicios
 * @returns {Object} - Objeto con nombre como key y precio como value
 */
export const serviciosAPreciosBase = (servicios) => {
  const precios = {};
  servicios.forEach(servicio => {
    if (servicio.activo !== false) {
      precios[servicio.nombre] = servicio.precio;
    }
  });
  return precios;
};
