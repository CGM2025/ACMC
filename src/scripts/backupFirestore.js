// src/scripts/backupFirestore.js
//
// SCRIPT DE BACKUP: Descarga todos los datos de Firestore a JSON
//

import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// Colecciones a respaldar
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
  'bloques',
  'configuracion'
];

/**
 * Descarga todos los documentos de una colección
 */
const backupColeccion = async (nombreColeccion) => {
  try {
    const snapshot = await getDocs(collection(db, nombreColeccion));
    const documentos = {};
    
    snapshot.forEach(doc => {
      documentos[doc.id] = doc.data();
    });
    
    return {
      coleccion: nombreColeccion,
      cantidad: snapshot.size,
      documentos
    };
  } catch (error) {
    console.error(`Error en ${nombreColeccion}:`, error);
    return {
      coleccion: nombreColeccion,
      cantidad: 0,
      error: error.message
    };
  }
};

/**
 * Ejecuta el backup completo
 */
export const ejecutarBackup = async () => {
  console.log('📦 Iniciando backup de Firestore...');
  
  const backup = {
    fecha: new Date().toISOString(),
    version: '1.0',
    colecciones: {}
  };
  
  for (const coleccion of COLECCIONES) {
    console.log(`   📄 Respaldando: ${coleccion}...`);
    const resultado = await backupColeccion(coleccion);
    backup.colecciones[coleccion] = resultado;
    console.log(`   ✅ ${coleccion}: ${resultado.cantidad} documentos`);
  }
  
  // Crear archivo descargable
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Crear link de descarga
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_firestore_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('✅ Backup completado y descargado');
  
  return backup;
};

export { COLECCIONES };
