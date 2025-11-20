import React from 'react';
import { Plus, Upload, Edit, Trash2 } from 'lucide-react';

/**
 * Componente Clientes - Gestión de clientes del sistema
 * 
 * @param {Object} props
 * @param {Array} props.clientes - Lista de clientes
 * @param {string} props.ordenClientes - Orden actual ('original' o 'alfabetico')
 * @param {Function} props.ordenarClientes - Función para cambiar el orden
 * @param {Function} props.openModal - Función para abrir modal de cliente
 * @param {Function} props.eliminarCliente - Función para eliminar un cliente
 * @param {Function} props.importarPreciosAutomaticamente - Función para importar precios automáticamente
 */
const Clientes = ({ 
  clientes, 
  ordenClientes, 
  ordenarClientes, 
  openModal, 
  eliminarCliente,
  importarPreciosAutomaticamente 
}) => {
  return (
    <div className="space-y-6">
      {/* Header con botones de ordenamiento y acciones */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        
        <div className="flex gap-3 items-center">
          {/* Botones de ordenamiento */}
          <div className="flex gap-2 mr-2">
            <button
              onClick={() => ordenarClientes('original')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                ordenClientes === 'original'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Orden original"
            >
              📋 Original
            </button>
            <button
              onClick={() => ordenarClientes('alfabetico')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                ordenClientes === 'alfabetico'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Orden alfabético"
            >
              🔤 A-Z
            </button>
          </div>
          
          {/* Botón importar precios */}
          <button 
            onClick={importarPreciosAutomaticamente} 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Precios
          </button>
          
          {/* Botón nuevo */}
          <button 
            onClick={() => openModal('cliente')} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </button>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white shadow rounded-md">
        <ul className="divide-y">
          {clientes.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              No hay clientes registrados
            </li>
          ) : (
            clientes.map(cliente => (
              <li key={cliente.id} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  {/* Información del Cliente */}
                  <div>
                    <p className="font-medium">{cliente.nombre}</p>
                    <p className="text-sm text-gray-600">{cliente.email}</p>
                    <p className="text-sm text-blue-600">Código: {cliente.codigo}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openModal('cliente', cliente)} 
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar cliente"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => eliminarCliente(cliente.id)} 
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar cliente"
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

export default Clientes;
