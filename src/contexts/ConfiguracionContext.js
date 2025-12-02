// src/contexts/ConfiguracionContext.js
//
// Contexto para manejar la configuración de empresa globalmente
// Recibe currentUser e isLoggedIn como props del Provider
//

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { obtenerConfiguracion } from '../api/configuracion';

// Crear el contexto
const ConfiguracionContext = createContext(null);

/**
 * Provider de configuración que envuelve la aplicación
 * IMPORTANTE: Recibe currentUser e isLoggedIn como props desde App.js
 */
export const ConfiguracionProvider = ({ children, currentUser, isLoggedIn }) => {
  const [configuracion, setConfiguracion] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // Obtener organizationId del usuario pasado como prop
  const organizationId = currentUser?.organizationId || null;

  // Debug: Log para verificar qué recibe el Provider
  useEffect(() => {
    console.log('🔍 ConfiguracionProvider recibió:');
    console.log('   - isLoggedIn:', isLoggedIn);
    console.log('   - currentUser:', currentUser);
    console.log('   - organizationId:', organizationId);
  }, [isLoggedIn, currentUser, organizationId]);

  /**
   * Carga la configuración desde Firestore
   */
  const cargarConfiguracion = useCallback(async () => {
    if (!organizationId) {
      console.warn('⚠️ ConfiguracionContext: No hay organizationId disponible');
      setCargando(false);
      return;
    }
    
    try {
      setCargando(true);
      console.log('📥 Cargando configuración para org:', organizationId);
      const config = await obtenerConfiguracion(organizationId);
      setConfiguracion(config);
      console.log('✅ Configuración cargada:', config);
    } catch (error) {
      console.error('❌ Error al cargar configuración:', error);
    } finally {
      setCargando(false);
    }
  }, [organizationId]);

  /**
   * Actualiza la configuración en el estado local
   * (Llamar después de guardar en Firestore)
   */
  const actualizarConfiguracion = useCallback((nuevaConfig) => {
    setConfiguracion(prev => ({ ...prev, ...nuevaConfig }));
  }, []);

  // Cargar configuración cuando el usuario inicia sesión o cambia de organización
  useEffect(() => {
    if (isLoggedIn && organizationId) {
      console.log('🔄 Disparando carga de configuración...');
      cargarConfiguracion();
    } else {
      setConfiguracion(null);
      setCargando(false);
    }
  }, [isLoggedIn, organizationId, cargarConfiguracion]);

  return (
    <ConfiguracionContext.Provider value={{
      configuracion,
      cargando,
      organizationId,
      cargarConfiguracion,
      actualizarConfiguracion
    }}>
      {children}
    </ConfiguracionContext.Provider>
  );
};

/**
 * Hook para acceder a la configuración desde cualquier componente
 */
export const useConfiguracion = () => {
  const context = useContext(ConfiguracionContext);
  
  if (!context) {
    throw new Error('useConfiguracion debe usarse dentro de ConfiguracionProvider');
  }
  
  return context;
};
