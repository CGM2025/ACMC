// src/scripts/migracionOrganizationId.js
// 
// SCRIPT DE MIGRACIÓN: Agregar organizationId a todos los documentos
// 
// INSTRUCCIONES:
// 1. Crea un componente temporal en tu app para ejecutar este script
// 2. Solo un admin debe ejecutarlo UNA VEZ
// 3. Después de ejecutar, puedes eliminar el componente
//

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

// ID de tu organización principal
const ORGANIZATION_ID = 'org_acmc_001';

// Datos de la organización
const ORGANIZATION_DATA = {
  id: ORGANIZATION_ID,
  nombre: 'Autism Center Mexico City',
  nombreCorto: 'ACMC',
  email: 'contacto@acmc.com', // Actualiza con tu email real
  telefono: '',
  direccion: '',
  plan: 'premium',
  activo: true,
  fechaCreacion: serverTimestamp(),
  configuracion: {
    logoUrl: null,
    colores: {
      primario: '#2563eb',
      secundario: '#1e40af',
      acento: '#10b981'
    }
  },
  limites: {
    maxUsuarios: 50,
    maxTerapeutas: 20,
    maxClientes: 200
  }
};

// Colecciones a migrar
const COLECCIONES = [
  'usuarios',
  'terapeutas',
  'clientes',
  'citas',
  'pagos',
  'recibos',
  'horasTrabajadas',
  'comprobantes',
  'servicios',
  'utilidadHistorica',
  'bloques'
];

/**
 * Paso 1: Crear la organización en Firestore
 */
export const crearOrganizacion = async () => {
  try {
    console.log('📦 Creando organización...');
    
    const orgRef = doc(db, 'organizations', ORGANIZATION_ID);
    await setDoc(orgRef, ORGANIZATION_DATA);
    
    console.log('✅ Organización creada:', ORGANIZATION_ID);
    return { success: true, organizationId: ORGANIZATION_ID };
  } catch (error) {
    console.error('❌ Error creando organización:', error);
    return { success: false, error };
  }
};

/**
 * Paso 2: Migrar una colección específica
 */
export const migrarColeccion = async (nombreColeccion) => {
  try {
    console.log(`📄 Migrando colección: ${nombreColeccion}...`);
    
    const colRef = collection(db, nombreColeccion);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      console.log(`   ⚪ Colección ${nombreColeccion} está vacía`);
      return { success: true, coleccion: nombreColeccion, documentos: 0 };
    }
    
    // Usar batches para eficiencia (máximo 500 operaciones por batch)
    const batchSize = 450;
    let batch = writeBatch(db);
    let operaciones = 0;
    let totalDocumentos = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const docRef = doc(db, nombreColeccion, docSnapshot.id);
      const data = docSnapshot.data();
      
      // Solo actualizar si no tiene organizationId
      if (!data.organizationId) {
        batch.update(docRef, { organizationId: ORGANIZATION_ID });
        operaciones++;
        totalDocumentos++;
        
        // Commit batch si llegamos al límite
        if (operaciones >= batchSize) {
          await batch.commit();
          console.log(`   💾 Batch guardado (${totalDocumentos} documentos)`);
          batch = writeBatch(db);
          operaciones = 0;
        }
      }
    }
    
    // Commit del último batch si hay operaciones pendientes
    if (operaciones > 0) {
      await batch.commit();
    }
    
    console.log(`   ✅ ${nombreColeccion}: ${totalDocumentos} documentos migrados`);
    return { success: true, coleccion: nombreColeccion, documentos: totalDocumentos };
    
  } catch (error) {
    console.error(`   ❌ Error en ${nombreColeccion}:`, error);
    return { success: false, coleccion: nombreColeccion, error };
  }
};

/**
 * Paso 3: Migrar TODAS las colecciones
 */
export const migrarTodasLasColecciones = async () => {
  console.log('🚀 Iniciando migración completa...');
  console.log('================================');
  
  const resultados = [];
  
  for (const coleccion of COLECCIONES) {
    const resultado = await migrarColeccion(coleccion);
    resultados.push(resultado);
  }
  
  console.log('================================');
  console.log('📊 RESUMEN DE MIGRACIÓN:');
  
  let totalExito = 0;
  let totalDocs = 0;
  
  resultados.forEach(r => {
    if (r.success) {
      totalExito++;
      totalDocs += r.documentos || 0;
      console.log(`   ✅ ${r.coleccion}: ${r.documentos} docs`);
    } else {
      console.log(`   ❌ ${r.coleccion}: ERROR`);
    }
  });
  
  console.log('--------------------------------');
  console.log(`   Total colecciones: ${totalExito}/${COLECCIONES.length}`);
  console.log(`   Total documentos: ${totalDocs}`);
  console.log('================================');
  
  return resultados;
};

/**
 * EJECUTAR MIGRACIÓN COMPLETA
 * Esta función ejecuta todo el proceso
 */
export const ejecutarMigracionCompleta = async () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN A MULTI-TENANT SaaS         ║');
  console.log('║  Agregando organizationId              ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  
  // Paso 1: Crear organización
  const orgResult = await crearOrganizacion();
  if (!orgResult.success) {
    console.error('❌ Error fatal: No se pudo crear la organización');
    return { success: false, paso: 1, error: orgResult.error };
  }
  
  // Paso 2: Migrar colecciones
  const migrationResults = await migrarTodasLasColecciones();
  
  // Verificar si todo fue exitoso
  const todosExitosos = migrationResults.every(r => r.success);
  
  if (todosExitosos) {
    console.log('');
    console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('');
    console.log('Próximos pasos:');
    console.log('1. Verificar datos en Firebase Console');
    console.log('2. Actualizar las APIs para usar organizationId');
    console.log('3. Actualizar reglas de seguridad');
    console.log('');
  } else {
    console.log('');
    console.log('⚠️ Migración completada con errores');
    console.log('Revisa los logs para más detalles');
    console.log('');
  }
  
  return { 
    success: todosExitosos, 
    organizationId: ORGANIZATION_ID,
    resultados: migrationResults 
  };
};

// Exportar constantes útiles
export { ORGANIZATION_ID, COLECCIONES };
