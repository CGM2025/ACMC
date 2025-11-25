import React from 'react';
import { 
  DollarSign, 
  Users, 
  Clock, 
  LogOut, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  FileText 
} from 'lucide-react';
import { FileCheck } from 'lucide-react';

/**
 * Componente Sidebar - Barra lateral de navegación
 * 
 * @param {Object} props
 * @param {Object} props.currentUser - Usuario actual con nombre y rol
 * @param {string} props.activeTab - Tab activa actualmente
 * @param {Function} props.setActiveTab - Función para cambiar de tab
 * @param {boolean} props.sidebarCollapsed - Estado de colapso del sidebar
 * @param {Function} props.setSidebarCollapsed - Función para colapsar/expandir sidebar
 * @param {Function} props.hasPermission - Función para verificar permisos del usuario
 * @param {Function} props.handleLogout - Función para cerrar sesión
 */
const Sidebar = ({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  sidebarCollapsed, 
  setSidebarCollapsed,
  hasPermission,
  handleLogout 
}) => {
  // Configuración de los items del menú
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: DollarSign, 
      permission: 'dashboard',
      color: 'blue' 
    },
    { 
      id: 'horas', 
      label: 'Horas', 
      icon: Clock, 
      permission: 'horas',
      color: 'blue' 
    },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: FileText, 
      permission: 'reportes',
      color: 'blue' 
    },
    { 
      id: 'terapeutas', 
      label: 'Terapeutas', 
      icon: Users, 
      permission: 'terapeutas',
      color: 'blue' 
    },
    { 
      id: 'bloques', 
      label: 'Bloques de Citas', 
      icon: Calendar, 
      permission: 'bloques',
      color: 'blue' 
    },
    { 
      id: 'citas', 
      label: 'Citas', 
      icon: Calendar, 
      permission: 'citas',
      color: 'blue' 
    },
    { 
      id: 'clientes', 
      label: 'Clientes', 
      icon: Users, 
      permission: 'clientes',
      color: 'blue' 
    },
    { 
      id: 'pagos', 
      label: 'Pagos', 
      icon: DollarSign, 
      permission: 'pagos',
      color: 'blue' 
    },
    { 
      id: 'recibos-gemini', 
      label: 'Recibos Gemini', 
      icon: FileText, 
      permission: 'reportes',
      color: 'purple' 
    }
  ];

  return (
    <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg fixed h-full transition-all duration-300 ease-in-out flex flex-col`}>
      {/* Logo/Header del Sidebar */}
      <div className="p-6 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">Sistema de Gestión</h1>
              <p className="text-sm text-gray-500 mt-1">{currentUser.nombre}</p>
              <p className="text-xs text-gray-400">{currentUser.rol}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* Menú de Navegación con Scroll */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            // Solo mostrar si el usuario tiene permiso
            if (!hasPermission(item.permission)) {
              return null;
            }

            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? `bg-${item.color}-600 text-white shadow-md` 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <Icon size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Botón de Logout */}
      <div className="p-4 border-t bg-white flex-shrink-0">
        <button 
          onClick={handleLogout} 
          className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center gap-2'} px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium`}
          title={sidebarCollapsed ? 'Cerrar Sesión' : ''}
        >
          <LogOut size={18} />
          {!sidebarCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
      {hasPermission('usuarios') && (
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            activeTab === 'usuarios'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
          } ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <Users size={20} />
          {!sidebarCollapsed && <span>Usuarios Portal</span>}
        </button>
      )}
      {hasPermission('comprobantes') && (
        <button
          onClick={() => setActiveTab('comprobantes')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            activeTab === 'comprobantes'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
          } ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <FileCheck size={20} />
          {!sidebarCollapsed && <span>Comprobantes</span>}
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
