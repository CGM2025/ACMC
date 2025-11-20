import React from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';

/**
 * Componente BloquesCitas - Gestión de bloques recurrentes de citas
 * 
 * @param {Object} props
 * @param {Array} props.terapeutas - Lista de terapeutas
 * @param {Array} props.clientes - Lista de clientes
 * @param {Array} props.diasSemanaOptions - Opciones de días de la semana
 * @param {Object} props.nuevoHorario - Estado del nuevo horario
 * @param {Function} props.setNuevoHorario - Función para actualizar nuevo horario
 * @param {Array} props.horarios - Lista de horarios configurados
 * @param {string} props.fechaInicio - Fecha de inicio del período
 * @param {Function} props.setFechaInicio - Función para actualizar fecha inicio
 * @param {string} props.fechaFin - Fecha de fin del período
 * @param {Function} props.setFechaFin - Función para actualizar fecha fin
 * @param {Array} props.citasGeneradas - Citas generadas previo a guardar
 * @param {boolean} props.mostrarResultado - Si se debe mostrar el resultado
 * @param {Function} props.toggleDia - Función para toggle de días
 * @param {Function} props.agregarHorario - Función para agregar horario
 * @param {Function} props.eliminarHorario - Función para eliminar horario
 * @param {Function} props.generarCitas - Función para generar citas
 * @param {Function} props.guardarCitas - Función para guardar citas
 */
const BloquesCitas = ({ 
  terapeutas,
  clientes,
  diasSemanaOptions,
  nuevoHorario,
  setNuevoHorario,
  horarios,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  citasGeneradas,
  mostrarResultado,
  toggleDia,
  agregarHorario,
  eliminarHorario,
  generarCitas,
  guardarCitas
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bloques de Citas</h2>
      </div>

      {/* Formulario de configuración de horarios */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configurar Horarios</h3>
        <div className="space-y-4">
          {/* Selección de terapeuta y cliente */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg" 
              value={nuevoHorario.terapeuta} 
              onChange={(e) => setNuevoHorario({...nuevoHorario, terapeuta: e.target.value})}
            >
              <option value="">Seleccionar terapeuta</option>
              {terapeutas.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
            </select>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg" 
              value={nuevoHorario.cliente} 
              onChange={(e) => setNuevoHorario({...nuevoHorario, cliente: e.target.value})}
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </div>
          
          {/* Días de la semana */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Días de la semana</p>
            <div className="flex flex-wrap gap-2">
              {diasSemanaOptions.map(dia => (
                <button 
                  key={dia.value} 
                  onClick={() => toggleDia(dia.value)} 
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    nuevoHorario.diasSemana.includes(dia.value) 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora de inicio</label>
              <input 
                type="time" 
                value={nuevoHorario.horaInicio} 
                onChange={(e) => setNuevoHorario({...nuevoHorario, horaInicio: e.target.value})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora de fin</label>
              <input 
                type="time" 
                value={nuevoHorario.horaFin} 
                onChange={(e) => setNuevoHorario({...nuevoHorario, horaFin: e.target.value})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              />
            </div>
          </div>
          
          {/* Botón agregar */}
          <button 
            onClick={agregarHorario} 
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Agregar Horario
          </button>
        </div>
      </div>

      {/* Lista de horarios configurados */}
      {horarios.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Horarios Configurados</h3>
          <div className="space-y-2">
            {horarios.map((horario) => (
              <div 
                key={horario.id} 
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-800">{horario.terapeuta} - {horario.cliente}</p>
                  <p className="text-sm text-gray-600">
                    {horario.diasSemana.map(d => 
                      diasSemanaOptions.find(opt => opt.value === d)?.label
                    ).join(', ')}
                  </p>
                  <p className="text-sm text-blue-600">{horario.horaInicio} - {horario.horaFin}</p>
                </div>
                <button 
                  onClick={() => eliminarHorario(horario.id)} 
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selección de período */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Selecciona el período</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de fin</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
            />
          </div>
        </div>
        <button 
          onClick={generarCitas} 
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
        >
          <Calendar size={20} />
          Generar Citas
        </button>
      </div>

      {/* Resultado de citas generadas */}
      {mostrarResultado && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            ✨ Se generarán {citasGeneradas.length} citas
          </h3>
          <div className="max-h-96 overflow-y-auto mb-4 space-y-2">
            {citasGeneradas.slice(0, 10).map((cita, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{cita.terapeuta} con {cita.cliente}</p>
                    <p className="text-sm text-gray-600">
                      {cita.diaSemana}, {cita.fecha} | {cita.horaInicio} - {cita.horaFin}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {citasGeneradas.length > 10 && (
              <p className="text-center text-gray-600 text-sm py-2">
                ... y {citasGeneradas.length - 10} citas más
              </p>
            )}
          </div>
          <button 
            onClick={guardarCitas}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Guardar Citas
          </button>
        </div>
      )}
    </div>
  );
};

export default BloquesCitas;
