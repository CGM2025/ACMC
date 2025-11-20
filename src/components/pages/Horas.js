import React from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * Componente Horas - Muestra las horas trabajadas calculadas desde citas completadas
 * 
 * @param {Object} props
 * @param {Array} props.horasDesdeCitas - Array con horas agrupadas por terapeuta y fecha
 */
const Horas = ({ horasDesdeCitas }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Horas Trabajadas</h2>
      </div>

      {/* Contenido */}
      <div className="bg-white shadow rounded-md">
        {horasDesdeCitas.length > 0 ? (
          <>
            {/* Banner informativo */}
            <div className="px-6 py-4 bg-green-50 border-b">
              <p className="text-sm text-green-800">
                <CheckCircle className="inline w-4 h-4 mr-2" />
                Mostrando horas calculadas desde {horasDesdeCitas.length} días con citas completadas
              </p>
            </div>

            {/* Lista de registros de horas */}
            <ul className="divide-y">
              {horasDesdeCitas.map((registro, index) => (
                <li key={index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    {/* Información del terapeuta y citas */}
                    <div className="flex-1">
                      <p className="font-medium text-lg">{registro.terapeuta}</p>
                      <p className="text-sm text-gray-600">{registro.fecha}</p>
                      
                      {/* Desglose de citas */}
                      <div className="mt-2 space-y-1">
                        {registro.citas.map((cita, idx) => (
                          <div key={idx} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <span className="font-medium">{cita.cliente}</span>
                            <span className="text-gray-500 ml-2">
                              {cita.horaInicio} - {cita.horaFin} ({cita.duracion.toFixed(1)}h)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total de horas */}
                    <div className="ml-4 text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {registro.horasTotal.toFixed(1)}h
                      </p>
                      <p className="text-xs text-gray-500">
                        {registro.citas.length} {registro.citas.length === 1 ? 'cita' : 'citas'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          /* Estado vacío */
          <div className="px-6 py-12 text-center">
            <CheckCircle className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg">No hay citas completadas aún</p>
            <p className="text-gray-400 mt-2">
              Las citas con estado "Completada" aparecerán aquí automáticamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Horas;
