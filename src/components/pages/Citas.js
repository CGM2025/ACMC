import React, { useState, useMemo } from 'react';
import { Plus, Upload, Search, Filter, X, Calendar, Edit, Trash2, Users, User } from 'lucide-react';
import CalendarioCitas from '../CalendarioCitas';

/**
 * Componente Citas - Gestión de citas programadas
 */
const Citas = ({
  citas,
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  filterEstado,
  setFilterEstado,
  filterTerapeuta,
  setFilterTerapeuta,
  filterFechaInicio,
  setFilterFechaInicio,
  filterFechaFin,
  setFilterFechaFin,
  vistaCalendario,
  setVistaCalendario,
  importandoWord,
  filtrarCitas,
  contarFiltrosActivos,
  limpiarFiltros,
  openModal,
  eliminarCita,
  importarDesdeWord,
  handleCalendarioSelectCita,
  handleCalendarioSelectSlot,
  handleCalendarioEventDrop
}) => {
  // Estado local para filtro de cliente
  const [filterCliente, setFilterCliente] = useState('todos');

  // Obtener listas únicas de terapeutas y clientes
  const terapeutasUnicos = useMemo(() => {
    return [...new Set(citas.map(c => c.terapeuta))].filter(Boolean).sort();
  }, [citas]);

  const clientesUnicos = useMemo(() => {
    return [...new Set(citas.map(c => c.cliente))].filter(Boolean).sort();
  }, [citas]);

  // Filtrar citas incluyendo el filtro de cliente
  const citasFiltradas = useMemo(() => {
    let resultado = filtrarCitas();
    
    // Aplicar filtro de cliente adicional
    if (filterCliente !== 'todos') {
      resultado = resultado.filter(cita => cita.cliente === filterCliente);
    }
    
    return resultado;
  }, [filtrarCitas, filterCliente]);

  // Contar filtros activos incluyendo cliente
  const filtrosActivosTotal = useMemo(() => {
    let count = contarFiltrosActivos();
    if (filterCliente !== 'todos') count++;
    return count;
  }, [contarFiltrosActivos, filterCliente]);

  // Limpiar todos los filtros
  const limpiarTodosFiltros = () => {
    limpiarFiltros();
    setFilterCliente('todos');
  };

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Header - Botones a la izquierda */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold mr-2">Citas</h2>
        
        {/* Botón Nueva Cita */}
        <button
          onClick={() => openModal('cita')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          <Plus size={18} />
          Nueva Cita
        </button>

        {/* Botón Importar Word */}
        <label className={`px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all text-sm ${
          importandoWord 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}>
          <Upload size={18} />
          {importandoWord ? 'Importando...' : 'Importar Word'}
          <input
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                importarDesdeWord(file);
              }
              e.target.value = '';
            }}
            disabled={importandoWord}
          />
        </label>
        
        {/* Botones de vista Lista/Calendario */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setVistaCalendario('lista')}
            className={`px-3 py-1.5 rounded-md transition-all text-sm ${
              vistaCalendario === 'lista' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setVistaCalendario('calendario')}
            className={`px-3 py-1.5 rounded-md transition-all text-sm ${
              vistaCalendario === 'calendario' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Calendario
          </button>
        </div>

        {/* Contador de citas */}
        <span className="text-sm text-gray-500 ml-auto">
          {citasFiltradas.length} de {citas.length} citas
        </span>
      </div>

      {/* Filtros rápidos - Visibles en ambas vistas */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex gap-3 flex-wrap items-center">
          {/* Filtro Terapeuta */}
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <select
              value={filterTerapeuta}
              onChange={(e) => setFilterTerapeuta(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-w-[180px]"
            >
              <option value="todos">Todos los terapeutas</option>
              {terapeutasUnicos.map((terapeuta, index) => (
                <option key={index} value={terapeuta}>{terapeuta}</option>
              ))}
            </select>
          </div>

          {/* Filtro Cliente */}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-w-[180px]"
            >
              <option value="todos">Todos los clientes</option>
              {clientesUnicos.map((cliente, index) => (
                <option key={index} value={cliente}>{cliente}</option>
              ))}
            </select>
          </div>

          {/* Filtro Estado - Solo en vista lista o siempre visible */}
          <div className="flex items-center gap-2">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">🟡 Pendiente</option>
              <option value="confirmada">🔵 Confirmada</option>
              <option value="cancelada">🔴 Cancelada</option>
              <option value="completada">🟢 Completada</option>
            </select>
          </div>

          {/* Botón Limpiar Filtros */}
          {filtrosActivosTotal > 0 && (
            <button
              onClick={limpiarTodosFiltros}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm"
            >
              <X size={16} />
              Limpiar ({filtrosActivosTotal})
            </button>
          )}

          {/* Más filtros - Solo vista lista */}
          {vistaCalendario === 'lista' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all text-sm ml-auto ${
                showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              Más filtros
            </button>
          )}
        </div>

        {/* Panel de Filtros adicionales - Solo en vista Lista */}
        {vistaCalendario === 'lista' && showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 mt-3 border-t">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Filtro Fecha Inicio */}
            <div>
              <input
                type="date"
                value={filterFechaInicio}
                onChange={(e) => setFilterFechaInicio(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Desde"
              />
            </div>

            {/* Filtro Fecha Fin */}
            <div>
              <input
                type="date"
                value={filterFechaFin}
                onChange={(e) => setFilterFechaFin(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Hasta"
              />
            </div>
          </div>
        )}
      </div>

      {/* Vista de Calendario o Lista */}
      {vistaCalendario === 'calendario' ? (
        <div className="w-full overflow-hidden">
          <CalendarioCitas
            citas={citasFiltradas}
            onSelectCita={handleCalendarioSelectCita}
            onSelectSlot={handleCalendarioSelectSlot}
            onEventDrop={handleCalendarioEventDrop}
          />
        </div>
      ) : (
        <>
          {citasFiltradas.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="max-h-[calc(100vh-380px)] overflow-y-auto space-y-2">
                {citasFiltradas.map((cita) => (
                  <div key={cita.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200 flex justify-between items-center hover:bg-blue-100 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{cita.terapeuta} con {cita.cliente}</p>
                      <p className="text-sm text-gray-600">{cita.fecha} | {cita.horaInicio} - {cita.horaFin}</p>
                      <p className="text-sm text-gray-600 mt-1 truncate">📋 {cita.tipoTerapia || 'No especificado'}</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full font-medium ${
                        cita.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        cita.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                        cita.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {cita.estado}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      <button 
                        onClick={() => openModal('cita', cita)} 
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => eliminarCita(cita.id)} 
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg">No se encontraron citas</p>
              <p className="text-gray-400 mt-2">
                {filtrosActivosTotal > 0 
                  ? 'Intenta ajustar los filtros' 
                  : 'Ve a Configuración → Horarios Recurrentes para generar citas'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Citas;
