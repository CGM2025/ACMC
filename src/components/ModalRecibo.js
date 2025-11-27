import React from 'react';
import { X, FileText, Calendar, DollarSign, Clock, User, TrendingUp } from 'lucide-react';

/**
 * Modal para visualizar el detalle completo de un recibo
 * Muestra información del cliente, citas incluidas, totales y cálculos
 * 
 * @param {Object} recibo - Datos del recibo
 * @param {Function} onCerrar - Función para cerrar el modal
 * @param {string} nombreCliente - Nombre del cliente
 * @param {boolean} esPortalCliente - Si es true, oculta ganancia, margen y costo terapeutas
 */
const ModalRecibo = ({ recibo, onCerrar, nombreCliente, esPortalCliente = false }) => {
  if (!recibo) return null;

  // Calcular totales si no vienen en el recibo
  const calcularTotales = () => {
    if (recibo.totalGeneral) {
      return {
        subtotal: recibo.totalPrecio || 0,
        iva: recibo.totalIva || 0,
        total: recibo.totalGeneral || 0,
        horas: recibo.totalHoras || 0,
        citas: recibo.totalCitas || 0,
        costo: recibo.totalCostoTerapeutas || 0,
        ganancia: recibo.gananciaTotal || 0,
        margen: recibo.margenPorcentaje || 0
      };
    }
    return null;
  };

  const totales = calcularTotales();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Recibo: {recibo.reciboId || 'N/A'}
              </h2>
              <p className="text-blue-100 text-sm">
                {recibo.mes && recibo.año ? `${recibo.mes} ${recibo.año}` : recibo.mes || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información del Cliente */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <User size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Información del Cliente</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold text-gray-900">
                  {nombreCliente || recibo.clienteNombre || recibo.cliente || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Código</p>
                <p className="font-semibold text-gray-900">
                  {recibo.clienteCodigo || recibo.codigo || 'N/A'}
                </p>
              </div>
              {recibo.fechaGeneracion && (
                <div>
                  <p className="text-sm text-gray-600">Fecha de Generación</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(recibo.fechaGeneracion).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  recibo.estadoPago === 'pagado' 
                    ? 'bg-green-100 text-green-800'
                    : recibo.estadoPago === 'parcial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {recibo.estadoPago === 'pagado' ? 'Pagado' : 
                   recibo.estadoPago === 'parcial' ? 'Pago Parcial' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen de Servicios - Vista diferente para cliente vs admin */}
          {totales && (
            <div className={`grid ${esPortalCliente ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4`}>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-700">Horas</span>
                  <Clock size={18} className="text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {totales.horas.toFixed(2)}h
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Citas</span>
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {totales.citas}
                </p>
              </div>

              {/* Solo mostrar Ganancia y Margen si NO es portal de cliente */}
              {!esPortalCliente && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Ganancia</span>
                      <TrendingUp size={18} className="text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      ${Math.round(totales.ganancia).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-amber-700">Margen</span>
                      <TrendingUp size={18} className="text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-900">
                      {totales.margen.toFixed(1)}%
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Detalle de Citas (si existen) */}
          {recibo.citas && recibo.citas.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalle de Citas ({recibo.citas.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Horario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Terapeuta
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        Duración
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        Precio
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recibo.citas.map((cita, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(cita.fecha).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {cita.horaInicio} - {cita.horaFin}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {cita.terapeuta}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {cita.tipoTerapia}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {cita.duracion?.toFixed(2)}h
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ${Math.round(cita.precio || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          ${Math.round(cita.total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totales Financieros */}
          {totales && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-gray-600" />
                Resumen Financiero
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ${Math.round(totales.subtotal).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-700">IVA (16%)</span>
                  <span className="font-semibold text-gray-900">
                    ${Math.round(totales.iva).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">TOTAL</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${Math.round(totales.total).toLocaleString()}
                  </span>
                </div>

                {/* Solo mostrar Costo Terapeutas y Ganancia si NO es portal de cliente */}
                {!esPortalCliente && totales.costo > 0 && (
                  <>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-gray-600">Costo Terapeutas</span>
                      <span className="text-sm font-medium text-gray-700">
                        ${Math.round(totales.costo).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-green-700">Ganancia</span>
                      <span className="text-sm font-bold text-green-600">
                        ${Math.round(totales.ganancia).toLocaleString()} ({totales.margen.toFixed(1)}%)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onCerrar}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRecibo;
