import React, { useState, useMemo } from 'react';
import { Search, Grid, List, MoreHorizontal, Filter } from 'lucide-react';

/**
 * Componente de Recibos con interfaz estilo Gemini
 * Muestra una lista de clientes en sidebar y detalles del cliente seleccionado
 */
const RecibosGemini = ({ 
  citas, 
  clientes, 
  meses 
}) => {
  // Estados
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7));
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [vistaLista, setVistaLista] = useState(true); // true = lista, false = grid

  /**
   * Calcula duración en horas
   */
  const calcularDuracion = (inicio, fin) => {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
  };

  /**
   * Filtra las citas completadas del mes seleccionado
   */
  const citasDelMes = useMemo(() => {
    const [year, month] = mesSeleccionado.split('-');
    
    return citas.filter(cita => {
      if (cita.estado !== 'completada') return false;
      
      const fecha = new Date(cita.fecha);
      if (fecha.getFullYear() !== parseInt(year)) return false;
      if (fecha.getMonth() !== parseInt(month) - 1) return false;
      
      return true;
    });
  }, [citas, mesSeleccionado]);

  /**
   * Agrupa las citas por cliente
   */
  const clientesConCitas = useMemo(() => {
    const clientesMap = {};
    
    citasDelMes.forEach(cita => {
      if (!clientesMap[cita.cliente]) {
        const clienteObj = clientes.find(c => c.nombre === cita.cliente);
        clientesMap[cita.cliente] = {
          nombre: cita.cliente,
          codigo: clienteObj?.codigo || 'N/A',
          clienteId: clienteObj?.id || null,
          citas: [],
          totalHoras: 0,
          totalCitas: 0,
          totalPrecio: 0,
          totalIva: 0,
          totalGeneral: 0
        };
      }
      
      const duracion = calcularDuracion(cita.horaInicio, cita.horaFin);
      const precio = cita.costoTotal || (cita.costoPorHora * duracion) || 0;
      const iva = precio * 0.16;
      const total = precio + iva;
      
      clientesMap[cita.cliente].citas.push({
        ...cita,
        duracion,
        precio,
        iva,
        total
      });
      
      clientesMap[cita.cliente].totalHoras += duracion;
      clientesMap[cita.cliente].totalCitas += 1;
      clientesMap[cita.cliente].totalPrecio += precio;
      clientesMap[cita.cliente].totalIva += iva;
      clientesMap[cita.cliente].totalGeneral += total;
    });

    return Object.values(clientesMap).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
  }, [citasDelMes, clientes]);

  /**
   * Filtra clientes por búsqueda
   */
  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente) return clientesConCitas;
    
    const busqueda = busquedaCliente.toLowerCase();
    return clientesConCitas.filter(cliente => 
      cliente.nombre.toLowerCase().includes(busqueda) ||
      cliente.codigo.toLowerCase().includes(busqueda)
    );
  }, [clientesConCitas, busquedaCliente]);

  /**
   * Selecciona el primer cliente automáticamente si hay clientes
   */
  useMemo(() => {
    if (clientesFiltrados.length > 0 && !clienteSeleccionado) {
      setClienteSeleccionado(clientesFiltrados[0]);
    }
  }, [clientesFiltrados, clienteSeleccionado]);

  /**
   * Formatea la fecha en español
   */
  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  /**
   * Obtiene el nombre del mes
   */
  const obtenerNombreMes = (mesISO) => {
    const [year, month] = mesISO.split('-');
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Lista de Clientes */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recibo de Pacientes Gemini
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVistaLista(true)}
                className={`p-1.5 rounded ${vistaLista ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                <List size={18} className="text-gray-600" />
              </button>
              <button
                onClick={() => setVistaLista(false)}
                className={`p-1.5 rounded ${!vistaLista ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                <Grid size={18} className="text-gray-600" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded">
                <Filter size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Selector de Mes */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Período
            </label>
            <input
              type="month"
              value={mesSeleccionado}
              onChange={(e) => {
                setMesSeleccionado(e.target.value);
                setClienteSeleccionado(null); // Reset selección
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar"
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="flex-1 overflow-y-auto">
          {clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <p className="font-medium">No hay clientes con citas en este período</p>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Período seleccionado: {obtenerNombreMes(mesSeleccionado)}</p>
                <p>Total de citas en el sistema: {citas.length}</p>
                <p>Citas completadas en este mes: {citasDelMes.length}</p>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Intenta seleccionar otro mes con el selector arriba
                </p>
              </div>
            </div>
          ) : (
            clientesFiltrados.map((cliente) => (
              <div
                key={cliente.nombre}
                onClick={() => setClienteSeleccionado(cliente)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  clienteSeleccionado?.nombre === cliente.nombre
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">{cliente.nombre}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {cliente.codigo}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel Principal - Detalles del Cliente */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!clienteSeleccionado ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Selecciona un cliente para ver sus detalles</p>
          </div>
        ) : (
          <>
            {/* Header del Cliente */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {clienteSeleccionado.nombre}
                </h1>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <MoreHorizontal size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Client Name
                  </label>
                  <div className="text-gray-900">{clienteSeleccionado.nombre}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Client ID
                  </label>
                  <div className="text-gray-900">{clienteSeleccionado.codigo}</div>
                </div>
              </div>
            </div>

            {/* Tabla de Recibos */}
            <div className="flex-1 overflow-y-auto bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recibo</h2>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                    Filtro
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded">
                    <MoreHorizontal size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Terapias ABA ACMC
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr className="text-left text-gray-600">
                      <th className="pb-3 px-3 font-medium"># Fecha de Sesión</th>
                      <th className="pb-3 px-3 font-medium text-center"># Duración</th>
                      <th className="pb-3 px-3 font-medium">Terapeuta</th>
                      <th className="pb-3 px-3 font-medium text-right">Precio de la sesión</th>
                      <th className="pb-3 px-3 font-medium text-right">IVA</th>
                      <th className="pb-3 px-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clienteSeleccionado.citas.map((cita, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span>{formatearFecha(cita.fecha)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {cita.duracion.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">{cita.terapeuta}</td>
                        <td className="py-3 px-3 text-right">{cita.precio.toFixed(0)}</td>
                        <td className="py-3 px-3 text-right">{cita.iva.toFixed(0)}</td>
                        <td className="py-3 px-3 text-right">{cita.total.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-300">
                    <tr className="font-semibold">
                      <td className="py-3 px-3" colSpan="2">
                        {clienteSeleccionado.totalCitas} citas
                      </td>
                      <td className="py-3 px-3">
                        Suma {clienteSeleccionado.totalHoras.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        Suma {clienteSeleccionado.totalPrecio.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        Suma {clienteSeleccionado.totalIva.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        Suma {clienteSeleccionado.totalGeneral.toFixed(0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecibosGemini;
