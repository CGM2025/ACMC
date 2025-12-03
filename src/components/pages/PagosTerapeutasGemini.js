import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft,
  ChevronRight,
  User,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  CheckCircle,
  Layers,
  TrendingUp,
  Download,
  Printer
} from 'lucide-react';

/**
 * Componente de Pagos a Terapeutas con interfaz estilo Gemini
 * Muestra una lista de terapeutas en sidebar y detalles de pago del seleccionado
 * Calcula automáticamente el pago basado en citas completadas + cargos de sombra
 */
const PagosTerapeutasGemini = ({ 
  citas = [], 
  terapeutas = [],
  cargosSombra = [],
  servicios = []
}) => {
  // Estados
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7));
  const [terapeutaSeleccionado, setTerapeutaSeleccionado] = useState(null);
  const [busquedaTerapeuta, setBusquedaTerapeuta] = useState('');

  // Nombres de los meses
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  /**
   * Obtiene el nombre del mes en formato legible
   */
  const obtenerNombreMes = (mesISO) => {
    const [year, month] = mesISO.split('-');
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  /**
   * Navegar al mes anterior
   */
  const mesAnterior = () => {
    const [year, month] = mesSeleccionado.split('-').map(Number);
    let nuevoMes = month - 1;
    let nuevoYear = year;
    
    if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoYear = year - 1;
    }
    
    setMesSeleccionado(`${nuevoYear}-${String(nuevoMes).padStart(2, '0')}`);
    setTerapeutaSeleccionado(null);
  };

  /**
   * Navegar al mes siguiente
   */
  const mesSiguiente = () => {
    const [year, month] = mesSeleccionado.split('-').map(Number);
    let nuevoMes = month + 1;
    let nuevoYear = year;
    
    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoYear = year + 1;
    }
    
    setMesSeleccionado(`${nuevoYear}-${String(nuevoMes).padStart(2, '0')}`);
    setTerapeutaSeleccionado(null);
  };

  /**
   * Calcula duración en horas
   */
  const calcularDuracion = (inicio, fin) => {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
  };

  /**
   * Formatea fecha para mostrar
   */
  const formatearFecha = (fechaISO) => {
    const [year, month, day] = fechaISO.split('-');
    return `${day}/${month}/${year}`;
  };

  /**
   * Filtra las citas completadas del mes seleccionado
   */
  const citasDelMes = useMemo(() => {
    const [year, month] = mesSeleccionado.split('-');
    
    return citas.filter(cita => {
      if (cita.estado !== 'completada') return false;
      
      const [citaYear, citaMonth] = cita.fecha.split('-');
      return citaYear === year && citaMonth === month;
    });
  }, [citas, mesSeleccionado]);

  /**
   * Filtra los cargos de sombra del mes seleccionado
   */
  const cargosSombraDelMes = useMemo(() => {
    return cargosSombra.filter(cargo => cargo.mes === mesSeleccionado);
  }, [cargosSombra, mesSeleccionado]);

  /**
   * Agrupa las citas y cargos por terapeuta
   */
  const terapeutasConPagos = useMemo(() => {
    const terapeutasMap = {};
    
    // Procesar citas
    citasDelMes.forEach(cita => {
      const nombreTerapeuta = cita.terapeuta;
      
      if (!terapeutasMap[nombreTerapeuta]) {
        // Buscar el objeto terapeuta para obtener su ID
        const terapeutaObj = terapeutas.find(t => t.nombre === nombreTerapeuta);
        
        terapeutasMap[nombreTerapeuta] = {
          nombre: nombreTerapeuta,
          terapeutaId: terapeutaObj?.id || null,
          citas: [],
          cargosSombra: [],
          totalHoras: 0,
          totalCitas: 0,
          totalPagoCitas: 0,
          totalPagoSombra: 0,
          totalPago: 0
        };
      }
      
      const duracion = calcularDuracion(cita.horaInicio, cita.horaFin);
      const pagoCita = cita.costoTerapeutaTotal || 0;
      
      terapeutasMap[nombreTerapeuta].citas.push({
        ...cita,
        duracion,
        pagoCita
      });
      
      terapeutasMap[nombreTerapeuta].totalHoras += duracion;
      terapeutasMap[nombreTerapeuta].totalCitas += 1;
      terapeutasMap[nombreTerapeuta].totalPagoCitas += pagoCita;
    });

    // Procesar cargos de sombra
    cargosSombraDelMes.forEach(cargo => {
      const nombreTerapeuta = cargo.terapeutaNombre;
      
      if (!terapeutasMap[nombreTerapeuta]) {
        const terapeutaObj = terapeutas.find(t => t.nombre === nombreTerapeuta);
        
        terapeutasMap[nombreTerapeuta] = {
          nombre: nombreTerapeuta,
          terapeutaId: terapeutaObj?.id || cargo.terapeutaId,
          citas: [],
          cargosSombra: [],
          totalHoras: 0,
          totalCitas: 0,
          totalPagoCitas: 0,
          totalPagoSombra: 0,
          totalPago: 0
        };
      }
      
      terapeutasMap[nombreTerapeuta].cargosSombra.push(cargo);
      terapeutasMap[nombreTerapeuta].totalPagoSombra += (cargo.montoTerapeuta || 0);
    });

    // Calcular totales finales
    Object.values(terapeutasMap).forEach(terapeuta => {
      terapeuta.totalPago = terapeuta.totalPagoCitas + terapeuta.totalPagoSombra;
    });

    return Object.values(terapeutasMap).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
  }, [citasDelMes, cargosSombraDelMes, terapeutas]);

  /**
   * Calcula el total general a pagar a todas las terapeutas
   */
  const totalGeneralPago = useMemo(() => {
    return terapeutasConPagos.reduce((sum, t) => sum + t.totalPago, 0);
  }, [terapeutasConPagos]);

  /**
   * Filtra terapeutas por búsqueda
   */
  const terapeutasFiltrados = useMemo(() => {
    if (!busquedaTerapeuta) return terapeutasConPagos;
    
    const busqueda = busquedaTerapeuta.toLowerCase();
    return terapeutasConPagos.filter(t => 
      t.nombre.toLowerCase().includes(busqueda)
    );
  }, [terapeutasConPagos, busquedaTerapeuta]);

  /**
   * Agrupa citas por cliente para mejor visualización
   */
  const citasAgrupadasPorCliente = useMemo(() => {
    if (!terapeutaSeleccionado) return [];
    
    const clientesMap = {};
    
    terapeutaSeleccionado.citas.forEach(cita => {
      if (!clientesMap[cita.cliente]) {
        clientesMap[cita.cliente] = {
          cliente: cita.cliente,
          citas: [],
          totalHoras: 0,
          totalPago: 0
        };
      }
      
      clientesMap[cita.cliente].citas.push(cita);
      clientesMap[cita.cliente].totalHoras += cita.duracion;
      clientesMap[cita.cliente].totalPago += cita.pagoCita;
    });
    
    return Object.values(clientesMap).sort((a, b) => 
      a.cliente.localeCompare(b.cliente)
    );
  }, [terapeutaSeleccionado]);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50">
      {/* Sidebar - Lista de Terapeutas */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Pagos a Terapeutas</h2>
          </div>

          {/* Selector de Mes con Flechas */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Período
            </label>
            <div className="flex items-center justify-between bg-gray-100 rounded-lg p-1">
              <button
                onClick={mesAnterior}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              
              <div className="flex-1 text-center">
                <span className="font-semibold text-gray-800">
                  {obtenerNombreMes(mesSeleccionado)}
                </span>
              </div>
              
              <button
                onClick={mesSiguiente}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Total del mes */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 text-white mb-4">
            <p className="text-xs opacity-90">Total a pagar este mes</p>
            <p className="text-2xl font-bold">
              ${totalGeneralPago.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {terapeutasConPagos.length} terapeutas
            </p>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar terapeuta..."
              value={busquedaTerapeuta}
              onChange={(e) => setBusquedaTerapeuta(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Lista de Terapeutas */}
        <div className="flex-1 overflow-y-auto">
          {terapeutasFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <User size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No hay terapeutas con pagos</p>
                <p className="text-sm mt-1">en {obtenerNombreMes(mesSeleccionado)}</p>
              </div>
            </div>
          ) : (
            terapeutasFiltrados.map((terapeuta) => (
              <div
                key={terapeuta.nombre}
                onClick={() => setTerapeutaSeleccionado(terapeuta)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  terapeutaSeleccionado?.nombre === terapeuta.nombre
                    ? 'bg-green-50 border-l-4 border-l-green-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{terapeuta.nombre}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {terapeuta.totalCitas} citas • {terapeuta.totalHoras.toFixed(1)}h
                      {terapeuta.cargosSombra.length > 0 && (
                        <span className="ml-2 text-purple-600">
                          + {terapeuta.cargosSombra.length} sombra
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${terapeuta.totalPago.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel Principal - Detalles del Terapeuta */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!terapeutaSeleccionado ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <User size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Selecciona un terapeuta para ver el detalle</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header del Terapeuta */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {terapeutaSeleccionado.nombre}
                  </h1>
                  <p className="text-gray-500">
                    {obtenerNombreMes(mesSeleccionado)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => window.print()}
                  >
                    <Printer size={20} />
                    Imprimir
                  </button>
                </div>
              </div>

              {/* Resumen de Pago */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Citas</p>
                  <p className="text-xl font-bold text-blue-900">{terapeutaSeleccionado.totalCitas}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium">Horas</p>
                  <p className="text-xl font-bold text-purple-900">{terapeutaSeleccionado.totalHoras.toFixed(1)}h</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 font-medium">Pago Citas</p>
                  <p className="text-xl font-bold text-amber-900">
                    ${terapeutaSeleccionado.totalPagoCitas.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium">Total a Pagar</p>
                  <p className="text-xl font-bold text-green-900">
                    ${terapeutaSeleccionado.totalPago.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Cargos de Sombra del Terapeuta */}
              {terapeutaSeleccionado.cargosSombra.length > 0 && (
                <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                      <Layers size={18} />
                      Cargos de Sombra ({terapeutaSeleccionado.cargosSombra.length})
                    </h3>
                    <span className="text-purple-700 font-bold">
                      ${terapeutaSeleccionado.totalPagoSombra.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {terapeutaSeleccionado.cargosSombra.map(cargo => (
                      <div 
                        key={cargo.id} 
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{cargo.descripcion}</p>
                          <p className="text-sm text-gray-500">
                            Cliente: {cargo.clienteNombre}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-purple-700">
                            ${cargo.montoTerapeuta?.toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Detalle de Citas por Cliente */}
            <div className="flex-1 overflow-y-auto bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Detalle de Citas por Cliente
              </h2>

              {citasAgrupadasPorCliente.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No hay citas completadas este mes</p>
                  {terapeutaSeleccionado.cargosSombra.length > 0 && (
                    <p className="text-sm mt-2 text-purple-600">
                      Solo tiene cargos de sombra
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {citasAgrupadasPorCliente.map(grupo => (
                    <div 
                      key={grupo.cliente}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Header del Cliente */}
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User size={18} className="text-gray-500" />
                          <span className="font-medium text-gray-900">{grupo.cliente}</span>
                          <span className="text-sm text-gray-500">
                            ({grupo.citas.length} citas)
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            <Clock size={14} className="inline mr-1" />
                            {grupo.totalHoras.toFixed(1)}h
                          </span>
                          <span className="font-semibold text-green-600">
                            ${grupo.totalPago.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      {/* Tabla de Citas */}
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-t border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Fecha</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Horario</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Tipo</th>
                            <th className="px-4 py-2 text-center text-gray-600 font-medium">Duración</th>
                            <th className="px-4 py-2 text-right text-gray-600 font-medium">Pago</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {grupo.citas
                            .sort((a, b) => a.fecha.localeCompare(b.fecha))
                            .map(cita => (
                              <tr key={cita.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-900">
                                  {formatearFecha(cita.fecha)}
                                </td>
                                <td className="px-4 py-2 text-gray-600">
                                  {cita.horaInicio} - {cita.horaFin}
                                </td>
                                <td className="px-4 py-2 text-gray-600">
                                  {cita.tipoTerapia || 'Sesión'}
                                </td>
                                <td className="px-4 py-2 text-center text-gray-900">
                                  {cita.duracion.toFixed(1)}h
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-green-600">
                                  ${cita.pagoCita.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                </td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Resumen Final */}
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <DollarSign size={20} />
                  Resumen de Pago - {terapeutaSeleccionado.nombre}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pago por citas ({terapeutaSeleccionado.totalCitas} citas, {terapeutaSeleccionado.totalHoras.toFixed(1)}h):</span>
                    <span className="font-medium text-gray-900">
                      ${terapeutaSeleccionado.totalPagoCitas.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  
                  {terapeutaSeleccionado.cargosSombra.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-600">Pago por sombra ({terapeutaSeleccionado.cargosSombra.length} cargos):</span>
                      <span className="font-medium text-purple-700">
                        ${terapeutaSeleccionado.totalPagoSombra.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-2 border-t border-green-200">
                    <span className="font-bold text-green-900">TOTAL A PAGAR:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${terapeutaSeleccionado.totalPago.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PagosTerapeutasGemini;
