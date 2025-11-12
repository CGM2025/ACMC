# Utility Functions and Tests

## costoCalculations.js

This module contains utility functions for calculating costs in the appointment system.

### `calcularCostoTotal(horaInicio, horaFin, costoPorHora)`

Calculates the total cost based on start time, end time, and cost per hour.

**Parameters:**
- `horaInicio` (string): Start time in "HH:MM" format
- `horaFin` (string): End time in "HH:MM" format
- `costoPorHora` (number|string): Cost per hour

**Returns:**
- `number`: Total calculated cost (returns 0 if parameters are invalid)

**Example:**
```javascript
import { calcularCostoTotal } from './utils/costoCalculations';

const total = calcularCostoTotal('08:00', '10:00', 300);
console.log(total); // 600
```

## Unit Tests

The test suite (`costoCalculations.test.js`) covers the following scenarios:

### 1. Valid Inputs - Correct Calculation
✅ Tests that `costoTotal` is correctly calculated for valid `horaInicio`, `horaFin`, and `costoPorHora` inputs:
- 2 hours × 300/hour = 600
- 4 hours × 450/hour = 1800
- 1 hour × 100/hour = 100
- 8 hours × 500/hour = 4000

### 2. Invalid Inputs - Zero Cost
✅ Tests that `costoTotal` is set to 0 when `horaInicio` or `horaFin` are invalid:
- Empty strings
- Null values
- Undefined values
- Invalid time formats (e.g., "invalid")
- Out of range hours (e.g., "25:00")

### 3. Fractional Hour Durations
✅ Tests that `costoTotal` is calculated correctly for fractional hour durations:
- 1.5 hours × 300/hour = 450
- 2.5 hours × 400/hour = 1000
- 0.5 hours × 600/hour = 300
- 0.25 hours × 800/hour = 200
- 3.75 hours × 200/hour = 750

### 4. Zero Cost Per Hour
✅ Tests that `costoTotal` is calculated correctly when `costoPorHora` is zero:
- Any duration × 0/hour = 0

### Additional Edge Cases Covered:
- String to number conversion for `costoPorHora`
- Negative duration (end time before start time)
- Same start and end time (zero duration)
- Very large cost values
- Decimal cost values
- Time with seconds format

## Running the Tests

To run all tests:
```bash
npm test
```

To run only the costoCalculations tests:
```bash
npm test -- src/utils/costoCalculations.test.js
```

## Test Results

All 14 tests pass successfully:
- ✅ Valid inputs (4 tests)
- ✅ Invalid inputs (5 tests)
- ✅ Edge cases (5 tests)
