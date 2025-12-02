// src/components/ConfiguracionEmpresa.jsx
import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Save, Building2, Palette, Check } from 'lucide-react';
import { 
  obtenerConfiguracion, 
  guardarConfiguracion, 
  subirLogo, 
  eliminarLogo 
} from '../api/configuracion';

/**
 * Componente para configurar la personalización de la empresa
 * Solo visible para administradores
 */
const ConfiguracionEmpresa = ({ onConfiguracionActualizada }) => {
  const [config, setConfig] = useState({
    nombreEmpresa: '',
    logoUrl: null,
    colores: {
      primario: '#2563eb',
      secundario: '#1e40af',
      acento: '#10b981'
    }
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Colores predefinidos para elegir
  const coloresPredefinidos = [
    { nombre: 'Azul', primario: '#2563eb', secundario: '#1e40af', acento: '#10b981' },
    { nombre: 'Verde', primario: '#059669', secundario: '#047857', acento: '#2563eb' },
    { nombre: 'Morado', primario: '#7c3aed', secundario: '#5b21b6', acento: '#f59e0b' },
    { nombre: 'Rojo', primario: '#dc2626', secundario: '#b91c1c', acento: '#2563eb' },
    { nombre: 'Naranja', primario: '#ea580c', secundario: '#c2410c', acento: '#2563eb' },
    { nombre: 'Teal', primario: '#0d9488', secundario: '#0f766e', acento: '#f59e0b' },
  ];

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    try {
      const data = await obtenerConfiguracion();
      setConfig(data);
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al cargar configuración', 'error');
    } finally {
      setCargando(false);
    }
  };

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleSubirLogo = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setSubiendoLogo(true);
    try {
      const url = await subirLogo(archivo);
      setConfig(prev => ({ ...prev, logoUrl: url }));
      mostrarMensaje('Logo subido correctamente');
      if (onConfiguracionActualizada) onConfiguracionActualizada();
    } catch (error) {
      mostrarMensaje(error.message || 'Error al subir logo', 'error');
    } finally {
      setSubiendoLogo(false);
    }
  };

  const handleEliminarLogo = async () => {
    if (!window.confirm('¿Eliminar el logo actual?')) return;

    try {
      await eliminarLogo();
      setConfig(prev => ({ ...prev, logoUrl: null }));
      mostrarMensaje('Logo eliminado');
      if (onConfiguracionActualizada) onConfiguracionActualizada();
    } catch (error) {
      mostrarMensaje('Error al eliminar logo', 'error');
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await guardarConfiguracion(config);
      mostrarMensaje('Configuración guardada correctamente');
      if (onConfiguracionActualizada) onConfiguracionActualizada();
    } catch (error) {
      mostrarMensaje('Error al guardar configuración', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const aplicarTemaColor = (tema) => {
    setConfig(prev => ({
      ...prev,
      colores: {
        primario: tema.primario,
        secundario: tema.secundario,
        acento: tema.acento
      }
    }));
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de feedback */}
      {mensaje && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          mensaje.tipo === 'error' 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          <Check size={20} />
          {mensaje.texto}
        </div>
      )}

      {/* Sección: Logo */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-blue-600" />
          Logo de la Empresa
        </h3>

        <div className="flex items-start gap-6">
          {/* Vista previa del logo */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
              {config.logoUrl ? (
                <img 
                  src={config.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Building2 size={40} className="mx-auto mb-1" />
                  <span className="text-xs">Sin logo</span>
                </div>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="flex-1 space-y-4">
            <p className="text-sm text-gray-600">
              Sube el logo de tu empresa. Formatos permitidos: PNG, JPG, WEBP. Tamaño máximo: 2MB.
            </p>

            <div className="flex gap-3">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                subiendoLogo 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                <Upload size={18} />
                {subiendoLogo ? 'Subiendo...' : 'Subir Logo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleSubirLogo}
                  disabled={subiendoLogo}
                  className="hidden"
                />
              </label>

              {config.logoUrl && (
                <button
                  onClick={handleEliminarLogo}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Nombre de la Empresa */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Nombre de la Empresa
        </h3>

        <input
          type="text"
          value={config.nombreEmpresa}
          onChange={(e) => setConfig(prev => ({ ...prev, nombreEmpresa: e.target.value }))}
          placeholder="Nombre de tu empresa"
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-2">
          Este nombre aparecerá en el sidebar, portal de terapeutas y pantalla de login.
        </p>
      </div>

      {/* Sección: Colores */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Palette size={20} className="text-blue-600" />
          Colores del Tema
        </h3>

        {/* Temas predefinidos */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">Temas predefinidos:</p>
          <div className="flex flex-wrap gap-3">
            {coloresPredefinidos.map((tema) => (
              <button
                key={tema.nombre}
                onClick={() => aplicarTemaColor(tema)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: tema.primario }}
                />
                <span className="text-sm font-medium text-gray-700">{tema.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colores personalizados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Primario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.colores.primario}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  colores: { ...prev.colores, primario: e.target.value }
                }))}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={config.colores.primario}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  colores: { ...prev.colores, primario: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.colores.secundario}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  colores: { ...prev.colores, secundario: e.target.value }
                }))}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={config.colores.secundario}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  colores: { ...prev.colores, secundario: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color de Acento
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.colores.acento}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  colores: { ...prev.colores, acento: e.target.value }
                }))}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={config.colores.acento}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  colores: { ...prev.colores, acento: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">Vista previa:</p>
          <div className="flex items-center gap-4">
            <button
              style={{ backgroundColor: config.colores.primario }}
              className="px-4 py-2 text-white rounded-lg"
            >
              Botón Primario
            </button>
            <button
              style={{ backgroundColor: config.colores.secundario }}
              className="px-4 py-2 text-white rounded-lg"
            >
              Botón Secundario
            </button>
            <button
              style={{ backgroundColor: config.colores.acento }}
              className="px-4 py-2 text-white rounded-lg"
            >
              Botón Acento
            </button>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            guardando
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Save size={20} />
          {guardando ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
};

export default ConfiguracionEmpresa;
