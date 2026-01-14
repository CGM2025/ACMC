// src/components/configuracion/HistorialCambios.jsx
//
// Componente para visualizar el historial de cambios (audit log)
// Muestra cambios en asignaciones, contratos y otros documentos importantes
//

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Users,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';
import {
  obtenerHistorialCompleto,
  obtenerHistorialPorTipo,
  obtenerHistorialEntidad,
  TIPOS_ENTIDAD,
  TIPOS_ACCION
} from '../../api/historialCambios';

const HistorialCambios = ({ organizationId, currentUser }) => {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroAccion, setFiltroAccion] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [registroExpandido, setRegistroExpandido] = useState(null);
  const [limite, setLimite] = useState(50);

  // Cargar historial
  const cargarHistorial = async () => {
    setCargando(true);
    try {
      let datos;
      if (filtroTipo === 'todos') {
        datos = await obtenerHistorialCompleto(organizationId, limite);
      } else {
        datos = await obtenerHistorialPorTipo(filtroTipo, organizationId, limite);
      }
      setHistorial(datos);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      cargarHistorial();
    }
  }, [organizationId, filtroTipo, limite]);

  // Filtrar historial
  const historialFiltrado = useMemo(() => {
    return historial.filter(registro => {
      // Filtro por acción
      if (filtroAccion !== 'todos' && registro.accion !== filtroAccion) {
        return false;
      }

      // Filtro por búsqueda
      if (busqueda) {
        const termino = busqueda.toLowerCase();
        const coincide =
          registro.nombreReferencia?.toLowerCase().includes(termino) ||
          registro.descripcion?.toLowerCase().includes(termino) ||
          registro.usuarioNombre?.toLowerCase().includes(termino) ||
          registro.resumenCambios?.toLowerCase().includes(termino);
        if (!coincide) return false;
      }

      return true;
    });
  }, [historial, filtroAccion, busqueda]);

  // Obtener icono según tipo de entidad
  const getIconoEntidad = (tipo) => {
    switch (tipo) {
      case TIPOS_ENTIDAD.ASIGNACION:
        return <FileText size={16} className="text-blue-600" />;
      case TIPOS_ENTIDAD.CONTRATO:
        return <Briefcase size={16} className="text-purple-600" />;
      case TIPOS_ENTIDAD.TERAPEUTA:
        return <Users size={16} className="text-green-600" />;
      case TIPOS_ENTIDAD.CLIENTE:
        return <User size={16} className="text-orange-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  // Obtener icono según tipo de acción
  const getIconoAccion = (accion) => {
    switch (accion) {
      case TIPOS_ACCION.CREAR:
        return <Plus size={14} className="text-green-600" />;
      case TIPOS_ACCION.ACTUALIZAR:
        return <Edit2 size={14} className="text-blue-600" />;
      case TIPOS_ACCION.ELIMINAR:
        return <Trash2 size={14} className="text-red-600" />;
      case TIPOS_ACCION.DESACTIVAR:
        return <ToggleLeft size={14} className="text-orange-600" />;
      case TIPOS_ACCION.REACTIVAR:
        return <ToggleRight size={14} className="text-green-600" />;
      default:
        return <Edit2 size={14} className="text-gray-600" />;
    }
  };

  // Obtener color de badge según acción
  const getColorAccion = (accion) => {
    switch (accion) {
      case TIPOS_ACCION.CREAR:
        return 'bg-green-100 text-green-700';
      case TIPOS_ACCION.ACTUALIZAR:
        return 'bg-blue-100 text-blue-700';
      case TIPOS_ACCION.ELIMINAR:
        return 'bg-red-100 text-red-700';
      case TIPOS_ACCION.DESACTIVAR:
        return 'bg-orange-100 text-orange-700';
      case TIPOS_ACCION.REACTIVAR:
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear valor para mostrar
  const formatearValor = (valor) => {
    if (valor === null || valor === undefined) return <span className="text-gray-400 italic">(vacío)</span>;
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (typeof valor === 'number') {
      if (valor >= 100) {
        return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
      }
      return valor.toString();
    }
    if (Array.isArray(valor)) {
      if (valor.length === 0) return <span className="text-gray-400 italic">(ninguno)</span>;
      if (valor[0]?.nombre) {
        return valor.map(t => t.nombre).join(', ');
      }
      return valor.join(', ');
    }
    if (typeof valor === 'object') {
      if (valor.montoMensual !== undefined) {
        return `$${(valor.montoMensual || 0).toLocaleString('es-MX')}/mes`;
      }
      if (valor.montoPorHora !== undefined) {
        return `$${(valor.montoPorHora || 0).toLocaleString('es-MX')}/hr`;
      }
      return JSON.stringify(valor);
    }
    return String(valor);
  };

  // Formatear nombre del campo
  const formatearCampo = (campo) => {
    const mapeo = {
      precioCliente: 'Precio Cliente',
      pagoTerapeuta: 'Pago Terapeuta',
      clienteNombre: 'Cliente',
      terapeutaNombre: 'Terapeuta',
      servicioNombre: 'Servicio',
      cobroCliente: 'Cobro al Cliente',
      pagoTerapeutas: 'Pago a Terapeutas',
      horasEstimadas: 'Horas Estimadas',
      horasSemanales: 'Horas Semanales',
      montoMensual: 'Monto Mensual',
      montoPorHora: 'Monto por Hora',
      tarifaPorHora: 'Tarifa por Hora',
      activo: 'Estado Activo',
      terapeutas: 'Terapeutas',
      servicio: 'Servicio',
      tipoContrato: 'Tipo de Contrato',
      descripcionRecibo: 'Descripción para Recibo',
      condicion: 'Condición/Horario'
    };
    return mapeo[campo] || campo.charAt(0).toUpperCase() + campo.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History className="text-indigo-600" />
            Historial de Cambios
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Registro de cambios en asignaciones, contratos y configuraciones
          </p>
        </div>
        <button
          onClick={cargarHistorial}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap gap-4 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, usuario o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filtro por tipo */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="todos">Todos los tipos</option>
            <option value={TIPOS_ENTIDAD.ASIGNACION}>Asignaciones</option>
            <option value={TIPOS_ENTIDAD.CONTRATO}>Contratos</option>
            <option value={TIPOS_ENTIDAD.TERAPEUTA}>Terapeutas</option>
            <option value={TIPOS_ENTIDAD.CLIENTE}>Clientes</option>
          </select>
        </div>

        {/* Filtro por acción */}
        <select
          value={filtroAccion}
          onChange={(e) => setFiltroAccion(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="todos">Todas las acciones</option>
          <option value={TIPOS_ACCION.CREAR}>Creaciones</option>
          <option value={TIPOS_ACCION.ACTUALIZAR}>Actualizaciones</option>
          <option value={TIPOS_ACCION.DESACTIVAR}>Desactivaciones</option>
        </select>

        {/* Límite */}
        <select
          value={limite}
          onChange={(e) => setLimite(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value={25}>25 registros</option>
          <option value={50}>50 registros</option>
          <option value={100}>100 registros</option>
          <option value={200}>200 registros</option>
        </select>
      </div>

      {/* Lista de cambios */}
      {cargando ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <RefreshCw size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Cargando historial...</p>
        </div>
      ) : historialFiltrado.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <History size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No hay registros en el historial</p>
          <p className="text-gray-400 text-sm mt-2">
            Los cambios a asignaciones y contratos aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {historialFiltrado.map((registro) => (
            <div
              key={registro.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              {/* Header del registro */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setRegistroExpandido(
                  registroExpandido === registro.id ? null : registro.id
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Icono de entidad */}
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getIconoEntidad(registro.tipoEntidad)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">
                            {registro.nombreReferencia || 'Sin nombre'}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getColorAccion(registro.accion)}`}>
                            {getIconoAccion(registro.accion)}
                            {registro.accion}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {registro.tipoEntidad}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {registro.descripcion || registro.resumenCambios || 'Sin descripción'}
                        </p>
                      </div>
                    </div>

                    {/* Info de usuario y fecha */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {registro.usuarioNombre || 'Sistema'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatearFecha(registro.fecha)}
                      </span>
                    </div>
                  </div>

                  {/* Flecha expandir */}
                  <div className="flex items-center">
                    {registroExpandido === registro.id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Contenido expandido */}
              {registroExpandido === registro.id && (
                <div className="px-4 pb-4 border-t bg-gray-50">
                  <div className="py-4">
                    {/* Cambios detectados */}
                    {registro.cambios && registro.cambios.length > 0 ? (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Cambios realizados:
                        </h4>
                        <div className="space-y-2">
                          {registro.cambios.map((cambio, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-lg p-3 border flex items-center gap-3"
                            >
                              <span className="font-medium text-gray-700 min-w-[150px]">
                                {formatearCampo(cambio.campo)}:
                              </span>
                              <span className="text-red-600 line-through">
                                {formatearValor(cambio.valorAnterior)}
                              </span>
                              <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                              <span className="text-green-600 font-medium">
                                {formatearValor(cambio.valorNuevo)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : registro.accion === TIPOS_ACCION.CREAR ? (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Datos del nuevo registro:
                        </h4>
                        <div className="bg-white rounded-lg p-4 border">
                          <pre className="text-xs text-gray-600 overflow-auto max-h-48">
                            {JSON.stringify(registro.datosNuevos, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        No hay detalles de cambios disponibles
                      </p>
                    )}

                    {/* ID del documento */}
                    <div className="text-xs text-gray-400 mt-4 pt-4 border-t">
                      <span>ID: {registro.entidadId}</span>
                      {registro.usuarioEmail && (
                        <span className="ml-4">Email: {registro.usuarioEmail}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Mostrar cantidad */}
          <div className="text-center text-sm text-gray-500 py-4">
            Mostrando {historialFiltrado.length} de {historial.length} registros
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialCambios;
