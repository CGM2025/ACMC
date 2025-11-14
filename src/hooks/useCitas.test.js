import { renderHook, act, waitFor } from '@testing-library/react';
import { useCitas } from './useCitas';
import { doc, updateDoc, writeBatch, collection } from 'firebase/firestore';
import mammoth from 'mammoth';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
  collection: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: {},
}));

// Mock mammoth
jest.mock('mammoth', () => ({
  convertToHtml: jest.fn(),
}));

describe('useCitas Hook', () => {
  // Mock data
  const mockCitas = [
    {
      id: '1',
      terapeuta: 'Ana García',
      cliente: 'Juan Pérez',
      fecha: '2024-01-15',
      horaInicio: '09:00',
      horaFin: '11:00',
      estado: 'completada',
      tipoTerapia: 'Sesión de ABA estándar',
      costoPorHora: 450,
      costoTotal: 900,
      costoTerapeuta: 200,
      costoTerapeutaTotal: 400,
    },
    {
      id: '2',
      terapeuta: 'María López',
      cliente: 'Eva Ferreira',
      fecha: '2024-01-16',
      horaInicio: '10:00',
      horaFin: '12:30',
      estado: 'pendiente',
      tipoTerapia: 'Terapia Ocupacional',
      costoPorHora: 950,
      costoTotal: 2375,
      costoTerapeuta: 300,
      costoTerapeutaTotal: 750,
    },
    {
      id: '3',
      terapeuta: 'Ana García',
      cliente: 'Eva Ferreira',
      fecha: '2024-01-20',
      horaInicio: '14:00',
      horaFin: '16:00',
      estado: 'completada',
      tipoTerapia: 'Sesión de ABA estándar',
      costoPorHora: 757,
      costoTotal: 1514,
      costoTerapeuta: 250,
      costoTerapeutaTotal: 500,
    },
    {
      id: '4',
      terapeuta: 'María López',
      cliente: 'Juan Pérez',
      fecha: '2024-02-01',
      horaInicio: '08:00',
      horaFin: '09:30',
      estado: 'completada',
      tipoTerapia: 'Sesión de ABA estándar',
      costoPorHora: 450,
      costoTotal: 675,
      costoTerapeuta: 200,
      costoTerapeutaTotal: 300,
    },
  ];

  const mockTerapeutas = [
    {
      id: 't1',
      nombre: 'Ana García',
      costosPorServicio: { 'Sesión de ABA estándar': 200 },
      costosPorCliente: {},
    },
    {
      id: 't2',
      nombre: 'María López',
      costosPorServicio: { 'Terapia Ocupacional': 300 },
      costosPorCliente: { 'c1': 250 },
    },
  ];

  const mockClientes = [
    {
      id: 'c1',
      nombre: 'Juan Pérez',
      preciosPersonalizados: { 'Sesión de ABA estándar': 450 },
    },
    {
      id: 'c2',
      nombre: 'Eva Ferreira',
      preciosPersonalizados: { 
        'Sesión de ABA estándar': 757,
        'Servicios de Sombra': 265,
      },
    },
  ];

  const mockCargarCitas = jest.fn();
  const mockPreciosBasePorTerapia = {
    'Sesión de ABA estándar': 450,
    'Terapia Ocupacional': 950,
    'Servicios de Sombra': 150,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
    updateDoc.mockResolvedValue({});
    const mockBatch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue({}),
    };
    writeBatch.mockReturnValue(mockBatch);
    collection.mockReturnValue({ path: 'citas' });
    doc.mockReturnValue({ id: 'mockDocId' });
    
    // Mock alert
    global.alert = jest.fn();
  });

  describe('filtrarCitas', () => {
    test('should return all citas when no filters are applied', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(4);
      expect(filtered).toEqual(mockCitas);
    });

    test('should correctly filter by search term (terapeuta)', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setSearchTerm('Ana García');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.terapeuta === 'Ana García')).toBe(true);
    });

    test('should correctly filter by search term (cliente)', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setSearchTerm('juan pérez');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.cliente === 'Juan Pérez')).toBe(true);
    });

    test('should correctly filter by search term (fecha)', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setSearchTerm('2024-01-16');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].fecha).toBe('2024-01-16');
    });

    test('should correctly filter by estado', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setFilterEstado('completada');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(3);
      expect(filtered.every(c => c.estado === 'completada')).toBe(true);
    });

    test('should correctly filter by terapeuta', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setFilterTerapeuta('María López');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.terapeuta === 'María López')).toBe(true);
    });

    test('should correctly filter by date range (fechaInicio)', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setFilterFechaInicio('2024-01-20');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.fecha >= '2024-01-20')).toBe(true);
    });

    test('should correctly filter by date range (fechaFin)', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setFilterFechaFin('2024-01-20');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(3);
      expect(filtered.every(c => c.fecha <= '2024-01-20')).toBe(true);
    });

    test('should correctly filter by date range (both fechaInicio and fechaFin)', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setFilterFechaInicio('2024-01-16');
        result.current.setFilterFechaFin('2024-01-20');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.fecha >= '2024-01-16' && c.fecha <= '2024-01-20')).toBe(true);
    });

    test('should correctly apply multiple filters simultaneously', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setSearchTerm('García');
        result.current.setFilterEstado('completada');
        result.current.setFilterFechaInicio('2024-01-15');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => 
        c.terapeuta.includes('García') && 
        c.estado === 'completada' && 
        c.fecha >= '2024-01-15'
      )).toBe(true);
    });

    test('should return empty array when no citas match filters', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setSearchTerm('Nonexistent Name');
      });

      const filtered = result.current.filtrarCitas();
      expect(filtered).toHaveLength(0);
    });
  });

  describe('generarCitas', () => {
    test('should accurately generate recurring appointments for single schedule', () => {
      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      // 2024-01-07 (Sun) to 2024-01-13 (Sat), Wed=1/10, Fri=1/12 (days 3 and 5)
      act(() => {
        result.current.setFechaInicio('2024-01-07');
        result.current.setFechaFin('2024-01-13');
        result.current.setHorarios([
          {
            id: 1,
            terapeuta: 'Ana García',
            cliente: 'Juan Pérez',
            diasSemana: [3, 5], // Wed (1/10), Fri (1/12)
            horaInicio: '09:00',
            horaFin: '11:00',
          }
        ]);
      });

      act(() => {
        result.current.generarCitas();
      });

      const citas = result.current.citasGeneradas;
      expect(citas).toHaveLength(2); // Wed, Fri
      // Check that we have the right days
      const fechas = citas.map(c => c.fecha).sort();
      expect(fechas).toEqual(['2024-01-10', '2024-01-12']); // Wednesday and Friday
      expect(citas.every(c => c.terapeuta === 'Ana García')).toBe(true);
      expect(citas.every(c => c.cliente === 'Juan Pérez')).toBe(true);
    });

    test('should correctly calculate cost based on duration and client pricing', () => {
      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      // 2024-01-10 is Wednesday (day 3)
      act(() => {
        result.current.setFechaInicio('2024-01-10');
        result.current.setFechaFin('2024-01-10');
        result.current.setHorarios([
          {
            id: 1,
            terapeuta: 'Ana García',
            cliente: 'Juan Pérez',
            diasSemana: [3], // Wednesday
            horaInicio: '09:00',
            horaFin: '11:30', // 2.5 hours
          }
        ]);
      });

      act(() => {
        result.current.generarCitas();
      });

      const citas = result.current.citasGeneradas;
      expect(citas).toHaveLength(1);
      expect(citas[0].costoPorHora).toBe(450); // Juan Pérez's personalized price
      expect(citas[0].costoTotal).toBe(1125); // 450 * 2.5 hours
    });

    test('should use base price when client has no personalized pricing', () => {
      const clienteSinPrecios = [
        {
          id: 'c3',
          nombre: 'Nuevo Cliente',
          preciosPersonalizados: {},
        }
      ];

      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, clienteSinPrecios, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      // 2024-01-10 is Wednesday (day 3)
      act(() => {
        result.current.setFechaInicio('2024-01-10');
        result.current.setFechaFin('2024-01-10');
        result.current.setHorarios([
          {
            id: 1,
            terapeuta: 'Ana García',
            cliente: 'Nuevo Cliente',
            diasSemana: [3], // Wednesday
            horaInicio: '09:00',
            horaFin: '10:00',
          }
        ]);
      });

      act(() => {
        result.current.generarCitas();
      });

      const citas = result.current.citasGeneradas;
      expect(citas).toHaveLength(1);
      expect(citas[0].costoPorHora).toBe(450); // Base price for 'Sesión de ABA estándar'
      expect(citas[0].costoTotal).toBe(450);
    });

    test('should correctly calculate therapist costs per client', () => {
      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      // 2024-01-10 is Wednesday (day 3)
      act(() => {
        result.current.setFechaInicio('2024-01-10');
        result.current.setFechaFin('2024-01-10');
        result.current.setHorarios([
          {
            id: 1,
            terapeuta: 'María López',
            cliente: 'Juan Pérez', // Has specific cost for this client (250)
            diasSemana: [3],
            horaInicio: '09:00',
            horaFin: '11:00', // 2 hours
          }
        ]);
      });

      act(() => {
        result.current.generarCitas();
      });

      const citas = result.current.citasGeneradas;
      expect(citas).toHaveLength(1);
      expect(citas[0].costoTerapeuta).toBe(250); // Specific cost for Juan Pérez
      expect(citas[0].costoTerapeutaTotal).toBe(500); // 250 * 2 hours
    });

    test('should correctly calculate therapist costs by service type', () => {
      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      // 2024-01-10 is Wednesday (day 3)
      act(() => {
        result.current.setFechaInicio('2024-01-10');
        result.current.setFechaFin('2024-01-10');
        result.current.setHorarios([
          {
            id: 1,
            terapeuta: 'Ana García',
            cliente: 'Eva Ferreira', // No specific client cost, use service cost
            diasSemana: [3],
            horaInicio: '09:00',
            horaFin: '12:00', // 3 hours
          }
        ]);
      });

      act(() => {
        result.current.generarCitas();
      });

      const citas = result.current.citasGeneradas;
      expect(citas).toHaveLength(1);
      expect(citas[0].costoTerapeuta).toBe(200); // Service cost for 'Sesión de ABA estándar'
      expect(citas[0].costoTerapeutaTotal).toBe(600); // 200 * 3 hours
    });

    test('should generate appointments for multiple schedules', () => {
      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      // 2024-01-07 (Sun) to 2024-01-13 (Sat)
      act(() => {
        result.current.setFechaInicio('2024-01-07');
        result.current.setFechaFin('2024-01-13');
        result.current.setHorarios([
          {
            id: 1,
            terapeuta: 'Ana García',
            cliente: 'Juan Pérez',
            diasSemana: [1, 3], // Mon (1/8), Wed (1/10)
            horaInicio: '09:00',
            horaFin: '11:00',
          },
          {
            id: 2,
            terapeuta: 'María López',
            cliente: 'Eva Ferreira',
            diasSemana: [2, 5], // Tue (1/9), Fri (1/12)
            horaInicio: '14:00',
            horaFin: '16:00',
          }
        ]);
      });

      act(() => {
        result.current.generarCitas();
      });

      const citas = result.current.citasGeneradas;
      expect(citas).toHaveLength(4); // 2 for each schedule
      
      const citasAna = citas.filter(c => c.terapeuta === 'Ana García');
      const citasMaria = citas.filter(c => c.terapeuta === 'María López');
      
      expect(citasAna).toHaveLength(2);
      expect(citasMaria).toHaveLength(2);
    });

    test('should not generate citas when dates are not set', () => {
      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setHorarios([
          {
            id: 1,
            terapeuta: 'Ana García',
            cliente: 'Juan Pérez',
            diasSemana: [1],
            horaInicio: '09:00',
            horaFin: '11:00',
          }
        ]);
      });

      act(() => {
        result.current.generarCitas();
      });

      expect(global.alert).toHaveBeenCalledWith('⚠️ Completa las fechas y agrega al menos un horario');
      expect(result.current.citasGeneradas).toHaveLength(0);
    });

    test('should not generate citas when horarios array is empty', () => {
      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      act(() => {
        result.current.setFechaInicio('2024-01-15');
        result.current.setFechaFin('2024-01-19');
      });

      act(() => {
        result.current.generarCitas();
      });

      expect(global.alert).toHaveBeenCalledWith('⚠️ Completa las fechas y agrega al menos un horario');
      expect(result.current.citasGeneradas).toHaveLength(0);
    });

    test('should skip schedule when client or therapist is not found', () => {
      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      // 2024-01-10 is Wednesday (day 3)
      act(() => {
        result.current.setFechaInicio('2024-01-10');
        result.current.setFechaFin('2024-01-10');
        result.current.setHorarios([
          {
            id: 1,
            terapeuta: 'Nonexistent Therapist',
            cliente: 'Juan Pérez',
            diasSemana: [3],
            horaInicio: '09:00',
            horaFin: '11:00',
          },
          {
            id: 2,
            terapeuta: 'Ana García',
            cliente: 'Nonexistent Client',
            diasSemana: [3],
            horaInicio: '09:00',
            horaFin: '11:00',
          }
        ]);
      });

      act(() => {
        result.current.generarCitas();
      });

      const citas = result.current.citasGeneradas;
      expect(citas).toHaveLength(0);
    });
  });

  describe('importarDesdeWord', () => {
    test('should correctly parse Word document and extract appointment data', async () => {
      const mockHtml = `
        <table>
          <tr><th>Fecha</th><th>Cliente</th><th>Terapeuta</th><th>Inicio</th><th>Fin</th><th>Tipo</th></tr>
          <tr>
            <td>2024-01-15</td>
            <td>Juan Pérez</td>
            <td>Ana García</td>
            <td>09:00</td>
            <td>11:00</td>
            <td>Sesión de ABA estándar</td>
          </tr>
        </table>
      `;

      mammoth.convertToHtml.mockResolvedValue({ value: mockHtml });

      const mockFile = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));

      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      await act(async () => {
        await result.current.importarDesdeWord(mockFile);
      });

      await waitFor(() => {
        expect(mockCargarCitas).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith('✅ 1 citas importadas correctamente');
      });
    });

    test('should handle missing tipo terapia with default value', async () => {
      const mockHtml = `
        <table>
          <tr><th>Fecha</th><th>Cliente</th><th>Terapeuta</th><th>Inicio</th><th>Fin</th><th>Tipo</th></tr>
          <tr>
            <td>2024-01-15</td>
            <td>Juan Pérez</td>
            <td>Ana García</td>
            <td>09:00</td>
            <td>11:00</td>
            <td></td>
          </tr>
        </table>
      `;

      mammoth.convertToHtml.mockResolvedValue({ value: mockHtml });

      const mockFile = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));

      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      await act(async () => {
        await result.current.importarDesdeWord(mockFile);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('✅ 1 citas importadas correctamente');
      });
    });

    test('should skip rows with missing required information', async () => {
      const mockHtml = `
        <table>
          <tr><th>Fecha</th><th>Cliente</th><th>Terapeuta</th><th>Inicio</th><th>Fin</th><th>Tipo</th></tr>
          <tr>
            <td>2024-01-15</td>
            <td>Juan Pérez</td>
            <td>Ana García</td>
            <td>09:00</td>
            <td>11:00</td>
            <td>Sesión de ABA estándar</td>
          </tr>
          <tr>
            <td></td>
            <td>Eva Ferreira</td>
            <td>María López</td>
            <td>10:00</td>
            <td>12:00</td>
            <td>Terapia Ocupacional</td>
          </tr>
          <tr>
            <td>2024-01-16</td>
            <td></td>
            <td>María López</td>
            <td>10:00</td>
            <td>12:00</td>
            <td>Terapia Ocupacional</td>
          </tr>
        </table>
      `;

      mammoth.convertToHtml.mockResolvedValue({ value: mockHtml });

      const mockFile = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));

      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      await act(async () => {
        await result.current.importarDesdeWord(mockFile);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('✅ 1 citas importadas correctamente');
      });
    });

    test('should skip rows with nonexistent client or therapist', async () => {
      const mockHtml = `
        <table>
          <tr><th>Fecha</th><th>Cliente</th><th>Terapeuta</th><th>Inicio</th><th>Fin</th><th>Tipo</th></tr>
          <tr>
            <td>2024-01-15</td>
            <td>Juan Pérez</td>
            <td>Ana García</td>
            <td>09:00</td>
            <td>11:00</td>
            <td>Sesión de ABA estándar</td>
          </tr>
          <tr>
            <td>2024-01-16</td>
            <td>Nonexistent Client</td>
            <td>Ana García</td>
            <td>10:00</td>
            <td>12:00</td>
            <td>Sesión de ABA estándar</td>
          </tr>
        </table>
      `;

      mammoth.convertToHtml.mockResolvedValue({ value: mockHtml });

      const mockFile = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      await act(async () => {
        await result.current.importarDesdeWord(mockFile);
      });

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Cliente o terapeuta no encontrado'));
        expect(global.alert).toHaveBeenCalledWith('✅ 1 citas importadas correctamente');
      });

      consoleWarnSpy.mockRestore();
    });

    test('should show error when no table found in document', async () => {
      const mockHtml = '<p>No table here</p>';

      mammoth.convertToHtml.mockResolvedValue({ value: mockHtml });

      const mockFile = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));

      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      await act(async () => {
        await result.current.importarDesdeWord(mockFile);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('❌ No se encontró una tabla en el documento');
      });
    });

    test('should show error when no valid appointments found', async () => {
      const mockHtml = `
        <table>
          <tr><th>Fecha</th><th>Cliente</th><th>Terapeuta</th><th>Inicio</th><th>Fin</th><th>Tipo</th></tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </table>
      `;

      mammoth.convertToHtml.mockResolvedValue({ value: mockHtml });

      const mockFile = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));

      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      await act(async () => {
        await result.current.importarDesdeWord(mockFile);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('⚠️ No se encontraron citas válidas en el documento');
      });
    });

    test('should handle errors during import gracefully', async () => {
      mammoth.convertToHtml.mockRejectedValue(new Error('Failed to parse document'));

      const mockFile = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => 
        useCitas([], mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      await act(async () => {
        await result.current.importarDesdeWord(mockFile);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('❌ Error al importar el archivo'));
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleDrop', () => {
    test('should successfully update appointment date when dragged', async () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const mockEvent = {
        preventDefault: jest.fn(),
      };

      const citaToDrag = mockCitas[0];
      const newDate = new Date('2024-01-20');

      // Simulate drag start
      act(() => {
        result.current.handleDragStart({ dataTransfer: { effectAllowed: '' } }, citaToDrag);
      });

      // Simulate drop
      await act(async () => {
        await result.current.handleDrop(mockEvent, newDate);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { fecha: '2024-01-20' }
      );
      expect(mockCargarCitas).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('✅ Cita movida al 2024-01-20');
    });

    test('should not update when dropped on same date', async () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const mockEvent = {
        preventDefault: jest.fn(),
      };

      const citaToDrag = mockCitas[0];
      const sameDate = new Date('2024-01-15'); // Same as citaToDrag.fecha

      // Simulate drag start
      act(() => {
        result.current.handleDragStart({ dataTransfer: { effectAllowed: '' } }, citaToDrag);
      });

      // Simulate drop
      await act(async () => {
        await result.current.handleDrop(mockEvent, sameDate);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
      expect(mockCargarCitas).not.toHaveBeenCalled();
    });

    test('should not update when no cita is being dragged', async () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const mockEvent = {
        preventDefault: jest.fn(),
      };

      const newDate = new Date('2024-01-20');

      // Simulate drop without drag start
      await act(async () => {
        await result.current.handleDrop(mockEvent, newDate);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
      expect(mockCargarCitas).not.toHaveBeenCalled();
    });

    test('should handle database update errors gracefully', async () => {
      updateDoc.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const mockEvent = {
        preventDefault: jest.fn(),
      };

      const citaToDrag = mockCitas[0];
      const newDate = new Date('2024-01-20');

      // Simulate drag start
      act(() => {
        result.current.handleDragStart({ dataTransfer: { effectAllowed: '' } }, citaToDrag);
      });

      // Simulate drop
      await act(async () => {
        await result.current.handleDrop(mockEvent, newDate);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al mover cita:', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('❌ Error al mover la cita');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('calcularHorasDesdeCitas', () => {
    test('should accurately sum total hours for completed appointments', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const horasPorTerapeuta = result.current.calcularHorasDesdeCitas();

      expect(horasPorTerapeuta).toEqual({
        'Ana García': 4, // 2 hours + 2 hours from completed appointments
        'María López': 1.5, // 1.5 hours from completed appointment
      });
    });

    test('should group hours by therapist correctly', () => {
      const { result } = renderHook(() => 
        useCitas(mockCitas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const horasPorTerapeuta = result.current.calcularHorasDesdeCitas();

      expect(Object.keys(horasPorTerapeuta)).toHaveLength(2);
      expect(horasPorTerapeuta).toHaveProperty('Ana García');
      expect(horasPorTerapeuta).toHaveProperty('María López');
    });

    test('should only include completed appointments', () => {
      const citasConPendientes = [
        ...mockCitas,
        {
          id: '5',
          terapeuta: 'Ana García',
          cliente: 'Juan Pérez',
          fecha: '2024-02-05',
          horaInicio: '10:00',
          horaFin: '15:00',
          estado: 'pendiente', // Not completed
        },
      ];

      const { result } = renderHook(() => 
        useCitas(citasConPendientes, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const horasPorTerapeuta = result.current.calcularHorasDesdeCitas();

      // Should still be 4 hours for Ana García (not including the 5-hour pending appointment)
      expect(horasPorTerapeuta['Ana García']).toBe(4);
    });

    test('should return empty object when no completed appointments exist', () => {
      const citasPendientes = mockCitas.map(c => ({ ...c, estado: 'pendiente' }));

      const { result } = renderHook(() => 
        useCitas(citasPendientes, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const horasPorTerapeuta = result.current.calcularHorasDesdeCitas();

      expect(horasPorTerapeuta).toEqual({});
    });

    test('should correctly calculate fractional hours', () => {
      const citasConFracciones = [
        {
          id: '1',
          terapeuta: 'Ana García',
          cliente: 'Juan Pérez',
          fecha: '2024-01-15',
          horaInicio: '09:00',
          horaFin: '09:30', // 0.5 hours
          estado: 'completada',
        },
        {
          id: '2',
          terapeuta: 'Ana García',
          cliente: 'Juan Pérez',
          fecha: '2024-01-16',
          horaInicio: '10:00',
          horaFin: '10:45', // 0.75 hours
          estado: 'completada',
        },
      ];

      const { result } = renderHook(() => 
        useCitas(citasConFracciones, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const horasPorTerapeuta = result.current.calcularHorasDesdeCitas();

      expect(horasPorTerapeuta['Ana García']).toBeCloseTo(1.25, 2);
    });

    test('should handle multiple therapists with different hour totals', () => {
      const citasMultiplesTerapeutas = [
        {
          id: '1',
          terapeuta: 'Ana García',
          cliente: 'Juan Pérez',
          fecha: '2024-01-15',
          horaInicio: '09:00',
          horaFin: '11:00',
          estado: 'completada',
        },
        {
          id: '2',
          terapeuta: 'María López',
          cliente: 'Eva Ferreira',
          fecha: '2024-01-16',
          horaInicio: '10:00',
          horaFin: '14:00',
          estado: 'completada',
        },
        {
          id: '3',
          terapeuta: 'Ana García',
          cliente: 'Eva Ferreira',
          fecha: '2024-01-17',
          horaInicio: '08:00',
          horaFin: '09:00',
          estado: 'completada',
        },
      ];

      const { result } = renderHook(() => 
        useCitas(citasMultiplesTerapeutas, mockTerapeutas, mockClientes, mockCargarCitas, mockPreciosBasePorTerapia)
      );

      const horasPorTerapeuta = result.current.calcularHorasDesdeCitas();

      expect(horasPorTerapeuta['Ana García']).toBe(3); // 2 + 1
      expect(horasPorTerapeuta['María López']).toBe(4);
    });
  });
});
