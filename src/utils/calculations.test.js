// __tests__/utils/calculations.test.js
import { calcularIVA, calcularMargenPorcentaje } from '../utils/calculations';

test('calcularIVA debe retornar 16% del monto', () => {
  expect(calcularIVA(100)).toBe(16);
  expect(calcularIVA(1000)).toBe(160);
});

test('calcularMargenPorcentaje debe calcular correctamente', () => {
  expect(calcularMargenPorcentaje(100, 80)).toBe(20);
  expect(calcularMargenPorcentaje(200, 150)).toBe(25);
});