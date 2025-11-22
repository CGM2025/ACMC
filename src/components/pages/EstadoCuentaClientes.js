import React, { useState, useMemo } from 'react';
import { Search, DollarSign, FileText, CreditCard, TrendingUp, Calendar, AlertCircle, CheckCircle, Clock, Eye, Trash2 } from 'lucide-react';
import ModalRecibo from '../ModalRecibo';

/**
 * Componente EstadoCuentaClientes
 * Vista de estado de cuenta por cliente con sidebar y panel de detalles
 * 
 * @param {Array} clientes - Lista de clientes
 * @param {Array} recibos - Lista de recibos generados
 * @param {Array} pagos - Lista de pagos recibidos
 * @param {Function} onRegistrarPago - Función para abrir modal de nuevo pago
 */
const EstadoCuentaClientes = ({ 
  clientes = [], 
  recibos = [], 
  pagos = [],
  onRegistrarPago,
  onEliminarRecibo 
}) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [reciboModalAbierto, setReciboModalAbierto] = useState(false);
  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);

  // Calcular estado financiero de cada cliente
  const clientesConEstado = useMemo(() => {
    return clientes.map(cliente => {
      // Filtrar recibos del cliente (por nombre o por código - dependiendo de estructura)
      const recibosCliente = recibos.filter(r => 
        r.cliente === cliente.nombre || 
        r.clienteId === cliente.id ||
        r.clienteCodigo === cliente.codigo
      );
      
      // Calcular total facturado
      const totalFacturado = recibosCliente.reduce((sum, recibo) => 
        sum + (recibo.totalGeneral || 0), 0
      );
      
      // Filtrar pagos del cliente (usa clienteId que es el ID de Firestore)
      const pagosCliente = pagos.filter(p => 
        p.clienteId === cliente.id ||
        p.cliente === cliente.nombre ||
        p.clienteCodigo === cliente.codigo
      );
      
      // Calcular total pagado
      const totalPagado = pagosCliente.reduce((sum, pago) => 
        sum + (parseFloat(pago.monto) || 0), 0
      );
      
      // Calcular saldo pendiente
      const saldoPendiente = totalFacturado - totalPagado;
      
      // Determinar estado
      let estado = 'al-corriente';
      if (saldoPendiente > 0) estado = 'pendiente';
      if (saldoPendiente < 0) estado = 'adelantado';
      
      return {
        ...cliente,
        totalFacturado,
        totalPagado,
        saldoPendiente,
        estado,
        numRecibos: recibosCliente.length,
        numPagos: pagosCliente.length
      };
    }).sort((a, b) => b.saldoPendiente - a.saldoPendiente);
  }, [clientes, recibos, pagos]);

  // Filtrar clientes por búsqueda
  const clientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return clientesConEstado;
    
    const busquedaLower = busqueda.toLowerCase();
    return clientesConEstado.filter(cliente =>
      cliente.nombre.toLowerCase().includes(busquedaLower) ||
      cliente.codigo?.toLowerCase().includes(busquedaLower)
    );
  }, [clientesConEstado, busqueda]);

  // Seleccionar primer cliente si no hay ninguno seleccionado
  React.useEffect(() => {
    if (!clienteSeleccionado && clientesFiltrados.length > 0) {
      setClienteSeleccionado(clientesFiltrados[0]);
    }
  }, [clientesFiltrados, clienteSeleccionado]);

  // Obtener detalles del cliente seleccionado
  const detallesCliente = useMemo(() => {
    if (!clienteSeleccionado) return null;

    const recibosCliente = recibos
      .filter(r => 
        r.cliente === clienteSeleccionado.nombre ||
        r.clienteId === clienteSeleccionado.id ||
        r.clienteCodigo === clienteSeleccionado.codigo
      )
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    const pagosCliente = pagos
      .filter(p => 
        p.clienteId === clienteSeleccionado.id ||
        p.cliente === clienteSeleccionado.nombre ||
        p.clienteCodigo === clienteSeleccionado.codigo
      )
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return {
      recibos: recibosCliente,
      pagos: pagosCliente
    };
  }, [clienteSeleccionado, recibos, pagos]);

  // Función para ver recibo
  const handleVerRecibo = (recibo) => {
    setReciboSeleccionado(recibo);
    setReciboModalAbierto(true);
  };

  // Función para eliminar recibo con confirmación doble
  const handleEliminarRecibo = async (recibo) => {
    // Contar pagos vinculados a este recibo
    const pagosVinculados = pagos.filter(p => 
      p.reciboId === recibo.id || 
      p.reciboFirebaseId === recibo.id ||
      p.reciboId === recibo.reciboId
    );

    // Primera confirmación
    const mensajePagos = pagosVinculados.length > 0 
      ? `\n\n⚠️ ADVERTENCIA: Hay ${pagosVinculados.length} pago(s) vinculado(s) a este recibo.\nLos pagos NO se eliminarán, pero quedarán sin recibo asociado.`
      : '';

    const confirmar1 = window.confirm(
      `¿Estás seguro de eliminar este recibo?\n\n` +
      `Recibo: ${recibo.reciboId || 'N/A'}\n` +
      `Cliente: ${clienteSeleccionado.nombre}\n` +
      `Monto: $${Math.round(recibo.totalGeneral || 0).toLocaleString()}` +
      mensajePagos
    );

    if (!confirmar1) return;

    // Segunda confirmación
    const confirmar2 = window.confirm(
      `🚨 ÚLTIMA CONFIRMACIÓN\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `¿Realmente deseas eliminar el recibo ${recibo.reciboId || 'N/A'}?`
    );

    if (!confirmar2) return;

    // Llamar a la función de eliminación
    if (onEliminarRecibo) {
      try {
        await onEliminarRecibo(recibo.id);
        alert('✅ Recibo eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar recibo:', error);
        alert('❌ Error al eliminar el recibo: ' + error.message);
      }
    }
  };

  // Función para obtener color según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'al-corriente':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendiente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'adelantado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'al-corriente':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'pendiente':
        return <AlertCircle size={16} className="text-red-600" />;
      case 'adelantado':
        return <TrendingUp size={16} className="text-blue-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'al-corriente':
        return 'Al Corriente';
      case 'pendiente':
        return 'Saldo Pendiente';
      case 'adelantado':
        return 'Saldo a Favor';
      default:
        return 'Sin Movimientos';
    }
  };

  // Calcular porcentaje pagado
  const calcularPorcentajePagado = (totalFacturado, totalPagado) => {
    if (totalFacturado === 0) return 0;
    return Math.min(100, (totalPagado / totalFacturado) * 100);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Lista de Clientes */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-bold text-white mb-2">
            Estado de Cuenta
          </h2>
          <p className="text-blue-100 text-sm">
            {clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'cliente' : 'clientes'}
          </p>
        </div>

        {/* Buscador */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="flex-1 overflow-y-auto">
          {clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <Search size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500">No se encontraron clientes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => setClienteSeleccionado(cliente)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    clienteSeleccionado?.id === cliente.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {cliente.nombre}
                      </h3>
                      {cliente.codigo && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {cliente.codigo}
                        </p>
                      )}
                    </div>
                    <div className="ml-2">
                      {getEstadoIcon(cliente.estado)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Saldo:</span>
                      <span className={`font-bold ${
                        cliente.saldoPendiente > 0 ? 'text-red-600' :
                        cliente.saldoPendiente < 0 ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        ${Math.abs(cliente.saldoPendiente).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {cliente.numRecibos}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {cliente.numPagos}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel Principal - Detalles del Cliente */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!clienteSeleccionado ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <DollarSign size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Selecciona un cliente para ver su estado de cuenta</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header del Cliente */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {clienteSeleccionado.nombre}
                  </h1>
                  {clienteSeleccionado.codigo && (
                    <p className="text-gray-500 mt-1">
                      Código: {clienteSeleccionado.codigo}
                    </p>
                  )}
                </div>
                <div className={`px-4 py-2 rounded-full border ${getEstadoColor(clienteSeleccionado.estado)} flex items-center gap-2`}>
                  {getEstadoIcon(clienteSeleccionado.estado)}
                  <span className="font-semibold text-sm">
                    {getEstadoTexto(clienteSeleccionado.estado)}
                  </span>
                </div>
              </div>

              {/* Resumen Financiero */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Facturado */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Total Facturado</span>
                    <FileText size={20} className="text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    ${clienteSeleccionado.totalFacturado.toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {clienteSeleccionado.numRecibos} {clienteSeleccionado.numRecibos === 1 ? 'recibo' : 'recibos'}
                  </p>
                </div>

                {/* Total Pagado */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Total Pagado</span>
                    <CreditCard size={20} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    ${clienteSeleccionado.totalPagado.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {clienteSeleccionado.numPagos} {clienteSeleccionado.numPagos === 1 ? 'pago' : 'pagos'}
                  </p>
                </div>

                {/* Saldo Pendiente */}
                <div className={`bg-gradient-to-br rounded-lg p-4 border ${
                  clienteSeleccionado.saldoPendiente > 0 
                    ? 'from-red-50 to-red-100 border-red-200'
                    : clienteSeleccionado.saldoPendiente < 0
                    ? 'from-blue-50 to-blue-100 border-blue-200'
                    : 'from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      clienteSeleccionado.saldoPendiente > 0 ? 'text-red-700' :
                      clienteSeleccionado.saldoPendiente < 0 ? 'text-blue-700' :
                      'text-gray-700'
                    }`}>
                      {clienteSeleccionado.saldoPendiente > 0 ? 'Saldo Pendiente' :
                       clienteSeleccionado.saldoPendiente < 0 ? 'Saldo a Favor' :
                       'Sin Saldo'}
                    </span>
                    <DollarSign size={20} className={
                      clienteSeleccionado.saldoPendiente > 0 ? 'text-red-600' :
                      clienteSeleccionado.saldoPendiente < 0 ? 'text-blue-600' :
                      'text-gray-600'
                    } />
                  </div>
                  <p className={`text-2xl font-bold ${
                    clienteSeleccionado.saldoPendiente > 0 ? 'text-red-900' :
                    clienteSeleccionado.saldoPendiente < 0 ? 'text-blue-900' :
                    'text-gray-900'
                  }`}>
                    ${Math.abs(clienteSeleccionado.saldoPendiente).toLocaleString()}
                  </p>
                  
                  {/* Barra de progreso */}
                  {clienteSeleccionado.totalFacturado > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            clienteSeleccionado.saldoPendiente <= 0 ? 'bg-green-600' : 'bg-red-600'
                          }`}
                          style={{ 
                            width: `${calcularPorcentajePagado(
                              clienteSeleccionado.totalFacturado, 
                              clienteSeleccionado.totalPagado
                            )}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {calcularPorcentajePagado(
                          clienteSeleccionado.totalFacturado, 
                          clienteSeleccionado.totalPagado
                        ).toFixed(1)}% pagado
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contenido con Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sección de Recibos */}
              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText size={20} className="text-purple-600" />
                      Recibos
                    </h2>
                    <span className="text-sm text-gray-500">
                      {detallesCliente?.recibos.length || 0} {detallesCliente?.recibos.length === 1 ? 'recibo' : 'recibos'}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {!detallesCliente?.recibos || detallesCliente.recibos.length === 0 ? (
                    <div className="p-8 text-center">
                      <FileText size={48} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">No hay recibos registrados</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Período
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Recibo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Fecha Emisión
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                            Monto
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {detallesCliente.recibos.map((recibo, index) => {
                          const montoPagado = detallesCliente.pagos
                            .filter(p => 
                              p.reciboId === recibo.id || 
                              p.reciboFirebaseId === recibo.id ||
                              p.reciboId === recibo.reciboId
                            )
                            .reduce((sum, p) => sum + parseFloat(p.monto), 0);
                          const estaPagado = montoPagado >= recibo.totalGeneral;
                          const esParcial = montoPagado > 0 && montoPagado < recibo.totalGeneral;

                          return (
                            <tr key={recibo.id || index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">
                                  {recibo.mes} {recibo.año}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <FileText size={16} className="text-purple-600" />
                                  <span className="text-sm font-mono text-gray-900">
                                    {recibo.reciboId || 'N/A'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {recibo.fecha ? new Date(recibo.fecha).toLocaleDateString('es-MX') : 
                                 recibo.fechaGeneracion ? new Date(recibo.fechaGeneracion).toLocaleDateString('es-MX') : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="font-semibold text-gray-900">
                                  ${Math.round(recibo.totalGeneral).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                  estaPagado 
                                    ? 'bg-green-100 text-green-800'
                                    : esParcial
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {estaPagado ? (
                                    <>
                                      <CheckCircle size={12} />
                                      Pagado
                                    </>
                                  ) : esParcial ? (
                                    <>
                                      <Clock size={12} />
                                      Parcial (${Math.round(montoPagado).toLocaleString()})
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle size={12} />
                                      Pendiente
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleVerRecibo(recibo)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Ver recibo"
                                  >
                                    <Eye size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleEliminarRecibo(recibo)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar recibo"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Sección de Pagos */}
              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCard size={20} className="text-green-600" />
                      Historial de Pagos
                    </h2>
                    <button
                      onClick={() => onRegistrarPago && onRegistrarPago(clienteSeleccionado)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <DollarSign size={16} />
                      Registrar Pago
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {!detallesCliente?.pagos || detallesCliente.pagos.length === 0 ? (
                    <div className="p-8 text-center">
                      <CreditCard size={48} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 mb-4">No hay pagos registrados</p>
                      <button
                        onClick={() => onRegistrarPago && onRegistrarPago(clienteSeleccionado)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                      >
                        <DollarSign size={16} />
                        Registrar Primer Pago
                      </button>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Método
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Concepto
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                            Monto
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {detallesCliente.pagos.map((pago, index) => (
                          <tr key={pago.id || index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-900">
                                  {new Date(pago.fecha).toLocaleDateString('es-MX')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {pago.metodoPago || 'No especificado'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {pago.concepto || 'Pago de servicios'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="font-semibold text-green-600">
                                ${parseFloat(pago.monto).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-sm font-bold text-gray-900">
                            TOTAL PAGADO
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-lg font-bold text-green-600">
                              ${clienteSeleccionado.totalPagado.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Recibo */}
      {reciboModalAbierto && reciboSeleccionado && (
        <ModalRecibo
          recibo={reciboSeleccionado}
          nombreCliente={clienteSeleccionado?.nombre}
          onCerrar={() => {
            setReciboModalAbierto(false);
            setReciboSeleccionado(null);
          }}
        />
      )}
    </div>
  );
};

export default EstadoCuentaClientes;
