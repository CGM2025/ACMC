import React, { useState, useEffect } from 'react';
import { X, DollarSign, User, Users, Calendar, FileText } from 'lucide-react';

/**
 * Modal para agregar o editar cargos de sombra
 * 
 * Props:
 * - isOpen: boolean - Si el modal está abierto
 * - onClose: function - Callback al cerrar
 * - onSave: function - Callback al guardar (recibe el cargo)
 * - clientes: array - Lista de clientes
 * - terapeutas: array - Lista de terapeutas
 * - cargoExistente: object - Cargo a editar (null para nuevo)
 * - mesActual: string - Mes actual en formato "YYYY-MM"
 */
const ModalCargoSombra = ({ 
  isOpen, 
  onClose, 
  onSave, 
  clientes = [], 
  terapeutas = [], 
  cargoExistente = null,
  mesActual = ''
}) => {
  const [formData, setFormData] = useState({
    clienteId: '',
    clienteNombre: '',
    terapeutaId: '',
    terapeutaNombre: '',
    mes: mesActual || new Date().toISOString().slice(0, 7),
    montoCliente: '',
    montoTerapeuta: '',
    descripcion: ''
  });
  
  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Cargar datos existentes si es edición
  useEffect(() => {
    if (cargoExistente) {
      setFormData({
        clienteId: cargoExistente.clienteId || '',
        clienteNombre: cargoExistente.clienteNombre || '',
        terapeutaId: cargoExistente.terapeutaId || '',
        terapeutaNombre: cargoExistente.terapeutaNombre || '',
        mes: cargoExistente.mes || mesActual,
        montoCliente: cargoExistente.montoCliente?.toString() || '',
        montoTerapeuta: cargoExistente.montoTerapeuta?.toString() || '',
        descripcion: cargoExistente.descripcion || ''
      });
    } else {
      // Reset para nuevo cargo
      setFormData({
        clienteId: '',
        clienteNombre: '',
        terapeutaId: '',
        terapeutaNombre: '',
        mes: mesActual || new Date().toISOString().slice(0, 7),
        montoCliente: '',
        montoTerapeuta: '',
        descripcion: ''
      });
    }
    setErrors({});
  }, [cargoExistente, mesActual, isOpen]);

  // Actualizar descripción automáticamente
  useEffect(() => {
    if (formData.mes) {
      const [year, month] = formData.mes.split('-');
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const nombreMes = meses[parseInt(month) - 1];
      setFormData(prev => ({
        ...prev,
        descripcion: `Sombra Escolar - ${nombreMes} ${year}`
      }));
    }
  }, [formData.mes]);

  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const cliente = clientes.find(c => c.id === clienteId);
    setFormData(prev => ({
      ...prev,
      clienteId,
      clienteNombre: cliente?.nombre || ''
    }));
  };

  const handleTerapeutaChange = (e) => {
    const terapeutaId = e.target.value;
    const terapeuta = terapeutas.find(t => t.id === terapeutaId);
    setFormData(prev => ({
      ...prev,
      terapeutaId,
      terapeutaNombre: terapeuta?.nombre || ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error al editar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validar = () => {
    const nuevosErrores = {};
    
    if (!formData.clienteId) {
      nuevosErrores.clienteId = 'Selecciona un cliente';
    }
    if (!formData.terapeutaId) {
      nuevosErrores.terapeutaId = 'Selecciona una terapeuta';
    }
    if (!formData.mes) {
      nuevosErrores.mes = 'Selecciona un mes';
    }
    if (!formData.montoCliente || parseFloat(formData.montoCliente) <= 0) {
      nuevosErrores.montoCliente = 'Ingresa un monto válido';
    }
    if (!formData.montoTerapeuta || parseFloat(formData.montoTerapeuta) < 0) {
      nuevosErrores.montoTerapeuta = 'Ingresa un monto válido';
    }
    
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validar()) return;
    
    setGuardando(true);
    
    try {
      const cargoData = {
        ...formData,
        montoCliente: parseFloat(formData.montoCliente),
        montoTerapeuta: parseFloat(formData.montoTerapeuta)
      };
      
      await onSave(cargoData, cargoExistente?.id);
      onClose();
    } catch (error) {
      console.error('Error al guardar cargo:', error);
      alert('Error al guardar el cargo: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Calcular utilidad en tiempo real
  const montoCliente = parseFloat(formData.montoCliente) || 0;
  const montoTerapeuta = parseFloat(formData.montoTerapeuta) || 0;
  const utilidad = montoCliente - montoTerapeuta;
  const porcentajeUtilidad = montoCliente > 0 ? ((utilidad / montoCliente) * 100).toFixed(1) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={20} />
            {cargoExistente ? 'Editar Cargo de Sombra' : 'Agregar Cargo de Sombra'}
          </h2>
          <button 
            onClick={onClose}
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Mes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Mes
            </label>
            <input
              type="month"
              name="mes"
              value={formData.mes}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.mes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.mes && <p className="text-red-500 text-xs mt-1">{errors.mes}</p>}
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={16} className="inline mr-1" />
              Cliente
            </label>
            <select
              value={formData.clienteId}
              onChange={handleClienteChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.clienteId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes
                .filter(c => c.activo !== false)
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))
              }
            </select>
            {errors.clienteId && <p className="text-red-500 text-xs mt-1">{errors.clienteId}</p>}
          </div>

          {/* Terapeuta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users size={16} className="inline mr-1" />
              Terapeuta
            </label>
            <select
              value={formData.terapeutaId}
              onChange={handleTerapeutaChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.terapeutaId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar terapeuta...</option>
              {terapeutas
                .filter(t => t.activo !== false)
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .map(terapeuta => (
                  <option key={terapeuta.id} value={terapeuta.id}>
                    {terapeuta.nombre}
                  </option>
                ))
              }
            </select>
            {errors.terapeutaId && <p className="text-red-500 text-xs mt-1">{errors.terapeutaId}</p>}
          </div>

          {/* Montos */}
          <div className="grid grid-cols-2 gap-4">
            {/* Monto Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign size={16} className="inline mr-1" />
                Cobro al Cliente
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="montoCliente"
                  value={formData.montoCliente}
                  onChange={handleChange}
                  placeholder="24000"
                  className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.montoCliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.montoCliente && <p className="text-red-500 text-xs mt-1">{errors.montoCliente}</p>}
            </div>

            {/* Monto Terapeuta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign size={16} className="inline mr-1" />
                Pago a Terapeuta
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="montoTerapeuta"
                  value={formData.montoTerapeuta}
                  onChange={handleChange}
                  placeholder="19500"
                  className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.montoTerapeuta ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.montoTerapeuta && <p className="text-red-500 text-xs mt-1">{errors.montoTerapeuta}</p>}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText size={16} className="inline mr-1" />
              Descripción
            </label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Sombra Escolar - Noviembre 2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Resumen de Utilidad */}
          {(montoCliente > 0 || montoTerapeuta > 0) && (
            <div className={`p-3 rounded-lg ${utilidad >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Utilidad ACMC:</span>
                <span className={`font-bold ${utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${utilidad.toLocaleString()} ({porcentajeUtilidad}%)
                </span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : (cargoExistente ? 'Actualizar' : 'Agregar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCargoSombra;
