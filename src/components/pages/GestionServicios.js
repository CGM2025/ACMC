import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  DollarSign,
  Package,
  Check,
  XCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Loader
} from 'lucide-react';

/**
 * Componente para gestionar servicios/tipos de terapia
 * Permite ver, agregar, editar y eliminar servicios
 */
const GestionServicios = ({ 
  servicios = [],
  onCrear,
  onActualizar,
  onEliminar,
  onActivar,
  onDesactivar
}) => {
  // Estados
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);
  
  // Niveles disponibles para terapeutas
  const NIVELES_TERAPEUTA = [
    { value: 'terapeuta_ocupacional', label: 'Terapeuta Ocupacional' },
    { value: 'junior', label: 'Terapeuta Junior' },
    { value: 'senior', label: 'Terapeuta Senior' },
    { value: 'coordinadora', label: 'Coordinadora' },
    { value: 'supervisora', label: 'Supervisora' },
    { value: 'recursos_humanos', label: 'Recursos Humanos' }
  ];

  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    orden: '',
    descripcion: '',
    activo: true,
    nivelesPermitidos: [] // Niveles de terapeuta que pueden dar este servicio
  });

  /**
   * Resetea el formulario
   */
  const resetForm = () => {
    setForm({
      nombre: '',
      precio: '',
      orden: '',
      descripcion: '',
      activo: true,
      nivelesPermitidos: []
    });
    setEditando(null);
    setMostrarFormulario(false);
  };

  /**
   * Abre el formulario para crear
   */
  const abrirCrear = () => {
    resetForm();
    setForm(prev => ({
      ...prev,
      orden: servicios.length + 1
    }));
    setMostrarFormulario(true);
  };

  /**
   * Abre el formulario para editar
   */
  const abrirEditar = (servicio) => {
    setEditando(servicio);
    setForm({
      nombre: servicio.nombre,
      precio: servicio.precio.toString(),
      orden: servicio.orden?.toString() || '99',
      descripcion: servicio.descripcion || '',
      activo: servicio.activo !== false,
      nivelesPermitidos: servicio.nivelesPermitidos || []
    });
    setMostrarFormulario(true);
  };

  /**
   * Guarda el servicio (crear o actualizar)
   */
  const guardar = async () => {
    // Validaciones
    if (!form.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }
    if (!form.precio || parseFloat(form.precio) < 0) {
      alert('El precio debe ser un número válido');
      return;
    }

    setGuardando(true);

    try {
      const datos = {
        nombre: form.nombre.trim(),
        precio: parseFloat(form.precio),
        orden: parseInt(form.orden) || 99,
        descripcion: form.descripcion.trim(),
        activo: form.activo,
        nivelesPermitidos: form.nivelesPermitidos || []
      };

      if (editando) {
        await onActualizar(editando.id, datos);
      } else {
        await onCrear(datos);
      }

      resetForm();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Elimina un servicio
   */
  const eliminar = async (id) => {
    try {
      await onEliminar(id);
      setConfirmandoEliminar(null);
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  /**
   * Toggle activo/inactivo
   */
  const toggleActivo = async (servicio) => {
    try {
      if (servicio.activo !== false) {
        await onDesactivar(servicio.id);
      } else {
        await onActivar(servicio.id);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Ordenar servicios
  const serviciosOrdenados = [...servicios].sort((a, b) => 
    (a.orden || 99) - (b.orden || 99)
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="text-purple-600" size={28} />
            Gestión de Servicios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los tipos de terapia y sus precios base
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo Servicio
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">¿Cómo funcionan los precios?</p>
            <p>
              Los precios definidos aquí son los <strong>precios base</strong>. 
              Si un cliente tiene un <strong>precio personalizado</strong> para un servicio, 
              se usará ese precio en lugar del base.
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Servicios */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Orden
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Servicio
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                Precio/Hora
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Estado
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {serviciosOrdenados.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No hay servicios configurados</p>
                  <button
                    onClick={abrirCrear}
                    className="mt-3 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Crear primer servicio
                  </button>
                </td>
              </tr>
            ) : (
              serviciosOrdenados.map((servicio) => (
                <tr 
                  key={servicio.id} 
                  className={`hover:bg-gray-50 ${servicio.activo === false ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                      {servicio.orden || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{servicio.nombre}</div>
                    {servicio.descripcion && (
                      <div className="text-xs text-gray-500 mt-0.5">{servicio.descripcion}</div>
                    )}
                    {servicio.nivelesPermitidos && servicio.nivelesPermitidos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {servicio.nivelesPermitidos.map(nivel => (
                          <span key={nivel} className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                            {nivel === 'terapeuta_ocupacional' && 'T.O.'}
                            {nivel === 'junior' && 'Jr'}
                            {nivel === 'senior' && 'Sr'}
                            {nivel === 'coordinadora' && 'Coord'}
                            {nivel === 'supervisora' && 'Sup'}
                            {nivel === 'recursos_humanos' && 'RRHH'}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-lg font-semibold text-green-600">
                      <DollarSign size={16} />
                      {servicio.precio.toLocaleString('es-MX')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActivo(servicio)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        servicio.activo !== false
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {servicio.activo !== false ? (
                        <>
                          <Check size={12} />
                          Activo
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => abrirEditar(servicio)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmandoEliminar(servicio)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>
          {servicios.filter(s => s.activo !== false).length} servicios activos 
          de {servicios.length} totales
        </span>
        <span>
          Precio promedio: ${servicios.length > 0 
            ? Math.round(servicios.reduce((sum, s) => sum + s.precio, 0) / servicios.length).toLocaleString('es-MX')
            : 0
          }
        </span>
      </div>

      {/* Modal Formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editando ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Sesión de ABA estándar"
                />
              </div>

              {/* Precio y Orden */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio por Hora *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={form.precio}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="450"
                      min="0"
                      step="10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Descripción del servicio..."
                  rows={2}
                />
              </div>

              {/* Niveles Permitidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveles de Terapeuta Permitidos
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Selecciona qué niveles de terapeuta pueden dar este servicio. Si no seleccionas ninguno, todos podrán darlo.
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
                  {NIVELES_TERAPEUTA.map((nivel) => (
                    <label key={nivel.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.nivelesPermitidos.includes(nivel.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, nivelesPermitidos: [...form.nivelesPermitidos, nivel.value] });
                          } else {
                            setForm({ ...form, nivelesPermitidos: form.nivelesPermitidos.filter(n => n !== nivel.value) });
                          }
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{nivel.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Activo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">
                  Servicio activo (visible en selects)
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={resetForm}
                disabled={guardando}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editando ? 'Guardar Cambios' : 'Crear Servicio'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar */}
      {confirmandoEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Eliminar servicio?
              </h3>
              <p className="text-gray-600 mb-2">
                <strong>{confirmandoEliminar.nombre}</strong>
              </p>
              <p className="text-sm text-red-600 mb-6">
                Esta acción no se puede deshacer. Considera desactivarlo en su lugar.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmandoEliminar(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => eliminar(confirmandoEliminar.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionServicios;
