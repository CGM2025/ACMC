import React, { useMemo } from 'react';
import { DollarSign, Users, Clock, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { importarUtilidadHistorica } from '../../api';

/**
 * Componente Dashboard - Vista principal con métricas y análisis
 * 
 * @param {Object} props
 * @param {Array} props.citas - Lista de citas
 * @param {Array} props.clientes - Lista de clientes
 * @param {Array} props.utilidadHistorica - Datos históricos de utilidad
 * @param {number} props.totalHoras - Total de horas trabajadas
 * @param {number} props.totalPagos - Total de pagos registrados
 * @param {number|string} props.rangoMeses - Rango de meses a mostrar (6, 12, 24, o 'todo')
 * @param {Function} props.setRangoMeses - Función para cambiar el rango de meses
 * @param {number} props.refreshKey - Key para forzar re-render
 * @param {Function} props.setRefreshKey - Función para actualizar refreshKey
 * @param {Function} props.cargarUtilidadHistorica - Función para recargar datos históricos
 */
const Dashboard = ({ 
  citas,
  clientes,
  utilidadHistorica,
  totalHoras,
  totalPagos,
  rangoMeses,
  setRangoMeses,
  refreshKey,
  setRefreshKey,
  cargarUtilidadHistorica
}) => {
  // Colores para las gráficas
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  /**
   * Calcular contribución de ganancias por terapeuta
   */
  const calcularContribucionPorTerapeuta = () => {
    const contribucionPorTerapeuta = {};
    
    // Filtrar solo citas completadas
    const citasCompletadas = citas.filter(c => c.estado === 'completada');
    
    citasCompletadas.forEach(cita => {
      if (!contribucionPorTerapeuta[cita.terapeuta]) {
        contribucionPorTerapeuta[cita.terapeuta] = {
          nombre: cita.terapeuta,
          totalIngresos: 0,
          totalCostos: 0,
          ganancia: 0
        };
      }
      
      // Calcular duración
      const inicio = new Date(`2000-01-01T${cita.horaInicio}`);
      const fin = new Date(`2000-01-01T${cita.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      
      // Calcular ingresos (precio al cliente)
      const ingresos = cita.costoTotal || (cita.costoPorHora * duracionHoras) || 0;
      
      // Calcular costos (lo que se paga a la terapeuta)
      const costos = cita.costoTerapeutaTotal || 0;
      
      contribucionPorTerapeuta[cita.terapeuta].totalIngresos += ingresos;
      contribucionPorTerapeuta[cita.terapeuta].totalCostos += costos;
      contribucionPorTerapeuta[cita.terapeuta].ganancia += (ingresos - costos);
    });
    
    // Calcular total de ganancias para sacar porcentajes
    const gananciaTotal = Object.values(contribucionPorTerapeuta).reduce((sum, t) => sum + t.ganancia, 0);
    
    // Convertir a array y agregar porcentajes
    const arrayContribucion = Object.values(contribucionPorTerapeuta).map(t => ({
      ...t,
      porcentaje: gananciaTotal > 0 ? (t.ganancia / gananciaTotal) * 100 : 0
    }));
    
    // Ordenar de mayor a menor porcentaje
    return arrayContribucion.sort((a, b) => b.porcentaje - a.porcentaje);
  };

  /**
   * Importar datos históricos de utilidad desde archivo JSON
   */
  const importarUtilidadHistoricaLocal = async (datosHistoricos) => {
    try {
      console.log('📊 Importando', datosHistoricos.length, 'registros...');
      const registrosImportados = await importarUtilidadHistorica(datosHistoricos);
      console.log('✅ Registros importados:', registrosImportados);
      
      // Recargar datos
      console.log('🔄 Recargando datos históricos...');
      await cargarUtilidadHistorica();

      // Forzar re-render
      setRefreshKey(prev => prev + 1);
      
      console.log('📈 Datos actuales:', utilidadHistorica.length, 'registros');
      alert(`✅ Se importaron ${registrosImportados} registros históricos exitosamente`);
    } catch (error) {
      console.error('❌ Error al importar datos históricos:', error);
      alert('Error al importar datos históricos: ' + error.message);
    }
  };

  /**
   * Calcular evolución mensual de ganancias (datos históricos + datos del sistema)
   */
  const calcularEvolucionMensual = () => {
    const mesesMap = {
      'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
      'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
    };
    
    const evolucion = {};
    
    // 1. Agregar datos históricos
    console.log('📊 Procesando', utilidadHistorica.length, 'registros históricos');
    utilidadHistorica.forEach(registro => {
      const key = `${registro.año}-${String(mesesMap[registro.mes] + 1).padStart(2, '0')}`;
      evolucion[key] = {
        año: registro.año,
        mes: registro.mes,
        mesNum: mesesMap[registro.mes],
        ganancia: registro.utilidad,
        fuente: 'histórico'
      };
    });
    
    // 2. Calcular ganancias del sistema (citas completadas)
    const citasCompletadas = citas.filter(c => c.estado === 'completada');
    
    citasCompletadas.forEach(cita => {
      const fecha = new Date(cita.fecha);
      const año = fecha.getFullYear();
      const mes = fecha.getMonth();
      const key = `${año}-${String(mes + 1).padStart(2, '0')}`;
      
      // Calcular duración
      const inicio = new Date(`2000-01-01T${cita.horaInicio}`);
      const fin = new Date(`2000-01-01T${cita.horaFin}`);
      const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
      
      // Calcular ganancia
      const ingresos = cita.costoTotal || (cita.costoPorHora * duracionHoras) || 0;
      const costos = cita.costoTerapeutaTotal || 0;
      const ganancia = ingresos - costos;
      
      if (!evolucion[key]) {
        const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        evolucion[key] = {
          año: año,
          mes: mesesNombres[mes],
          mesNum: mes,
          ganancia: 0,
          fuente: 'sistema'
        };
      }
      
      // Si ya existe dato histórico, lo respetamos (no sobreescribimos)
      if (evolucion[key].fuente !== 'histórico') {
        evolucion[key].ganancia += ganancia;
        evolucion[key].fuente = 'sistema';
      }
    });
    
    // Convertir a array y ordenar cronológicamente
    return Object.values(evolucion).sort((a, b) => {
      if (a.año !== b.año) return a.año - b.año;
      return a.mesNum - b.mesNum;
    });
  };

  /**
   * Calcular KPIs de crecimiento anual
   */
  const calcularKPIsAnuales = () => {
    const evolucion = calcularEvolucionMensual();
    
    if (evolucion.length === 0) return null;
    
    // Agrupar por año
    const porAño = {};
    evolucion.forEach(mes => {
      if (!porAño[mes.año]) {
        porAño[mes.año] = [];
      }
      porAño[mes.año].push(mes.ganancia);
    });
    
    // Calcular promedios por año
    const promediosAnuales = Object.entries(porAño).map(([año, ganancias]) => ({
      año: parseInt(año),
      promedio: ganancias.reduce((sum, g) => sum + g, 0) / ganancias.length,
      total: ganancias.reduce((sum, g) => sum + g, 0),
      meses: ganancias.length
    })).sort((a, b) => a.año - b.año);
    
    // Calcular crecimientos
    const crecimientos = [];
    for (let i = 1; i < promediosAnuales.length; i++) {
      const añoAnterior = promediosAnuales[i - 1];
      const añoActual = promediosAnuales[i];
      const crecimiento = ((añoActual.promedio - añoAnterior.promedio) / añoAnterior.promedio) * 100;
      crecimientos.push({
        año: añoActual.año,
        crecimiento: crecimiento
      });
    }
    
    // Mejor y peor año
    const mejorAño = promediosAnuales.reduce((max, año) => año.promedio > max.promedio ? año : max);
    const peorAño = promediosAnuales.reduce((min, año) => año.promedio < min.promedio ? año : min);
    
    return {
      promediosAnuales,
      crecimientos,
      mejorAño,
      peorAño
    };
  };

  // Memoizar datos calculados para optimizar rendimiento
  const contribuciones = useMemo(() => calcularContribucionPorTerapeuta(), [citas]);
  const evolucion = useMemo(() => calcularEvolucionMensual(), [citas, utilidadHistorica, refreshKey]);
  const kpis = useMemo(() => calcularKPIsAnuales(), [evolucion]);

  // Filtrar datos según el rango seleccionado
  const datosFiltrados = rangoMeses === 'todo' 
    ? evolucion 
    : evolucion.slice(-rangoMeses);

  return (
    <div className="space-y-6">
      {/* Botón de Importación (solo si no hay datos históricos) */}
      {utilidadHistorica.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-yellow-900">📊 Importar Datos Históricos</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Importa tu historial de ganancias desde el archivo JSON para ver la evolución completa
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    try {
                      const datos = JSON.parse(event.target.result);
                      await importarUtilidadHistoricaLocal(datos);
                    } catch (error) {
                      alert('Error al leer el archivo JSON');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
              className="hidden"
              id="importar-historico"
            />
            <label
              htmlFor="importar-historico"
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 cursor-pointer flex items-center gap-2"
            >
              <Upload size={16} />
              Importar JSON
            </label>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Horas</p>
              <p className="text-3xl font-bold">{totalHoras.toFixed(1)}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Pagos</p>
              <p className="text-3xl font-bold">${totalPagos.toLocaleString()}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Clientes</p>
              <p className="text-3xl font-bold">{clientes.length}</p>
            </div>
            <Users className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Gráfica de Contribución por Terapeuta */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          💰 Contribución de Ganancias por Terapeuta
        </h3>
        
        {contribuciones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay citas completadas aún para mostrar contribuciones</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfica de Pie */}
            <div className="flex items-center justify-center">
              <PieChart width={400} height={400}>
                <Pie
                  data={contribuciones}
                  cx={200}
                  cy={200}
                  labelLine={true}
                  label={({ porcentaje }) => `${porcentaje.toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="ganancia"
                >
                  {contribuciones.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `$${Math.round(value).toLocaleString()}`,
                    props.payload.nombre
                  ]}
                />
              </PieChart>
            </div>

            {/* Tabla de detalles */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Terapeuta</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Ganancia</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contribuciones.map((t, index) => (
                    <tr key={t.nombre} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-sm font-medium text-gray-900">{t.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                        ${Math.round(t.ganancia).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        {t.porcentaje.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                      ${Math.round(contribuciones.reduce((sum, t) => sum + t.ganancia, 0)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Evolución Mensual de Ganancias */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            📈 Evolución Mensual de Ganancias
          </h3>
          
          {/* Selector de rango */}
          <div className="flex gap-2">
            <button
              onClick={() => setRangoMeses(6)}
              className={`px-3 py-1 rounded ${rangoMeses === 6 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              6M
            </button>
            <button
              onClick={() => setRangoMeses(12)}
              className={`px-3 py-1 rounded ${rangoMeses === 12 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              12M
            </button>
            <button
              onClick={() => setRangoMeses(24)}
              className={`px-3 py-1 rounded ${rangoMeses === 24 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              24M
            </button>
            <button
              onClick={() => setRangoMeses('todo')}
              className={`px-3 py-1 rounded ${rangoMeses === 'todo' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Todo
            </button>
          </div>
        </div>

        {/* KPIs Anuales */}
        {kpis && kpis.promediosAnuales.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Promedios Anuales */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">📊 Promedios Anuales</h4>
              <div className="space-y-2">
                {kpis.promediosAnuales.map(a => (
                  <div key={a.año} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">
                      {a.año} {a.meses < 12 && `(${a.meses}m)`}
                    </span>
                    <span className="text-sm font-bold text-blue-900">
                      ${Math.round(a.promedio).toLocaleString()}/mes
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Crecimientos Anuales */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-900 mb-3">📈 Crecimientos</h4>
              <div className="space-y-2">
                {kpis.crecimientos.map(c => {
                  const esAñoActual = c.año === new Date().getFullYear();
                  const añoData = kpis.promediosAnuales.find(a => a.año === c.año);
                  const esAñoCompleto = añoData && añoData.meses >= 12;
                  
                  return (
                    <div key={c.año} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-purple-800">
                        {c.año} {esAñoActual && !esAñoCompleto && '*'}
                      </span>
                      <span className={`text-sm font-bold ${c.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {c.crecimiento >= 0 ? '↑' : '↓'} {Math.abs(c.crecimiento).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
                {kpis.crecimientos.some(c => {
                  const esAñoActual = c.año === new Date().getFullYear();
                  const añoData = kpis.promediosAnuales.find(a => a.año === c.año);
                  const esAñoCompleto = añoData && añoData.meses >= 12;
                  return esAñoActual && !esAñoCompleto;
                }) && (
                  <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">
                    * Año en progreso, sujeto a cambios
                  </p>
                )}
              </div>
            </div>

            {/* Mejor Año */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-3">💰 Análisis Histórico</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-green-700">Mejor Año</p>
                  <p className="text-lg font-bold text-green-900">
                    {kpis.mejorAño.año}: ${Math.round(kpis.mejorAño.promedio).toLocaleString()}/mes
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Promedio Histórico</p>
                  <p className="text-lg font-bold text-green-900">
                    ${Math.round(kpis.promediosAnuales.reduce((sum, a) => sum + a.promedio, 0) / kpis.promediosAnuales.length).toLocaleString()}/mes
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Crecimiento Total</p>
                  <p className="text-lg font-bold text-green-900">
                    {(() => {
                      const primerAño = kpis.promediosAnuales[0];
                      const ultimoAño = kpis.promediosAnuales[kpis.promediosAnuales.length - 1];
                      const crecimientoTotal = ((ultimoAño.promedio - primerAño.promedio) / primerAño.promedio) * 100;
                      return `${crecimientoTotal >= 0 ? '+' : ''}${crecimientoTotal.toFixed(1)}%`;
                    })()}
                  </p>
                  <p className="text-xs text-green-600">
                    {kpis.promediosAnuales[0].año} → {kpis.promediosAnuales[kpis.promediosAnuales.length - 1].año}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gráfica de línea */}
        {datosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay datos suficientes para mostrar la evolución</p>
            <p className="text-sm text-gray-400 mt-2">
              {utilidadHistorica.length === 0 ? 'Importa tus datos históricos para ver la gráfica' : 'Completa algunas citas para ver datos del sistema'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <LineChart width={1000} height={400} data={datosFiltrados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="mes" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                formatter={(value) => [`$${Math.round(value).toLocaleString()}`, 'Ganancia']}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `${payload[0].payload.mes} ${payload[0].payload.año}`;
                  }
                  return label;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="ganancia" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Ganancia Mensual"
                dot={{ r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
            
            {/* Estadísticas del período actual */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-600">Ganancia Promedio</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${Math.round(datosFiltrados.reduce((sum, m) => sum + m.ganancia, 0) / datosFiltrados.length).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {rangoMeses === 'todo' ? 'Histórico' : `Últimos ${rangoMeses} meses`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Mejor Mes</p>
                <p className="text-2xl font-bold text-green-600">
                  ${Math.round(Math.max(...datosFiltrados.map(m => m.ganancia))).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const mejor = datosFiltrados.reduce((max, m) => m.ganancia > max.ganancia ? m : max);
                    return `${mejor.mes} ${mejor.año}`;
                  })()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Período</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${Math.round(datosFiltrados.reduce((sum, m) => sum + m.ganancia, 0)).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {datosFiltrados.length} meses
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
