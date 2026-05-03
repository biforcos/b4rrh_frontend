# Payroll Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nueva pantalla "Nómina › Operaciones" que permite invalidar y calcular nóminas masivamente con selección de empleados (todos / lista / único) y progreso en tiempo real para el cálculo asíncrono.

**Architecture:** Se añaden tres endpoints al contrato OpenAPI del backend (`b4rrhh_backend`) y se regenera el cliente TypeScript. La feature Angular `nomina/operaciones` sigue el patrón existente: gateway → store (signals + polling con RxJS) → página standalone. El store es `providedIn: 'root'` e implementa `OnDestroy` para limpiar la suscripción de polling.

**Tech Stack:** Angular 21 (signals, `ChangeDetectionStrategy.OnPush`), RxJS (`interval` + `switchMap` + `takeWhile`), OpenAPI Generator (Angular HttpClient), Vitest.

---

## File map

| Acción | Ruta |
|--------|------|
| Modify | `b4rrhh_backend/openapi/personnel-administration-api.yaml` |
| Create | `src/app/features/nomina/operaciones/models/target-selection.model.ts` |
| Create | `src/app/features/nomina/operaciones/models/calculation-run.model.ts` |
| Create | `src/app/features/nomina/operaciones/models/bulk-invalidate-result.model.ts` |
| Create | `src/app/features/nomina/operaciones/models/target-selection.model.spec.ts` |
| Create | `src/app/features/nomina/operaciones/models/calculation-run.model.spec.ts` |
| Create | `src/app/features/nomina/operaciones/gateway/operaciones.gateway.ts` |
| Create | `src/app/features/nomina/operaciones/store/operaciones.store.ts` |
| Create | `src/app/features/nomina/operaciones/ui/operaciones-page.component.ts` |
| Create | `src/app/features/nomina/operaciones/ui/operaciones-page.component.html` |
| Create | `src/app/features/nomina/operaciones/ui/operaciones-page.component.scss` |
| Create | `src/app/features/nomina/operaciones/operaciones.routes.ts` |
| Modify | `src/app/app.routes.ts` |
| Modify | `src/app/core/layout/app-shell/app-shell.component.ts` |
| Modify | `src/app/core/i18n/app-texts.ts` |

---

### Task 1: OpenAPI contract + client generation

**Files:**
- Modify: `b4rrhh_backend/openapi/personnel-administration-api.yaml` (line 4245 for paths, line 4721 for schemas)

- [ ] **Step 1: Insert three new path entries after the `/payrolls/.../recalculate` block (after line 4245)**

The block ends at line 4245. Insert the following before the `/payroll-engine/` section (line 4247):

```yaml
  /payrolls/invalidate-bulk:
    post:
      summary: Bulk invalidate payrolls
      operationId: bulkInvalidatePayroll
      tags:
        - Payroll
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/BulkInvalidatePayrollRequest"
      responses:
        "200":
          description: Bulk invalidation completed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/BulkInvalidatePayrollResponse"

  /payroll/calculation-runs/launch:
    post:
      summary: Launch a payroll calculation run
      operationId: launchPayrollCalculation
      tags:
        - Payroll Calculation Run
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LaunchPayrollCalculationRequest"
      responses:
        "201":
          description: Calculation run created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PayrollCalculationRunResponse"

  /payroll/calculation-runs/{runId}:
    get:
      summary: Get a payroll calculation run by ID
      operationId: getPayrollCalculationRun
      tags:
        - Payroll Calculation Run
      parameters:
        - name: runId
          in: path
          required: true
          schema:
            type: integer
            format: int64
      responses:
        "200":
          description: Calculation run found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PayrollCalculationRunResponse"
        "404":
          description: Run not found
```

- [ ] **Step 2: Insert seven new schemas at the top of `components/schemas` (after line 4720 `schemas:`)**

```yaml
    PayrollLaunchTargetSelectionType:
      type: string
      enum:
        - ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD
        - EMPLOYEE_LIST
        - SINGLE_EMPLOYEE

    PayrollLaunchEmployeeTargetRequest:
      type: object
      required:
        - employeeTypeCode
        - employeeNumber
      properties:
        employeeTypeCode:
          type: string
        employeeNumber:
          type: string

    PayrollLaunchTargetSelectionRequest:
      type: object
      required:
        - selectionType
      properties:
        selectionType:
          $ref: "#/components/schemas/PayrollLaunchTargetSelectionType"
        employee:
          nullable: true
          allOf:
            - $ref: "#/components/schemas/PayrollLaunchEmployeeTargetRequest"
        employees:
          type: array
          nullable: true
          items:
            $ref: "#/components/schemas/PayrollLaunchEmployeeTargetRequest"

    LaunchPayrollCalculationRequest:
      type: object
      required:
        - ruleSystemCode
        - payrollPeriodCode
        - payrollTypeCode
        - calculationEngineCode
        - calculationEngineVersion
        - targetSelection
      properties:
        ruleSystemCode:
          type: string
        payrollPeriodCode:
          type: string
        payrollTypeCode:
          type: string
        calculationEngineCode:
          type: string
        calculationEngineVersion:
          type: string
        targetSelection:
          $ref: "#/components/schemas/PayrollLaunchTargetSelectionRequest"

    PayrollCalculationRunResponse:
      type: object
      properties:
        runId:
          type: integer
          format: int64
        status:
          type: string
        ruleSystemCode:
          type: string
        payrollPeriodCode:
          type: string
        payrollTypeCode:
          type: string
        calculationEngineCode:
          type: string
        calculationEngineVersion:
          type: string
        totalCandidates:
          type: integer
        totalEligible:
          type: integer
        totalClaimed:
          type: integer
        totalSkippedNotEligible:
          type: integer
        totalSkippedAlreadyClaimed:
          type: integer
        totalCalculated:
          type: integer
        totalNotValid:
          type: integer
        totalErrors:
          type: integer
        requestedAt:
          type: string
          format: date-time
        startedAt:
          type: string
          format: date-time
          nullable: true
        finishedAt:
          type: string
          format: date-time
          nullable: true

    BulkInvalidatePayrollRequest:
      type: object
      required:
        - ruleSystemCode
        - payrollPeriodCode
        - payrollTypeCode
        - statusReasonCode
        - targetSelection
      properties:
        ruleSystemCode:
          type: string
        payrollPeriodCode:
          type: string
        payrollTypeCode:
          type: string
        statusReasonCode:
          type: string
        targetSelection:
          $ref: "#/components/schemas/PayrollLaunchTargetSelectionRequest"

    BulkInvalidatePayrollResponse:
      type: object
      properties:
        ruleSystemCode:
          type: string
        payrollPeriodCode:
          type: string
        payrollTypeCode:
          type: string
        totalCandidates:
          type: integer
        totalFound:
          type: integer
        totalInvalidated:
          type: integer
        totalSkippedAlreadyNotValid:
          type: integer
        totalSkippedProtected:
          type: integer
        totalSkippedNotFound:
          type: integer
        statusReasonCode:
          type: string
```

- [ ] **Step 3: Regenerate the TypeScript client**

Run in `b4rrhh_frontend/`:
```bash
npm run api:refresh
```

Expected: no errors. Verify these files now exist:
- `src/app/core/api/generated/api/payroll-calculation-run.service.ts`
- `src/app/core/api/generated/model/payroll-calculation-run-response.ts`
- `src/app/core/api/generated/model/bulk-invalidate-payroll-response.ts`
- `src/app/core/api/generated/model/payroll-launch-target-selection-request.ts`

Also verify `src/app/core/api/generated/api/payroll.service.ts` now contains method `bulkInvalidatePayroll`.

- [ ] **Step 4: Commit**

```bash
git add b4rrhh_backend/openapi/personnel-administration-api.yaml
git add src/app/core/api/generated/
git commit -m "feat: add payroll bulk-invalidate and calculation-run endpoints to OpenAPI + regenerate client"
```

---

### Task 2: Domain models

**Files:**
- Create: `src/app/features/nomina/operaciones/models/target-selection.model.ts`
- Create: `src/app/features/nomina/operaciones/models/target-selection.model.spec.ts`
- Create: `src/app/features/nomina/operaciones/models/calculation-run.model.ts`
- Create: `src/app/features/nomina/operaciones/models/calculation-run.model.spec.ts`
- Create: `src/app/features/nomina/operaciones/models/bulk-invalidate-result.model.ts`

- [ ] **Step 1: Write failing tests for `buildTargetSelectionPayload`**

Create `src/app/features/nomina/operaciones/models/target-selection.model.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { buildTargetSelectionPayload } from './target-selection.model';

describe('buildTargetSelectionPayload', () => {
  it('ALL returns ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD with no employee fields', () => {
    expect(buildTargetSelectionPayload('ALL', '', '', '')).toEqual({
      selectionType: 'ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD',
    });
  });

  it('LIST parses colon-separated lines into employees array', () => {
    const result = buildTargetSelectionPayload('LIST', 'EMP:EMP001\nEMP:EMP002', '', '');
    expect(result).toEqual({
      selectionType: 'EMPLOYEE_LIST',
      employees: [
        { employeeTypeCode: 'EMP', employeeNumber: 'EMP001' },
        { employeeTypeCode: 'EMP', employeeNumber: 'EMP002' },
      ],
    });
  });

  it('LIST ignores blank lines', () => {
    const result = buildTargetSelectionPayload('LIST', 'EMP:EMP001\n\n', '', '');
    expect(result.employees).toHaveLength(1);
  });

  it('LIST trims whitespace from type and number', () => {
    const result = buildTargetSelectionPayload('LIST', '  EMP : EMP001 ', '', '');
    expect(result.employees![0]).toEqual({ employeeTypeCode: 'EMP', employeeNumber: 'EMP001' });
  });

  it('SINGLE returns single employee target', () => {
    expect(buildTargetSelectionPayload('SINGLE', '', 'EMP', 'EMP001')).toEqual({
      selectionType: 'SINGLE_EMPLOYEE',
      employee: { employeeTypeCode: 'EMP', employeeNumber: 'EMP001' },
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- --reporter=verbose target-selection.model.spec
```

Expected: FAIL — `buildTargetSelectionPayload` is not defined.

- [ ] **Step 3: Write failing tests for `isRunFinished`**

Create `src/app/features/nomina/operaciones/models/calculation-run.model.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { isRunFinished } from './calculation-run.model';
import type { CalculationRun } from './calculation-run.model';

const base: CalculationRun = {
  runId: 1,
  status: 'COMPLETED',
  ruleSystemCode: 'ESP',
  payrollPeriodCode: '202604',
  totalCandidates: 0,
  totalEligible: 0,
  totalCalculated: 0,
  totalNotValid: 0,
  totalErrors: 0,
  requestedAt: '2026-04-29T08:00:00',
  startedAt: null,
  finishedAt: null,
};

describe('isRunFinished', () => {
  it('returns true for COMPLETED', () => expect(isRunFinished({ ...base, status: 'COMPLETED' })).toBe(true));
  it('returns true for COMPLETED_WITH_ERRORS', () => expect(isRunFinished({ ...base, status: 'COMPLETED_WITH_ERRORS' })).toBe(true));
  it('returns true for FAILED', () => expect(isRunFinished({ ...base, status: 'FAILED' })).toBe(true));
  it('returns false for RUNNING', () => expect(isRunFinished({ ...base, status: 'RUNNING' })).toBe(false));
  it('returns false for REQUESTED', () => expect(isRunFinished({ ...base, status: 'REQUESTED' })).toBe(false));
});
```

- [ ] **Step 4: Run tests to confirm they fail**

```bash
npm run test -- --reporter=verbose calculation-run.model.spec
```

Expected: FAIL — `isRunFinished` is not defined.

- [ ] **Step 5: Implement the three model files**

Create `src/app/features/nomina/operaciones/models/target-selection.model.ts`:

```typescript
export type TargetSelectionMode = 'ALL' | 'LIST' | 'SINGLE';

export interface TargetSelectionPayload {
  selectionType: 'ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD' | 'EMPLOYEE_LIST' | 'SINGLE_EMPLOYEE';
  employee?: { employeeTypeCode: string; employeeNumber: string };
  employees?: Array<{ employeeTypeCode: string; employeeNumber: string }>;
}

export function buildTargetSelectionPayload(
  mode: TargetSelectionMode,
  listText: string,
  singleTypeCode: string,
  singleNumber: string,
): TargetSelectionPayload {
  if (mode === 'ALL') {
    return { selectionType: 'ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD' };
  }
  if (mode === 'LIST') {
    const employees = listText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.includes(':'))
      .map((l) => {
        const colonIdx = l.indexOf(':');
        return {
          employeeTypeCode: l.slice(0, colonIdx).trim(),
          employeeNumber: l.slice(colonIdx + 1).trim(),
        };
      });
    return { selectionType: 'EMPLOYEE_LIST', employees };
  }
  return {
    selectionType: 'SINGLE_EMPLOYEE',
    employee: { employeeTypeCode: singleTypeCode.trim(), employeeNumber: singleNumber.trim() },
  };
}
```

Create `src/app/features/nomina/operaciones/models/calculation-run.model.ts`:

```typescript
export type CalculationRunStatus =
  | 'REQUESTED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED';

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
  return (
    run.status === 'COMPLETED' ||
    run.status === 'COMPLETED_WITH_ERRORS' ||
    run.status === 'FAILED'
  );
}
```

Create `src/app/features/nomina/operaciones/models/bulk-invalidate-result.model.ts`:

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

- [ ] **Step 6: Run both test suites — verify they pass**

```bash
npm run test -- --reporter=verbose target-selection.model.spec calculation-run.model.spec
```

Expected: 10 tests passing.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/nomina/operaciones/models/
git commit -m "feat: add payroll operations domain models and pure function tests"
```

---

### Task 3: Gateway

**Files:**
- Create: `src/app/features/nomina/operaciones/gateway/operaciones.gateway.ts`

The gateway is at depth `features/nomina/operaciones/gateway/`, so the generated API services are four levels up: `../../../../core/api/generated/api/`.

- [ ] **Step 1: Create the gateway**

Create `src/app/features/nomina/operaciones/gateway/operaciones.gateway.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { PayrollCalculationRunService } from '../../../../core/api/generated/api/payroll-calculation-run.service';
import { PayrollService } from '../../../../core/api/generated/api/payroll.service';
import { BulkInvalidateResult } from '../models/bulk-invalidate-result.model';
import { CalculationRun } from '../models/calculation-run.model';
import { TargetSelectionPayload } from '../models/target-selection.model';

@Injectable({ providedIn: 'root' })
export class OperacionesGateway {
  private readonly payrollApi = inject(PayrollService);
  private readonly calculationRunApi = inject(PayrollCalculationRunService);

  launchCalculation(params: {
    ruleSystemCode: string;
    payrollPeriodCode: string;
    payrollTypeCode: string;
    calculationEngineCode: string;
    calculationEngineVersion: string;
    targetSelection: TargetSelectionPayload;
  }): Observable<CalculationRun> {
    return this.calculationRunApi
      .launchPayrollCalculation({ launchPayrollCalculationRequest: params as any })
      .pipe(map(this.mapRun));
  }

  getCalculationRun(runId: number): Observable<CalculationRun> {
    return this.calculationRunApi.getPayrollCalculationRun({ runId }).pipe(map(this.mapRun));
  }

  bulkInvalidate(params: {
    ruleSystemCode: string;
    payrollPeriodCode: string;
    payrollTypeCode: string;
    statusReasonCode: string;
    targetSelection: TargetSelectionPayload;
  }): Observable<BulkInvalidateResult> {
    return this.payrollApi
      .bulkInvalidatePayroll({ bulkInvalidatePayrollRequest: params as any })
      .pipe(
        map((r) => ({
          totalCandidates: r.totalCandidates ?? 0,
          totalFound: r.totalFound ?? 0,
          totalInvalidated: r.totalInvalidated ?? 0,
          totalSkippedAlreadyNotValid: r.totalSkippedAlreadyNotValid ?? 0,
          totalSkippedProtected: r.totalSkippedProtected ?? 0,
          totalSkippedNotFound: r.totalSkippedNotFound ?? 0,
        })),
      );
  }

  private mapRun = (r: any): CalculationRun => ({
    runId: r.runId,
    status: r.status,
    ruleSystemCode: r.ruleSystemCode,
    payrollPeriodCode: r.payrollPeriodCode,
    totalCandidates: r.totalCandidates ?? 0,
    totalEligible: r.totalEligible ?? 0,
    totalCalculated: r.totalCalculated ?? 0,
    totalNotValid: r.totalNotValid ?? 0,
    totalErrors: r.totalErrors ?? 0,
    requestedAt: r.requestedAt,
    startedAt: r.startedAt ?? null,
    finishedAt: r.finishedAt ?? null,
  });
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/nomina/operaciones/gateway/
git commit -m "feat: add operaciones gateway wrapping calculation-run and bulk-invalidate API"
```

---

### Task 4: Store

**Files:**
- Create: `src/app/features/nomina/operaciones/store/operaciones.store.ts`

- [ ] **Step 1: Create the store**

Create `src/app/features/nomina/operaciones/store/operaciones.store.ts`:

```typescript
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';

import { OperacionesGateway } from '../gateway/operaciones.gateway';
import { BulkInvalidateResult } from '../models/bulk-invalidate-result.model';
import { CalculationRun, isRunFinished } from '../models/calculation-run.model';
import { TargetSelectionMode, buildTargetSelectionPayload } from '../models/target-selection.model';

function currentPeriod(): number {
  const now = new Date();
  return now.getFullYear() * 100 + now.getMonth() + 1;
}

function formatPeriod(period: number): string {
  const month = period % 100;
  const year = Math.floor(period / 100);
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${names[month - 1]} ${year}`;
}

function movePeriod(period: number, delta: 1 | -1): number {
  const month = period % 100;
  const year = Math.floor(period / 100);
  if (delta === -1) return month === 1 ? (year - 1) * 100 + 12 : period - 1;
  return month === 12 ? (year + 1) * 100 + 1 : period + 1;
}

@Injectable({ providedIn: 'root' })
export class OperacionesStore implements OnDestroy {
  private readonly gateway = inject(OperacionesGateway);

  private readonly ruleSystemCodeState = signal<string>('ESP');
  private readonly periodState = signal<number>(currentPeriod());
  private readonly payrollTypeCodeState = signal<string>('MENSUAL');
  private readonly targetModeState = signal<TargetSelectionMode>('ALL');
  private readonly employeeListTextState = signal<string>('');
  private readonly singleEmployeeTypeState = signal<string>('');
  private readonly singleEmployeeNumberState = signal<string>('');

  private readonly statusReasonCodeState = signal<string>('RECALCULO');
  private readonly invalidatingState = signal<boolean>(false);
  private readonly invalidateResultState = signal<BulkInvalidateResult | null>(null);
  private readonly invalidateErrorState = signal<string | null>(null);

  private readonly engineCodeState = signal<string>('GRAPH');
  private readonly engineVersionState = signal<string>('1.0');
  private readonly launchingState = signal<boolean>(false);
  private readonly runState = signal<CalculationRun | null>(null);
  private readonly launchErrorState = signal<string | null>(null);
  private pollSubscription: Subscription | null = null;

  readonly ruleSystemCode = this.ruleSystemCodeState.asReadonly();
  readonly period = this.periodState.asReadonly();
  readonly payrollTypeCode = this.payrollTypeCodeState.asReadonly();
  readonly targetMode = this.targetModeState.asReadonly();
  readonly employeeListText = this.employeeListTextState.asReadonly();
  readonly singleEmployeeType = this.singleEmployeeTypeState.asReadonly();
  readonly singleEmployeeNumber = this.singleEmployeeNumberState.asReadonly();
  readonly statusReasonCode = this.statusReasonCodeState.asReadonly();
  readonly invalidating = this.invalidatingState.asReadonly();
  readonly invalidateResult = this.invalidateResultState.asReadonly();
  readonly invalidateError = this.invalidateErrorState.asReadonly();
  readonly engineCode = this.engineCodeState.asReadonly();
  readonly engineVersion = this.engineVersionState.asReadonly();
  readonly launching = this.launchingState.asReadonly();
  readonly run = this.runState.asReadonly();
  readonly launchError = this.launchErrorState.asReadonly();

  readonly periodLabel = computed(() => formatPeriod(this.periodState()));
  readonly isRunActive = computed(() => {
    const r = this.runState();
    return r !== null && !isRunFinished(r);
  });
  readonly runProgress = computed(() => {
    const r = this.runState();
    if (!r || r.totalEligible === 0) return 0;
    return Math.round(((r.totalCalculated + r.totalErrors) / r.totalEligible) * 100);
  });
  readonly canInvalidate = computed(
    () =>
      !this.invalidatingState() &&
      !this.launchingState() &&
      this.ruleSystemCodeState().trim().length > 0 &&
      this.payrollTypeCodeState().trim().length > 0,
  );
  readonly canLaunch = computed(
    () =>
      !this.invalidatingState() &&
      !this.launchingState() &&
      this.ruleSystemCodeState().trim().length > 0 &&
      this.payrollTypeCodeState().trim().length > 0 &&
      this.engineCodeState().trim().length > 0 &&
      this.engineVersionState().trim().length > 0,
  );

  setRuleSystemCode(v: string): void { this.ruleSystemCodeState.set(v); }
  setPayrollTypeCode(v: string): void { this.payrollTypeCodeState.set(v); }
  setTargetMode(v: TargetSelectionMode): void { this.targetModeState.set(v); }
  setEmployeeListText(v: string): void { this.employeeListTextState.set(v); }
  setSingleEmployeeType(v: string): void { this.singleEmployeeTypeState.set(v); }
  setSingleEmployeeNumber(v: string): void { this.singleEmployeeNumberState.set(v); }
  setStatusReasonCode(v: string): void { this.statusReasonCodeState.set(v); }
  setEngineCode(v: string): void { this.engineCodeState.set(v); }
  setEngineVersion(v: string): void { this.engineVersionState.set(v); }
  prevPeriod(): void { this.periodState.update((p) => movePeriod(p, -1)); }
  nextPeriod(): void { this.periodState.update((p) => movePeriod(p, 1)); }

  invalidate(): void {
    if (!this.canInvalidate()) return;
    this.invalidatingState.set(true);
    this.invalidateResultState.set(null);
    this.invalidateErrorState.set(null);
    this.gateway
      .bulkInvalidate({
        ruleSystemCode: this.ruleSystemCodeState(),
        payrollPeriodCode: String(this.periodState()),
        payrollTypeCode: this.payrollTypeCodeState(),
        statusReasonCode: this.statusReasonCodeState(),
        targetSelection: buildTargetSelectionPayload(
          this.targetModeState(),
          this.employeeListTextState(),
          this.singleEmployeeTypeState(),
          this.singleEmployeeNumberState(),
        ),
      })
      .subscribe({
        next: (result) => {
          this.invalidatingState.set(false);
          this.invalidateResultState.set(result);
        },
        error: () => {
          this.invalidatingState.set(false);
          this.invalidateErrorState.set('request-failed');
        },
      });
  }

  launch(): void {
    if (!this.canLaunch()) return;
    this.stopPolling();
    this.launchingState.set(true);
    this.runState.set(null);
    this.launchErrorState.set(null);
    this.gateway
      .launchCalculation({
        ruleSystemCode: this.ruleSystemCodeState(),
        payrollPeriodCode: String(this.periodState()),
        payrollTypeCode: this.payrollTypeCodeState(),
        calculationEngineCode: this.engineCodeState(),
        calculationEngineVersion: this.engineVersionState(),
        targetSelection: buildTargetSelectionPayload(
          this.targetModeState(),
          this.employeeListTextState(),
          this.singleEmployeeTypeState(),
          this.singleEmployeeNumberState(),
        ),
      })
      .subscribe({
        next: (run) => {
          this.launchingState.set(false);
          this.runState.set(run);
          if (!isRunFinished(run)) {
            this.startPolling(run.runId);
          }
        },
        error: () => {
          this.launchingState.set(false);
          this.launchErrorState.set('launch-failed');
        },
      });
  }

  private startPolling(runId: number): void {
    this.pollSubscription = interval(3000)
      .pipe(
        switchMap(() => this.gateway.getCalculationRun(runId)),
        takeWhile((run) => !isRunFinished(run), true),
      )
      .subscribe({
        next: (run) => this.runState.set(run),
        error: () => this.launchErrorState.set('poll-failed'),
      });
  }

  private stopPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/nomina/operaciones/store/
git commit -m "feat: add operaciones store with shared context, bulk invalidate, and async calculation run with polling"
```

---

### Task 5: Page component, routes

**Files:**
- Create: `src/app/features/nomina/operaciones/ui/operaciones-page.component.ts`
- Create: `src/app/features/nomina/operaciones/ui/operaciones-page.component.html`
- Create: `src/app/features/nomina/operaciones/ui/operaciones-page.component.scss`
- Create: `src/app/features/nomina/operaciones/operaciones.routes.ts`

- [ ] **Step 1: Create the TypeScript component**

Create `src/app/features/nomina/operaciones/ui/operaciones-page.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { TargetSelectionMode } from '../models/target-selection.model';
import { OperacionesStore } from '../store/operaciones.store';

@Component({
  selector: 'app-operaciones-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  templateUrl: './operaciones-page.component.html',
  styleUrl: './operaciones-page.component.scss',
})
export class OperacionesPageComponent {
  protected readonly store = inject(OperacionesStore);

  protected readonly targetModes: ReadonlyArray<{ value: TargetSelectionMode; label: string }> = [
    { value: 'ALL', label: 'Todos del periodo' },
    { value: 'LIST', label: 'Lista' },
    { value: 'SINGLE', label: 'Empleado único' },
  ];

  protected readonly runStatusLabels: Record<string, string> = {
    REQUESTED: 'Solicitado',
    RUNNING: 'En curso…',
    COMPLETED: 'Completado',
    COMPLETED_WITH_ERRORS: 'Completado con errores',
    FAILED: 'Fallido',
  };

  protected readonly runStatusSeverity: Record<string, string> = {
    REQUESTED: 'ops-badge--grey',
    RUNNING: 'ops-badge--yellow',
    COMPLETED: 'ops-badge--green',
    COMPLETED_WITH_ERRORS: 'ops-badge--orange',
    FAILED: 'ops-badge--red',
  };
}
```

- [ ] **Step 2: Create the HTML template**

Create `src/app/features/nomina/operaciones/ui/operaciones-page.component.html`:

```html
<section class="ops-page" aria-label="Operaciones de cálculo">

  <!-- Contexto compartido -->
  <div class="ops-page__context">
    <div class="ops-page__context-fields">
      <label class="ops-page__field">
        <span class="ops-page__field-label">Sistema</span>
        <input
          type="text"
          class="ops-page__input"
          [value]="store.ruleSystemCode()"
          (input)="store.setRuleSystemCode($any($event.target).value)"
        />
      </label>

      <div class="ops-page__field">
        <span class="ops-page__field-label">Periodo</span>
        <div class="ops-page__period-nav">
          <button
            type="button"
            class="ops-page__period-btn"
            aria-label="Periodo anterior"
            (click)="store.prevPeriod()"
          >&#8249;</button>
          <span class="ops-page__period-label">{{ store.periodLabel() }}</span>
          <button
            type="button"
            class="ops-page__period-btn"
            aria-label="Periodo siguiente"
            (click)="store.nextPeriod()"
          >&#8250;</button>
        </div>
      </div>

      <label class="ops-page__field">
        <span class="ops-page__field-label">Tipo de nómina</span>
        <input
          type="text"
          class="ops-page__input"
          [value]="store.payrollTypeCode()"
          (input)="store.setPayrollTypeCode($any($event.target).value)"
        />
      </label>
    </div>

    <div class="ops-page__target-section">
      <span class="ops-page__field-label">Empleados objetivo</span>
      <div class="ops-page__target-tabs">
        @for (mode of targetModes; track mode.value) {
          <button
            type="button"
            class="ops-page__target-tab"
            [class.ops-page__target-tab--active]="store.targetMode() === mode.value"
            (click)="store.setTargetMode(mode.value)"
          >{{ mode.label }}</button>
        }
      </div>

      @if (store.targetMode() === 'LIST') {
        <textarea
          class="ops-page__textarea"
          placeholder="Una línea por empleado, formato TIPO:NÚMERO&#10;Ejemplo:&#10;EMP:EMP001&#10;EMP:EMP002"
          rows="4"
          [value]="store.employeeListText()"
          (input)="store.setEmployeeListText($any($event.target).value)"
        ></textarea>
      }

      @if (store.targetMode() === 'SINGLE') {
        <div class="ops-page__single-employee">
          <label class="ops-page__field">
            <span class="ops-page__field-label">Tipo</span>
            <input
              type="text"
              class="ops-page__input"
              placeholder="EMP"
              [value]="store.singleEmployeeType()"
              (input)="store.setSingleEmployeeType($any($event.target).value)"
            />
          </label>
          <label class="ops-page__field">
            <span class="ops-page__field-label">Número</span>
            <input
              type="text"
              class="ops-page__input"
              placeholder="EMP001"
              [value]="store.singleEmployeeNumber()"
              (input)="store.setSingleEmployeeNumber($any($event.target).value)"
            />
          </label>
        </div>
      }
    </div>
  </div>

  <!-- Paneles paralelos -->
  <div class="ops-page__panels">

    <!-- Panel invalidar -->
    <div class="ops-page__panel ops-page__panel--invalidate">
      <h2 class="ops-page__panel-title ops-page__panel-title--invalidate">Invalidar masivamente</h2>

      <label class="ops-page__field">
        <span class="ops-page__field-label">Motivo de invalidación</span>
        <input
          type="text"
          class="ops-page__input"
          [value]="store.statusReasonCode()"
          [disabled]="store.invalidating()"
          (input)="store.setStatusReasonCode($any($event.target).value)"
        />
      </label>

      <app-ui-button
        type="button"
        size="small"
        severity="danger"
        label="Invalidar"
        [disabled]="!store.canInvalidate()"
        (pressed)="store.invalidate()"
      />

      @if (store.invalidating()) {
        <p class="ops-page__status-text">Procesando…</p>
      }

      @if (store.invalidateError()) {
        <p class="ops-page__error">No se pudo procesar la invalidación. Reintenta.</p>
      }

      @if (store.invalidateResult(); as result) {
        <div class="ops-page__result-grid">
          <div class="ops-page__counter">
            <span class="ops-page__counter-value">{{ result.totalCandidates }}</span>
            <span class="ops-page__counter-label">Candidatos</span>
          </div>
          <div class="ops-page__counter ops-page__counter--success">
            <span class="ops-page__counter-value">{{ result.totalInvalidated }}</span>
            <span class="ops-page__counter-label">Invalidadas</span>
          </div>
          <div class="ops-page__counter ops-page__counter--warn">
            <span class="ops-page__counter-value">{{ result.totalSkippedAlreadyNotValid }}</span>
            <span class="ops-page__counter-label">Ya inv.</span>
          </div>
          <div class="ops-page__counter ops-page__counter--warn">
            <span class="ops-page__counter-value">{{ result.totalSkippedProtected }}</span>
            <span class="ops-page__counter-label">Protegidas</span>
          </div>
          <div class="ops-page__counter ops-page__counter--error">
            <span class="ops-page__counter-value">{{ result.totalSkippedNotFound }}</span>
            <span class="ops-page__counter-label">No encontradas</span>
          </div>
        </div>
      }
    </div>

    <!-- Panel calcular -->
    <div class="ops-page__panel ops-page__panel--calculate">
      <h2 class="ops-page__panel-title ops-page__panel-title--calculate">Lanzar cálculo</h2>

      <div class="ops-page__engine-fields">
        <label class="ops-page__field">
          <span class="ops-page__field-label">Motor</span>
          <input
            type="text"
            class="ops-page__input"
            [value]="store.engineCode()"
            [disabled]="store.launching()"
            (input)="store.setEngineCode($any($event.target).value)"
          />
        </label>
        <label class="ops-page__field">
          <span class="ops-page__field-label">Versión</span>
          <input
            type="text"
            class="ops-page__input"
            [value]="store.engineVersion()"
            [disabled]="store.launching()"
            (input)="store.setEngineVersion($any($event.target).value)"
          />
        </label>
      </div>

      <app-ui-button
        type="button"
        size="small"
        label="Lanzar"
        [disabled]="!store.canLaunch()"
        (pressed)="store.launch()"
      />

      @if (store.launching()) {
        <p class="ops-page__status-text">Lanzando run…</p>
      }

      @if (store.launchError()) {
        <p class="ops-page__error">
          @if (store.launchError() === 'launch-failed') { No se pudo lanzar el cálculo. Reintenta. }
          @if (store.launchError() === 'poll-failed') { Error al seguir el estado del run. Recarga la página para ver el resultado. }
        </p>
      }

      @if (store.run(); as run) {
        <div class="ops-page__run-panel">
          <div class="ops-page__run-header">
            <span class="ops-page__run-title">Run #{{ run.runId }}</span>
            <span class="ops-badge" [ngClass]="runStatusSeverity[run.status]">
              {{ runStatusLabels[run.status] ?? run.status }}
            </span>
          </div>

          <div class="ops-page__result-grid">
            <div class="ops-page__counter">
              <span class="ops-page__counter-value">{{ run.totalCandidates }}</span>
              <span class="ops-page__counter-label">Candidatos</span>
            </div>
            <div class="ops-page__counter ops-page__counter--info">
              <span class="ops-page__counter-value">{{ run.totalEligible }}</span>
              <span class="ops-page__counter-label">Elegibles</span>
            </div>
            <div class="ops-page__counter ops-page__counter--success">
              <span class="ops-page__counter-value">{{ run.totalCalculated }}</span>
              <span class="ops-page__counter-label">Calculadas</span>
            </div>
            <div class="ops-page__counter ops-page__counter--error">
              <span class="ops-page__counter-value">{{ run.totalErrors }}</span>
              <span class="ops-page__counter-label">Errores</span>
            </div>
            <div class="ops-page__counter">
              <span class="ops-page__counter-value">{{ run.totalNotValid }}</span>
              <span class="ops-page__counter-label">No válidas</span>
            </div>
          </div>

          @if (store.isRunActive()) {
            <div class="ops-page__progress-bar">
              <div class="ops-page__progress-fill" [style.width.%]="store.runProgress()"></div>
            </div>
          }
        </div>
      }
    </div>

  </div>
</section>
```

Note: `[ngClass]` requires `NgClass` imported in the component. Add `NgClass` from `@angular/common` to the component imports array:

```typescript
import { NgClass } from '@angular/common';
// ...
imports: [UiButtonComponent, NgClass],
```

- [ ] **Step 3: Create the SCSS**

Create `src/app/features/nomina/operaciones/ui/operaciones-page.component.scss`:

```scss
.ops-page {
  display: grid;
  gap: 0.8rem;
  padding: 0.5rem 0;
}

.ops-page__context {
  border: 1px solid #c8d9ed;
  border-radius: 8px;
  background: #f0f4fa;
  padding: 0.8rem;
  display: grid;
  gap: 0.6rem;
}

.ops-page__context-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.ops-page__field {
  display: grid;
  gap: 0.1rem;
}

.ops-page__field-label {
  font-size: 0.68rem;
  color: #5f7386;
  line-height: 1.2;
}

.ops-page__input {
  border: 1px solid #cedae7;
  border-radius: 0.42rem;
  background: #fff;
  color: #1f3246;
  font-size: 0.75rem;
  padding: 0.32rem 0.42rem;
  min-height: 2rem;
  width: 100%;
  box-sizing: border-box;
}

.ops-page__input:focus-visible {
  outline: none;
  border-color: #7ea6cc;
  box-shadow: 0 0 0 2px rgba(126, 166, 204, 0.2);
}

.ops-page__input:disabled {
  background: #f4f7fa;
  color: #8a9eb0;
}

.ops-page__period-nav {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.ops-page__period-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border: 1px solid #cedae7;
  border-radius: 0.38rem;
  background: #f4f7fa;
  color: #3c546b;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
}

.ops-page__period-btn:hover:not(:disabled) {
  background: #e8eef5;
  border-color: #b3c5d4;
}

.ops-page__period-label {
  min-width: 5rem;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 600;
  color: #2d4458;
}

.ops-page__target-section {
  display: grid;
  gap: 0.35rem;
}

.ops-page__target-tabs {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.ops-page__target-tab {
  border: 1px solid #cedae7;
  border-radius: 4px;
  background: #fff;
  color: #475f74;
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
}

.ops-page__target-tab--active {
  background: #2d5fa6;
  border-color: #2d5fa6;
  color: #fff;
  font-weight: 600;
}

.ops-page__textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #cedae7;
  border-radius: 0.42rem;
  background: #fff;
  color: #1f3246;
  font-size: 0.74rem;
  padding: 0.4rem 0.5rem;
  resize: vertical;
  font-family: monospace;
}

.ops-page__textarea:focus-visible {
  outline: none;
  border-color: #7ea6cc;
  box-shadow: 0 0 0 2px rgba(126, 166, 204, 0.2);
}

.ops-page__single-employee {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.4rem;
}

.ops-page__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}

.ops-page__panel {
  border-radius: 8px;
  padding: 0.8rem;
  display: grid;
  gap: 0.5rem;
  align-content: start;
}

.ops-page__panel--invalidate {
  border: 1px solid #fca5a5;
  background: #fff8f8;
}

.ops-page__panel--calculate {
  border: 1px solid #86efac;
  background: #f6fff8;
}

.ops-page__panel-title {
  font-size: 0.82rem;
  font-weight: 700;
  margin: 0;
}

.ops-page__panel-title--invalidate { color: #b91c1c; }
.ops-page__panel-title--calculate  { color: #15803d; }

.ops-page__engine-fields {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.4rem;
}

.ops-page__status-text {
  margin: 0;
  font-size: 0.72rem;
  color: #5f7386;
  font-style: italic;
}

.ops-page__error {
  margin: 0;
  font-size: 0.72rem;
  color: #b42318;
}

.ops-page__result-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.3rem;
}

.ops-page__counter {
  background: #f1f5f9;
  border-radius: 5px;
  padding: 0.35rem;
  text-align: center;
  display: grid;
  gap: 0.08rem;
}

.ops-page__counter--success { background: #dcfce7; }
.ops-page__counter--warn    { background: #fef9c3; }
.ops-page__counter--error   { background: #fee2e2; }
.ops-page__counter--info    { background: #dbeafe; }

.ops-page__counter-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1f3246;
  line-height: 1;
}

.ops-page__counter-label {
  font-size: 0.58rem;
  color: #5f7386;
}

.ops-page__run-panel {
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
  padding: 0.6rem;
  display: grid;
  gap: 0.45rem;
}

.ops-page__run-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.ops-page__run-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1e40af;
}

.ops-badge {
  border-radius: 10px;
  padding: 0.15rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
}

.ops-badge--grey   { background: #e2e8f0; color: #475569; }
.ops-badge--yellow { background: #fef9c3; color: #92400e; }
.ops-badge--green  { background: #dcfce7; color: #15803d; }
.ops-badge--orange { background: #ffedd5; color: #9a3412; }
.ops-badge--red    { background: #fee2e2; color: #b91c1c; }

.ops-page__progress-bar {
  background: #dbeafe;
  border-radius: 4px;
  height: 6px;
  overflow: hidden;
}

.ops-page__progress-fill {
  background: #3b82f6;
  height: 100%;
  transition: width 0.5s ease;
}

@media (max-width: 800px) {
  .ops-page__context-fields {
    grid-template-columns: 1fr 1fr;
  }

  .ops-page__panels {
    grid-template-columns: 1fr;
  }

  .ops-page__result-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

- [ ] **Step 4: Create the routes file**

Create `src/app/features/nomina/operaciones/operaciones.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const operacionesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ui/operaciones-page.component').then((m) => m.OperacionesPageComponent),
  },
];
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/nomina/operaciones/
git commit -m "feat: add payroll operations page with bulk invalidate and calculation launch"
```

---

### Task 6: Nav wiring + final build verification

**Files:**
- Modify: `src/app/core/i18n/app-texts.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/core/layout/app-shell/app-shell.component.ts`

- [ ] **Step 1: Add text key in `app-texts.ts`**

In `src/app/core/i18n/app-texts.ts`, after the line `sectionRecibos: 'Recibos',` add:

```typescript
  sectionOperaciones: 'Operaciones',
```

- [ ] **Step 2: Add route in `app.routes.ts`**

In `src/app/app.routes.ts`, after the `nomina/recibos` route block (after line 70), insert:

```typescript
      {
        path: 'nomina/operaciones',
        loadChildren: () =>
          import('./features/nomina/operaciones/operaciones.routes').then(
            (m) => m.operacionesRoutes,
          ),
      },
```

- [ ] **Step 3: Add nav item in `app-shell.component.ts`**

In `src/app/core/layout/app-shell/app-shell.component.ts`, after the `sectionRecibos` item (line 86), add:

```typescript
        { label: this.texts.sectionOperaciones, icon: 'pi pi-bolt', routerLink: '/nomina/operaciones' },
```

The Nómina group should now look like:

```typescript
    {
      label: this.texts.sectionPayroll,
      icon: 'pi pi-file',
      expanded: true,
      items: [
        { label: this.texts.sectionRecibos, icon: 'pi pi-receipt', routerLink: '/nomina/recibos' },
        { label: this.texts.sectionOperaciones, icon: 'pi pi-bolt', routerLink: '/nomina/operaciones' },
      ],
    },
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Start dev server and smoke-test manually**

```bash
npm start
```

Navigate to `http://localhost:4200`. Verify:
1. Sidebar shows "Nómina › Operaciones" with a bolt icon.
2. Clicking it loads the operations page.
3. The three period nav buttons (prev/label/next) work and update the period label.
4. Switching target mode tabs shows/hides the textarea and single-employee inputs.
5. Filling sistema + tipo de nómina enables both action buttons.
6. The invalidate panel button calls the API and shows the result counters.
7. The calculate panel launches a run, shows `REQUESTED` badge, then auto-updates while polling.

- [ ] **Step 6: Commit**

```bash
git add src/app/core/i18n/app-texts.ts src/app/app.routes.ts src/app/core/layout/app-shell/app-shell.component.ts
git commit -m "feat: wire payroll operations page into navigation and routing"
```
