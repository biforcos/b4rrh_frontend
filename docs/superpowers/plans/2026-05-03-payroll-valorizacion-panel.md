# Payroll Valorización Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a slide-in drawer panel to the payroll receipt screen that shows every concept that participated in the payroll calculation (devengos, deducciones, bases, técnicos, informativos), with text search.

**Architecture:** No backend changes. The API already returns all concept natures in `GET /payrolls/{...}`. `RecibosDetailComponent` gains a local `drawerOpen` signal and renders a new `RecibosValorizacionPanelComponent` as a fixed overlay. The panel component owns search state internally and filters concepts with a `computed` signal.

**Tech Stack:** Angular 21, Vitest, Angular Signals (`signal`, `computed`, `effect`), CSS-in-component (no PrimeNG for this layout).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/app/features/nomina/recibos/ui/recibos-valorizacion-panel.component.ts` | Drawer panel: search, filter, color-coded table |
| Create | `src/app/features/nomina/recibos/ui/recibos-valorizacion-panel.component.spec.ts` | Unit tests for filter logic |
| Modify | `src/app/features/nomina/recibos/ui/recibos-detail.component.ts` | Wire up drawer: signal, effect, button, overlay |

---

## Task 1: `RecibosValorizacionPanelComponent` — failing tests first

**Files:**
- Create: `src/app/features/nomina/recibos/ui/recibos-valorizacion-panel.component.spec.ts`

- [ ] **Step 1.1 — Write the spec file**

```typescript
// src/app/features/nomina/recibos/ui/recibos-valorizacion-panel.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { RecibosValorizacionPanelComponent } from './recibos-valorizacion-panel.component';
import { PayrollConceptModel } from '../models/payroll-concept.model';

function makeConcept(code: string, label: string, nature = 'EARNING'): PayrollConceptModel {
  return {
    lineNumber: 1,
    conceptCode: code,
    conceptLabel: label,
    amount: 100,
    quantity: null,
    rate: null,
    conceptNatureCode: nature,
    originPeriodCode: null,
    displayOrder: 1,
  };
}

describe('RecibosValorizacionPanelComponent', () => {
  let component: RecibosValorizacionPanelComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(RecibosValorizacionPanelComponent);
    component = fixture.componentInstance;
  });

  it('returns all concepts when search is empty', () => {
    component.concepts = [makeConcept('101', 'Salario Base'), makeConcept('770', 'Retención IRPF')];
    expect(component.filteredConcepts()).toHaveLength(2);
  });

  it('filters by conceptCode case-insensitively', () => {
    component.concepts = [makeConcept('101', 'Salario Base'), makeConcept('770', 'Retención IRPF')];
    component.searchTerm.set('77');
    expect(component.filteredConcepts()).toHaveLength(1);
    expect(component.filteredConcepts()[0].conceptCode).toBe('770');
  });

  it('filters by conceptLabel case-insensitively', () => {
    component.concepts = [makeConcept('101', 'Salario Base'), makeConcept('B_CC', 'Base Cotización Comunes')];
    component.searchTerm.set('base');
    expect(component.filteredConcepts()).toHaveLength(1);
    expect(component.filteredConcepts()[0].conceptCode).toBe('B_CC');
  });

  it('emits close when onClose() is called', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push());
    component.onClose();
    expect(emitted).toHaveLength(1);
  });
});
```

- [ ] **Step 1.2 — Run tests to confirm they fail (component not found)**

```bash
cd b4rrhh_frontend
npm run test -- --reporter=verbose recibos-valorizacion-panel
```

Expected: 4 failing tests with "Cannot find module './recibos-valorizacion-panel.component'".

---

## Task 2: Implement `RecibosValorizacionPanelComponent`

**Files:**
- Create: `src/app/features/nomina/recibos/ui/recibos-valorizacion-panel.component.ts`

- [ ] **Step 2.1 — Create the component**

```typescript
// src/app/features/nomina/recibos/ui/recibos-valorizacion-panel.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollConceptModel } from '../models/payroll-concept.model';

const NATURE_COLOR: Record<string, string> = {
  EARNING: '#a6e3a1',
  DEDUCTION: '#f38ba8',
  BASE: '#89b4fa',
  TECHNICAL: '#cba6f7',
  INFORMATIONAL: '#fab387',
  TOTAL_EARNING: '#6c7086',
  TOTAL_DEDUCTION: '#6c7086',
  NET_PAY: '#6c7086',
};

@Component({
  selector: 'app-recibos-valorizacion-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- overlay -->
    <div class="overlay" (click)="onClose()"></div>

    <!-- drawer -->
    <div class="drawer">
      <!-- header -->
      <div class="drawer-header">
        <div>
          <div class="drawer-title">Valorización</div>
          <div class="drawer-subtitle">{{ payrollKey }}</div>
        </div>
        <button class="close-btn" (click)="onClose()">✕</button>
      </div>

      <!-- search -->
      <div class="search-bar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            class="search-input"
            type="text"
            placeholder="Buscar por código o concepto…"
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)"
          />
        </div>
      </div>

      <!-- legend -->
      <div class="legend">
        @for (item of legendItems; track item.nature) {
          <span class="legend-item" [style.color]="item.color">■ {{ item.label }}</span>
        }
      </div>

      <!-- table -->
      <div class="table-wrap">
        @if (loading) {
          <div class="loading-msg">Cargando conceptos…</div>
        } @else if (filteredConcepts().length === 0) {
          <div class="loading-msg">Sin resultados.</div>
        } @else {
          <table class="val-table">
            <thead>
              <tr>
                <th class="col-stripe"></th>
                <th class="col-code">Clave</th>
                <th class="col-label">Concepto</th>
                <th class="col-num">Cant.</th>
                <th class="col-num">Tarifa</th>
                <th class="col-num">Importe</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredConcepts(); track c.lineNumber) {
                <tr class="val-row">
                  <td class="col-stripe" [style.background]="colorFor(c.conceptNatureCode)"></td>
                  <td class="col-code-cell">{{ c.conceptCode }}</td>
                  <td class="col-label-cell">{{ c.conceptLabel }}</td>
                  <td class="col-num-cell">{{ c.quantity != null ? fmt(c.quantity) : '—' }}</td>
                  <td class="col-num-cell">{{ c.rate != null ? fmt(c.rate) : '—' }}</td>
                  <td class="col-num-cell" [style.color]="colorFor(c.conceptNatureCode)">
                    {{ c.amount != null ? fmt(c.amount) : '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 99;
      }
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 99;
      }
      .drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 460px;
        background: #1e1e2e;
        z-index: 100;
        display: flex;
        flex-direction: column;
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
        animation: slideIn 280ms ease;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to   { transform: translateX(0); }
      }
      .drawer-header {
        padding: 12px 16px;
        border-bottom: 1px solid #313244;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
      .drawer-title {
        color: #cdd6f4;
        font-size: 13px;
        font-weight: 700;
      }
      .drawer-subtitle {
        color: #6c7086;
        font-size: 10px;
        margin-top: 2px;
      }
      .close-btn {
        background: none;
        border: 1px solid #45475a;
        color: #cdd6f4;
        width: 26px;
        height: 26px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .close-btn:hover {
        background: #313244;
      }
      .search-bar {
        padding: 10px 16px;
        border-bottom: 1px solid #313244;
        flex-shrink: 0;
      }
      .search-wrap {
        position: relative;
      }
      .search-icon {
        position: absolute;
        left: 9px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
      }
      .search-input {
        width: 100%;
        background: #313244;
        border: 1px solid #45475a;
        border-radius: 4px;
        padding: 7px 10px 7px 28px;
        color: #cdd6f4;
        font-size: 12px;
        box-sizing: border-box;
        outline: none;
      }
      .search-input:focus {
        border-color: #89b4fa;
      }
      .search-input::placeholder {
        color: #585b70;
      }
      .legend {
        padding: 6px 16px;
        border-bottom: 1px solid #313244;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      .legend-item {
        font-size: 9px;
        font-weight: 600;
      }
      .table-wrap {
        flex: 1;
        overflow-y: auto;
      }
      .loading-msg {
        color: #6c7086;
        font-size: 12px;
        padding: 20px 16px;
      }
      .val-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .val-table thead {
        position: sticky;
        top: 0;
        background: #181825;
      }
      .val-table th {
        padding: 6px 8px;
        color: #6c7086;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        text-align: left;
      }
      .col-stripe { width: 3px; padding: 0 !important; }
      .col-code   { width: 80px; }
      .col-label  { }
      .col-num    { width: 70px; text-align: right !important; }
      .val-row { border-bottom: 1px solid #313244; }
      .val-row:hover { background: #24273a; }
      .col-stripe { padding: 0; }
      .col-code-cell {
        padding: 5px 8px;
        color: #cdd6f4;
        font-family: monospace;
        font-size: 10px;
      }
      .col-label-cell {
        padding: 5px 8px;
        color: #cdd6f4;
      }
      .col-num-cell {
        padding: 5px 8px;
        text-align: right;
        color: #585b70;
        font-weight: 600;
      }
    `,
  ],
})
export class RecibosValorizacionPanelComponent {
  private readonly _concepts = signal<ReadonlyArray<PayrollConceptModel>>([]);

  set concepts(val: ReadonlyArray<PayrollConceptModel>) {
    this._concepts.set(val);
  }

  loading = false;
  payrollKey = '';

  @Output() close = new EventEmitter<void>();

  readonly searchTerm = signal('');

  readonly filteredConcepts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this._concepts();
    return this._concepts().filter(
      (c) =>
        c.conceptCode.toLowerCase().includes(term) ||
        c.conceptLabel.toLowerCase().includes(term),
    );
  });

  readonly legendItems = [
    { nature: 'EARNING',     label: 'Devengo',    color: '#a6e3a1' },
    { nature: 'DEDUCTION',   label: 'Deducción',  color: '#f38ba8' },
    { nature: 'BASE',        label: 'Base',       color: '#89b4fa' },
    { nature: 'TECHNICAL',   label: 'Técnico',    color: '#cba6f7' },
    { nature: 'INFORMATIONAL', label: 'Informativo', color: '#fab387' },
    { nature: 'NET_PAY',     label: 'Totales/Liq.', color: '#6c7086' },
  ];

  colorFor(nature: string): string {
    return NATURE_COLOR[nature] ?? '#6c7086';
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  onClose(): void {
    this.close.emit();
  }
}
```

- [ ] **Step 2.2 — Run tests and confirm they pass**

```bash
npm run test -- --reporter=verbose recibos-valorizacion-panel
```

Expected: 4 passing tests.

- [ ] **Step 2.3 — Run full suite to check no regressions**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 2.4 — Commit**

```bash
git add src/app/features/nomina/recibos/ui/recibos-valorizacion-panel.component.ts \
        src/app/features/nomina/recibos/ui/recibos-valorizacion-panel.component.spec.ts
git commit -m "feat(recibos): add RecibosValorizacionPanelComponent with search and color-coding"
```

---

## Task 3: Wire up drawer in `RecibosDetailComponent`

**Files:**
- Modify: `src/app/features/nomina/recibos/ui/recibos-detail.component.ts`

The current file imports `CommonModule` and `RecibosFolioComponent`. We add:
- `signal` and `effect` to the `@angular/core` import
- `RecibosValorizacionPanelComponent` to `imports`
- `drawerOpen` signal and `closeDrawerEffect`
- A "⊞ Valorización" button in the action bar
- The panel overlay rendered when `drawerOpen()` is true

- [ ] **Step 3.1 — Update `recibos-detail.component.ts`**

Replace the full file content:

```typescript
// src/app/features/nomina/recibos/ui/recibos-detail.component.ts
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecibosStore } from '../store/recibos.store';
import { RecibosFolioComponent } from './recibos-folio.component';
import { RecibosValorizacionPanelComponent } from './recibos-valorizacion-panel.component';

const STATUS_LABELS: Record<string, string> = {
  CALCULATED: 'CALCULADA',
  NOT_VALID: 'INVÁLIDA',
  EXPLICIT_VALIDATED: 'VALIDADA',
  DEFINITIVE: 'DEFINITIVA',
};

@Component({
  selector: 'app-recibos-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RecibosFolioComponent, RecibosValorizacionPanelComponent],
  template: `
    @if (store.selectedPayroll(); as payroll) {
      <div class="action-bar">
        <div class="action-bar-info">
          <span class="payroll-key"
            >{{ payroll.employeeNumber }} · Período {{ payroll.payrollPeriodCode }}</span
          >
          <span class="status-badge" [class]="'badge-' + payroll.status.toLowerCase()">
            {{ statusLabel(payroll.status) }}
          </span>
        </div>
        <div class="action-bar-buttons">
          @if (payroll.status === 'CALCULATED') {
            <button
              class="btn btn-invalidar"
              [disabled]="store.transitioning()"
              (click)="invalidate()"
            >
              Invalidar
            </button>
            <button class="btn btn-validar" [disabled]="store.transitioning()" (click)="validate()">
              Validar
            </button>
          }
          @if (payroll.status === 'NOT_VALID') {
            <button
              class="btn btn-recalcular"
              [disabled]="store.transitioning()"
              (click)="recalculate()"
            >
              Recalcular
            </button>
          }
          @if (!store.conceptsLoading()) {
            <button class="btn btn-valorizacion" (click)="drawerOpen.set(true)">
              ⊞ Valorización
            </button>
          }
        </div>
      </div>

      @if (store.transitionError()) {
        <div class="transition-error">{{ store.transitionError() }}</div>
      }

      <div class="folio-wrapper">
        @if (store.conceptsLoading()) {
          <div class="loading-msg">Cargando conceptos...</div>
        } @else {
          <app-recibos-folio
            [concepts]="store.concepts()"
            [employeeNumber]="payroll.employeeNumber"
            [payrollPeriodCode]="payroll.payrollPeriodCode"
            [companyProfile]="store.companyProfile()"
            [employeeProfile]="store.employeeProfile()"
            [agreementProfile]="store.agreementProfile()"
            [presenceStartDate]="store.presenceStartDate()"
            [presenceEndDate]="store.presenceEndDate()"
            [workCenterCode]="store.workCenterCode()"
            [workCenterName]="store.workCenterName()"
          />
        }
      </div>

      @if (drawerOpen()) {
        <app-recibos-valorizacion-panel
          [concepts]="store.concepts()"
          [loading]="store.conceptsLoading()"
          [payrollKey]="payroll.employeeNumber + ' · Período ' + payroll.payrollPeriodCode"
          (close)="drawerOpen.set(false)"
        />
      }
    } @else {
      <div class="no-selection">Selecciona una nómina de la lista para ver el detalle.</div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow-y: auto;
        background: #d1d5db;
        padding: 16px 20px;
        gap: 12px;
      }
      .action-bar {
        background: #1e1e2e;
        padding: 8px 14px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 780px;
      }
      .payroll-key {
        color: #89b4fa;
        font-size: 12px;
        font-weight: 600;
      }
      .status-badge {
        margin-left: 10px;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        color: #1e1e2e;
      }
      .badge-calculated { background: #a6e3a1; }
      .badge-not_valid { background: #f38ba8; }
      .badge-explicit_validated { background: #89b4fa; }
      .badge-definitive { background: #cba6f7; }
      .action-bar-buttons {
        display: flex;
        gap: 8px;
      }
      .btn {
        border: none;
        padding: 5px 14px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-invalidar { background: #f38ba8; color: #1e1e2e; }
      .btn-validar { background: #89b4fa; color: #1e1e2e; }
      .btn-recalcular { background: #fab387; color: #1e1e2e; }
      .btn-valorizacion { background: #cba6f7; color: #1e1e2e; }
      .transition-error {
        max-width: 780px;
        background: #f38ba8;
        color: #1e1e2e;
        padding: 8px 14px;
        border-radius: 4px;
        font-size: 11px;
      }
      .folio-wrapper { max-width: 780px; }
      .loading-msg,
      .no-selection {
        color: #6c7086;
        font-size: 12px;
        padding: 20px;
      }
    `,
  ],
})
export class RecibosDetailComponent {
  protected readonly store = inject(RecibosStore);
  readonly drawerOpen = signal(false);

  constructor() {
    effect(() => {
      this.store.selectedKey();
      this.drawerOpen.set(false);
    });
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  invalidate(): void {
    const key = this.store.selectedKey();
    if (key) this.store.invalidate(key);
  }

  validate(): void {
    const key = this.store.selectedKey();
    if (key) this.store.validate(key);
  }

  recalculate(): void {
    const key = this.store.selectedKey();
    if (key) this.store.recalculate(key);
  }
}
```

- [ ] **Step 3.2 — Run the full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 3.3 — Commit**

```bash
git add src/app/features/nomina/recibos/ui/recibos-detail.component.ts
git commit -m "feat(recibos): wire valorización drawer into RecibosDetailComponent"
```

---

## Self-Review

| Spec requirement | Covered by |
|---|---|
| Drawer lateral derecho | Task 2 — `.drawer { position: fixed; right: 0 }` with slide animation |
| Overlay semitransparente | Task 2 — `.overlay` div detrás del drawer |
| Botón "⊞ Valorización" en action bar | Task 3 — `.btn-valorizacion` |
| Cierra con ✕ y click en overlay | Task 2 — `onClose()` en overlay y close-btn |
| Cierra al cambiar de nómina | Task 3 — `effect()` watching `store.selectedKey()` |
| Lista plana ordenada por `displayOrder` | Task 3 — `store.concepts()` ya ordenado por el gateway |
| Franja de color por naturaleza | Task 2 — `col-stripe` cell con `[style.background]` |
| Importe coloreado por naturaleza | Task 2 — `[style.color]` en col-num-cell de importe |
| Búsqueda por código y etiqueta | Task 2 — `filteredConcepts` computed |
| Leyenda de colores | Task 2 — `.legend` con `legendItems` |
| No cambios en backend ni store | ✅ Solo frontend |
