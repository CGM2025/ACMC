import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';

/**
 * Modal para crear/editar pagos con selector de recibos
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSave - Función para guardar el pago
 * @param {Object} props.pagoForm - Datos del formulario de pago
 * @param {Function} props.setPagoForm - Función para actualizar el formulario
 * @param {Array} props.clientes - Lista de clientes
 * @param {Array} props.recibos - Lista de recibos disponibles
 * @param {string|null} props.editingId - ID del pago en edición (null si es nuevo)
 */
const ModalPago = ({ 
  isOpen, 
  onClose, 
  onSave, 
  pagoForm, 
  setPagoForm, 
  clientes, 
  recibos,
  editingId 
}) => {
  const [mostrarRecibos, setMostrarRecibos] = useState(false);

  // Filtrar recibos del cliente seleccionado
  const recibosFiltrados = useMemo(() => {
    if (!pagoForm.clienteId) return [];
    
    const cliente = clientes.find(c => c.id === pagoForm.clienteId);
    if (!cliente) return [];

    return recibos.filter(r => r.clienteNombre === cliente.nombre);
  }, [pagoForm.clienteId, clientes, recibos]);

  // Obtener información del recibo seleccionado
  const reciboSeleccionado = useMemo(() => {
    if (!pagoForm.reciboFirebaseId) return null;
    return recibos.find(r => r.id === pagoForm.reciboFirebaseId);
  }, [pagoForm.reciboFirebaseId, recibos]);

  // Calcular deuda pendiente del recibo seleccionado
  const deudaPendiente = useMemo(() => {
    if (!reciboSeleccionado) return null;
    return reciboSeleccionado.totalGeneral - reciboSeleccionado.montoPagado;
  }, [reciboSeleccionado]);

  // Validar si el monto excede la deuda
  const montoExcedeDeuda = useMemo(() => {
    if (deudaPendiente === null) return false;
    const monto = parseFloat(pagoForm.monto) || 0;
    return monto > deudaPendiente + 0.01; // Tolerancia para decimales
  }, [pagoForm.monto, deudaPendiente]);

  // Cuando se selecciona un cliente, mostrar/ocultar sección de recibos
  useEffect(() => {
    if (pagoForm.clienteId && recibosFiltrados.length > 0) {
      setMostrarRecibos(true);
    } else {
      setMostrarRecibos(false);
    }
  }, [pagoForm.clienteId, recibosFiltrados.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            {editingId ? 'Editar Pago' : 'Registrar Pago'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
              value={pagoForm.clienteId} 
              onChange={(e) => {
                setPagoForm({
                  ...pagoForm, 
                  clienteId: e.target.value,
                  // Limpiar recibo si cambia de cliente
                  reciboFirebaseId: '',
                  reciboId: ''
                });
              }}
              required
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.codigo ? `(${c.codigo})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Recibo (solo si hay recibos del cliente) */}
          {mostrarRecibos && recibosFiltrados.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                🧾 Ligar a Recibo (Opcional)
              </label>
              <select
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                value={pagoForm.reciboFirebaseId}
                onChange={(e) => {
                  const recibo = recibos.find(r => r.id === e.target.value);
                  setPagoForm({
                    ...pagoForm,
                    reciboFirebaseId: e.target.value,
                    reciboId: recibo ? recibo.reciboId : ''
                  });
                }}
              >
                <option value="">Sin recibo (pago general)</option>
                {recibosFiltrados.map(recibo => (
                  <option key={recibo.id} value={recibo.id}>
                    {recibo.reciboId} - ${recibo.totalGeneral.toFixed(2)} 
                    {' '}({recibo.estadoPago === 'pendiente' ? '⏳ Pendiente' : 
                         recibo.estadoPago === 'parcial' ? '🟡 Parcial' : '✅ Pagado'})
                  </option>
                ))}
              </select>

              {/* Info del recibo seleccionado */}
              {reciboSeleccionado && (
                <div className="mt-3 text-sm bg-white border border-blue-200 rounded p-3">
                  <p className="font-medium text-blue-900 mb-1">
                    📋 {reciboSeleccionado.reciboId}
                  </p>
                  <div className="space-y-1 text-gray-700">
                    <p>Total: <span className="font-semibold">${reciboSeleccionado.totalGeneral.toFixed(2)}</span></p>
                    <p>Pagado: <span className="font-semibold">${reciboSeleccionado.montoPagado.toFixed(2)}</span></p>
                    <p>Pendiente: <span className="font-semibold text-orange-600">
                      ${(reciboSeleccionado.totalGeneral - reciboSeleccionado.montoPagado).toFixed(2)}
                    </span></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mensaje si no hay recibos */}
          {mostrarRecibos && recibosFiltrados.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ℹ️ Este cliente no tiene recibos registrados. El pago se guardará como pago general.
              </p>
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto ($) *
            </label>
            <input
              type="number"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                montoExcedeDeuda ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              value={pagoForm.monto}
              onChange={(e) => setPagoForm({...pagoForm, monto: e.target.value})}
              placeholder="0.00"
              required
            />
            {montoExcedeDeuda && (
              <p className="text-red-600 text-xs mt-1">
                El monto excede la deuda pendiente (${deudaPendiente.toFixed(2)})
              </p>
            )}
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concepto
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
              value={pagoForm.concepto} 
              onChange={(e) => setPagoForm({...pagoForm, concepto: e.target.value})}
              placeholder="Descripción del pago"
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
              value={pagoForm.metodo} 
              onChange={(e) => setPagoForm({...pagoForm, metodo: e.target.value})}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
              value={pagoForm.fecha} 
              onChange={(e) => setPagoForm({...pagoForm, fecha: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={montoExcedeDeuda}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              montoExcedeDeuda
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {editingId ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPago;
