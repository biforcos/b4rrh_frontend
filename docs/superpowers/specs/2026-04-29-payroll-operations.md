# Payroll Operations — Spec

## Goal

Nueva pantalla bajo "Nómina › Operaciones de cálculo" que permite lanzar cálculo masivo e invalidación masiva de nóminas, con selección flexible de empleados (todos del periodo / lista / único) y visualización de progreso en tiempo real para el run de cálculo.

---

## Scope

Dos subsistemas acoplados:

1. **OpenAPI** — añadir tres endpoints al contrato (`launch`, `get run`, `bulk invalidate`) y regenerar el cliente TypeScript.
2. **Frontend Angular** — nueva feature `nomina/operaciones` con store, gateway, y página única.

---

## Backend: OpenAPI additions (`openapi/personnel-administration-api.yaml`)

### Endpoints nuevos

```
POST   /payroll/calculation-runs/launch
         → LaunchPayrollCalculationRequest → 201 PayrollCalculationRunResponse

GET    /payroll/calculation-runs/{runId}
         → 200 PayrollCalculationRunResponse | 404

POST   /payrolls/invalidate-bulk
         → BulkInvalidatePayrollRequest → 200 BulkInvalidatePayrollResponse
```

### Schemas nuevos

**`PayrollLaunchTargetSelectionType`** (enum): `ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD`, `EMPLOYEE_LIST`, `SINGLE_EMPLOYEE`

**`PayrollLaunchEmployeeTargetRequest`**:
```yaml
employeeTypeCode: string
employeeNumber: string
```

**`PayrollLaunchTargetSelectionRequest`**:
```yaml
selectionType: PayrollLaunchTargetSelectionType
employee:   # only when SINGLE_EMPLOYEE
  $ref: '#/components/schemas/PayrollLaunchEmployeeTargetRequest'
employees:  # only when EMPLOYEE_LIST
  type: array
  items:
    $ref: '#/components/schemas/PayrollLaunchEmployeeTargetRequest'
```

**`LaunchPayrollCalculationRequest`**:
```yaml
ruleSystemCode: string
payrollPeriodCode: string   # format: yyyyMM as string, e.g. "202604"
payrollTypeCode: string
calculationEngineCode: string
calculationEngineVersion: string
targetSelection:
  $ref: '#/components/schemas/PayrollLaunchTargetSelectionRequest'
```

**`PayrollCalculationRunResponse`**:
```yaml
runId: integer (int64)
status: string   # REQUESTED | RUNNING | COMPLETED | COMPLETED_WITH_ERRORS | FAILED
ruleSystemCode: string
payrollPeriodCode: string
payrollTypeCode: string
calculationEngineCode: string
calculationEngineVersion: string
totalCandidates: integer
totalEligible: integer
totalClaimed: integer
totalSkippedNotEligible: integer
totalSkippedAlreadyClaimed: integer
totalCalculated: integer
totalNotValid: integer
totalErrors: integer
requestedAt: string (date-time)
startedAt: string (date-time, nullable)
finishedAt: string (date-time, nullable)
```

**`BulkInvalidatePayrollRequest`**:
```yaml
ruleSystemCode: string
payrollPeriodCode: string
payrollTypeCode: string
statusReasonCode: string
targetSelection:
  $ref: '#/components/schemas/PayrollLaunchTargetSelectionRequest'
```

**`BulkInvalidatePayrollResponse`**:
```yaml
ruleSystemCode: string
payrollPeriodCode: string
payrollTypeCode: string
totalCandidates: integer
totalFound: integer
totalInvalidated: integer
totalSkippedAlreadyNotValid: integer
totalSkippedProtected: integer
totalSkippedNotFound: integer
statusReasonCode: string
```

Tras añadir los schemas, ejecutar `npm run api:refresh` en el frontend para regenerar el cliente.

---

## Frontend: estructura de archivos

```
src/app/features/nomina/operaciones/
  operaciones.routes.ts
  models/
    target-selection.model.ts        # tipos locales para selección de empleados
    calculation-run.model.ts         # CalculationRun, CalculationRunStatus
    bulk-invalidate-result.model.ts  # BulkInvalidateResult
  gateway/
    operaciones.gateway.ts           # wraps generated services
  store/
    operaciones.store.ts             # señales de estado + polling
  ui/
    operaciones-page.component.ts
    operaciones-page.component.html
    operaciones-page.component.scss
```

Archivos existentes a modificar:
- `src/app/app.routes.ts` — añadir ruta `nomina/operaciones`
- `src/app/core/layout/app-shell/app-shell.component.ts` — añadir nav item
- `src/app/core/i18n/app-texts.ts` — añadir texto `sectionOperaciones`

---

## Modelos de dominio frontend

### `target-selection.model.ts`
```typescript
export type TargetSelectionMode = 'ALL' | 'LIST' | 'SINGLE';

export interface EmployeeTarget {
  employeeTypeCode: string;
  employeeNumber: string;
}
```

### `calculation-run.model.ts`
```typescript
export type CalculationRunStatus =
  | 'REQUESTED' | 'RUNNING'
  | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';

export interface CalculationRun {
  runId: number;
  status: CalculationRunStatus;
  ruleSystemCode: string;
  payrollPeriodCode: string;
  totalCandidates: number;
  totalEligible: number;
  totalCalculated: number;
  totalNotValid: number;
  totalErrors: number;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export function isRunFinished(run: CalculationRun): boolean {
  return run.status === 'COMPLETED'
    || run.status === 'COMPLETED_WITH_ERRORS'
    || run.status === 'FAILED';
}
```

### `bulk-invalidate-result.model.ts`
```typescript
export interface BulkInvalidateResult {
  totalCandidates: number;
  totalFound: number;
  totalInvalidated: number;
  totalSkippedAlreadyNotValid: number;
  totalSkippedProtected: number;
  totalSkippedNotFound: number;
}
```

---

## Gateway (`operaciones.gateway.ts`)

Inyecta los servicios generados. Métodos:

```typescript
launchCalculation(params: {
  ruleSystemCode: string;
  payrollPeriodCode: string;
  payrollTypeCode: string;
  calculationEngineCode: string;
  calculationEngineVersion: string;
  targetSelection: TargetSelectionPayload;  // formato API (selectionType + employee/employees)
}): Observable<CalculationRun>

getCalculationRun(runId: number): Observable<CalculationRun>

bulkInvalidate(params: {
  ruleSystemCode: string;
  payrollPeriodCode: string;
  payrollTypeCode: string;
  statusReasonCode: string;
  targetSelection: TargetSelectionPayload;
}): Observable<BulkInvalidateResult>
```

Cada método mapea la respuesta de la API al modelo de dominio local. `getCalculationRun` propaga el error si el run no se encuentra (no absorbe 404).

El `periodState` del store es un `number` (yyyyMM, ej. `202604`). El gateway lo convierte a string con `String(period)` al construir la request — mismo patrón que `employee-payroll-input.gateway.ts`.

---

## Store (`operaciones.store.ts`)

### Estado (señales privadas)

**Contexto compartido:**
- `ruleSystemCodeState = signal<string>('ESP')`
- `periodState = signal<number>(currentPeriod())` — yyyyMM integer
- `payrollTypeCodeState = signal<string>('MENSUAL')`
- `targetModeState = signal<TargetSelectionMode>('ALL')`
- `employeeListTextState = signal<string>('')` — textarea, una línea por empleado `TIPO:NÚMERO`
- `singleEmployeeTypeState = signal<string>('')`
- `singleEmployeeNumberState = signal<string>('')`

**Invalidación:**
- `statusReasonCodeState = signal<string>('RECALCULO')`
- `invalidatingState = signal<boolean>(false)`
- `invalidateResultState = signal<BulkInvalidateResult | null>(null)`
- `invalidateErrorState = signal<string | null>(null)`

**Cálculo:**
- `engineCodeState = signal<string>('GRAPH')`
- `engineVersionState = signal<string>('1.0')`
- `launchingState = signal<boolean>(false)`
- `runState = signal<CalculationRun | null>(null)`
- `launchErrorState = signal<string | null>(null)`
- `private pollSubscription: Subscription | null = null`

### Computed públicos
- `periodLabel = computed(() => formatPeriod(periodState()))` — "Abr 2026"
- `isRunning = computed(() => run && !isRunFinished(run))`
- `runProgress = computed(...)` — porcentaje (totalCalculated + totalErrors) / totalEligible
- `canInvalidate = computed(...)` — ruleSystemCode, period, payrollTypeCode no vacíos
- `canLaunch = computed(...)` — canInvalidate + engineCode + engineVersion

### Polling
Al recibir el runId tras `launchCalculation`:
```typescript
this.pollSubscription = interval(3000).pipe(
  switchMap(() => this.gateway.getCalculationRun(runId)),
  takeWhile(run => !isRunFinished(run), true),
).subscribe({
  next: run => this.runState.set(mapToCalculationRun(run)),
  error: () => this.launchErrorState.set('poll-failed'),
});
```
Llamar `pollSubscription?.unsubscribe()` antes de un nuevo launch y en `ngOnDestroy`.

### Conversión `targetSelectionPayload()`
- `ALL` → `{ selectionType: 'ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD' }`
- `LIST` → parsea `employeeListText` (líneas `TIPO:NÚMERO`) → `{ selectionType: 'EMPLOYEE_LIST', employees: [...] }`
- `SINGLE` → `{ selectionType: 'SINGLE_EMPLOYEE', employee: { employeeTypeCode, employeeNumber } }`

---

## Página (`operaciones-page.component`)

### Estructura HTML

```
<section class="operations-page">
  <!-- Contexto compartido -->
  <div class="operations-page__context">
    <label> Sistema  <select> </label>
    <label> Periodo  <prev-btn> label <next-btn> </label>
    <label> Tipo     <select/input> </label>
    <!-- Selector de modo empleados -->
    <div class="operations-page__target-tabs">
      [Todos del periodo] [Lista] [Empleado único]
    </div>
    @if (targetMode() === 'LIST') { <textarea> }
    @if (targetMode() === 'SINGLE') { <input tipo> <input número> }
  </div>

  <!-- Paneles paralelos -->
  <div class="operations-page__panels">
    <!-- Panel invalidar -->
    <div class="operations-page__panel operations-page__panel--invalidate">
      <label> Motivo  <input> </label>
      <app-ui-button label="Invalidar" (pressed)="submitInvalidate()" />
      @if (invalidateResult()) { <div class="operations-page__result-grid"> ... }
      @if (invalidateError()) { <p class="operations-page__error"> ... }
    </div>

    <!-- Panel calcular -->
    <div class="operations-page__panel operations-page__panel--calculate">
      <label> Motor   <input> </label>
      <label> Versión <input> </label>
      <app-ui-button label="Lanzar" (pressed)="submitLaunch()" />
      @if (run()) {
        <div class="operations-page__run-panel">
          status badge · progress bar · contador grid
        </div>
      }
      @if (launchError()) { <p class="operations-page__error"> ... }
    </div>
  </div>
</section>
```

### Formato de la lista de empleados (modo LIST)
El textarea acepta una entrada por línea en formato `TIPO:NÚMERO`, p.ej.:
```
EMP:EMP001
EMP:EMP002
```
El store parsea cada línea dividiendo por `:`. Las líneas vacías se ignoran.

### Badges de estado del run
- `REQUESTED` → gris "Solicitado"
- `RUNNING` → amarillo animado "En curso…"
- `COMPLETED` → verde "Completado"
- `COMPLETED_WITH_ERRORS` → naranja "Completado con errores"
- `FAILED` → rojo "Fallido"

### Grid de contadores (run y resultado de invalidación)
Tarjetas compactas con número grande + etiqueta pequeña:
- Run: Candidatos / Calculadas / Errores / No elegibles
- Invalidación: Candidatos / Invalidadas / Ya inv. / Protegidas / No encontradas

---

## Navegación

### `app-texts.ts`
```typescript
sectionOperaciones: 'Operaciones',
```

### `app-shell.component.ts` — dentro del grupo Nómina
```typescript
{ label: this.texts.sectionOperaciones, icon: 'pi pi-bolt', routerLink: '/nomina/operaciones' },
```

### `app.routes.ts`
```typescript
{
  path: 'nomina/operaciones',
  loadChildren: () =>
    import('./features/nomina/operaciones/operaciones.routes').then((m) => m.operacionesRoutes),
},
```

---

## Fuera de scope

- Historial persistente de runs pasados (mostrar solo el run activo de la sesión).
- Selección visual de empleados con búsqueda (el modo LIST usa textarea de texto plano).
- Polling para invalidación (es síncrono, resultado inmediato).
- Gestión de `payrollTypeCode` mediante dropdown poblado desde API (texto libre por ahora).
