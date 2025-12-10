import React, { useState, useEffect, useMemo } from 'react';
import { useConfiguracion } from '../contexts/ConfiguracionContext';
import {
  LayoutDashboard,
  FolderOpen,
  Briefcase,
  DollarSign,
  Users,
  Clock,
  LogOut,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Settings,
  Building2,
  Package,
  Send,
  FileCheck,
  Calculator,
  BarChart3,
  UserCog,
  CalendarClock
} from 'lucide-react';

/**
 * Componente Sidebar - Barra lateral de navegación con estructura jerárquica
 */
const Sidebar = ({
  currentUser,
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  hasPermission,
  handleLogout,
  onCerrarMes
}) => {
  const { configuracion } = useConfiguracion();

  // Estado para controlar qué submenús están expandidos
  const [expandedMenus, setExpandedMenus] = useState({
    operacion: false,
    finanzas: false,
    reportes: false,
    configuracion: false
  });

  // Toggle para expandir/colapsar submenús
  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Verificar si algún item del submenú está activo
  const isSubmenuActive = (children) => {
    return children.some(child => activeTab === child.id);
  };

  // Estructura del menú jerárquico - definida antes del useEffect
  const menuStructure = useMemo(() => [
    // 1. Dashboard (sin cambios)
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard',
      type: 'item'
    },

    // 2. Expedientes (NUEVO)
    {
      id: 'expedientes',
      label: 'Expedientes',
      icon: FolderOpen,
      permission: 'clientes',
      type: 'item'
    },

    // 3. Operación
    {
      id: 'operacion',
      label: 'Operación',
      icon: Briefcase,
      permission: 'citas',
      type: 'group',
      children: [
        { id: 'citas', label: 'Calendario/Citas', icon: Calendar, permission: 'citas' },
        { id: 'solicitudes', label: 'Solicitudes de Cambio', icon: Send, permission: 'admin' },
        { id: 'horarios-recurrentes', label: 'Horarios Recurrentes', icon: CalendarClock, permission: 'admin' }
      ]
    },

    // 4. Finanzas
    {
      id: 'finanzas',
      label: 'Finanzas',
      icon: DollarSign,
      permission: 'pagos',
      type: 'group',
      children: [
        { id: 'recibos-gemini', label: 'Recibos', icon: FileText, permission: 'reportes' },
        { id: 'pagos-terapeutas', label: 'Pagos Terapeutas', icon: Calculator, permission: 'pagos' },
        { id: 'comprobantes', label: 'Comprobantes', icon: FileCheck, permission: 'comprobantes' },
        { id: 'cerrar-mes', label: 'Cerrar Mes', icon: Calculator, permission: 'utilidad' }
      ]
    },

    // 5. Reportes
    {
      id: 'reportes-menu',
      label: 'Reportes',
      icon: BarChart3,
      permission: 'reportes',
      type: 'group',
      children: [
        { id: 'reportes', label: 'General', icon: FileText, permission: 'reportes' },
        { id: 'horas', label: 'Por Horas', icon: Clock, permission: 'horas' }
      ]
    },

    // 6. Configuración
    {
      id: 'configuracion-menu',
      label: 'Configuración',
      icon: Settings,
      permission: 'admin',
      type: 'group',
      children: [
        { id: 'clientes', label: 'Catálogo Clientes', icon: Users, permission: 'clientes' },
        { id: 'terapeutas', label: 'Catálogo Terapeutas', icon: UserCog, permission: 'terapeutas' },
        { id: 'servicios', label: 'Catálogo Servicios', icon: Package, permission: 'servicios' },
        { id: 'configuracion', label: 'Empresa', icon: Building2, permission: 'admin' },
        { id: 'usuarios', label: 'Usuarios Portal', icon: Users, permission: 'usuarios' }
      ]
    }
  ], []);

  // Auto-expandir submenú cuando activeTab cambia a un hijo
  useEffect(() => {
    menuStructure.forEach(item => {
      if (item.type === 'group' && item.children) {
        const hasActiveChild = item.children.some(child => child.id === activeTab);
        if (hasActiveChild) {
          setExpandedMenus(prev => ({
            ...prev,
            [item.id]: true
          }));
        }
      }
    });
  }, [activeTab, menuStructure]);

  // Renderizar un item individual del menú
  const renderMenuItem = (item, isChild = false) => {
    if (!hasPermission(item.permission)) return null;

    const Icon = item.icon;
    const isActive = activeTab === item.id;

    const handleClick = () => {
      if (item.id === 'cerrar-mes') {
        if (onCerrarMes) onCerrarMes();
      } else {
        setActiveTab(item.id);
      }
    };

    return (
      <button
        key={item.id}
        onClick={handleClick}
        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}
          ${isChild ? 'px-4 py-2 pl-10' : 'px-4 py-3'}
          rounded-lg font-medium transition-all text-sm
          ${isActive
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-100'
          }`}
        title={sidebarCollapsed ? item.label : ''}
      >
        <Icon size={isChild ? 16 : 20} />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </button>
    );
  };

  // Renderizar un grupo con submenú
  const renderMenuGroup = (group) => {
    // Verificar si al menos un hijo tiene permiso
    const hasAnyChildPermission = group.children.some(child => hasPermission(child.permission));
    if (!hasAnyChildPermission) return null;

    const Icon = group.icon;
    const isExpanded = expandedMenus[group.id];
    const hasActiveChild = isSubmenuActive(group.children);

    return (
      <div key={group.id} className="space-y-1">
        {/* Header del grupo */}
        <button
          onClick={() => !sidebarCollapsed && toggleMenu(group.id)}
          className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
            px-4 py-3 rounded-lg font-medium transition-all
            ${hasActiveChild
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
          title={sidebarCollapsed ? group.label : ''}
        >
          <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
            <Icon size={20} />
            {!sidebarCollapsed && <span>{group.label}</span>}
          </div>
          {!sidebarCollapsed && (
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {/* Items del submenú */}
        {!sidebarCollapsed && isExpanded && (
          <div className="space-y-1 ml-2 border-l-2 border-gray-200">
            {group.children.map(child => renderMenuItem(child, true))}
          </div>
        )}

        {/* En modo colapsado, mostrar tooltip o submenú flotante */}
        {sidebarCollapsed && (
          <div className="hidden group-hover:block absolute left-20 bg-white shadow-lg rounded-lg py-2 min-w-48 z-50">
            {group.children.map(child => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg fixed h-full transition-all duration-300 ease-in-out flex flex-col z-40`}>
      {/* Logo/Header del Sidebar */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {configuracion?.logoUrl ? (
                  <img
                    src={configuracion.logoUrl}
                    alt={configuracion.nombreEmpresa}
                    className="w-10 h-10 object-contain rounded"
                  />
                ) : (
                  <span className="text-3xl">🏥</span>
                )}
                <h1 className="text-lg font-bold text-gray-800 leading-tight">
                  {configuracion?.nombreEmpresa || 'Sistema de Gestión'}
                </h1>
              </div>
              <p className="text-sm text-gray-500">{currentUser.nombre}</p>
              <p className="text-xs text-gray-400">{currentUser.rol}</p>
            </div>
          )}
          {sidebarCollapsed && configuracion?.logoUrl && (
            <img
              src={configuracion.logoUrl}
              alt={configuracion.nombreEmpresa}
              className="w-8 h-8 object-contain rounded mx-auto"
            />
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
      <nav className="p-3 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {menuStructure.map((item) => {
            if (item.type === 'group') {
              return renderMenuGroup(item);
            } else {
              return renderMenuItem(item);
            }
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
    </aside>
  );
};

export default Sidebar;
