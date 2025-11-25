import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  Clock,
  AlertCircle,
  X,
  FileText,
  Image,
  DollarSign,
  User,
  Calendar,
  CreditCard,
  Loader,
  RefreshCw
} from 'lucide-react';

/**
 * Panel de Admin para revisar y aprobar comprobantes de pago
 */
const GestionComprobantes = ({ 
  comprobantes = [],
  clientes = [],
  recibos = [],
  onAprobar,
  onRechazar,
  onRecargar,
  loading = false
}) => {
  const [filtro, setFiltro] = useState('pendiente'); // pendiente, aprobado, rechazado, todos
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [mostrarRechazo, setMostrarRechazo] = useState(false);

  // Filtrar comprobantes según estado
  const comprobantesFiltrados = comprobantes.filter(c => {
    if (filtro === 'todos') return true;
    return c.estado === filtro;
  });

  // Obtener nombre del cliente
  const getClienteNombre = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  // Obtener info del recibo
  const getReciboInfo = (reciboId) => {
    const recibo = recibos.find(r => r.id === reciboId);
    return recibo ? `Recibo ${recibo.numero || ''} - ${recibo.periodo}` : 'Recibo no encontrado';
  };

  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Abrir modal de detalle
  const verDetalle = (comprobante) => {
    setComprobanteSeleccionado(comprobante);
    setMostrarModal(true);
    setMostrarRechazo(false);
    setMotivoRechazo('');
  };

  // Cerrar modal
  const cerrarModal = () => {
    setMostrarModal(false);
    setComprobanteSeleccionado(null);
    setMostrarRechazo(false);
    setMotivoRechazo('');
  };

  // Aprobar comprobante
  const handleAprobar = async () => {
    if (!comprobanteSeleccionado) return;
    
    setProcesando(true);
    try {
      await onAprobar(comprobanteSeleccionado);
      cerrarModal();
    } catch (error) {
      console.error('Error aprobando:', error);
      alert('Error al aprobar el comprobante');
    } finally {
      setProcesando(false);
    }
  };

  // Rechazar comprobante
  const handleRechazar = async () => {
    if (!comprobanteSeleccionado) return;
    if (!motivoRechazo.trim()) {
      alert('Por favor indica el motivo del rechazo');
      return;
    }

    setProcesando(true);
    try {
      await onRechazar(comprobanteSeleccionado, motivoRechazo);
      cerrarModal();
    } catch (error) {
      console.error('Error rechazando:', error);
      alert('Error al rechazar el comprobante');
    } finally {
      setProcesando(false);
    }
  };

  // Contadores por estado
  const contadores = {
    pendiente: comprobantes.filter(c => c.estado === 'pendiente').length,
    aprobado: comprobantes.filter(c => c.estado === 'aprobado').length,
    rechazado: comprobantes.filter(c => c.estado === 'rechazado').length,
    todos: comprobantes.length
  };

  // Badge de estado
  const EstadoBadge = ({ estado }) => {
    const configs = {
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pendiente' },
      aprobado: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Aprobado' },
      rechazado: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rechazado' }
    };
    const config = configs[estado] || configs.pendiente;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileCheck size={28} />
            Comprobantes de Pago
          </h2>
          <p className="text-gray-600 mt-1">
            Revisa y aprueba los comprobantes enviados por los clientes
          </p>
        </div>
        <button
          onClick={onRecargar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'pendiente', label: 'Pendientes', color: 'yellow' },
          { key: 'aprobado', label: 'Aprobados', color: 'green' },
          { key: 'rechazado', label: 'Rechazados', color: 'red' },
          { key: 'todos', label: 'Todos', color: 'gray' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === f.key
                ? f.color === 'yellow' ? 'bg-yellow-500 text-white' :
                  f.color === 'green' ? 'bg-green-500 text-white' :
                  f.color === 'red' ? 'bg-red-500 text-white' :
                  'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filtro === f.key ? 'bg-white/30' : 'bg-gray-300'
            }`}>
              {contadores[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Lista de comprobantes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <Loader size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Cargando comprobantes...</p>
          </div>
        ) : comprobantesFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No hay comprobantes {filtro !== 'todos' ? filtro + 's' : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Recibo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comprobantesFiltrados.map((comprobante) => (
                  <tr key={comprobante.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {getClienteNombre(comprobante.clienteId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {comprobante.reciboPeriodo || getReciboInfo(comprobante.reciboId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-green-600">
                        ${comprobante.monto?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {comprobante.metodoPago || 'No especificado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatFecha(comprobante.fechaSubida)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EstadoBadge estado={comprobante.estado} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => verDetalle(comprobante)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                      >
                        <Eye size={16} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {mostrarModal && comprobanteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Detalle del Comprobante
              </h3>
              <button
                onClick={cerrarModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              {/* Info del comprobante */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User size={20} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Cliente</p>
                    <p className="font-medium">{getClienteNombre(comprobanteSeleccionado.clienteId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DollarSign size={20} className="text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Monto</p>
                    <p className="font-medium text-green-600">
                      ${comprobanteSeleccionado.monto?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard size={20} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Método</p>
                    <p className="font-medium capitalize">{comprobanteSeleccionado.metodoPago}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar size={20} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Fecha de envío</p>
                    <p className="font-medium">{formatFecha(comprobanteSeleccionado.fechaSubida)}</p>
                  </div>
                </div>
              </div>

              {/* Concepto */}
              {comprobanteSeleccionado.concepto && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Concepto</p>
                  <p className="text-blue-900">{comprobanteSeleccionado.concepto}</p>
                </div>
              )}

              {/* Imagen/PDF del comprobante */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Comprobante:</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {comprobanteSeleccionado.archivoTipo?.startsWith('image/') ? (
                    <img
                      src={comprobanteSeleccionado.archivoURL}
                      alt="Comprobante"
                      className="w-full max-h-96 object-contain bg-gray-100"
                    />
                  ) : (
                    <div className="p-8 text-center bg-gray-50">
                      <FileText size={48} className="text-red-500 mx-auto mb-2" />
                      <p className="text-gray-600 mb-4">Archivo PDF</p>
                      <a
                        href={comprobanteSeleccionado.archivoURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Download size={18} />
                        Ver PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado actual */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <span className="text-gray-600">Estado actual:</span>
                <EstadoBadge estado={comprobanteSeleccionado.estado} />
              </div>

              {/* Motivo de rechazo si existe */}
              {comprobanteSeleccionado.estado === 'rechazado' && comprobanteSeleccionado.motivoRechazo && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <p className="text-sm font-medium text-red-800 mb-1">Motivo del rechazo:</p>
                  <p className="text-red-700">{comprobanteSeleccionado.motivoRechazo}</p>
                </div>
              )}

              {/* Formulario de rechazo */}
              {mostrarRechazo && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <label className="block text-sm font-medium text-red-800 mb-2">
                    Motivo del rechazo *
                  </label>
                  <textarea
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Ej: El comprobante no es legible, el monto no coincide, etc."
                  />
                </div>
              )}
            </div>

            {/* Footer con acciones */}
            {comprobanteSeleccionado.estado === 'pendiente' && (
              <div className="flex gap-3 p-6 border-t bg-gray-50">
                {!mostrarRechazo ? (
                  <>
                    <button
                      onClick={() => setMostrarRechazo(true)}
                      disabled={procesando}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium disabled:opacity-50"
                    >
                      <XCircle size={20} />
                      Rechazar
                    </button>
                    <button
                      onClick={handleAprobar}
                      disabled={procesando}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                    >
                      {procesando ? (
                        <Loader size={20} className="animate-spin" />
                      ) : (
                        <CheckCircle size={20} />
                      )}
                      Aprobar Pago
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setMostrarRechazo(false)}
                      disabled={procesando}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleRechazar}
                      disabled={procesando || !motivoRechazo.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                    >
                      {procesando ? (
                        <Loader size={20} className="animate-spin" />
                      ) : (
                        <XCircle size={20} />
                      )}
                      Confirmar Rechazo
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionComprobantes;
