import React, { useState } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

/**
 * Componente para que el cliente suba comprobantes de pago
 * Se usa dentro del Portal del Cliente
 */
const SubirComprobante = ({ 
  recibo, 
  clienteId,
  onSubir, 
  onCerrar 
}) => {
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState(recibo?.saldoPendiente || '');
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const metodosPermitidos = [
    { value: 'transferencia', label: 'Transferencia Bancaria' },
    { value: 'deposito', label: 'Depósito en Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'otro', label: 'Otro' }
  ];

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
      setError('Solo se permiten imágenes (JPG, PNG, GIF) o PDF');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede ser mayor a 5MB');
      return;
    }

    setError('');
    setArchivo(file);

    // Crear preview si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!archivo) {
      setError('Debes seleccionar un archivo');
      return;
    }

    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubir({
        archivo,
        reciboId: recibo?.id,
        reciboPeriodo: recibo?.periodo,
        clienteId,
        concepto: concepto || `Pago de ${recibo?.periodo || 'servicios'}`,
        monto: parseFloat(monto),
        metodoPago
      });

      setExito(true);
    } catch (err) {
      console.error('Error subiendo comprobante:', err);
      setError(err.message || 'Error al subir el comprobante');
    } finally {
      setLoading(false);
    }
  };

  const quitarArchivo = () => {
    setArchivo(null);
    setPreview(null);
  };

  // Pantalla de éxito
  if (exito) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ¡Comprobante Enviado!
          </h3>
          <p className="text-gray-600 mb-6">
            Tu comprobante ha sido enviado para revisión. 
            Te notificaremos cuando sea aprobado.
          </p>
          <button
            onClick={onCerrar}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Subir Comprobante de Pago
          </h3>
          <button
            onClick={onCerrar}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info del recibo */}
        {recibo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Recibo:</strong> {recibo.numero || recibo.id}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Período:</strong> {recibo.periodo}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Saldo pendiente:</strong> ${recibo.saldoPendiente?.toLocaleString() || recibo.total?.toLocaleString()}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Zona de upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comprobante de pago *
          </label>
          
          {!archivo ? (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Upload size={32} className="text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 text-center">
                <span className="text-blue-600 font-medium">Click para subir</span>
                {' '}o arrastra tu archivo
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, GIF o PDF (máx. 5MB)
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleArchivoChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-4">
                {/* Preview o icono */}
                {preview ? (
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    {archivo.type === 'application/pdf' ? (
                      <FileText size={32} className="text-red-500" />
                    ) : (
                      <Image size={32} className="text-gray-400" />
                    )}
                  </div>
                )}
                
                {/* Info del archivo */}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {archivo.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(archivo.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={quitarArchivo}
                    className="text-sm text-red-600 hover:text-red-700 mt-1"
                  >
                    Quitar archivo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Monto */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto pagado *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* Método de pago */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de pago
          </label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {metodosPermitidos.map(metodo => (
              <option key={metodo.value} value={metodo.value}>
                {metodo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Concepto (opcional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Concepto o nota (opcional)
          </label>
          <input
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Pago correspondiente a octubre 2024"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !archivo}
            className={`flex-1 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 ${
              loading || !archivo
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={18} />
                Enviar Comprobante
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubirComprobante;
