import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

/**
 * Componente Terapeutas - Gestión de terapeutas del sistema
 * 
 * @param {Object} props
 * @param {Array} props.terapeutas - Lista de terapeutas
 * @param {string} props.ordenTerapeutas - Orden actual ('original' o 'alfabetico')
 * @param {Function} props.ordenarTerapeutas - Función para cambiar el orden
 * @param {Function} props.openModal - Función para abrir modal de terapeuta
 * @param {Function} props.eliminarTerapeuta - Función para eliminar un terapeuta
 */
const Terapeutas = ({ 
  terapeutas, 
  ordenTerapeutas, 
  ordenarTerapeutas, 
  openModal, 
  eliminarTerapeuta 
}) => {
  return (
    <div className="space-y-6">
      {/* Header con botones de ordenamiento */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Terapeutas</h2>
        
        <div className="flex gap-3 items-center">
          {/* Botones de ordenamiento */}
          <div className="flex gap-2 mr-2">
            <button
              onClick={() => ordenarTerapeutas('original')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                ordenTerapeutas === 'original'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Orden original"
            >
              📋 Original
            </button>
            <button
              onClick={() => ordenarTerapeutas('alfabetico')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                ordenTerapeutas === 'alfabetico'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Orden alfabético"
            >
              🔤 A-Z
            </button>
          </div>
          
          {/* Botón nuevo */}
          <button 
            onClick={() => openModal('terapeuta')} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </button>
        </div>
      </div>

      {/* Lista de Terapeutas */}
      <div className="bg-white shadow rounded-md">
        <ul className="divide-y">
          {terapeutas.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              No hay terapeutas registrados
            </li>
          ) : (
            terapeutas.map(terapeuta => (
              <li key={terapeuta.id} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  {/* Información del Terapeuta */}
                  <div>
                    <p className="font-medium">{terapeuta.nombre}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-gray-600">{terapeuta.especialidad}</p>
                      {/* Mostrar múltiples niveles o nivel único (compatibilidad) */}
                      {(() => {
                        const nivelesLabels = {
                          'terapeuta_ocupacional': 'T. Ocupacional',
                          'junior': 'Junior',
                          'senior': 'Senior',
                          'coordinadora': 'Coordinadora',
                          'supervisora': 'Supervisora',
                          'recursos_humanos': 'RRHH'
                        };
                        // Compatibilidad: si existe 'nivel' (string antiguo), convertir a array
                        let niveles = terapeuta.niveles || [];
                        if (!niveles.length && terapeuta.nivel) {
                          niveles = [terapeuta.nivel];
                        }
                        return niveles.map(nivel => (
                          <span
                            key={nivel}
                            className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {nivelesLabels[nivel] || nivel}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openModal('terapeuta', terapeuta)} 
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar terapeuta"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => eliminarTerapeuta(terapeuta.id)} 
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar terapeuta"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default Terapeutas;
