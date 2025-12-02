// src/components/MigracionOrganization.jsx
//
// COMPONENTE TEMPORAL para ejecutar la migración
// ELIMINAR después de ejecutar la migración exitosamente
//

import React, { useState } from 'react';
import { AlertTriangle, Play, CheckCircle, XCircle, Loader, Download } from 'lucide-react';
import { 
  ejecutarMigracionCompleta, 
  crearOrganizacion,
  migrarColeccion,
  ORGANIZATION_ID,
  COLECCIONES 
} from '../scripts/migracionOrganizationId';
import { ejecutarBackup } from '../scripts/backupFirestore';

const MigracionOrganization = () => {
  const [estado, setEstado] = useState('inicial'); // inicial, ejecutando, completado, error
  const [logs, setLogs] = useState([]);
  const [resultados, setResultados] = useState(null);
  const [progreso, setProgreso] = useState({ actual: 0, total: COLECCIONES.length + 1 });
  const [backupRealizado, setBackupRealizado] = useState(false);
  const [ejecutandoBackup, setEjecutandoBackup] = useState(false);

  const hacerBackup = async () => {
    setEjecutandoBackup(true);
    try {
      await ejecutarBackup();
      setBackupRealizado(true);
      alert('✅ Backup descargado correctamente. Revisa tu carpeta de descargas.');
    } catch (error) {
      alert('❌ Error al hacer backup: ' + error.message);
    } finally {
      setEjecutandoBackup(false);
    }
  };

  const agregarLog = (mensaje, tipo = 'info') => {
    setLogs(prev => [...prev, { mensaje, tipo, timestamp: new Date().toISOString() }]);
  };

  const ejecutarMigracion = async () => {
    if (!window.confirm(
      '⚠️ ADVERTENCIA: Esta acción modificará TODOS los documentos en tu base de datos.\n\n' +
      '¿Estás seguro de que quieres continuar?\n\n' +
      'Recomendación: Haz un backup antes de continuar.'
    )) {
      return;
    }

    setEstado('ejecutando');
    setLogs([]);
    setProgreso({ actual: 0, total: COLECCIONES.length + 1 });

    try {
      // Paso 1: Crear organización
      agregarLog('📦 Creando organización...', 'info');
      const orgResult = await crearOrganizacion();
      
      if (orgResult.success) {
        agregarLog(`✅ Organización creada: ${ORGANIZATION_ID}`, 'success');
        setProgreso({ actual: 1, total: COLECCIONES.length + 1 });
      } else {
        agregarLog(`❌ Error creando organización: ${orgResult.error?.message}`, 'error');
        setEstado('error');
        return;
      }

      // Paso 2: Migrar cada colección
      const resultadosMigracion = [];
      
      for (let i = 0; i < COLECCIONES.length; i++) {
        const coleccion = COLECCIONES[i];
        agregarLog(`📄 Migrando: ${coleccion}...`, 'info');
        
        const resultado = await migrarColeccion(coleccion);
        resultadosMigracion.push(resultado);
        
        if (resultado.success) {
          agregarLog(`   ✅ ${coleccion}: ${resultado.documentos} documentos`, 'success');
        } else {
          agregarLog(`   ❌ ${coleccion}: Error - ${resultado.error?.message}`, 'error');
        }
        
        setProgreso({ actual: i + 2, total: COLECCIONES.length + 1 });
      }

      // Resumen
      const exitosos = resultadosMigracion.filter(r => r.success).length;
      const totalDocs = resultadosMigracion.reduce((sum, r) => sum + (r.documentos || 0), 0);
      
      setResultados({
        colecciones: resultadosMigracion,
        exitosos,
        totalDocs,
        organizationId: ORGANIZATION_ID
      });

      if (exitosos === COLECCIONES.length) {
        agregarLog('🎉 ¡Migración completada exitosamente!', 'success');
        setEstado('completado');
      } else {
        agregarLog('⚠️ Migración completada con errores', 'warning');
        setEstado('error');
      }

    } catch (error) {
      agregarLog(`❌ Error fatal: ${error.message}`, 'error');
      setEstado('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🚀 Migración a Multi-Tenant SaaS</h2>
        <p className="opacity-90">
          Este proceso agregará <code className="bg-white/20 px-2 py-1 rounded">organizationId</code> a 
          todos los documentos existentes para preparar el sistema para múltiples organizaciones.
        </p>
      </div>

      {/* Advertencia */}
      {estado === 'inicial' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-800">Antes de continuar:</h3>
              <ul className="mt-2 text-yellow-700 space-y-1 text-sm">
                <li>• Esta operación modificará <strong>todos</strong> los documentos en Firestore</li>
                <li>• Se recomienda hacer un backup antes de ejecutar</li>
                <li>• El proceso puede tomar varios minutos dependiendo del volumen de datos</li>
                <li>• No cierres esta ventana mientras se ejecuta la migración</li>
                <li>• Solo ejecuta esta migración <strong>UNA VEZ</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Información de la migración */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Detalles de la migración:</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Organization ID</p>
            <p className="font-mono font-semibold text-blue-600">{ORGANIZATION_ID}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Colecciones a migrar</p>
            <p className="font-semibold text-gray-800">{COLECCIONES.length}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Colecciones:</p>
          <div className="flex flex-wrap gap-2">
            {COLECCIONES.map(col => (
              <span key={col} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Barra de progreso */}
        {estado === 'ejecutando' && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span>{progreso.actual} / {progreso.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Botón de Backup */}
        {estado === 'inicial' && (
          <div className="mb-4">
            <button
              onClick={hacerBackup}
              disabled={ejecutandoBackup}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                ejecutandoBackup
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : backupRealizado
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {ejecutandoBackup ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Descargando backup...
                </>
              ) : backupRealizado ? (
                <>
                  <CheckCircle size={20} />
                  Backup descargado ✓
                </>
              ) : (
                <>
                  <Download size={20} />
                  1. Descargar Backup (Recomendado)
                </>
              )}
            </button>
            {backupRealizado && (
              <p className="text-sm text-green-600 text-center mt-2">
                ✓ Backup guardado. Ahora puedes ejecutar la migración.
              </p>
            )}
          </div>
        )}

        {/* Botón de ejecución */}
        <button
          onClick={ejecutarMigracion}
          disabled={estado === 'ejecutando'}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            estado === 'ejecutando'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : estado === 'completado'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {estado === 'ejecutando' ? (
            <>
              <Loader className="animate-spin" size={20} />
              Ejecutando migración...
            </>
          ) : estado === 'completado' ? (
            <>
              <CheckCircle size={20} />
              Migración Completada
            </>
          ) : (
            <>
              <Play size={20} />
              2. Ejecutar Migración
            </>
          )}
        </button>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">📋 Logs de ejecución:</h3>
          <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`${
                  log.tipo === 'error' ? 'text-red-400' :
                  log.tipo === 'success' ? 'text-green-400' :
                  log.tipo === 'warning' ? 'text-yellow-400' :
                  'text-gray-300'
                }`}
              >
                {log.mensaje}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultados */}
      {resultados && (
        <div className={`rounded-xl p-6 ${
          estado === 'completado' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`font-semibold mb-4 ${
            estado === 'completado' ? 'text-green-800' : 'text-red-800'
          }`}>
            {estado === 'completado' ? '✅ Resumen de Migración' : '⚠️ Migración con Errores'}
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500">Colecciones migradas</p>
              <p className="text-2xl font-bold text-gray-800">
                {resultados.exitosos}/{COLECCIONES.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500">Documentos actualizados</p>
              <p className="text-2xl font-bold text-gray-800">{resultados.totalDocs}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500">Organization ID</p>
              <p className="text-lg font-mono text-blue-600">{resultados.organizationId}</p>
            </div>
          </div>

          {estado === 'completado' && (
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Próximos pasos:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Verifica los datos en Firebase Console</li>
                <li>Elimina este componente de migración</li>
                <li>Actualiza las APIs para usar organizationId</li>
                <li>Actualiza las reglas de seguridad</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MigracionOrganization;
