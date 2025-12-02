// src/components/ConfiguracionEmpresa.jsx
//
// Componente para configurar la personalización de la empresa
// Logo, nombre y colores del tema
//

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Save, Loader, Check, Building2, AlertCircle } from 'lucide-react';
import { useConfiguracion } from '../contexts/ConfiguracionContext';
import { guardarConfiguracion, subirLogo, eliminarLogo } from '../api/configuracion';

// Temas predefinidos
const TEMAS_PREDEFINIDOS = [
  { nombre: 'Azul', primario: '#2563eb', secundario: '#1e40af', acento: '#10b981' },
  { nombre: 'Verde', primario: '#16a34a', secundario: '#166534', acento: '#0891b2' },
  { nombre: 'Morado', primario: '#9333ea', secundario: '#7e22ce', acento: '#f59e0b' },
  { nombre: 'Rojo', primario: '#dc2626', secundario: '#b91c1c', acento: '#2563eb' },
  { nombre: 'Naranja', primario: '#ea580c', secundario: '#c2410c', acento: '#0d9488' },
  { nombre: 'Teal', primario: '#0d9488', secundario: '#0f766e', acento: '#8b5cf6' }
];

const ConfiguracionEmpresa = ({ onConfiguracionActualizada }) => {
  // Obtener configuración y organizationId del contexto
  const { configuracion, organizationId, cargando, cargarConfiguracion } = useConfiguracion();
  
  // Estados del formulario
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [colores, setColores] = useState({
    primario: '#2563eb',
    secundario: '#1e40af',
    acento: '#10b981'
  });
  
  // Estados de UI
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Debug: Log para verificar valores
  useEffect(() => {
    console.log('ConfiguracionEmpresa - organizationId:', organizationId);
    console.log('ConfiguracionEmpresa - configuracion:', configuracion);
    console.log('ConfiguracionEmpresa - cargando:', cargando);
  }, [organizationId, configuracion, cargando]);

  // Cargar configuración inicial
  useEffect(() => {
    if (configuracion) {
      setNombreEmpresa(configuracion.nombreEmpresa || '');
      setLogoUrl(configuracion.logoUrl || null);
      setColores(configuracion.colores || {
        primario: '#2563eb',
        secundario: '#1e40af',
        acento: '#10b981'
      });
    }
  }, [configuracion]);

  // Mostrar mensaje temporal
  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  // Manejar subida de logo
  const handleSubirLogo = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    if (!organizationId) {
      mostrarMensaje('Error: No se encontró la organización. Por favor recarga la página.', 'error');
      return;
    }

    setSubiendoLogo(true);
    try {
      const url = await subirLogo(archivo, organizationId);
      setLogoUrl(url);
      mostrarMensaje('Logo subido correctamente');
      
      // Recargar configuración
      await cargarConfiguracion();
      if (onConfiguracionActualizada) onConfiguracionActualizada();
    } catch (error) {
      mostrarMensaje(error.message, 'error');
    } finally {
      setSubiendoLogo(false);
    }
  };

  // Manejar eliminación de logo
  const handleEliminarLogo = async () => {
    if (!window.confirm('¿Eliminar el logo?')) return;

    if (!organizationId) {
      mostrarMensaje('Error: No se encontró la organización. Por favor recarga la página.', 'error');
      return;
    }

    setSubiendoLogo(true);
    try {
      await eliminarLogo(organizationId);
      setLogoUrl(null);
      mostrarMensaje('Logo eliminado');
      
      // Recargar configuración
      await cargarConfiguracion();
      if (onConfiguracionActualizada) onConfiguracionActualizada();
    } catch (error) {
      mostrarMensaje(error.message, 'error');
    } finally {
      setSubiendoLogo(false);
    }
  };

  // Aplicar tema predefinido
  const aplicarTema = (tema) => {
    setColores({
      primario: tema.primario,
      secundario: tema.secundario,
      acento: tema.acento
    });
  };

  // Guardar configuración
  const handleGuardar = async () => {
    if (!organizationId) {
      mostrarMensaje('Error: No se encontró la organización. Por favor recarga la página.', 'error');
      return;
    }

    setGuardando(true);
    try {
      await guardarConfiguracion({
        nombreEmpresa,
        logoUrl,
        colores
      }, organizationId);
      
      mostrarMensaje('Configuración guardada correctamente');
      
      // Recargar configuración
      await cargarConfiguracion();
      if (onConfiguracionActualizada) onConfiguracionActualizada();
    } catch (error) {
      mostrarMensaje('Error al guardar: ' + error.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Mostrar estado de carga mientras se obtiene la organización
  if (cargando) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <Loader className="animate-spin text-blue-600" size={24} />
          <span className="text-gray-600">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  // Mostrar error si no hay organización después de cargar
  if (!organizationId) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">No se pudo cargar la organización</p>
            <p className="text-sm mt-1">
              Tu usuario no tiene una organización asignada. 
              Contacta al administrador o recarga la página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
      <h2 className="text-xl font-bold text-gray-800">Configuración de Empresa</h2>
      
      {/* Mensaje de feedback */}
      {mensaje && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          mensaje.tipo === 'error' 
            ? 'bg-red-50 text-red-700' 
            : 'bg-green-50 text-green-700'
        }`}>
          {mensaje.tipo === 'success' && <Check size={20} />}
          {mensaje.tipo === 'error' && <AlertCircle size={20} />}
          {mensaje.texto}
        </div>
      )}

      {/* Sección: Logo */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 size={20} />
          Logo de la Empresa
        </h3>
        
        <div className="flex items-center gap-6">
          {/* Preview del logo */}
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-4xl text-gray-400">🏢</span>
            )}
          </div>
          
          {/* Botones de acción */}
          <div className="space-y-2">
            <label className="block">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleSubirLogo}
                className="hidden"
                disabled={subiendoLogo}
              />
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                subiendoLogo 
                  ? 'bg-gray-300 text-gray-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {subiendoLogo ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <Upload size={18} />
                )}
                {subiendoLogo ? 'Subiendo...' : 'Subir Logo'}
              </span>
            </label>
            
            {logoUrl && (
              <button
                onClick={handleEliminarLogo}
                disabled={subiendoLogo}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                Eliminar
              </button>
            )}
            
            <p className="text-sm text-gray-500">
              PNG, JPG o WEBP. Máximo 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Sección: Nombre de la empresa */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Nombre de la Empresa
        </h3>
        
        <input
          type="text"
          value={nombreEmpresa}
          onChange={(e) => setNombreEmpresa(e.target.value)}
          placeholder="Nombre de tu empresa"
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Sección: Colores */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Colores del Tema
        </h3>
        
        {/* Temas predefinidos */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">Temas predefinidos:</p>
          <div className="flex flex-wrap gap-2">
            {TEMAS_PREDEFINIDOS.map((tema) => (
              <button
                key={tema.nombre}
                onClick={() => aplicarTema(tema)}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: tema.primario }}
                />
                <span className="text-sm">{tema.nombre}</span>
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
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colores.primario}
                onChange={(e) => setColores(prev => ({ ...prev, primario: e.target.value }))}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colores.primario}
                onChange={(e) => setColores(prev => ({ ...prev, primario: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colores.secundario}
                onChange={(e) => setColores(prev => ({ ...prev, secundario: e.target.value }))}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colores.secundario}
                onChange={(e) => setColores(prev => ({ ...prev, secundario: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Acento
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colores.acento}
                onChange={(e) => setColores(prev => ({ ...prev, acento: e.target.value }))}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colores.acento}
                onChange={(e) => setColores(prev => ({ ...prev, acento: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
              />
            </div>
          </div>
        </div>
        
        {/* Vista previa */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: colores.primario }}
            >
              Primario
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: colores.secundario }}
            >
              Secundario
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: colores.acento }}
            >
              Acento
            </button>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="pt-4 border-t">
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            guardando
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {guardando ? (
            <Loader className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          {guardando ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
};

export default ConfiguracionEmpresa;
