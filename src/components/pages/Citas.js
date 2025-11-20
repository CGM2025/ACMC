import React from 'react';
import { Plus, Upload, Search, Filter, X, Calendar, Edit, Trash2 } from 'lucide-react';
import CalendarioCitas from '../CalendarioCitas';

/**
 * Componente Citas - Gestión de citas programadas
 * 
 * @param {Object} props
 * @param {Array} props.citas - Lista de todas las citas
 * @param {string} props.searchTerm - Término de búsqueda
 * @param {Function} props.setSearchTerm - Función para actualizar búsqueda
 * @param {boolean} props.showFilters - Si se muestran los filtros
 * @param {Function} props.setShowFilters - Función para toggle filtros
 * @param {string} props.filterEstado - Filtro de estado actual
 * @param {Function} props.setFilterEstado - Función para actualizar filtro estado
 * @param {string} props.filterTerapeuta - Filtro de terapeuta actual
 * @param {Function} props.setFilterTerapeuta - Función para actualizar filtro terapeuta
 * @param {string} props.filterFechaInicio - Filtro fecha inicio
 * @param {Function} props.setFilterFechaInicio - Función para actualizar fecha inicio
 * @param {string} props.filterFechaFin - Filtro fecha fin
 * @param {Function} props.setFilterFechaFin - Función para actualizar fecha fin
 * @param {string} props.vistaCalendario - Vista actual ('lista' o 'calendario')
 * @param {Function} props.setVistaCalendario - Función para cambiar vista
 * @param {boolean} props.importandoWord - Si está importando desde Word
 * @param {Function} props.filtrarCitas - Función para filtrar citas
 * @param {Function} props.contarFiltrosActivos - Función para contar filtros activos
 * @param {Function} props.limpiarFiltros - Función para limpiar filtros
 * @param {Function} props.openModal - Función para abrir modal
 * @param {Function} props.eliminarCita - Función para eliminar cita
 * @param {Function} props.importarDesdeWord - Función para importar desde Word
 * @param {Function} props.handleCalendarioSelectCita - Handler para seleccionar cita en calendario
 * @param {Function} props.handleCalendarioSelectSlot - Handler para seleccionar slot en calendario
 * @param {Function} props.handleCalendarioEventDrop - Handler para arrastrar evento en calendario
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
  const citasFiltradas = filtrarCitas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Citas Programadas</h2>
        <div className="flex gap-2">
          {/* Botón Nueva Cita */}
          <button
            onClick={() => openModal('cita')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Nueva Cita
          </button>

          {/* Botón Importar Word */}
          <label className={`px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
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
          <button
            onClick={() => setVistaCalendario('lista')}
            className={`px-4 py-2 rounded-lg transition-all ${
              vistaCalendario === 'lista' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setVistaCalendario('calendario')}
            className={`px-4 py-2 rounded-lg transition-all ${
              vistaCalendario === 'calendario' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Calendario
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex gap-3">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por terapeuta, cliente o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botón Filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={20} />
            Filtros
            {contarFiltrosActivos() > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {contarFiltrosActivos()}
              </span>
            )}
          </button>

          {/* Botón Limpiar Filtros */}
          {contarFiltrosActivos() > 0 && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
            >
              <X size={20} />
              Limpiar
            </button>
          )}
        </div>

        {/* Panel de Filtros */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
                <option value="completada">Completada</option>
              </select>
            </div>

            {/* Filtro Terapeuta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Terapeuta</label>
              <select
                value={filterTerapeuta}
                onChange={(e) => setFilterTerapeuta(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                {[...new Set(citas.map(c => c.terapeuta))].map((terapeuta, index) => (
                  <option key={index} value={terapeuta}>{terapeuta}</option>
                ))}
              </select>
            </div>

            {/* Filtro Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
              <input
                type="date"
                value={filterFechaInicio}
                onChange={(e) => setFilterFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
              <input
                type="date"
                value={filterFechaFin}
                onChange={(e) => setFilterFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Contador de citas */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
          <span>Mostrando {citasFiltradas.length} de {citas.length} citas</span>
          {contarFiltrosActivos() > 0 && (
            <span className="text-blue-600 font-medium">{contarFiltrosActivos()} filtro(s) activo(s)</span>
          )}
        </div>
      </div>

      {/* Vista de Calendario o Lista */}
      {vistaCalendario === 'calendario' ? (
        <CalendarioCitas
          citas={citasFiltradas}
          onSelectCita={handleCalendarioSelectCita}
          onSelectSlot={handleCalendarioSelectSlot}
          onEventDrop={handleCalendarioEventDrop}
        />
      ) : (
        <>
          {citasFiltradas.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Citas ({citasFiltradas.length})</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {citasFiltradas.map((cita) => (
                  <div key={cita.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200 flex justify-between items-center hover:bg-blue-100 transition-all">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{cita.terapeuta} con {cita.cliente}</p>
                      <p className="text-sm text-gray-600">{cita.fecha} | {cita.horaInicio} - {cita.horaFin}</p>
                      <p className="text-sm text-gray-600 mt-1">📋 {cita.tipoTerapia || 'No especificado'}</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full font-medium ${
                        cita.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        cita.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                        cita.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {cita.estado}
                      </span>
                    </div>
                    <div className="flex gap-2">
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
                {contarFiltrosActivos() > 0 ? 'Intenta ajustar los filtros' : 'Ve a "Bloques de Citas" para generar nuevas citas'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Citas;
