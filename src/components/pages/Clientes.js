import React, { useState, useMemo } from 'react';
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
  // Estado para filtrar por activo/inactivo
  const [filtroEstado, setFiltroEstado] = useState('activos'); // 'activos', 'inactivos', 'todos'

  // Filtrar clientes según el estado seleccionado
  const clientesFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return clientes;
    if (filtroEstado === 'activos') return clientes.filter(c => c.activo !== false);
    if (filtroEstado === 'inactivos') return clientes.filter(c => c.activo === false);
    return clientes;
  }, [clientes, filtroEstado]);

  // Contar clientes por estado
  const conteos = useMemo(() => ({
    activos: clientes.filter(c => c.activo !== false).length,
    inactivos: clientes.filter(c => c.activo === false).length,
    total: clientes.length
  }), [clientes]);

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

      {/* Filtro por estado activo/inactivo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFiltroEstado('activos')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filtroEstado === 'activos'
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Activos ({conteos.activos})
          </button>
          <button
            onClick={() => setFiltroEstado('inactivos')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filtroEstado === 'inactivos'
                ? 'bg-gray-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Inactivos ({conteos.inactivos})
          </button>
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filtroEstado === 'todos'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({conteos.total})
          </button>
        </div>
        <span className="text-sm text-gray-500">
          Mostrando {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white shadow rounded-md">
        <ul className="divide-y">
          {clientesFiltrados.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              {filtroEstado === 'inactivos'
                ? 'No hay clientes inactivos'
                : filtroEstado === 'activos'
                  ? 'No hay clientes activos'
                  : 'No hay clientes registrados'}
            </li>
          ) : (
            clientesFiltrados.map(cliente => {
              const esInactivo = cliente.activo === false;
              return (
                <li key={cliente.id} className={`px-6 py-4 ${esInactivo ? 'bg-gray-50 opacity-70' : ''}`}>
                  <div className="flex justify-between items-center">
                    {/* Información del Cliente */}
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${esInactivo ? 'text-gray-500' : ''}`}>
                            {cliente.nombre}
                          </p>
                          {esInactivo && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{cliente.email}</p>
                        <p className="text-sm text-blue-600">Código: {cliente.codigo}</p>
                      </div>
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
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
};

export default Clientes;
