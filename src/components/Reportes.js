// src/components/Reportes.js
import React, { useState, useMemo } from 'react';
import { Download, Calendar, DollarSign, Clock, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reportes = ({ horasTrabajadas, pagos, terapeutas, clientes }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Calcular estadísticas del mes
  const estadisticas = useMemo(() => {
    const [año, mes] = mesSeleccionado.split('-');
    
    const horasMes = horasTrabajadas.filter(h => {
      const fecha = new Date(h.fecha);
      return fecha.getFullYear() === parseInt(año) && 
             fecha.getMonth() + 1 === parseInt(mes);
    });
    
    const pagosMes = pagos.filter(p => {
      const fecha = new Date(p.fecha);
      return fecha.getFullYear() === parseInt(año) && 
             fecha.getMonth() + 1 === parseInt(mes);
    });

    const totalHoras = horasMes.reduce((sum, h) => sum + h.horas, 0);
    const totalIngresos = pagosMes.reduce((sum, p) => sum + p.monto, 0);

    // Horas por terapeuta
    const horasPorTerapeuta = {};
    horasMes.forEach(h => {
      const nombreTerapeuta = terapeutas.find(t => t.id === h.terapeutaId)?.nombre || 'N/A';
      horasPorTerapeuta[nombreTerapeuta] = (horasPorTerapeuta[nombreTerapeuta] || 0) + h.horas;
    });

    // Ingresos por cliente
    const ingresosPorCliente = {};
    pagosMes.forEach(p => {
      const nombreCliente = clientes.find(c => c.id === p.clienteId)?.nombre || 'N/A';
      ingresosPorCliente[nombreCliente] = (ingresosPorCliente[nombreCliente] || 0) + p.monto;
    });

    return {
      totalHoras,
      totalIngresos,
      cantidadSesiones: horasMes.length,
      cantidadPagos: pagosMes.length,
      horasPorTerapeuta,
      ingresosPorCliente,
      horasMes,
      pagosMes
    };
  }, [mesSeleccionado, horasTrabajadas, pagos, terapeutas, clientes]);

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Hoja de resumen
    const resumenData = [
      ['Reporte Mensual', mesSeleccionado],
      [],
      ['RESUMEN GENERAL'],
      ['Total de horas trabajadas', estadisticas.totalHoras],
      ['Total de ingresos', `$${estadisticas.totalIngresos.toLocaleString()}`],
      ['Cantidad de sesiones', estadisticas.cantidadSesiones],
      ['Cantidad de pagos', estadisticas.cantidadPagos],
      [],
      ['HORAS POR TERAPEUTA'],
      ...Object.entries(estadisticas.horasPorTerapeuta).map(([nombre, horas]) => [nombre, horas]),
      [],
      ['INGRESOS POR CLIENTE'],
      ...Object.entries(estadisticas.ingresosPorCliente).map(([nombre, monto]) => [nombre, `$${monto.toLocaleString()}`])
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja de horas detalladas
    const horasData = estadisticas.horasMes.map(h => ({
      Fecha: h.fecha,
      Terapeuta: terapeutas.find(t => t.id === h.terapeutaId)?.nombre || 'N/A',
      Cliente: clientes.find(c => c.id === h.clienteId)?.nombre || 'N/A',
      Horas: h.horas,
      Notas: h.notas || ''
    }));
    const wsHoras = XLSX.utils.json_to_sheet(horasData);
    XLSX.utils.book_append_sheet(wb, wsHoras, 'Horas Trabajadas');

    // Hoja de pagos detallados
    const pagosData = estadisticas.pagosMes.map(p => ({
      Fecha: p.fecha,
      Cliente: clientes.find(c => c.id === p.clienteId)?.nombre || 'N/A',
      Monto: p.monto,
      Concepto: p.concepto,
      Método: p.metodo
    }));
    const wsPagos = XLSX.utils.json_to_sheet(pagosData);
    XLSX.utils.book_append_sheet(wb, wsPagos, 'Pagos');

    XLSX.writeFile(wb, `Reporte_${mesSeleccionado}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Reporte Mensual', 14, 20);
    doc.setFontSize(12);
    doc.text(mesSeleccionado, 14, 28);

    // Resumen general
    doc.setFontSize(14);
    doc.text('Resumen General', 14, 40);
    doc.setFontSize(10);
    doc.text(`Total de horas trabajadas: ${estadisticas.totalHoras}`, 14, 48);
    doc.text(`Total de ingresos: $${estadisticas.totalIngresos.toLocaleString()}`, 14, 54);
    doc.text(`Cantidad de sesiones: ${estadisticas.cantidadSesiones}`, 14, 60);
    doc.text(`Cantidad de pagos: ${estadisticas.cantidadPagos}`, 14, 66);

    // Tabla de horas por terapeuta
    doc.setFontSize(14);
    doc.text('Horas por Terapeuta', 14, 80);
    const horasTerapeutaData = Object.entries(estadisticas.horasPorTerapeuta).map(([nombre, horas]) => [nombre, horas]);
    doc.autoTable({
      startY: 85,
      head: [['Terapeuta', 'Horas']],
      body: horasTerapeutaData,
      theme: 'grid'
    });

    // Tabla de ingresos por cliente
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Ingresos por Cliente', 14, 20);
    const ingresosClienteData = Object.entries(estadisticas.ingresosPorCliente).map(([nombre, monto]) => [nombre, `$${monto.toLocaleString()}`]);
    doc.autoTable({
      startY: 25,
      head: [['Cliente', 'Ingresos']],
      body: ingresosClienteData,
      theme: 'grid'
    });

    // Detalle de horas trabajadas
    if (estadisticas.horasMes.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Detalle de Horas Trabajadas', 14, 20);
      const horasDetalleData = estadisticas.horasMes.map(h => [
        h.fecha,
        terapeutas.find(t => t.id === h.terapeutaId)?.nombre || 'N/A',
        clientes.find(c => c.id === h.clienteId)?.nombre || 'N/A',
        h.horas
      ]);
      doc.autoTable({
        startY: 25,
        head: [['Fecha', 'Terapeuta', 'Cliente', 'Horas']],
        body: horasDetalleData,
        theme: 'striped'
      });
    }

    // Detalle de pagos
    if (estadisticas.pagosMes.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Detalle de Pagos', 14, 20);
      const pagosDetalleData = estadisticas.pagosMes.map(p => [
        p.fecha,
        clientes.find(c => c.id === p.clienteId)?.nombre || 'N/A',
        `$${p.monto.toLocaleString()}`,
        p.concepto
      ]);
      doc.autoTable({
        startY: 25,
        head: [['Fecha', 'Cliente', 'Monto', 'Concepto']],
        body: pagosDetalleData,
        theme: 'striped'
      });
    }

    doc.save(`Reporte_${mesSeleccionado}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reportes Mensuales</h2>
        <div className="flex gap-3">
          <input
            type="month"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={exportarExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={18} />
            Excel
          </button>
          <button
            onClick={exportarPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Download size={18} />
            PDF
          </button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock size={24} />
            <span className="text-3xl font-bold">{estadisticas.totalHoras}</span>
          </div>
          <p className="text-blue-100">Horas Trabajadas</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} />
            <span className="text-3xl font-bold">${estadisticas.totalIngresos.toLocaleString()}</span>
          </div>
          <p className="text-green-100">Ingresos Totales</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar size={24} />
            <span className="text-3xl font-bold">{estadisticas.cantidadSesiones}</span>
          </div>
          <p className="text-purple-100">Sesiones</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} />
            <span className="text-3xl font-bold">{estadisticas.cantidadPagos}</span>
          </div>
          <p className="text-orange-100">Pagos Recibidos</p>
        </div>
      </div>

      {/* Gráficos/Tablas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Horas por terapeuta */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Horas por Terapeuta</h3>
          <div className="space-y-3">
            {Object.entries(estadisticas.horasPorTerapeuta).map(([nombre, horas]) => (
              <div key={nombre} className="flex justify-between items-center">
                <span className="text-gray-700">{nombre}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(horas / estadisticas.totalHoras) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-blue-600 w-12 text-right">{horas}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ingresos por cliente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Ingresos por Cliente</h3>
          <div className="space-y-3">
            {Object.entries(estadisticas.ingresosPorCliente)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([nombre, monto]) => (
                <div key={nombre} className="flex justify-between items-center">
                  <span className="text-gray-700">{nombre}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(monto / estadisticas.totalIngresos) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-green-600 w-24 text-right">${monto.toLocaleString()}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;