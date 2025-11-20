import React, { useState, useMemo } from 'react';
import { FileText, Download, Calendar, DollarSign, TrendingUp, User, Save } from 'lucide-react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Componente de Reportes con exportación a Excel y PDF
 * 
 * @param {Object} props
 * @param {Array} props.citas - Lista de citas
 * @param {Array} props.clientes - Lista de clientes
 * @param {Array} props.terapeutas - Lista de terapeutas
 * @param {Array} props.meses - Nombres de meses
 */
const Reportes = ({ 
  citas, 
  clientes, 
  terapeutas, 
  meses,
  guardarRecibosEnFirebase,
  guardandoRecibos,
  reporteGenerado
}) => {
  // Estados
  const [mesReporte, setMesReporte] = useState(new Date().toISOString().slice(0, 7));
  const [terapeutaReporte, setTerapeutaReporte] = useState('todas');
  const [clienteReporte, setClienteReporte] = useState('todos');
  const [ordenColumna, setOrdenColumna] = useState({ campo: null, direccion: 'asc' });

  /**
   * Filtra las citas completadas del mes seleccionado
   */
  const citasDelMes = useMemo(() => {
    const [year, month] = mesReporte.split('-');
    
    return citas.filter(cita => {
      if (cita.estado !== 'completada') return false;
      
      const fecha = new Date(cita.fecha);
      if (fecha.getFullYear() !== parseInt(year)) return false;
      if (fecha.getMonth() !== parseInt(month) - 1) return false;
      
      if (terapeutaReporte !== 'todas' && cita.terapeuta !== terapeutaReporte) return false;
      if (clienteReporte !== 'todos' && cita.cliente !== clienteReporte) return false;
      
      return true;
    });
  }, [citas, mesReporte, terapeutaReporte, clienteReporte]);

  /**
   * Calcula duración en horas
   */
  const calcularDuracion = (inicio, fin) => {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
  };

  /**
   * Agrupa las citas por cliente y calcula totales
   */
  const reportePorCliente = useMemo(() => {
    const reporte = {};
    
    citasDelMes.forEach(cita => {
      if (!reporte[cita.cliente]) {
        const clienteObj = clientes.find(c => c.nombre === cita.cliente);
        reporte[cita.cliente] = {
          nombre: cita.cliente,
          codigo: clienteObj?.codigo || 'N/A',
          clienteId: clienteObj?.id || null,  // ← NUEVA LÍNEA
          citas: [],
          totalHoras: 0,
          totalCitas: 0,
          totalPrecio: 0,
          totalIva: 0,
          totalGeneral: 0,
          totalCostoTerapeutas: 0
        };
      }
      
      const duracion = calcularDuracion(cita.horaInicio, cita.horaFin);
      const precio = cita.costoTotal || (cita.costoPorHora * duracion) || 0;
      const iva = precio * 0.16;
      const total = precio + iva;
      const costoTerapeuta = cita.costoTerapeutaTotal || 0;
      
      reporte[cita.cliente].citas.push({
        ...cita,
        duracion,
        precio,
        iva,
        total,
        costoTerapeuta
      });
      
      reporte[cita.cliente].totalHoras += duracion;
      reporte[cita.cliente].totalCitas += 1;
      reporte[cita.cliente].totalPrecio += precio;
      reporte[cita.cliente].totalIva += iva;
      reporte[cita.cliente].totalGeneral += total;
      reporte[cita.cliente].totalCostoTerapeutas += costoTerapeuta;
    });
    
    Object.values(reporte).forEach(cliente => {
      cliente.gananciaTotal = cliente.totalGeneral - cliente.totalCostoTerapeutas;
      cliente.margenPorcentaje = cliente.totalGeneral > 0 
        ? (cliente.gananciaTotal / cliente.totalGeneral) * 100 
        : 0;
    });
    return Object.values(reporte);
  }, [citasDelMes, clientes]);

  /**
   * Ordena las citas de un cliente
   */
  const ordenarCitas = (citasArray, campo) => {
    if (!citasArray || citasArray.length === 0) return citasArray;
    
    const nuevaDireccion = ordenColumna.campo === campo && ordenColumna.direccion === 'asc' ? 'desc' : 'asc';
    setOrdenColumna({ campo, direccion: nuevaDireccion });
    
    return [...citasArray].sort((a, b) => {
      let valorA, valorB;
      
      switch(campo) {
        case 'fecha':
          valorA = new Date(a.fecha);
          valorB = new Date(b.fecha);
          break;
        case 'terapeuta':
          return nuevaDireccion === 'asc' 
            ? a.terapeuta.localeCompare(b.terapeuta)
            : b.terapeuta.localeCompare(a.terapeuta);
        default:
          valorA = a[campo] || 0;
          valorB = b[campo] || 0;
      }
      
      return nuevaDireccion === 'asc' 
        ? (valorA > valorB ? 1 : -1)
        : (valorA < valorB ? 1 : -1);
    });
  };

  /**
   * Indicador de orden en columnas
   */
  const renderIndicadorOrden = (campo) => {
    if (ordenColumna.campo !== campo) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return ordenColumna.direccion === 'asc' 
      ? <span className="text-blue-600 ml-1">↑</span>
      : <span className="text-blue-600 ml-1">↓</span>;
  };

  /**
   * Exportar a Excel usando ExcelJS
   */
  const exportarExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const [year, month] = mesReporte.split('-');
    const nombreMes = meses[parseInt(month) - 1];
    
    workbook.creator = 'ACMC';
    workbook.created = new Date();
    
    // Hoja de resumen
    const wsResumen = workbook.addWorksheet('Resumen');
    wsResumen.columns = [
      { header: 'Código', key: 'codigo', width: 12 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Total Horas', key: 'horas', width: 12 },
      { header: 'Total Citas', key: 'citas', width: 12 },
      { header: 'Subtotal', key: 'subtotal', width: 15 },
      { header: 'IVA', key: 'iva', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Costo Terapeutas', key: 'costo', width: 18 },
      { header: 'Ganancia', key: 'ganancia', width: 15 },
      { header: 'Margen %', key: 'margen', width: 12 }
    ];
    
    wsResumen.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsResumen.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    wsResumen.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    reportePorCliente.forEach(cliente => {
      const ganancia = cliente.totalGeneral - cliente.totalCostoTerapeutas;
      const margen = (ganancia / cliente.totalGeneral * 100).toFixed(1);
      
      wsResumen.addRow({
        codigo: cliente.codigo,
        cliente: cliente.nombre,
        horas: parseFloat(cliente.totalHoras.toFixed(2)),
        citas: cliente.totalCitas,
        subtotal: parseFloat(cliente.totalPrecio.toFixed(2)),
        iva: parseFloat(cliente.totalIva.toFixed(2)),
        total: parseFloat(cliente.totalGeneral.toFixed(2)),
        costo: parseFloat(cliente.totalCostoTerapeutas.toFixed(2)),
        ganancia: parseFloat(ganancia.toFixed(2)),
        margen: parseFloat(margen)
      });
    });
    
    ['E', 'F', 'G', 'H', 'I'].forEach(col => {
      wsResumen.getColumn(col).numFmt = '"$"#,##0.00';
    });
    
    // Hojas por cliente
    reportePorCliente.forEach(cliente => {
      const nombreHoja = cliente.nombre.substring(0, 25).replace(/[:\\/?*[\]]/g, '');
      const ws = workbook.addWorksheet(nombreHoja);
      
      ws.columns = [
        { header: 'Fecha', key: 'fecha', width: 12 },
        { header: 'Terapeuta', key: 'terapeuta', width: 25 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Inicio', key: 'inicio', width: 10 },
        { header: 'Fin', key: 'fin', width: 10 },
        { header: 'Duración', key: 'duracion', width: 12 },
        { header: 'Precio', key: 'precio', width: 12 },
        { header: 'IVA', key: 'iva', width: 12 },
        { header: 'Total', key: 'total', width: 12 }
      ];
      
      cliente.citas.forEach(cita => {
        ws.addRow({
          fecha: cita.fecha,
          terapeuta: cita.terapeuta,
          tipo: cita.tipoTerapia || 'N/A',
          inicio: cita.horaInicio,
          fin: cita.horaFin,
          duracion: cita.duracion.toFixed(2),
          precio: cita.precio.toFixed(2),
          iva: cita.iva.toFixed(2),
          total: cita.total.toFixed(2)
        });
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${nombreMes}_${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Exportar a PDF
   */
  const exportarPDF = () => {
    const doc = new jsPDF();
    const [year, month] = mesReporte.split('-');
    const nombreMes = meses[parseInt(month) - 1];
    
    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Horas Trabajadas', 14, 20);
    doc.setFontSize(12);
    doc.text(`Período: ${nombreMes} ${year}`, 14, 28);
    
    if (terapeutaReporte !== 'todas') {
      doc.text(`Terapeuta: ${terapeutaReporte}`, 14, 34);
    }
    
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 40);
    
    let yPos = 50;
    
    // Resumen por cliente
    reportePorCliente.forEach((cliente, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Encabezado del cliente
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`${cliente.nombre} (${cliente.codigo})`, 14, yPos);
      yPos += 8;
      
      // Tabla de citas del cliente
      const citasData = cliente.citas.map(cita => [
        cita.fecha,
        cita.terapeuta,
        cita.tipoTerapia || 'N/A',
        `${cita.horaInicio}-${cita.horaFin}`,
        cita.duracion.toFixed(2),
        `$${cita.total.toFixed(2)}`
      ]);
      
      autoTable(doc,{
        startY: yPos,
        head: [['Fecha', 'Terapeuta', 'Tipo', 'Horario', 'Horas', 'Total']],
        body: citasData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      yPos = doc.lastAutoTable.finalY + 5;
      
      // Totales del cliente
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`Total: $${cliente.totalGeneral.toFixed(2)}`, 14, yPos);
      yPos += 12;
      doc.setFont(undefined, 'normal');
    });
    
    doc.save(`Reporte_${nombreMes}_${year}.pdf`);
  };

  /**
   * Descargar como texto
   */
  const descargarTexto = () => {
    const [year, month] = mesReporte.split('-');
    const nombreMes = meses[parseInt(month) - 1];
    
    let contenido = `REPORTE DE HORAS TRABAJADAS\n`;
    contenido += `Período: ${nombreMes} ${year}\n`;
    contenido += `Generado: ${new Date().toLocaleDateString()}\n`;
    contenido += `${'='.repeat(80)}\n\n`;

    reportePorCliente.forEach(cliente => {
      contenido += `CLIENTE: ${cliente.nombre} (${cliente.codigo})\n`;
      contenido += `${'-'.repeat(80)}\n`;
      
      cliente.citas.forEach(cita => {
        contenido += `  ${cita.fecha} - ${cita.terapeuta}\n`;
        contenido += `    ${cita.horaInicio} - ${cita.horaFin} (${cita.duracion.toFixed(2)}h)\n`;
        contenido += `    ${cita.tipoTerapia || 'N/A'}: $${cita.total.toFixed(2)}\n`;
      });
      
      contenido += `\nRESUMEN:\n`;
      contenido += `  Total: $${cliente.totalGeneral.toFixed(2)}\n`;
      contenido += `\n${'='.repeat(80)}\n\n`;
    });

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${nombreMes}_${year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cálculos de resumen
  const totalHorasGeneral = reportePorCliente.reduce((sum, c) => sum + c.totalHoras, 0);
  const totalCitasGeneral = reportePorCliente.reduce((sum, c) => sum + c.totalCitas, 0);
  const totalIngresosGeneral = reportePorCliente.reduce((sum, c) => sum + c.totalGeneral, 0);
  const totalCostosGeneral = reportePorCliente.reduce((sum, c) => sum + c.totalCostoTerapeutas, 0);
  const gananciaGeneral = totalIngresosGeneral - totalCostosGeneral;
  const margenGeneral = totalIngresosGeneral > 0 ? (gananciaGeneral / totalIngresosGeneral * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText size={28} />
          Reportes de Horas Trabajadas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar size={16} className="inline mr-2" />
              Mes
            </label>
            <input
              type="month"
              value={mesReporte}
              onChange={(e) => setMesReporte(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          {/* Terapeuta */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <User size={16} className="inline mr-2" />
              Terapeuta
            </label>
            <select
              value={terapeutaReporte}
              onChange={(e) => setTerapeutaReporte(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="todas">Todas las terapeutas</option>
              {terapeutas.map(t => (
                <option key={t.id} value={t.nombre}>{t.nombre}</option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <User size={16} className="inline mr-2" />
              Cliente
            </label>
            <select
              value={clienteReporte}
              onChange={(e) => setClienteReporte(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="todos">Todos los clientes</option>
              {clientes.map(c => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de Exportación */}
        <div className="flex gap-3 mt-6 flex-wrap">
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            <Download size={18} />
            Exportar Excel
          </button>
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
          >
            <Download size={18} />
            Exportar PDF
          </button>
          <button
            onClick={descargarTexto}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            <Download size={18} />
            Descargar TXT
          </button>
          <button
            onClick={async () => {
              const reporteParaGuardar = {
                mes: mesReporte,
                recibos: reportePorCliente
              };
              
              const resultado = await guardarRecibosEnFirebase(reporteParaGuardar);
              if (resultado.exito) {
                alert(`✅ ${resultado.mensaje}`);
              } else {
                alert(`❌ ${resultado.mensaje}`);
              }
            }}
            // disabled={guardandoRecibos || !reporteGenerado || !reporteGenerado.recibos || reporteGenerado.recibos.length === 0}
            disabled={guardandoRecibos || reportePorCliente.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              // guardandoRecibos || !reporteGenerado || !reporteGenerado.recibos || reporteGenerado.recibos.length === 0
              guardandoRecibos || reportePorCliente.length === 0
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save size={18} />
            {guardandoRecibos ? 'Guardando...' : 'Guardar Recibos'}
          </button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Citas</p>
              <p className="text-2xl font-bold">{totalCitasGeneral}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Horas</p>
              <p className="text-2xl font-bold">{totalHorasGeneral.toFixed(1)}h</p>
            </div>
            <FileText className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos</p>
              <p className="text-2xl font-bold">${totalIngresosGeneral.toFixed(0)}</p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ganancia</p>
              <p className="text-2xl font-bold">${gananciaGeneral.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Margen: {margenGeneral.toFixed(1)}%</p>
            </div>
            <TrendingUp className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Tabla de Reportes por Cliente */}
      {reportePorCliente.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No hay citas completadas en el período seleccionado</p>
        </div>
      ) : (
        reportePorCliente.map((cliente, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">{cliente.nombre}</h3>
                <p className="text-sm text-gray-600">Código: {cliente.codigo}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  ${cliente.totalGeneral.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  {cliente.totalCitas} citas • {cliente.totalHoras.toFixed(1)}h
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="p-2 text-left cursor-pointer hover:bg-gray-100"
                      onClick={() => ordenarCitas(cliente.citas, 'fecha')}
                    >
                      Fecha {renderIndicadorOrden('fecha')}
                    </th>
                    <th 
                      className="p-2 text-left cursor-pointer hover:bg-gray-100"
                      onClick={() => ordenarCitas(cliente.citas, 'terapeuta')}
                    >
                      Terapeuta {renderIndicadorOrden('terapeuta')}
                    </th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Horario</th>
                    <th 
                      className="p-2 text-right cursor-pointer hover:bg-gray-100"
                      onClick={() => ordenarCitas(cliente.citas, 'duracion')}
                    >
                      Duración {renderIndicadorOrden('duracion')}
                    </th>
                    <th className="p-2 text-right">Precio</th>
                    <th className="p-2 text-right">IVA</th>
                    <th 
                      className="p-2 text-right cursor-pointer hover:bg-gray-100"
                      onClick={() => ordenarCitas(cliente.citas, 'total')}
                    >
                      Total {renderIndicadorOrden('total')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.citas.map((cita, citaIndex) => (
                    <tr key={citaIndex} className="border-t hover:bg-gray-50">
                      <td className="p-2">{cita.fecha}</td>
                      <td className="p-2">{cita.terapeuta}</td>
                      <td className="p-2">{cita.tipoTerapia || 'N/A'}</td>
                      <td className="p-2">{cita.horaInicio} - {cita.horaFin}</td>
                      <td className="p-2 text-right">{cita.duracion.toFixed(2)}h</td>
                      <td className="p-2 text-right">${cita.precio.toFixed(2)}</td>
                      <td className="p-2 text-right">${cita.iva.toFixed(2)}</td>
                      <td className="p-2 text-right font-semibold">${cita.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold">
                  <tr className="border-t-2">
                    <td colSpan="4" className="p-2">TOTALES</td>
                    <td className="p-2 text-right">{cliente.totalHoras.toFixed(2)}h</td>
                    <td className="p-2 text-right">${cliente.totalPrecio.toFixed(2)}</td>
                    <td className="p-2 text-right">${cliente.totalIva.toFixed(2)}</td>
                    <td className="p-2 text-right text-green-600">${cliente.totalGeneral.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Info de Ganancia */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Costo Terapeutas:</p>
                  <p className="font-semibold">${cliente.totalCostoTerapeutas.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ganancia:</p>
                  <p className="font-semibold text-green-600">
                    ${(cliente.totalGeneral - cliente.totalCostoTerapeutas).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Margen:</p>
                  <p className="font-semibold">
                    {((cliente.totalGeneral - cliente.totalCostoTerapeutas) / cliente.totalGeneral * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Reportes;