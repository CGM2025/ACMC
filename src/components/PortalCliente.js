import React, { useState, useMemo, useEffect } from 'react';
import { 
  LogOut, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Calendar,
  Eye,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import ModalRecibo from './ModalRecibo';
import SubirComprobante from './SubirComprobante';
import { subirComprobante, obtenerComprobantesCliente } from '../api/comprobantes';
import { storage } from '../firebase';

/**
 * Dashboard del Portal de Clientes
 * Muestra estado de cuenta, recibos, pagos y citas del cliente
 */
const PortalCliente = ({ 
  clienteData,
  recibos = [],
  pagos = [],
  citas = [],
  onLogout 
}) => {
  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);
  const [mostrarModalRecibo, setMostrarModalRecibo] = useState(false);
  const [mostrarSubirComprobante, setMostrarSubirComprobante] = useState(false);
  const [reciboParaPago, setReciboParaPago] = useState(null);
  const [comprobantesCliente, setComprobantesCliente] = useState([]);

  // Filtrar datos del cliente actual
  const recibosCliente = useMemo(() => {
    return recibos
      .filter(r => 
        r.clienteId === clienteData.id ||
        r.clienteCodigo === clienteData.codigo ||
        r.clienteNombre === clienteData.nombre
      )
      .sort((a, b) => new Date(b.fechaGeneracion || b.fecha) - new Date(a.fechaGeneracion || a.fecha));
  }, [recibos, clienteData]);

  const pagosCliente = useMemo(() => {
    return pagos
      .filter(p => 
        p.clienteId === clienteData.id ||
        p.cliente === clienteData.nombre
      )
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [pagos, clienteData]);

  const citasFuturas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return citas
      .filter(c => 
        (c.clienteId === clienteData.id || c.cliente === clienteData.nombre) &&
        c.estado === 'confirmada' &&
        new Date(c.fecha) >= hoy
      )
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 5); // Mostrar solo las próximas 5
  }, [citas, clienteData]);

  // Calcular resumen financiero
  const resumenFinanciero = useMemo(() => {
    const totalFacturado = recibosCliente.reduce((sum, r) => sum + (r.totalGeneral || 0), 0);
    const totalPagado = pagosCliente.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    const saldoPendiente = totalFacturado - totalPagado;
    const porcentajePagado = totalFacturado > 0 ? (totalPagado / totalFacturado) * 100 : 0;

    return {
      totalFacturado,
      totalPagado,
      saldoPendiente,
      porcentajePagado
    };
  }, [recibosCliente, pagosCliente]);

  const handleVerRecibo = (recibo) => {
    setReciboSeleccionado(recibo);
    setMostrarModalRecibo(true);
  };

  const getEstadoRecibo = (recibo) => {
    const pagosRecibo = pagosCliente.filter(p => 
      p.reciboId === recibo.id || 
      p.reciboFirebaseId === recibo.id
    );
    const totalPagadoRecibo = pagosRecibo.reduce((sum, p) => sum + parseFloat(p.monto), 0);

    if (totalPagadoRecibo >= recibo.totalGeneral) {
      return { estado: 'pagado', texto: 'Pagado', color: 'green' };
    } else if (totalPagadoRecibo > 0) {
      return { estado: 'parcial', texto: 'Pago Parcial', color: 'yellow' };
    } else {
      return { estado: 'pendiente', texto: 'Pendiente', color: 'red' };
    }
  };

  useEffect(() => {
    const cargarComprobantes = async () => {
      if (clienteData?.id) {
        const comps = await obtenerComprobantesCliente(clienteData.id);
        setComprobantesCliente(comps);
      }
    };
    cargarComprobantes();
  }, [clienteData]);

  const handleSubirComprobante = async (datos) => {
    const resultado = await subirComprobante(datos, storage);
    if (resultado.success) {
      // Recargar comprobantes
      const comps = await obtenerComprobantesCliente(clienteData.id);
      setComprobantesCliente(comps);
    } else {
      throw new Error(resultado.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏥 ACMC - Portal de Clientes
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido/a, {clienteData.nombre}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Resumen Financiero */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Tu Estado de Cuenta
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Total Facturado */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-purple-700">Total Facturado</span>
                <FileText size={24} className="text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-900">
                ${Math.round(resumenFinanciero.totalFacturado).toLocaleString()}
              </p>
              <p className="text-sm text-purple-600 mt-1">
                {recibosCliente.length} recibo(s)
              </p>
            </div>

            {/* Total Pagado */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-green-700">Total Pagado</span>
                <CreditCard size={24} className="text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-900">
                ${Math.round(resumenFinanciero.totalPagado).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {pagosCliente.length} pago(s)
              </p>
            </div>

            {/* Saldo Pendiente */}
            <div className={`${
              resumenFinanciero.saldoPendiente > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-blue-50 border-blue-200'
            } border rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${
                  resumenFinanciero.saldoPendiente > 0 ? 'text-red-700' : 'text-blue-700'
                }`}>
                  Saldo Pendiente
                </span>
                <DollarSign size={24} className={
                  resumenFinanciero.saldoPendiente > 0 ? 'text-red-600' : 'text-blue-600'
                } />
              </div>
              <p className={`text-3xl font-bold ${
                resumenFinanciero.saldoPendiente > 0 ? 'text-red-900' : 'text-blue-900'
              }`}>
                ${Math.round(Math.abs(resumenFinanciero.saldoPendiente)).toLocaleString()}
              </p>
              <p className={`text-sm mt-1 ${
                resumenFinanciero.saldoPendiente > 0 ? 'text-red-600' : 'text-blue-600'
              }`}>
                {resumenFinanciero.saldoPendiente > 0 ? 'Por pagar' : 'Al corriente'}
              </p>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso de pagos</span>
              <span className="font-semibold">
                {resumenFinanciero.porcentajePagado.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(resumenFinanciero.porcentajePagado, 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* Mis Recibos */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📄 Mis Recibos
          </h2>

          {recibosCliente.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tienes recibos registrados</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
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
                        Fecha
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
                    {recibosCliente.map((recibo) => {
                      const estadoRecibo = getEstadoRecibo(recibo);
                      return (
                        <tr key={recibo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900">
                              {recibo.mes} {recibo.año}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-600">
                              {recibo.reciboId || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {recibo.fechaGeneracion 
                              ? new Date(recibo.fechaGeneracion).toLocaleDateString('es-MX')
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-semibold text-gray-900">
                              ${Math.round(recibo.totalGeneral).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              estadoRecibo.color === 'green' 
                                ? 'bg-green-100 text-green-800'
                                : estadoRecibo.color === 'yellow'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {estadoRecibo.color === 'green' ? <CheckCircle size={12} /> :
                               estadoRecibo.color === 'yellow' ? <Clock size={12} /> :
                               <AlertCircle size={12} />}
                              {estadoRecibo.texto}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleVerRecibo(recibo)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye size={16} />
                                <span className="text-sm font-medium">Ver</span>
                              </button>
                              {getEstadoRecibo(recibo).estado !== 'pagado' && (
                                <button
                                  onClick={() => {
                                    setReciboParaPago(recibo);
                                    setMostrarSubirComprobante(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                  <Upload size={16} />
                                  <span className="text-sm font-medium">Pagar</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Historial de Pagos */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            💰 Historial de Pagos
          </h2>

          {pagosCliente.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <CreditCard size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay pagos registrados</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Concepto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Método
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagosCliente.map((pago, index) => (
                      <tr key={pago.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(pago.fecha).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {pago.concepto || 'Pago de servicios'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {pago.metodo || pago.metodoPago || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="font-semibold text-green-600">
                            ${Math.round(pago.monto).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right font-semibold text-gray-900">
                        Total Pagado:
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-green-600">
                          ${Math.round(resumenFinanciero.totalPagado).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Próximas Citas */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📅 Próximas Citas
          </h2>

          {citasFuturas.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tienes citas programadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {citasFuturas.map((cita) => (
                <div
                  key={cita.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Calendar size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {new Date(cita.fecha).toLocaleDateString('es-MX', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {cita.horaInicio} - {cita.horaFin}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Terapeuta:</span> {cita.terapeuta}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tipo:</span> {cita.tipoTerapia}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Recibo */}
      {mostrarModalRecibo && reciboSeleccionado && (
        <ModalRecibo
          recibo={reciboSeleccionado}
          nombreCliente={clienteData.nombre}
          onCerrar={() => {
            setMostrarModalRecibo(false);
            setReciboSeleccionado(null);
          }}
        />
      )}

      {mostrarSubirComprobante && (
        <SubirComprobante
          recibo={reciboParaPago}
          clienteId={clienteData?.id}
          onSubir={handleSubirComprobante}
          onCerrar={() => {
            setMostrarSubirComprobante(false);
            setReciboParaPago(null);
          }}
        />
      )}
    </div>
  );
};

export default PortalCliente;
