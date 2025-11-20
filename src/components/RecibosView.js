import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  MoreVertical, 
  Calendar, 
  Download, 
  Trash2,
  Eye
} from 'lucide-react';

const RecibosView = ({ 
  recibos, 
  onNuevoRecibo, 
  onVerRecibo, 
  onEliminarRecibo 
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Formateador de moneda
  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  // Formateador de fecha
  const formatearFecha = (fechaString) => {
    if (!fechaString) return '-';
    const fecha = new Date(fechaString);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(fecha);
  };

  // Lógica de filtrado
  const recibosFiltrados = useMemo(() => {
    return recibos.filter(recibo => {
      const coincideBusqueda = 
        recibo.nombreCliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        recibo.id?.toLowerCase().includes(busqueda.toLowerCase());
      
      // Asumimos que si no hay campo estado, está 'pagado' por defecto
      const estadoRecibo = recibo.estado || 'pagado'; 
      const coincideEstado = filtroEstado === 'todos' || estadoRecibo === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [recibos, busqueda, filtroEstado]);

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones Principales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recibos Generados</h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona y organiza tus comprobantes de pago</p>
        </div>
        <button
          onClick={onNuevoRecibo}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nuevo Recibo
        </button>
      </div>

      {/* Barra de Herramientas (Filtros y Búsqueda) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente o folio..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg border"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="pagado">Pagados</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </div>
      </div>

      {/* Tabla de Recibos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Folio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recibosFiltrados.length > 0 ? (
                recibosFiltrados.map((recibo) => (
                  <tr key={recibo.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{recibo.folio || recibo.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {formatearFecha(recibo.fecha)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{recibo.nombreCliente}</div>
                      <div className="text-xs text-gray-500">ID: {recibo.clienteId ? recibo.clienteId.slice(0,8) : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatearMoneda(recibo.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${(recibo.estado === 'pendiente') 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                        }`}>
                        {recibo.estado || 'Pagado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => onVerRecibo(recibo)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="Ver / Imprimir"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => onEliminarRecibo(recibo.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={40} className="text-gray-300" />
                      <p>No se encontraron recibos que coincidan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación simple (Footer de tabla) */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Mostrando {recibosFiltrados.length} resultados
          </span>
          {/* Aquí puedes agregar lógica de paginación real si tienes muchos datos */}
        </div>
      </div>
    </div>
  );
};

export default RecibosView;