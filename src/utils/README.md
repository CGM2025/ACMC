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

## reporteSorting.js

This module contains utility functions for sorting appointments in reports.

### `ordenarCitasPorCampo(citas, campo, direccion)`

Sorts appointments by a specified field in ascending or descending order.

**Parameters:**
- `citas` (Array): Array of appointments to sort
- `campo` (string): Field to sort by ('fecha', 'duracion', 'tipoTerapia', 'terapeuta', 'precio', 'iva', 'total', 'costoTerapeuta')
- `direccion` (string): Sort direction ('asc' or 'desc'). Default is 'asc'

**Returns:**
- `Array`: Sorted array of appointments (does not mutate original array)

**Example:**
```javascript
import { ordenarCitasPorCampo } from './utils/reporteSorting';

const citas = [
  { fecha: '2025-01-20', precio: 300 },
  { fecha: '2025-01-15', precio: 500 },
];

const citasOrdenadas = ordenarCitasPorCampo(citas, 'fecha', 'asc');
// Returns: [{ fecha: '2025-01-15', ... }, { fecha: '2025-01-20', ... }]
```

### `determinarNuevaDireccion(campoActual, direccionActual, nuevoCampo)`

Determines the new sort direction when a column is clicked.

**Parameters:**
- `campoActual` (string): Current sorted field
- `direccionActual` (string): Current sort direction
- `nuevoCampo` (string): New field that was clicked

**Returns:**
- `string`: New sort direction ('asc' or 'desc')

**Example:**
```javascript
import { determinarNuevaDireccion } from './utils/reporteSorting';

// Clicking the same column toggles direction
const nuevaDir = determinarNuevaDireccion('precio', 'asc', 'precio');
// Returns: 'desc'

// Clicking a different column resets to ascending
const nuevaDir2 = determinarNuevaDireccion('precio', 'desc', 'fecha');
// Returns: 'asc'
```

### Unit Tests (`reporteSorting.test.js`)

The test suite covers the following scenarios:

#### 1. Sorting by Numeric Field in Ascending Order (5 tests)
✅ Tests that appointments are correctly sorted by:
- `precio` (price)
- `duracion` (duration)
- `total` (total cost)
- `iva` (tax)
- `costoTerapeuta` (therapist cost, handling missing values)

#### 2. Sorting by Numeric Field in Descending Order (3 tests)
✅ Tests descending order sorting for:
- `precio`
- `duracion`
- `total`

#### 3. Sorting by Date Field (3 tests)
✅ Tests that appointments are correctly sorted by date:
- Ascending order (earliest to latest)
- Descending order (latest to earliest)
- Different months (cross-month sorting)

#### 4. Sorting by String Field (4 tests)
✅ Tests that appointments are correctly sorted by text fields:
- `tipoTerapia` (therapy type) in ascending order
- `terapeuta` (therapist) in ascending order
- `tipoTerapia` in descending order
- Case-insensitive sorting

#### 5. Direction Toggle Tests (5 tests)
✅ Tests the `determinarNuevaDireccion` function:
- Toggles from asc to desc when clicking same column
- Stays asc when clicking same column that was desc
- Resets to asc when clicking different column
- Handles initial state correctly

#### 6. Edge Cases (7 tests)
✅ Tests handling of:
- Empty array
- Null input
- Undefined input
- Single appointment
- Original array immutability
- Equal values
- Unknown field name

**Test Results:** All 27 tests pass successfully

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
