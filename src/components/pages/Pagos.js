import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

/**
 * Componente Pagos - Gestión de pagos del sistema
 * 
 * @param {Object} props
 * @param {Array} props.pagos - Lista de pagos
 * @param {Array} props.clientes - Lista de clientes
 * @param {Function} props.getNombre - Función para obtener nombre del cliente
 * @param {Function} props.openModal - Función para abrir modal de pago
 * @param {Function} props.eliminarPago - Función para eliminar un pago
 */
const Pagos = ({ 
  pagos, 
  clientes, 
  getNombre, 
  openModal, 
  eliminarPago 
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pagos</h2>
        <button 
          onClick={() => openModal('pago')} 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar
        </button>
      </div>

      {/* Lista de Pagos */}
      <div className="bg-white shadow rounded-md">
        <ul className="divide-y">
          {pagos.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              No hay pagos registrados
            </li>
          ) : (
            pagos.map(pago => (
              <li key={pago.id} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  {/* Información del Pago */}
                  <div>
                    <p className="font-medium">{getNombre(pago.clienteId, clientes)}</p>
                    <p className="text-sm text-gray-600">{pago.concepto}</p>
                  </div>

                  {/* Monto y Acciones */}
                  <div className="flex items-center space-x-4">
                    <p className="text-xl font-bold text-green-600">
                      ${pago.monto.toLocaleString()}
                    </p>
                    <button 
                      onClick={() => openModal('pago', pago)} 
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar pago"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => eliminarPago(pago.id)} 
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar pago"
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

export default Pagos;
