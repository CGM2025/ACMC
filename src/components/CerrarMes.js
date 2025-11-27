import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronLeft,
  ChevronRight,
  Save,
  FileText
} from 'lucide-react';

/**
 * Componente para cerrar el mes y calcular utilidad
 * Calcula ingresos automáticamente y permite ingresar gastos manualmente
 */
const CerrarMes = ({ 
  pagos = [],
  utilidadHistorica = [],
  onGuardar,
  onCerrar 
}) => {
  // Estado para el mes/año seleccionado
  const [año, setAño] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth()); // 0-11
  
  // Estado para gastos manuales
  const [gastos, setGastos] = useState({
    nomina: '',
    pagoTerapeutas: '',
    renta: '',
    servicios: '',
    otros: ''
  });
  
  // Estado del componente
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [notasMes, setNotasMes] = useState('');

  // Nombres de los meses
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Verificar si el mes ya está cerrado
  const mesCerrado = useMemo(() => {
    return utilidadHistorica.some(u => 
      u.año === año && u.mes === (mes + 1) // mes en utilidadHistorica es 1-12
    );
  }, [utilidadHistorica, año, mes]);

  // Calcular ingresos del mes seleccionado (automático)
  const ingresosMes = useMemo(() => {
    const inicioMes = new Date(año, mes, 1);
    const finMes = new Date(año, mes + 1, 0, 23, 59, 59);

    const pagosDelMes = pagos.filter(pago => {
      const fechaPago = new Date(pago.fecha);
      return fechaPago >= inicioMes && fechaPago <= finMes;
    });

    const total = pagosDelMes.reduce((sum, pago) => {
      const monto = parseFloat(pago.monto) || 0;
      return sum + monto;
    }, 0);

    return {
      total,
      cantidad: pagosDelMes.length,
      detalle: pagosDelMes
    };
  }, [pagos, año, mes]);

  // Calcular total de gastos
  const totalGastos = useMemo(() => {
    return Object.values(gastos).reduce((sum, valor) => {
      return sum + (parseFloat(valor) || 0);
    }, 0);
  }, [gastos]);

  // Calcular utilidad neta
  const utilidadNeta = useMemo(() => {
    return ingresosMes.total - totalGastos;
  }, [ingresosMes.total, totalGastos]);

  // Cambiar mes
  const cambiarMes = (direccion) => {
    if (direccion === 'anterior') {
      if (mes === 0) {
        setMes(11);
        setAño(año - 1);
      } else {
        setMes(mes - 1);
      }
    } else {
      if (mes === 11) {
        setMes(0);
        setAño(año + 1);
      } else {
        setMes(mes + 1);
      }
    }
    // Limpiar gastos al cambiar de mes
    setGastos({
      nomina: '',
      pagoTerapeutas: '',
      renta: '',
      servicios: '',
      otros: ''
    });
    setNotasMes('');
  };

  // Manejar cambio en gastos
  const handleGastoChange = (campo, valor) => {
    // Solo permitir números y punto decimal
    const valorLimpio = valor.replace(/[^0-9.]/g, '');
    setGastos(prev => ({
      ...prev,
      [campo]: valorLimpio
    }));
  };

  // Guardar cierre de mes
  const handleGuardar = async () => {
    // Validaciones
    if (mesCerrado) {
      setError('Este mes ya ha sido cerrado');
      return;
    }

    if (totalGastos === 0) {
      const confirmar = window.confirm(
        '¿Estás seguro de guardar con $0 en gastos?\n\nSi tienes gastos, ingrésalos antes de continuar.'
      );
      if (!confirmar) return;
    }

    setLoading(true);
    setError('');

    try {
      const datosCierre = {
        año: año,
        mes: mes + 1, // Guardar como 1-12
        mesNombre: nombresMeses[mes],
        ingresos: ingresosMes.total,
        cantidadPagos: ingresosMes.cantidad,
        gastos: {
          nomina: parseFloat(gastos.nomina) || 0,
          pagoTerapeutas: parseFloat(gastos.pagoTerapeutas) || 0,
          renta: parseFloat(gastos.renta) || 0,
          servicios: parseFloat(gastos.servicios) || 0,
          otros: parseFloat(gastos.otros) || 0
        },
        totalGastos: totalGastos,
        utilidad: utilidadNeta,
        notas: notasMes,
        fechaCierre: new Date().toISOString()
      };

      await onGuardar(datosCierre);
      setExito(true);
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.message || 'Error al guardar el cierre de mes');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito
  if (exito) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ¡Mes Cerrado Exitosamente!
          </h3>
          <p className="text-gray-600 mb-2">
            {nombresMeses[mes]} {año}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Utilidad registrada:</p>
            <p className={`text-2xl font-bold ${utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${utilidadNeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <Calculator size={28} />
            <div>
              <h3 className="text-xl font-bold">Cerrar Mes</h3>
              <p className="text-blue-100 text-sm">Calcula y registra la utilidad del mes</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Selector de Mes */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => cambiarMes('anterior')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="text-center min-w-[200px]">
              <h4 className="text-2xl font-bold text-gray-900">
                {nombresMeses[mes]} {año}
              </h4>
              {mesCerrado && (
                <span className="inline-flex items-center gap-1 text-sm text-amber-600 mt-1">
                  <AlertCircle size={14} />
                  Mes ya cerrado
                </span>
              )}
            </div>
            <button
              onClick={() => cambiarMes('siguiente')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* INGRESOS (Automático) */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={20} className="text-green-600" />
              <h4 className="font-semibold text-green-800">Ingresos del Mes</h4>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full ml-auto">
                Automático
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">
                  {ingresosMes.cantidad} pagos registrados
                </p>
                <p className="text-3xl font-bold text-green-700">
                  ${ingresosMes.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign size={40} className="text-green-300" />
            </div>
          </div>

          {/* GASTOS (Manual) */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={20} className="text-red-600" />
              <h4 className="font-semibold text-red-800">Gastos del Mes</h4>
              <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full ml-auto">
                Manual
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nómina */}
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">
                  Nómina (empleados fijos)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={gastos.nomina}
                    onChange={(e) => handleGastoChange('nomina', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                    placeholder="0.00"
                    disabled={mesCerrado}
                  />
                </div>
              </div>

              {/* Pago a Terapeutas */}
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">
                  Pago a Terapeutas
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={gastos.pagoTerapeutas}
                    onChange={(e) => handleGastoChange('pagoTerapeutas', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                    placeholder="0.00"
                    disabled={mesCerrado}
                  />
                </div>
              </div>

              {/* Renta */}
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">
                  Renta
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={gastos.renta}
                    onChange={(e) => handleGastoChange('renta', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                    placeholder="0.00"
                    disabled={mesCerrado}
                  />
                </div>
              </div>

              {/* Servicios */}
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">
                  Servicios (luz, internet, etc.)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={gastos.servicios}
                    onChange={(e) => handleGastoChange('servicios', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                    placeholder="0.00"
                    disabled={mesCerrado}
                  />
                </div>
              </div>

              {/* Otros */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-red-800 mb-1">
                  Otros gastos
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={gastos.otros}
                    onChange={(e) => handleGastoChange('otros', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                    placeholder="0.00"
                    disabled={mesCerrado}
                  />
                </div>
              </div>
            </div>

            {/* Total Gastos */}
            <div className="mt-4 pt-4 border-t border-red-200 flex items-center justify-between">
              <span className="font-medium text-red-800">Total Gastos:</span>
              <span className="text-2xl font-bold text-red-700">
                ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* UTILIDAD NETA */}
          <div className={`rounded-xl p-5 mb-6 ${
            utilidadNeta >= 0 
              ? 'bg-blue-50 border border-blue-200' 
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-semibold ${utilidadNeta >= 0 ? 'text-blue-800' : 'text-amber-800'}`}>
                  Utilidad Neta del Mes
                </h4>
                <p className={`text-sm ${utilidadNeta >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                  Ingresos - Gastos
                </p>
              </div>
              <p className={`text-3xl font-bold ${utilidadNeta >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                ${utilidadNeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Notas */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Notas del mes (opcional)
            </label>
            <textarea
              value={notasMes}
              onChange={(e) => setNotasMes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Ej: Mes de vacaciones, gastos extraordinarios, etc."
              disabled={mesCerrado}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onCerrar}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading || mesCerrado}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              mesCerrado
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Guardando...
              </>
            ) : mesCerrado ? (
              <>
                <CheckCircle size={20} />
                Mes Ya Cerrado
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar y Cerrar Mes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CerrarMes;
