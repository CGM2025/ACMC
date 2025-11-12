import { calcularCostoTotal } from './costoCalculations';

describe('calcularCostoTotal', () => {
  describe('Valid inputs', () => {
    test('correctly calculates costoTotal for valid horaInicio, horaFin, and costoPorHora', () => {
      // Test case 1: 2 hours duration, 300 per hour
      expect(calcularCostoTotal('08:00', '10:00', 300)).toBe(600);
      
      // Test case 2: 4 hours duration, 450 per hour
      expect(calcularCostoTotal('09:00', '13:00', 450)).toBe(1800);
      
      // Test case 3: 1 hour duration, 100 per hour
      expect(calcularCostoTotal('14:00', '15:00', 100)).toBe(100);
      
      // Test case 4: Full work day, 8 hours, 500 per hour
      expect(calcularCostoTotal('09:00', '17:00', 500)).toBe(4000);
    });

    test('correctly calculates costoTotal for fractional hour durations', () => {
      // Test case 1: 1.5 hours (90 minutes), 300 per hour
      expect(calcularCostoTotal('08:00', '09:30', 300)).toBe(450);
      
      // Test case 2: 2.5 hours (150 minutes), 400 per hour
      expect(calcularCostoTotal('10:00', '12:30', 400)).toBe(1000);
      
      // Test case 3: 0.5 hours (30 minutes), 600 per hour
      expect(calcularCostoTotal('14:00', '14:30', 600)).toBe(300);
      
      // Test case 4: 0.25 hours (15 minutes), 800 per hour
      expect(calcularCostoTotal('11:00', '11:15', 800)).toBe(200);
      
      // Test case 5: 3.75 hours (3 hours 45 minutes), 200 per hour
      expect(calcularCostoTotal('08:15', '12:00', 200)).toBe(750);
    });

    test('correctly calculates costoTotal when costoPorHora is zero', () => {
      // Test case 1: Any duration with 0 cost per hour should result in 0
      expect(calcularCostoTotal('08:00', '10:00', 0)).toBe(0);
      
      // Test case 2: Longer duration with 0 cost per hour
      expect(calcularCostoTotal('09:00', '17:00', 0)).toBe(0);
    });

    test('accepts costoPorHora as a string and converts it correctly', () => {
      // Test case 1: String number
      expect(calcularCostoTotal('08:00', '10:00', '300')).toBe(600);
      
      // Test case 2: String with decimal
      expect(calcularCostoTotal('09:00', '11:00', '450.50')).toBe(901);
    });
  });

  describe('Invalid inputs', () => {
    test('sets costoTotal to 0 when horaInicio is invalid', () => {
      // Test case 1: Empty string
      expect(calcularCostoTotal('', '10:00', 300)).toBe(0);
      
      // Test case 2: Null
      expect(calcularCostoTotal(null, '10:00', 300)).toBe(0);
      
      // Test case 3: Undefined
      expect(calcularCostoTotal(undefined, '10:00', 300)).toBe(0);
      
      // Test case 4: Invalid time format
      expect(calcularCostoTotal('invalid', '10:00', 300)).toBe(0);
      
      // Test case 5: Out of range hour
      expect(calcularCostoTotal('25:00', '10:00', 300)).toBe(0);
    });

    test('sets costoTotal to 0 when horaFin is invalid', () => {
      // Test case 1: Empty string
      expect(calcularCostoTotal('08:00', '', 300)).toBe(0);
      
      // Test case 2: Null
      expect(calcularCostoTotal('08:00', null, 300)).toBe(0);
      
      // Test case 3: Undefined
      expect(calcularCostoTotal('08:00', undefined, 300)).toBe(0);
      
      // Test case 4: Invalid time format
      expect(calcularCostoTotal('08:00', 'invalid', 300)).toBe(0);
      
      // Test case 5: Out of range hour
      expect(calcularCostoTotal('08:00', '25:00', 300)).toBe(0);
    });

    test('sets costoTotal to 0 when both horaInicio and horaFin are invalid', () => {
      expect(calcularCostoTotal('', '', 300)).toBe(0);
      expect(calcularCostoTotal(null, null, 300)).toBe(0);
      expect(calcularCostoTotal(undefined, undefined, 300)).toBe(0);
      expect(calcularCostoTotal('invalid', 'invalid', 300)).toBe(0);
    });

    test('sets costoTotal to 0 when costoPorHora is invalid', () => {
      // Test case 1: Null
      expect(calcularCostoTotal('08:00', '10:00', null)).toBe(0);
      
      // Test case 2: Undefined
      expect(calcularCostoTotal('08:00', '10:00', undefined)).toBe(0);
      
      // Test case 3: Non-numeric string
      expect(calcularCostoTotal('08:00', '10:00', 'invalid')).toBe(0);
    });

    test('sets costoTotal to 0 when all parameters are invalid', () => {
      expect(calcularCostoTotal('', '', null)).toBe(0);
      expect(calcularCostoTotal(null, null, undefined)).toBe(0);
      expect(calcularCostoTotal(undefined, undefined, 'invalid')).toBe(0);
    });
  });

  describe('Edge cases', () => {
    test('handles negative duration (end time before start time)', () => {
      // This results in negative hours, which gives a negative cost
      const result = calcularCostoTotal('17:00', '09:00', 300);
      expect(result).toBe(-2400); // -8 hours * 300
    });

    test('handles same start and end time', () => {
      expect(calcularCostoTotal('10:00', '10:00', 300)).toBe(0);
    });

    test('handles very large costoPorHora values', () => {
      expect(calcularCostoTotal('08:00', '10:00', 10000)).toBe(20000);
    });

    test('handles decimal costoPorHora values', () => {
      expect(calcularCostoTotal('08:00', '10:00', 299.99)).toBeCloseTo(599.98, 2);
      expect(calcularCostoTotal('09:00', '11:30', 450.75)).toBeCloseTo(1126.875, 2);
    });

    test('handles time with seconds (if provided)', () => {
      // Most time inputs ignore seconds, but ensure it doesn't break
      expect(calcularCostoTotal('08:00:00', '10:00:00', 300)).toBe(600);
    });
  });
});
