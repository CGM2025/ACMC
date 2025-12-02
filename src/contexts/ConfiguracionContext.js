// src/contexts/ConfiguracionContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { obtenerConfiguracion } from '../api/configuracion';

/**
 * Contexto para la configuración de empresa
 * Permite acceder a logo, nombre y colores desde cualquier componente
 */

const ConfiguracionContext = createContext();

export const ConfiguracionProvider = ({ children }) => {
  const [configuracion, setConfiguracion] = useState({
    nombreEmpresa: 'ACMC',
    logoUrl: null,
    colores: {
      primario: '#2563eb',
      secundario: '#1e40af',
      acento: '#10b981'
    }
  });
  const [cargando, setCargando] = useState(true);

  // Cargar configuración al iniciar
  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const config = await obtenerConfiguracion();
      setConfiguracion(config);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setCargando(false);
    }
  };

  // Función para actualizar la configuración localmente
  const actualizarConfiguracion = (nuevaConfig) => {
    setConfiguracion(prev => ({ ...prev, ...nuevaConfig }));
  };

  return (
    <ConfiguracionContext.Provider value={{
      configuracion,
      cargando,
      cargarConfiguracion,
      actualizarConfiguracion
    }}>
      {children}
    </ConfiguracionContext.Provider>
  );
};

/**
 * Hook para acceder a la configuración
 */
export const useConfiguracion = () => {
  const context = useContext(ConfiguracionContext);
  if (!context) {
    throw new Error('useConfiguracion debe usarse dentro de ConfiguracionProvider');
  }
  return context;
};

export default ConfiguracionContext;
