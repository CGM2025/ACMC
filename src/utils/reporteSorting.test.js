import { ordenarCitasPorCampo, determinarNuevaDireccion } from './reporteSorting';

describe('ordenarCitasPorCampo', () => {
  describe('Sorting by numeric field in ascending order', () => {
    test('correctly sorts appointments by precio in ascending order', () => {
      const citas = [
        { fecha: '2025-01-15', precio: 500, duracion: 2, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-16', precio: 300, duracion: 1.5, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-17', precio: 450, duracion: 3, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'precio', 'asc');

      expect(resultado[0].precio).toBe(300);
      expect(resultado[1].precio).toBe(450);
      expect(resultado[2].precio).toBe(500);
    });

    test('correctly sorts appointments by duracion in ascending order', () => {
      const citas = [
        { fecha: '2025-01-15', precio: 500, duracion: 2, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-16', precio: 300, duracion: 1.5, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-17', precio: 450, duracion: 3, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'duracion', 'asc');

      expect(resultado[0].duracion).toBe(1.5);
      expect(resultado[1].duracion).toBe(2);
      expect(resultado[2].duracion).toBe(3);
    });

    test('correctly sorts appointments by total in ascending order', () => {
      const citas = [
        { fecha: '2025-01-15', total: 1000, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-16', total: 500, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-17', total: 750, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'total', 'asc');

      expect(resultado[0].total).toBe(500);
      expect(resultado[1].total).toBe(750);
      expect(resultado[2].total).toBe(1000);
    });

    test('correctly sorts appointments by iva in ascending order', () => {
      const citas = [
        { fecha: '2025-01-15', iva: 80, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-16', iva: 48, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-17', iva: 72, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'iva', 'asc');

      expect(resultado[0].iva).toBe(48);
      expect(resultado[1].iva).toBe(72);
      expect(resultado[2].iva).toBe(80);
    });

    test('correctly sorts appointments by costoTerapeuta in ascending order, handling missing values', () => {
      const citas = [
        { fecha: '2025-01-15', costoTerapeuta: 400, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-16', tipoTerapia: 'Mental', terapeuta: 'Juan' }, // sin costoTerapeuta
        { fecha: '2025-01-17', costoTerapeuta: 300, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'costoTerapeuta', 'asc');

      expect(resultado[0].costoTerapeuta || 0).toBe(0);
      expect(resultado[1].costoTerapeuta).toBe(300);
      expect(resultado[2].costoTerapeuta).toBe(400);
    });
  });

  describe('Sorting by numeric field in descending order', () => {
    test('correctly sorts appointments by precio in descending order', () => {
      const citas = [
        { fecha: '2025-01-15', precio: 300, duracion: 1.5, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-16', precio: 500, duracion: 2, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-17', precio: 450, duracion: 3, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'precio', 'desc');

      expect(resultado[0].precio).toBe(500);
      expect(resultado[1].precio).toBe(450);
      expect(resultado[2].precio).toBe(300);
    });

    test('correctly sorts appointments by duracion in descending order', () => {
      const citas = [
        { fecha: '2025-01-15', precio: 500, duracion: 2, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-16', precio: 300, duracion: 1.5, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-17', precio: 450, duracion: 3, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'duracion', 'desc');

      expect(resultado[0].duracion).toBe(3);
      expect(resultado[1].duracion).toBe(2);
      expect(resultado[2].duracion).toBe(1.5);
    });

    test('correctly sorts appointments by total in descending order', () => {
      const citas = [
        { fecha: '2025-01-15', total: 500, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-16', total: 1000, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-17', total: 750, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'total', 'desc');

      expect(resultado[0].total).toBe(1000);
      expect(resultado[1].total).toBe(750);
      expect(resultado[2].total).toBe(500);
    });
  });

  describe('Sorting by date field in ascending order', () => {
    test('correctly sorts appointments by fecha in ascending order', () => {
      const citas = [
        { fecha: '2025-01-20', precio: 300, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-15', precio: 500, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-18', precio: 450, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'fecha', 'asc');

      expect(resultado[0].fecha).toBe('2025-01-15');
      expect(resultado[1].fecha).toBe('2025-01-18');
      expect(resultado[2].fecha).toBe('2025-01-20');
    });

    test('correctly sorts appointments by fecha in descending order', () => {
      const citas = [
        { fecha: '2025-01-15', precio: 500, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-20', precio: 300, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-18', precio: 450, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'fecha', 'desc');

      expect(resultado[0].fecha).toBe('2025-01-20');
      expect(resultado[1].fecha).toBe('2025-01-18');
      expect(resultado[2].fecha).toBe('2025-01-15');
    });

    test('correctly handles dates from different months', () => {
      const citas = [
        { fecha: '2025-03-15', precio: 300, tipoTerapia: 'Mental', terapeuta: 'Juan' },
        { fecha: '2025-01-15', precio: 500, tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-02-15', precio: 450, tipoTerapia: 'Física', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'fecha', 'asc');

      expect(resultado[0].fecha).toBe('2025-01-15');
      expect(resultado[1].fecha).toBe('2025-02-15');
      expect(resultado[2].fecha).toBe('2025-03-15');
    });
  });

  describe('Sorting by string field in ascending order', () => {
    test('correctly sorts appointments by tipoTerapia in ascending order', () => {
      const citas = [
        { fecha: '2025-01-15', tipoTerapia: 'Ocupacional', terapeuta: 'Pedro' },
        { fecha: '2025-01-16', tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-17', tipoTerapia: 'Mental', terapeuta: 'Juan' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'tipoTerapia', 'asc');

      expect(resultado[0].tipoTerapia).toBe('Física');
      expect(resultado[1].tipoTerapia).toBe('Mental');
      expect(resultado[2].tipoTerapia).toBe('Ocupacional');
    });

    test('correctly sorts appointments by terapeuta in ascending order', () => {
      const citas = [
        { fecha: '2025-01-15', tipoTerapia: 'Física', terapeuta: 'María' },
        { fecha: '2025-01-16', tipoTerapia: 'Mental', terapeuta: 'Ana' },
        { fecha: '2025-01-17', tipoTerapia: 'Física', terapeuta: 'Juan' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'terapeuta', 'asc');

      expect(resultado[0].terapeuta).toBe('Ana');
      expect(resultado[1].terapeuta).toBe('Juan');
      expect(resultado[2].terapeuta).toBe('María');
    });

    test('correctly sorts appointments by tipoTerapia in descending order', () => {
      const citas = [
        { fecha: '2025-01-15', tipoTerapia: 'Física', terapeuta: 'Ana' },
        { fecha: '2025-01-16', tipoTerapia: 'Ocupacional', terapeuta: 'Pedro' },
        { fecha: '2025-01-17', tipoTerapia: 'Mental', terapeuta: 'Juan' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'tipoTerapia', 'desc');

      expect(resultado[0].tipoTerapia).toBe('Ocupacional');
      expect(resultado[1].tipoTerapia).toBe('Mental');
      expect(resultado[2].tipoTerapia).toBe('Física');
    });

    test('handles case-insensitive sorting for string fields', () => {
      const citas = [
        { fecha: '2025-01-15', tipoTerapia: 'mental', terapeuta: 'Ana' },
        { fecha: '2025-01-16', tipoTerapia: 'FÍSICA', terapeuta: 'Juan' },
        { fecha: '2025-01-17', tipoTerapia: 'Ocupacional', terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'tipoTerapia', 'asc');

      expect(resultado[0].tipoTerapia).toBe('FÍSICA');
      expect(resultado[1].tipoTerapia).toBe('mental');
      expect(resultado[2].tipoTerapia).toBe('Ocupacional');
    });
  });

  describe('Edge cases', () => {
    test('returns empty array when citas is empty', () => {
      const resultado = ordenarCitasPorCampo([], 'precio', 'asc');
      expect(resultado).toEqual([]);
    });

    test('returns undefined when citas is null', () => {
      const resultado = ordenarCitasPorCampo(null, 'precio', 'asc');
      expect(resultado).toBeNull();
    });

    test('returns undefined when citas is undefined', () => {
      const resultado = ordenarCitasPorCampo(undefined, 'precio', 'asc');
      expect(resultado).toBeUndefined();
    });

    test('returns same array when only one appointment exists', () => {
      const citas = [
        { fecha: '2025-01-15', precio: 500, tipoTerapia: 'Física', terapeuta: 'Ana' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'precio', 'asc');

      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toEqual(citas[0]);
    });

    test('does not mutate original array', () => {
      const citas = [
        { fecha: '2025-01-15', precio: 500 },
        { fecha: '2025-01-16', precio: 300 },
      ];

      const citasOriginal = [...citas];
      ordenarCitasPorCampo(citas, 'precio', 'asc');

      expect(citas).toEqual(citasOriginal);
    });

    test('handles equal values correctly', () => {
      const citas = [
        { fecha: '2025-01-15', precio: 500, terapeuta: 'Ana' },
        { fecha: '2025-01-16', precio: 500, terapeuta: 'Juan' },
        { fecha: '2025-01-17', precio: 500, terapeuta: 'María' },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'precio', 'asc');

      expect(resultado.every(c => c.precio === 500)).toBe(true);
      expect(resultado).toHaveLength(3);
    });

    test('returns 0 for unknown campo', () => {
      const citas = [
        { fecha: '2025-01-15', precio: 500 },
        { fecha: '2025-01-16', precio: 300 },
      ];

      const resultado = ordenarCitasPorCampo(citas, 'campoInexistente', 'asc');

      // The order should remain unchanged since default case returns 0
      expect(resultado).toHaveLength(2);
    });
  });
});

describe('determinarNuevaDireccion', () => {
  test('toggles from asc to desc when clicking the same column', () => {
    const resultado = determinarNuevaDireccion('precio', 'asc', 'precio');
    expect(resultado).toBe('desc');
  });

  test('stays asc when clicking the same column that was already desc', () => {
    const resultado = determinarNuevaDireccion('precio', 'desc', 'precio');
    expect(resultado).toBe('asc');
  });

  test('resets to asc when clicking a different column', () => {
    const resultado = determinarNuevaDireccion('precio', 'asc', 'duracion');
    expect(resultado).toBe('asc');
  });

  test('resets to asc when clicking a different column from desc', () => {
    const resultado = determinarNuevaDireccion('precio', 'desc', 'fecha');
    expect(resultado).toBe('asc');
  });

  test('handles initial state correctly', () => {
    const resultado = determinarNuevaDireccion('', '', 'precio');
    expect(resultado).toBe('asc');
  });
});
