import React from 'react';
import { usePortalAuth } from '../hooks/usePortalAuth';
import PortalLogin from './PortalLogin';
import PortalCliente from './PortalCliente';

/**
 * Componente principal del Portal de Clientes
 * Gestiona el flujo de autenticación y muestra login o dashboard según el estado
 */
const Portal = ({ recibos, pagos, citas }) => {
  const {
    currentUser,
    clienteData,
    loading,
    error,
    login,
    logout,
    isCliente
  } = usePortalAuth();

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado o no es cliente, mostrar login
  if (!currentUser || !isCliente) {
    return <PortalLogin onLogin={login} error={error} />;
  }

  // Si está autenticado pero no hay datos del cliente
  if (!clienteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">
            Error: No se pudieron cargar los datos del cliente
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  // Mostrar dashboard del cliente
  return (
    <PortalCliente
      clienteData={clienteData}
      recibos={recibos}
      pagos={pagos}
      citas={citas}
      onLogout={logout}
    />
  );
};

export default Portal;
