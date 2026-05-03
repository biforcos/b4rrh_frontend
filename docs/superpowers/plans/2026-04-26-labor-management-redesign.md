# Labor Management UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `temporal-section` action-vocabulary pattern with a period-table + modal pattern across all labor management tabs, and redesign the journey timeline to Style C (color-coded cards).

**Architecture:** Two new shared components (`period-table`, `period-modal`) consumed by all section components. Zero changes to stores, gateways, mappers or OpenAPI. Section components keep their inject/catalog logic; only their template + internal state machine changes.

**Tech Stack:** Angular 21, standalone components, `input()` signals, `ContentChild`/`TemplateRef`, PrimeNG Dialog, Vitest, SCSS BEM.

---

## File Map

```
shared/ui/period-table/
  period-table.model.ts        CREATE
  period-table.component.ts    CREATE
  period-table.component.html  CREATE
  period-table.component.scss  CREATE
  period-table.component.spec.ts CREATE

shared/ui/period-modal/
  period-modal.component.ts    CREATE
  period-modal.component.html  CREATE
  period-modal.component.scss  CREATE
  period-modal.component.spec.ts CREATE

presence/components/
  employee-presence-block.component.html   REPLACE template
  employee-presence-block.component.scss   REPLACE styles
  employee-contract-section.component.ts   REPLACE logic
  employee-contract-section.component.html REPLACE template
  employee-contract-section.component.scss REPLACE styles
  employee-contract-section.component.spec.ts UPDATE tests
  employee-working-time-section.component.ts   REPLACE logic
  employee-working-time-section.component.html REPLACE template
  employee-working-time-section.component.spec.ts UPDATE tests
  employee-labor-classification-section.component.ts   REPLACE logic
  employee-labor-classification-section.component.html REPLACE template
  employee-labor-classification-section.component.spec.ts UPDATE tests
  employee-work-center-section.component.ts   REPLACE logic
  employee-work-center-section.component.html REPLACE template
  employee-work-center-section.component.spec.ts UPDATE tests

organization/components/
  employee-cost-center-section.component.ts   REPLACE logic
  employee-cost-center-section.component.html REPLACE template

organization/pages/
  employee-organization-page.component.html   REMOVE future placeholder

shell/components/
  employee-journey-timeline.component.ts   ADD resolveGroupIconBackground()
  employee-journey-timeline.component.html REPLACE template
  employee-journey-timeline.component.scss REPLACE styles

shared/ui/section/
  temporal-section.component.ts   DELETE (after all sections migrated)
  temporal-section.model.ts       DELETE
```

> **Important locations:**
> - All paths relative to `b4rrhh_frontend/src/app/features/employee/`
> - `employee-work-center-section` lives in `presence/components/`, not `organization/`

---

## Task 1: Create `period-table` component

**Files:**
- Create: `shared/ui/period-table/period-table.model.ts`
- Create: `shared/ui/period-table/period-table.component.ts`
- Create: `shared/ui/period-table/period-table.component.html`
- Create: `shared/ui/period-table/period-table.component.scss`
- Create: `shared/ui/period-table/period-table.component.spec.ts`

- [ ] **Step 1: Write the failing spec**

```typescript
// period-table.component.spec.ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeriodTableComponent } from './period-table.component';
import { PeriodTableRow } from './period-table.model';

interface TestRow extends PeriodTableRow { label: string; }
const row = (o: Partial<TestRow> = {}): TestRow =>
  ({ startDate: '2024-01-01', endDate: null, isActive: true, label: 'A', ...o });

@Component({
  template: `
    <app-period-table [rows]="rows" sectionTitle="Test"
      (addClicked)="adds++" (editClicked)="editIdx=$event" (deleteClicked)="delIdx=$event">
      <ng-template #columnHeaders><th>Label</th></ng-template>
      <ng-template #cellContent let-r><td>{{ r.label }}</td></ng-template>
    </app-period-table>`,
  imports: [PeriodTableComponent],
})
class Host { rows: TestRow[] = []; adds = 0; editIdx: number|null = null; delIdx: number|null = null; }

describe('PeriodTableComponent', () => {
  let fix: ComponentFixture<Host>;
  let host: Host;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fix = TestBed.createComponent(Host); host = fix.componentInstance; fix.detectChanges();
  });

  it('shows empty when no rows', () => expect(fix.nativeElement.querySelector('.period-table__empty')).toBeTruthy());

  it('renders active row with Vigente badge', () => {
    host.rows = [row()]; fix.detectChanges();
    expect(fix.nativeElement.querySelector('.period-table__badge--active')).toBeTruthy();
    expect(fix.nativeElement.querySelector('.period-table__td--period').textContent).toContain('2024-01-01');
  });

  it('shows delete only for non-active canDelete rows', () => {
    host.rows = [row({ isActive: true }), row({ isActive: false, canDelete: true })];
    fix.detectChanges();
    expect(fix.nativeElement.querySelectorAll('[aria-label="Eliminar"]').length).toBe(1);
  });

  it('emits addClicked', () => {
    fix.nativeElement.querySelector('.period-table__add-btn').click();
    expect(host.adds).toBe(1);
  });

  it('emits editClicked with index', () => {
    host.rows = [row()]; fix.detectChanges();
    fix.nativeElement.querySelector('[aria-label="Editar"]').click();
    expect(host.editIdx).toBe(0);
  });

  it('hides edit button when canEdit is false', () => {
    host.rows = [row({ canEdit: false })]; fix.detectChanges();
    expect(fix.nativeElement.querySelector('[aria-label="Editar"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL (component not found)**

```bash
cd b4rrhh_frontend && npm run test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|period-table"
```

- [ ] **Step 3: Create `period-table.model.ts`**

```typescript
// period-table.model.ts
export interface PeriodTableRow {
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  canEdit?: boolean;    // default true
  canDelete?: boolean;  // default false
}
```

- [ ] **Step 4: Create `period-table.component.ts`**

```typescript
import {
  ChangeDetectionStrategy, Component, ContentChild,
  TemplateRef, input, output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PeriodTableRow } from './period-table.model';

@Component({
  selector: 'app-period-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './period-table.component.html',
  styleUrl: './period-table.component.scss',
})
export class PeriodTableComponent<T extends PeriodTableRow = PeriodTableRow> {
  readonly rows = input<ReadonlyArray<T>>([]);
  readonly sectionTitle = input('');
  readonly addLabel = input('+ Nuevo período');
  readonly emptyMessage = input('Sin períodos registrados');

  readonly addClicked = output<void>();
  readonly editClicked = output<number>();
  readonly deleteClicked = output<number>();

  @ContentChild('columnHeaders') readonly columnHeadersTemplate: TemplateRef<unknown> | null = null;
  @ContentChild('cellContent') readonly cellContentTemplate: TemplateRef<{ $implicit: T; index: number }> | null = null;

  protected formatPeriod(row: T): string {
    return row.endDate ? `${row.startDate} — ${row.endDate}` : `${row.startDate} — en vigor`;
  }

  protected showEdit(row: T): boolean { return row.canEdit !== false; }
  protected showDelete(row: T): boolean { return !row.isActive && row.canDelete === true; }
  protected trackBy(index: number): number { return index; }
}
```

- [ ] **Step 5: Create `period-table.component.html`**

```html
<div class="period-table">
  <div class="period-table__header">
    <h3 class="period-table__title">{{ sectionTitle() }}</h3>
    <button type="button" class="period-table__add-btn" (click)="addClicked.emit()">{{ addLabel() }}</button>
  </div>

  @if (rows().length === 0) {
    <p class="period-table__empty">{{ emptyMessage() }}</p>
  } @else {
    <table class="period-table__table">
      <thead>
        <tr>
          <th class="period-table__th">Período</th>
          @if (columnHeadersTemplate) {
            <ng-container [ngTemplateOutlet]="columnHeadersTemplate" />
          }
          <th class="period-table__th">Estado</th>
          <th class="period-table__th period-table__th--actions"></th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track trackBy($index)) {
          <tr class="period-table__row" [class.period-table__row--active]="row.isActive">
            <td class="period-table__td period-table__td--period">{{ formatPeriod(row) }}</td>
            @if (cellContentTemplate) {
              <ng-container
                [ngTemplateOutlet]="cellContentTemplate"
                [ngTemplateOutletContext]="{ $implicit: row, index: $index }" />
            }
            <td class="period-table__td">
              <span class="period-table__badge" [class.period-table__badge--active]="row.isActive">
                {{ row.isActive ? 'Vigente' : 'Cerrado' }}
              </span>
            </td>
            <td class="period-table__td period-table__td--actions">
              <div class="period-table__actions">
                @if (showEdit(row)) {
                  <button type="button" class="period-table__icon-btn"
                    aria-label="Editar" (click)="editClicked.emit($index)">✏</button>
                }
                @if (showDelete(row)) {
                  <button type="button" class="period-table__icon-btn period-table__icon-btn--danger"
                    aria-label="Eliminar" (click)="deleteClicked.emit($index)">🗑</button>
                }
              </div>
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
</div>
```

- [ ] **Step 6: Create `period-table.component.scss`**

```scss
.period-table {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  &__title {
    font-size: 14px; font-weight: 600; color: #111827; margin: 0;
  }
  &__add-btn {
    background: #eff6ff; color: #1d4ed8; border: none;
    border-radius: 7px; padding: 5px 12px; font-size: 13px;
    font-weight: 500; cursor: pointer;
    &:hover { background: #dbeafe; }
  }
  &__table { width: 100%; border-collapse: collapse; }
  &__th {
    text-align: left; font-size: 11px; color: #6b7280;
    font-weight: 500; padding: 8px 10px; background: #fafafa;
    border-bottom: 1px solid #e5e7eb; text-transform: uppercase;
    letter-spacing: 0.04em;
    &--actions { width: 80px; }
  }
  &__row {
    border-bottom: 1px solid #f3f4f6;
    &--active { background: #fafffe; }
  }
  &__td {
    padding: 10px; font-size: 13px; color: #374151;
    &--period { font-variant-numeric: tabular-nums; }
    &--actions { width: 80px; }
  }
  &__badge {
    display: inline-flex; align-items: center; padding: 2px 8px;
    border-radius: 9999px; font-size: 11px; font-weight: 500;
    background: #f3f4f6; color: #9ca3af;
    &--active { background: #dcfce7; color: #166534; }
  }
  &__actions { display: flex; gap: 4px; align-items: center; }
  &__icon-btn {
    width: 28px; height: 28px; display: flex; align-items: center;
    justify-content: center; border: 1px solid #e5e7eb; border-radius: 5px;
    background: #f9fafb; color: #6b7280; cursor: pointer; font-size: 13px;
    &:hover { background: #f3f4f6; }
    &--danger:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }
  }
  &__empty { color: #9ca3af; font-size: 13px; padding: 16px 0; text-align: center; }
}
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
npm run test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|period-table"
```
Expected: `PASS  period-table.component.spec.ts`

- [ ] **Step 8: Commit**

```bash
git add src/app/features/employee/shared/ui/period-table/
git commit -m "feat(employee): add period-table shared component"
```

---

## Task 2: Create `period-modal` component

**Files:**
- Create: `shared/ui/period-modal/period-modal.component.ts`
- Create: `shared/ui/period-modal/period-modal.component.html`
- Create: `shared/ui/period-modal/period-modal.component.scss`
- Create: `shared/ui/period-modal/period-modal.component.spec.ts`

- [ ] **Step 1: Write the failing spec**

```typescript
// period-modal.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PeriodModalComponent } from './period-modal.component';

describe('PeriodModalComponent', () => {
  let fix: ComponentFixture<PeriodModalComponent>;
  let c: PeriodModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodModalComponent, NoopAnimationsModule],
    }).compileComponents();
    fix = TestBed.createComponent(PeriodModalComponent);
    c = fix.componentInstance;
  });

  it('creates', () => expect(c).toBeTruthy());

  it('emits submitted when enabled and not saving', () => {
    fix.componentRef.setInput('submitEnabled', true);
    fix.componentRef.setInput('saving', false);
    const spy = vi.fn();
    c.submitted.subscribe(spy);
    c.onSubmit();
    expect(spy).toHaveBeenCalled();
  });

  it('does not emit submitted when saving', () => {
    fix.componentRef.setInput('saving', true);
    fix.componentRef.setInput('submitEnabled', true);
    const spy = vi.fn();
    c.submitted.subscribe(spy);
    c.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits cancelled and visibleChange(false) on cancel', () => {
    const cancelSpy = vi.fn(); const visibleSpy = vi.fn();
    c.cancelled.subscribe(cancelSpy); c.visibleChange.subscribe(visibleSpy);
    c.onCancel();
    expect(cancelSpy).toHaveBeenCalled();
    expect(visibleSpy).toHaveBeenCalledWith(false);
  });

  it('emits closeActionClicked', () => {
    const spy = vi.fn(); c.closeActionClicked.subscribe(spy);
    c.onCloseAction(); expect(spy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|period-modal"
```

- [ ] **Step 3: Create `period-modal.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-period-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule],
  templateUrl: './period-modal.component.html',
  styleUrl: './period-modal.component.scss',
})
export class PeriodModalComponent {
  readonly title = input('');
  readonly subtitle = input<string | null>(null);
  readonly visible = input(false);
  readonly saving = input(false);
  readonly submitEnabled = input(true);
  readonly submitLabel = input('Guardar cambios');
  readonly showCloseAction = input(false);
  readonly closeActionLabel = input('Cerrar período');

  readonly visibleChange = output<boolean>();
  readonly submitted = output<void>();
  readonly cancelled = output<void>();
  readonly closeActionClicked = output<void>();

  onSubmit(): void {
    if (!this.saving() && this.submitEnabled()) this.submitted.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.visibleChange.emit(false);
  }

  onHide(): void { this.onCancel(); }
  onCloseAction(): void { this.closeActionClicked.emit(); }
}
```

- [ ] **Step 4: Create `period-modal.component.html`**

```html
<p-dialog
  [header]="title()"
  [visible]="visible()"
  (visibleChange)="visibleChange.emit($event)"
  (onHide)="onHide()"
  [modal]="true"
  [draggable]="false"
  [resizable]="false"
  [style]="{ width: '520px' }"
  styleClass="period-modal-dialog"
>
  @if (subtitle()) {
    <p class="period-modal__subtitle">{{ subtitle() }}</p>
  }
  <div class="period-modal__body">
    <ng-content />
  </div>

  <ng-template pTemplate="footer">
    <div class="period-modal__footer">
      @if (showCloseAction()) {
        <button type="button" class="period-modal__close-action-btn" (click)="onCloseAction()">
          {{ closeActionLabel() }}
        </button>
      }
      <div class="period-modal__footer-actions">
        <button type="button" class="period-modal__cancel-btn" (click)="onCancel()">Cancelar</button>
        <button type="button" class="period-modal__submit-btn"
          [disabled]="!submitEnabled() || saving()" (click)="onSubmit()">
          @if (saving()) { <span class="period-modal__spinner" aria-hidden="true"></span> }
          {{ submitLabel() }}
        </button>
      </div>
    </div>
  </ng-template>
</p-dialog>
```

- [ ] **Step 5: Create `period-modal.component.scss`**

```scss
.period-modal {
  &__subtitle { font-size: 13px; color: #6b7280; margin: -8px 0 16px; }
  &__body { display: flex; flex-direction: column; gap: 14px; }
  &__footer { display: flex; justify-content: space-between; align-items: center; width: 100%; }
  &__footer-actions { display: flex; gap: 8px; margin-left: auto; }
  &__close-action-btn, &__cancel-btn {
    background: none; border: 1px solid #e5e7eb; border-radius: 7px;
    padding: 7px 14px; font-size: 13px; color: #374151; cursor: pointer;
    &:hover { background: #f9fafb; }
  }
  &__submit-btn {
    background: #6366f1; border: none; border-radius: 7px;
    padding: 7px 16px; font-size: 13px; font-weight: 500; color: white;
    cursor: pointer; display: flex; align-items: center; gap: 6px;
    &:hover:not(:disabled) { background: #4f46e5; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
  &__spinner {
    width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: pm-spin 0.6s linear infinite;
  }
}
@keyframes pm-spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm run test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|period-modal"
```

- [ ] **Step 7: Commit**

```bash
git add src/app/features/employee/shared/ui/period-modal/
git commit -m "feat(employee): add period-modal shared component"
```

---

## Task 3: Redesign `employee-presence-block` → compact card

**Files:**
- Modify: `presence/components/employee-presence-block.component.html`
- Modify: `presence/components/employee-presence-block.component.scss`

The TS logic is unchanged. Only template and styles.

- [ ] **Step 1: Replace the template**

Replace the full contents of `employee-presence-block.component.html` with:

```html
<div class="presence-card">
  @if (currentPresence(); as p) {
    <div class="presence-card__content">
      <div class="presence-card__main">
        <span class="presence-card__company">{{ resolveCompanyLabel(p) }}</span>
        <span class="presence-card__meta">
          {{ resolveEntryReasonLabel(p) }} · {{ buildPeriodLabel(p) }} · #{{ p.presenceNumber }}
        </span>
      </div>
      <span class="presence-card__badge" [class.presence-card__badge--active]="p.isActive">
        {{ resolveStatusLabel(p) }}
      </span>
    </div>
  } @else {
    <p class="presence-card__empty">{{ texts.presenceBlockEmptyMessage }}</p>
  }
</div>
```

- [ ] **Step 2: Replace the styles**

Replace the full contents of `employee-presence-block.component.scss` with:

```scss
.presence-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;

  &__content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  &__main { display: flex; flex-direction: column; gap: 2px; }

  &__company { font-size: 14px; font-weight: 600; color: #111827; }

  &__meta { font-size: 12px; color: #6b7280; }

  &__badge {
    display: inline-flex; align-items: center; padding: 3px 10px;
    border-radius: 9999px; font-size: 11px; font-weight: 500;
    background: #f3f4f6; color: #9ca3af; white-space: nowrap;
    &--active { background: #dcfce7; color: #166534; }
  }

  &__empty { font-size: 13px; color: #9ca3af; margin: 0; }
}
```

- [ ] **Step 3: Verify in browser that the presence block shows as a compact horizontal card**

- [ ] **Step 4: Commit**

```bash
git add src/app/features/employee/presence/components/employee-presence-block.component.html \
        src/app/features/employee/presence/components/employee-presence-block.component.scss
git commit -m "feat(employee): redesign presence block as compact card"
```

---

## Task 4: Redesign `employee-contract-section`

**Store methods (unchanged):**
- `replaceFromDate(key, { effectiveDate, contractCode, contractSubtypeCode })`
- `correctOccurrence(key, startDate, { contractCode, contractSubtypeCode })`
- `closeOccurrence(key, startDate, { endDate })`

**Modal modes:**
- `create` → `replaceFromDate` — shows effectiveDate + type + subtype
- `edit` → `correctOccurrence` — shows type + subtype (vigente row also shows "Cerrar período" button)
- `close` → `closeOccurrence` — shows only endDate

**Files:**
- Modify: `presence/components/employee-contract-section.component.ts`
- Modify: `presence/components/employee-contract-section.component.html`
- Modify: `presence/components/employee-contract-section.component.scss`
- Modify: `presence/components/employee-contract-section.component.spec.ts`

- [ ] **Step 1: Replace `employee-contract-section.component.ts`**

Keep all existing imports for store, gateway, field catalog, text keys. Replace the internal state machine with:

```typescript
import {
  ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked
} from '@angular/core';
import { take } from 'rxjs';

import { EmployeeContractCatalogGateway } from '../../data-access/employee-contract-catalog.gateway';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeContractStore } from '../../data-access/employee-contract.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeContractModel } from '../../models/employee-contract.model';
import { EmployeeContractCatalogItemModel } from '../../models/employee-contract-catalog-item.model';
import { SlotKeyOption } from '../../shared/ui/section/editable-slot-section.model';
import { UiDateInputComponent } from '../../../../shared/ui/date-input/ui-date-input.component';
import { UiSelectComponent } from '../../../../shared/ui/select/ui-select.component';
import { PeriodTableComponent } from '../../shared/ui/period-table/period-table.component';
import { PeriodModalComponent } from '../../shared/ui/period-modal/period-modal.component';
import { PeriodTableRow } from '../../shared/ui/period-table/period-table.model';
import { currentLocalDate } from '../../../../shared/utils/local-date.util';

type ContractModalMode = 'create' | 'edit' | 'close';

interface ContractPeriodRow extends PeriodTableRow {
  contractCode: string;
  contractSubtypeCode: string | null;
  contractTypeName: string | null;
  contractSubtypeName: string | null;
}

@Component({
  selector: 'app-employee-contract-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PeriodTableComponent, PeriodModalComponent, UiDateInputComponent, UiSelectComponent],
  templateUrl: './employee-contract-section.component.html',
  styleUrl: './employee-contract-section.component.scss',
})
export class EmployeeContractSectionComponent {
  readonly employeeBusinessKey = input<EmployeeBusinessKey | null>(null);

  private readonly contractStore = inject(EmployeeContractStore);
  private readonly fieldCatalogService = inject(EmployeeFieldCatalogService);
  private readonly contractCatalogGateway = inject(EmployeeContractCatalogGateway);

  // Modal state
  protected readonly modalVisible = signal(false);
  protected readonly modalMode = signal<ContractModalMode>('create');
  protected readonly editingStartDate = signal<string | null>(null);
  protected readonly editingIsActive = signal(false);
  protected readonly effectiveDateDraft = signal('');
  protected readonly contractCodeDraft = signal('');
  protected readonly contractSubtypeCodeDraft = signal('');
  protected readonly endDateDraft = signal('');

  // Catalog options
  private readonly contractTypeOptionsState = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  private readonly subtypeOptionsState = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  private readonly subtypeLoadingState = signal(false);
  private subtypeRequestId = 0;
  private contractTypeRequestId = 0;

  protected readonly texts = employeeTexts;

  protected readonly rows = computed<ReadonlyArray<ContractPeriodRow>>(() =>
    this.contractStore.contracts().map((c) => ({
      startDate: c.startDate,
      endDate: c.endDate,
      isActive: c.isActive,
      canEdit: true,
      canDelete: false,
      contractCode: c.contractCode,
      contractSubtypeCode: c.contractSubtypeCode,
      contractTypeName: c.contractTypeName ?? null,
      contractSubtypeName: c.contractSubtypeName ?? null,
    })),
  );

  protected readonly contractTypeOptions = this.contractTypeOptionsState.asReadonly();
  protected readonly subtypeOptions = this.subtypeOptionsState.asReadonly();
  protected readonly subtypeLoading = this.subtypeLoadingState.asReadonly();
  protected readonly subtypeDisabled = computed(
    () => !this.contractCodeDraft() || this.subtypeLoadingState(),
  );
  protected readonly saving = computed(
    () => this.contractStore.mutating(),
  );

  protected readonly modalTitle = computed(() => {
    if (this.modalMode() === 'create') return 'Nuevo período — Contrato';
    if (this.modalMode() === 'close') return 'Cerrar período — Contrato';
    return 'Editar período — Contrato';
  });

  protected readonly modalSubtitle = computed(() => {
    const sd = this.editingStartDate();
    if (!sd) return null;
    return `Desde ${sd}`;
  });

  protected readonly isSubmitEnabled = computed(() => {
    const mode = this.modalMode();
    if (mode === 'create') {
      return !!this.effectiveDateDraft() && !!this.contractCodeDraft() && !!this.contractSubtypeCodeDraft();
    }
    if (mode === 'edit') {
      return !!this.contractCodeDraft() && !!this.contractSubtypeCodeDraft();
    }
    return !!this.endDateDraft();
  });

  constructor() {
    effect(() => {
      const key = this.employeeBusinessKey();
      untracked(() => {
        this.contractStore.loadContractsByBusinessKey(key);
        this.loadContractTypeOptions(key?.ruleSystemCode ?? null);
      });
    });

    effect(() => {
      const success = this.contractStore.success();
      if (success && this.modalVisible()) {
        untracked(() => this.closeModal());
      }
    });
  }

  protected openCreate(): void {
    this.contractStore.clearFeedback();
    this.modalMode.set('create');
    this.effectiveDateDraft.set(currentLocalDate());
    this.contractCodeDraft.set('');
    this.contractSubtypeCodeDraft.set('');
    this.subtypeOptionsState.set([]);
    this.modalVisible.set(true);
  }

  protected openEdit(index: number): void {
    const row = this.rows()[index];
    if (!row) return;
    this.contractStore.clearFeedback();
    this.modalMode.set('edit');
    this.editingStartDate.set(row.startDate);
    this.editingIsActive.set(row.isActive);
    this.contractCodeDraft.set(row.contractCode);
    this.contractSubtypeCodeDraft.set(row.contractSubtypeCode ?? '');
    this.loadSubtypeOptions(row.contractCode, row.startDate, row.contractSubtypeCode ?? null);
    this.modalVisible.set(true);
  }

  protected switchToClose(): void {
    this.modalMode.set('close');
    this.endDateDraft.set(currentLocalDate());
  }

  protected submit(): void {
    const key = this.employeeBusinessKey();
    if (!key || this.contractStore.mutating()) return;
    const mode = this.modalMode();

    if (mode === 'create') {
      this.contractStore.replaceFromDate(key, {
        effectiveDate: this.effectiveDateDraft(),
        contractCode: this.contractCodeDraft(),
        contractSubtypeCode: this.contractSubtypeCodeDraft(),
      });
    } else if (mode === 'edit') {
      const startDate = this.editingStartDate()!;
      this.contractStore.correctOccurrence(key, startDate, {
        contractCode: this.contractCodeDraft(),
        contractSubtypeCode: this.contractSubtypeCodeDraft(),
      });
    } else {
      const startDate = this.editingStartDate()!;
      this.contractStore.closeOccurrence(key, startDate, { endDate: this.endDateDraft() });
    }
  }

  protected closeModal(): void {
    this.modalVisible.set(false);
    this.contractStore.clearFeedback();
  }

  protected updateContractCode(value: string): void {
    const changed = this.contractCodeDraft() !== value;
    this.contractCodeDraft.set(value);
    if (changed) {
      this.contractSubtypeCodeDraft.set('');
      this.loadSubtypeOptions(value, this.effectiveDateDraft() || null, null);
    }
  }

  private closeModal(): void { this.modalVisible.set(false); }

  private loadContractTypeOptions(ruleSystemCode: string | null): void {
    if (!ruleSystemCode) { this.contractTypeOptionsState.set([]); return; }
    const id = ++this.contractTypeRequestId;
    this.fieldCatalogService.loadContractTypeOptions(ruleSystemCode).pipe(take(1)).subscribe({
      next: (opts) => { if (id === this.contractTypeRequestId) this.contractTypeOptionsState.set(opts); },
    });
  }

  private loadSubtypeOptions(contractCode: string, referenceDate: string | null, preferred: string | null): void {
    if (!contractCode) { this.subtypeOptionsState.set([]); return; }
    const rsc = this.employeeBusinessKey()?.ruleSystemCode ?? '';
    if (!rsc) return;
    const id = ++this.subtypeRequestId;
    this.subtypeLoadingState.set(true);
    this.contractCatalogGateway.loadContractSubtypes(rsc, contractCode, referenceDate).pipe(take(1)).subscribe({
      next: (items) => {
        if (id !== this.subtypeRequestId) return;
        this.subtypeOptionsState.set(items.map((i: EmployeeContractCatalogItemModel) => ({ value: i.code, label: i.label })));
        this.subtypeLoadingState.set(false);
      },
      error: () => { if (id === this.subtypeRequestId) this.subtypeLoadingState.set(false); },
    });
  }
}
```

- [ ] **Step 2: Replace `employee-contract-section.component.html`**

```html
<div class="contract-section">
  <app-period-table
    sectionTitle="Contrato"
    [rows]="rows()"
    (addClicked)="openCreate()"
    (editClicked)="openEdit($event)"
  >
    <ng-template #columnHeaders>
      <th>Tipo</th>
      <th>Subtipo</th>
    </ng-template>
    <ng-template #cellContent let-row>
      <td class="contract-section__cell">{{ row.contractTypeName || row.contractCode }}</td>
      <td class="contract-section__cell contract-section__cell--secondary">
        {{ row.contractSubtypeName || row.contractSubtypeCode || '—' }}
      </td>
    </ng-template>
  </app-period-table>

  <app-period-modal
    [title]="modalTitle()"
    [subtitle]="modalSubtitle()"
    [visible]="modalVisible()"
    [saving]="saving()"
    [submitEnabled]="isSubmitEnabled()"
    [showCloseAction]="modalMode() === 'edit' && editingIsActive()"
    (visibleChange)="modalVisible.set($event)"
    (submitted)="submit()"
    (cancelled)="closeModal()"
    (closeActionClicked)="switchToClose()"
  >
    @if (modalMode() === 'create') {
      <app-ui-date-input
        label="Efectivo desde"
        [value]="effectiveDateDraft()"
        (valueChange)="effectiveDateDraft.set($event)" />
      <app-ui-select
        label="Tipo de contrato"
        [options]="contractTypeOptions()"
        [value]="contractCodeDraft()"
        (valueChange)="updateContractCode($event)" />
      <app-ui-select
        label="Subtipo"
        [options]="subtypeOptions()"
        [value]="contractSubtypeCodeDraft()"
        [disabled]="subtypeDisabled()"
        [loading]="subtypeLoading()"
        (valueChange)="contractSubtypeCodeDraft.set($event)" />
    }

    @if (modalMode() === 'edit') {
      <app-ui-select
        label="Tipo de contrato"
        [options]="contractTypeOptions()"
        [value]="contractCodeDraft()"
        (valueChange)="updateContractCode($event)" />
      <app-ui-select
        label="Subtipo"
        [options]="subtypeOptions()"
        [value]="contractSubtypeCodeDraft()"
        [disabled]="subtypeDisabled()"
        [loading]="subtypeLoading()"
        (valueChange)="contractSubtypeCodeDraft.set($event)" />
    }

    @if (modalMode() === 'close') {
      <app-ui-date-input
        label="Fecha fin"
        [value]="endDateDraft()"
        (valueChange)="endDateDraft.set($event)" />
    }
  </app-period-modal>
</div>
```

- [ ] **Step 3: Replace `employee-contract-section.component.scss`**

```scss
.contract-section {
  &__cell { font-size: 13px; color: #374151; }
  &__cell--secondary { color: #6b7280; font-size: 12px; }
}
```

- [ ] **Step 4: Update spec — replace `findRow` and action-name assertions with new DOM selectors**

Replace the full spec with:

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EmployeeContractCatalogGateway } from '../../data-access/employee-contract-catalog.gateway';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeContractStore } from '../../data-access/employee-contract.store';
import { EmployeeContractModel } from '../../models/employee-contract.model';
import { EmployeeContractSectionComponent } from './employee-contract-section.component';

const employeeKey = { ruleSystemCode: 'RS1', employeeTypeCode: 'EMP', employeeNumber: '0001' };

class MockContractStore {
  readonly contractsState = signal<ReadonlyArray<EmployeeContractModel>>([]);
  readonly contracts = this.contractsState.asReadonly();
  readonly loading = signal(false).asReadonly();
  readonly mutating = signal(false).asReadonly();
  readonly error = signal<string | null>(null).asReadonly();
  readonly success = signal<string | null>(null).asReadonly();
  readonly loadContractsByBusinessKey = vi.fn();
  readonly replaceFromDate = vi.fn();
  readonly correctOccurrence = vi.fn();
  readonly closeOccurrence = vi.fn();
  readonly clearFeedback = vi.fn();
}

describe('EmployeeContractSectionComponent', () => {
  let fix: ComponentFixture<EmployeeContractSectionComponent>;
  let store: MockContractStore;
  let fieldCatalog: { loadContractTypeOptions: ReturnType<typeof vi.fn> };
  let catalogGateway: { loadContractSubtypes: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    store = new MockContractStore();
    fieldCatalog = { loadContractTypeOptions: vi.fn().mockReturnValue(of([{ value: 'PERM', label: 'Indefinido' }])) };
    catalogGateway = { loadContractSubtypes: vi.fn().mockReturnValue(of([{ code: 'PERM-FULL', label: 'Full · PERM-FULL' }])) };

    await TestBed.configureTestingModule({
      imports: [EmployeeContractSectionComponent, NoopAnimationsModule],
      providers: [
        { provide: EmployeeContractStore, useValue: store },
        { provide: EmployeeFieldCatalogService, useValue: fieldCatalog },
        { provide: EmployeeContractCatalogGateway, useValue: catalogGateway },
      ],
    }).compileComponents();
    fix = TestBed.createComponent(EmployeeContractSectionComponent);
    fix.componentRef.setInput('employeeBusinessKey', employeeKey);
    fix.detectChanges();
  });

  it('renders period-table with add button', () => {
    expect(fix.nativeElement.querySelector('.period-table__add-btn')).toBeTruthy();
  });

  it('shows a row per contract', () => {
    store.contractsState.set([
      { contractCode: 'PERM', contractSubtypeCode: 'PERM-FULL', startDate: '2024-01-01', endDate: null, isActive: true },
    ]);
    fix.detectChanges();
    expect(fix.nativeElement.querySelectorAll('.period-table__row').length).toBe(1);
  });

  it('opens create modal on add click', () => {
    fix.nativeElement.querySelector('.period-table__add-btn').click();
    fix.detectChanges();
    const component = fix.componentInstance as any;
    expect(component.modalVisible()).toBe(true);
    expect(component.modalMode()).toBe('create');
  });

  it('calls replaceFromDate on create submit', () => {
    const component = fix.componentInstance as any;
    component.modalMode.set('create');
    component.effectiveDateDraft.set('2025-06-01');
    component.contractCodeDraft.set('PERM');
    component.contractSubtypeCodeDraft.set('PERM-FULL');
    component.submit();
    expect(store.replaceFromDate).toHaveBeenCalledWith(employeeKey, {
      effectiveDate: '2025-06-01', contractCode: 'PERM', contractSubtypeCode: 'PERM-FULL',
    });
  });

  it('calls correctOccurrence on edit submit', () => {
    store.contractsState.set([
      { contractCode: 'PERM', contractSubtypeCode: 'PERM-FULL', startDate: '2024-01-01', endDate: null, isActive: true },
    ]);
    fix.detectChanges();
    const component = fix.componentInstance as any;
    component.openEdit(0);
    component.contractCodeDraft.set('TEMP');
    component.contractSubtypeCodeDraft.set('TEMP-EVT');
    component.submit();
    expect(store.correctOccurrence).toHaveBeenCalledWith(employeeKey, '2024-01-01', {
      contractCode: 'TEMP', contractSubtypeCode: 'TEMP-EVT',
    });
  });

  it('calls closeOccurrence after switchToClose', () => {
    store.contractsState.set([
      { contractCode: 'PERM', contractSubtypeCode: null, startDate: '2024-01-01', endDate: null, isActive: true },
    ]);
    fix.detectChanges();
    const component = fix.componentInstance as any;
    component.openEdit(0);
    component.switchToClose();
    component.endDateDraft.set('2025-12-31');
    component.submit();
    expect(store.closeOccurrence).toHaveBeenCalledWith(employeeKey, '2024-01-01', { endDate: '2025-12-31' });
  });
});
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm run test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|contract-section"
```

- [ ] **Step 6: Commit**

```bash
git add src/app/features/employee/presence/components/employee-contract-section.component.*
git commit -m "feat(employee): redesign contract section with period-table + modal"
```

---

## Task 5: Redesign `employee-working-time-section`

**Store methods:** `createWorkingTime(key, draft)`, `closeWorkingTime(key, number, draft)`

**Draft types:** `WorkingTimeCreateDraft = { startDate, workingTimePercentage }`, `WorkingTimeCloseDraft = { endDate }`

**UX rules:**
- `+ Nuevo período` → `createWorkingTime` (shows startDate + percentage)
- `✏ vigente` → shows close modal only (no correctWorkingTime exists)
- Historical rows: `canEdit: false` (no store method to correct history)

**Files:** Modify `presence/components/employee-working-time-section.component.{ts,html,spec.ts}`

- [ ] **Step 1: Replace `employee-working-time-section.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import { EmployeeWorkingTimeStore } from '../../data-access/employee-working-time.store';
import { WorkingTimeCreateDraft, WorkingTimeCloseDraft } from '../../data-access/employee-working-time.mapper';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeWorkingTimeModel } from '../../models/employee-working-time.model';
import { UiDateInputComponent } from '../../../../shared/ui/date-input/ui-date-input.component';
import { UiInputNumberComponent } from '../../../../shared/ui/input-number/ui-input-number.component';
import { PeriodTableComponent } from '../../shared/ui/period-table/period-table.component';
import { PeriodModalComponent } from '../../shared/ui/period-modal/period-modal.component';
import { PeriodTableRow } from '../../shared/ui/period-table/period-table.model';
import { currentLocalDate } from '../../../../shared/utils/local-date.util';

type WorkingTimeModalMode = 'create' | 'close';

interface WorkingTimePeriodRow extends PeriodTableRow {
  workingTimeNumber: number;
  workingTimePercentage: number;
  weeklyHours: number;
  dailyHours: number;
}

@Component({
  selector: 'app-employee-working-time-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PeriodTableComponent, PeriodModalComponent, UiDateInputComponent, UiInputNumberComponent],
  templateUrl: './employee-working-time-section.component.html',
  styleUrl: './employee-working-time-section.component.scss',
})
export class EmployeeWorkingTimeSectionComponent {
  readonly employeeBusinessKey = input<EmployeeBusinessKey | null>(null);

  private readonly workingTimeStore = inject(EmployeeWorkingTimeStore);

  protected readonly modalVisible = signal(false);
  protected readonly modalMode = signal<WorkingTimeModalMode>('create');
  protected readonly editingNumber = signal<number | null>(null);
  protected readonly startDateDraft = signal(currentLocalDate());
  protected readonly percentageDraft = signal(100);
  protected readonly endDateDraft = signal('');

  protected readonly texts = employeeTexts;

  protected readonly rows = computed<ReadonlyArray<WorkingTimePeriodRow>>(() =>
    this.workingTimeStore.workingTimes().map((wt) => ({
      startDate: wt.startDate,
      endDate: wt.endDate,
      isActive: wt.isActive,
      canEdit: wt.isActive, // only active can be closed
      canDelete: false,
      workingTimeNumber: wt.workingTimeNumber,
      workingTimePercentage: wt.workingTimePercentage,
      weeklyHours: wt.weeklyHours,
      dailyHours: wt.dailyHours,
    })),
  );

  protected readonly saving = computed(() => this.workingTimeStore.mutating());

  protected readonly modalTitle = computed(() =>
    this.modalMode() === 'create' ? 'Nueva jornada' : 'Cerrar período — Jornada',
  );

  protected readonly isSubmitEnabled = computed(() =>
    this.modalMode() === 'create' ? !!this.startDateDraft() : !!this.endDateDraft(),
  );

  constructor() {
    effect(() => {
      const key = this.employeeBusinessKey();
      untracked(() => this.workingTimeStore.loadWorkingTimesByBusinessKey(key));
    });

    effect(() => {
      const success = this.workingTimeStore.success();
      if (success && this.modalVisible()) untracked(() => this.closeModal());
    });
  }

  protected openCreate(): void {
    this.workingTimeStore.clearFeedback();
    this.modalMode.set('create');
    this.startDateDraft.set(currentLocalDate());
    this.percentageDraft.set(100);
    this.modalVisible.set(true);
  }

  protected openEdit(index: number): void {
    const row = this.rows()[index];
    if (!row || !row.isActive) return;
    this.workingTimeStore.clearFeedback();
    this.modalMode.set('close');
    this.editingNumber.set(row.workingTimeNumber);
    this.endDateDraft.set(currentLocalDate());
    this.modalVisible.set(true);
  }

  protected submit(): void {
    const key = this.employeeBusinessKey();
    if (!key || this.workingTimeStore.mutating()) return;

    if (this.modalMode() === 'create') {
      this.workingTimeStore.createWorkingTime(key, {
        startDate: this.startDateDraft(),
        workingTimePercentage: this.percentageDraft(),
      });
    } else {
      this.workingTimeStore.closeWorkingTime(key, this.editingNumber()!, { endDate: this.endDateDraft() });
    }
  }

  protected closeModal(): void {
    this.modalVisible.set(false);
    this.workingTimeStore.clearFeedback();
  }
}
```

- [ ] **Step 2: Replace `employee-working-time-section.component.html`**

```html
<div class="working-time-section">
  <app-period-table
    sectionTitle="Jornada"
    [rows]="rows()"
    (addClicked)="openCreate()"
    (editClicked)="openEdit($event)"
  >
    <ng-template #columnHeaders>
      <th>%</th>
      <th>Horas/sem</th>
    </ng-template>
    <ng-template #cellContent let-row>
      <td>{{ row.workingTimePercentage }}%</td>
      <td>{{ row.weeklyHours }} h/sem
        <span class="working-time-section__sub">({{ row.dailyHours }} h/día)</span>
      </td>
    </ng-template>
  </app-period-table>

  <app-period-modal
    [title]="modalTitle()"
    [visible]="modalVisible()"
    [saving]="saving()"
    [submitEnabled]="isSubmitEnabled()"
    [submitLabel]="modalMode() === 'close' ? 'Cerrar jornada' : 'Guardar'"
    (visibleChange)="modalVisible.set($event)"
    (submitted)="submit()"
    (cancelled)="closeModal()"
  >
    @if (modalMode() === 'create') {
      <app-ui-date-input label="Efectivo desde" [value]="startDateDraft()" (valueChange)="startDateDraft.set($event)" />
      <app-ui-input-number label="Porcentaje de jornada (%)" [value]="percentageDraft()" (valueChange)="percentageDraft.set($event)" [min]="1" [max]="100" />
    }
    @if (modalMode() === 'close') {
      <app-ui-date-input label="Fecha fin" [value]="endDateDraft()" (valueChange)="endDateDraft.set($event)" />
    }
  </app-period-modal>
</div>
```

Add `&__sub { font-size: 11px; color: #9ca3af; }` to the SCSS file.

- [ ] **Step 3: Update spec — mirror the contract spec pattern, verifying `createWorkingTime` and `closeWorkingTime` calls**

```typescript
// (abbreviated — follow the same MockStore + signal pattern as Task 4)
it('calls createWorkingTime on create submit', () => {
  const component = fix.componentInstance as any;
  component.modalMode.set('create');
  component.startDateDraft.set('2025-06-01');
  component.percentageDraft.set(50);
  component.submit();
  expect(store.createWorkingTime).toHaveBeenCalledWith(employeeKey, { startDate: '2025-06-01', workingTimePercentage: 50 });
});

it('calls closeWorkingTime on close submit', () => {
  const component = fix.componentInstance as any;
  component.modalMode.set('close');
  component.editingNumber.set(3);
  component.endDateDraft.set('2025-12-31');
  component.submit();
  expect(store.closeWorkingTime).toHaveBeenCalledWith(employeeKey, 3, { endDate: '2025-12-31' });
});
```

- [ ] **Step 4: Run tests and commit**

```bash
npm run test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|working-time"
git add src/app/features/employee/presence/components/employee-working-time-section.component.*
git commit -m "feat(employee): redesign working-time section with period-table + modal"
```

---

## Task 6: Redesign `employee-labor-classification-section`

**Store methods:** `replaceFromDate(key, draft)`, `correctOccurrence(key, startDate, draft)`, `closeOccurrence(key, startDate, draft)`

**Draft types:** `LaborClassificationReplaceDraft = { effectiveDate, agreementCode, agreementCategoryCode }`, `LaborClassificationCorrectDraft = { agreementCode, agreementCategoryCode }`, `LaborClassificationCloseDraft = { endDate }`

**Pattern:** Identical to Task 4 (contract). Three modal modes: `create` / `edit` / `close`. Vigente row shows "Cerrar período" secondary button. Historical rows edit agreement/category only.

- [ ] **Step 1: Replace `employee-labor-classification-section.component.ts`**

Mirror the contract section component, substituting:
- `EmployeeContractStore` → `EmployeeLaborClassificationStore`
- `EmployeeFieldCatalogService.loadContractTypeOptions` → `.loadAgreementOptions`
- `EmployeeContractCatalogGateway.loadContractSubtypes` → `EmployeeLaborClassificationCatalogGateway.loadAgreementCategories`
- Draft fields: `contractCode/contractSubtypeCode` → `agreementCode/agreementCategoryCode`
- Store calls: `replaceFromDate({ effectiveDate, agreementCode, agreementCategoryCode })`, `correctOccurrence(key, startDate, { agreementCode, agreementCategoryCode })`, `closeOccurrence(key, startDate, { endDate })`
- Row fields: `contractTypeName/contractSubtypeName` → `agreementName/agreementCategoryName`
- Modal title: `'Nuevo período — Convenio'` / `'Editar período — Convenio'` / `'Cerrar período — Convenio'`

- [ ] **Step 2: Replace template**

```html
<!-- Same structure as contract-section.component.html, column headers: Convenio / Categoría -->
<ng-template #columnHeaders>
  <th>Convenio</th>
  <th>Categoría</th>
</ng-template>
<ng-template #cellContent let-row>
  <td>{{ row.agreementName || row.agreementCode }}</td>
  <td>{{ row.agreementCategoryName || row.agreementCategoryCode }}</td>
</ng-template>
```

Modal body uses `app-ui-select` for agreementCode and agreementCategoryCode.

- [ ] **Step 3: Update spec — verify replaceFromDate, correctOccurrence, closeOccurrence calls (same pattern as Task 4)**

- [ ] **Step 4: Run tests and commit**

```bash
npm run test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|labor-classification"
git add src/app/features/employee/presence/components/employee-labor-classification-section.component.*
git commit -m "feat(employee): redesign labor-classification section with period-table + modal"
```

---

## Task 7: Redesign `employee-work-center-section`

**Store methods:** `createWorkCenter(key, draft)`, `correctWorkCenter(key, number, draft)`, `closeWorkCenter(key, number, endDate)`, `deleteWorkCenter(key, number)`

**Draft types:** `WorkCenterCreateDraft = { workCenterCode, startDate, endDate }`, `WorkCenterCorrectDraft = { workCenterCode, startDate, endDate }`

**UX rules:**
- `+` → `createWorkCenter` (startDate + workCenterCode)
- `✏ vigente` → `correctWorkCenter` + "Cerrar período" button → `closeWorkCenter`
- `✏ histórico` → `correctWorkCenter`
- `🗑 histórico (canDelete)` → confirmation dialog → `deleteWorkCenter`

- [ ] **Step 1: Replace `employee-work-center-section.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeWorkCenterStore } from '../../data-access/employee-work-center.store';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { SlotKeyOption } from '../../shared/ui/section/editable-slot-section.model';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { UiDateInputComponent } from '../../../../shared/ui/date-input/ui-date-input.component';
import { UiSelectComponent } from '../../../../shared/ui/select/ui-select.component';
import { PeriodTableComponent } from '../../shared/ui/period-table/period-table.component';
import { PeriodModalComponent } from '../../shared/ui/period-modal/period-modal.component';
import { PeriodTableRow } from '../../shared/ui/period-table/period-table.model';
import { currentLocalDate } from '../../../../shared/utils/local-date.util';

type WorkCenterModalMode = 'create' | 'edit' | 'close';

interface WorkCenterPeriodRow extends PeriodTableRow {
  assignmentNumber: number;
  workCenterCode: string;
  workCenterName: string | null;
}

@Component({
  selector: 'app-employee-work-center-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PeriodTableComponent, PeriodModalComponent, UiDateInputComponent, UiSelectComponent],
  templateUrl: './employee-work-center-section.component.html',
  styleUrl: './employee-work-center-section.component.scss',
})
export class EmployeeWorkCenterSectionComponent {
  readonly employeeBusinessKey = input<EmployeeBusinessKey | null>(null);

  private readonly workCenterStore = inject(EmployeeWorkCenterStore);
  private readonly fieldCatalogService = inject(EmployeeFieldCatalogService);

  protected readonly modalVisible = signal(false);
  protected readonly modalMode = signal<WorkCenterModalMode>('create');
  protected readonly editingNumber = signal<number | null>(null);
  protected readonly editingIsActive = signal(false);
  protected readonly startDateDraft = signal(currentLocalDate());
  protected readonly endDateDraft = signal('');
  protected readonly workCenterCodeDraft = signal('');
  protected readonly confirmDeleteNumber = signal<number | null>(null);
  protected readonly workCenterOptions = signal<ReadonlyArray<SlotKeyOption<string>>>([]);

  protected readonly texts = employeeTexts;

  protected readonly rows = computed<ReadonlyArray<WorkCenterPeriodRow>>(() =>
    this.workCenterStore.workCenters().map((wc) => ({
      startDate: wc.startDate,
      endDate: wc.endDate,
      isActive: wc.isActive,
      canEdit: true,
      canDelete: !wc.isActive && wc.canDelete,
      assignmentNumber: wc.workCenterAssignmentNumber,
      workCenterCode: wc.workCenterCode,
      workCenterName: wc.workCenterName ?? null,
    })),
  );

  protected readonly saving = computed(() => this.workCenterStore.mutating());
  protected readonly isSubmitEnabled = computed(() => {
    if (this.modalMode() === 'close') return !!this.endDateDraft();
    return !!this.startDateDraft() && !!this.workCenterCodeDraft();
  });
  protected readonly modalTitle = computed(() => {
    if (this.modalMode() === 'create') return 'Nuevo centro de trabajo';
    if (this.modalMode() === 'close') return 'Cerrar período — Centro de trabajo';
    return 'Editar centro de trabajo';
  });

  constructor() {
    effect(() => {
      const key = this.employeeBusinessKey();
      untracked(() => {
        this.workCenterStore.loadWorkCentersByBusinessKey(key);
        this.loadWorkCenterOptions(key?.ruleSystemCode ?? null);
      });
    });
    effect(() => {
      const success = this.workCenterStore.success();
      if (success && this.modalVisible()) untracked(() => this.closeModal());
    });
  }

  protected openCreate(): void {
    this.workCenterStore.clearFeedback();
    this.modalMode.set('create');
    this.startDateDraft.set(currentLocalDate());
    this.endDateDraft.set('');
    this.workCenterCodeDraft.set('');
    this.modalVisible.set(true);
  }

  protected openEdit(index: number): void {
    const row = this.rows()[index];
    if (!row) return;
    this.workCenterStore.clearFeedback();
    this.editingNumber.set(row.assignmentNumber);
    this.editingIsActive.set(row.isActive);
    this.workCenterCodeDraft.set(row.workCenterCode);
    this.startDateDraft.set(row.startDate);
    this.endDateDraft.set(row.endDate ?? '');
    this.modalMode.set('edit');
    this.modalVisible.set(true);
  }

  protected switchToClose(): void {
    this.modalMode.set('close');
    this.endDateDraft.set(currentLocalDate());
  }

  protected confirmDelete(index: number): void {
    const row = this.rows()[index];
    if (!row || !row.canDelete) return;
    if (confirm('¿Eliminar este período de centro de trabajo?')) {
      this.workCenterStore.deleteWorkCenter(this.employeeBusinessKey()!, row.assignmentNumber);
    }
  }

  protected submit(): void {
    const key = this.employeeBusinessKey();
    if (!key || this.workCenterStore.mutating()) return;

    if (this.modalMode() === 'create') {
      this.workCenterStore.createWorkCenter(key, {
        workCenterCode: this.workCenterCodeDraft(),
        startDate: this.startDateDraft(),
        endDate: this.endDateDraft(),
      });
    } else if (this.modalMode() === 'edit') {
      this.workCenterStore.correctWorkCenter(key, this.editingNumber()!, {
        workCenterCode: this.workCenterCodeDraft(),
        startDate: this.startDateDraft(),
        endDate: this.endDateDraft(),
      });
    } else {
      this.workCenterStore.closeWorkCenter(key, this.editingNumber()!, this.endDateDraft());
    }
  }

  protected closeModal(): void {
    this.modalVisible.set(false);
    this.workCenterStore.clearFeedback();
  }

  private loadWorkCenterOptions(ruleSystemCode: string | null): void {
    if (!ruleSystemCode) { this.workCenterOptions.set([]); return; }
    this.fieldCatalogService.loadWorkCenterOptions(ruleSystemCode).pipe(take(1)).subscribe({
      next: (opts) => this.workCenterOptions.set(opts),
    });
  }
}
```

- [ ] **Step 2: Replace template**

```html
<div class="work-center-section">
  <app-period-table
    sectionTitle="Centro de trabajo"
    [rows]="rows()"
    (addClicked)="openCreate()"
    (editClicked)="openEdit($event)"
    (deleteClicked)="confirmDelete($event)"
  >
    <ng-template #columnHeaders><th>Centro</th></ng-template>
    <ng-template #cellContent let-row>
      <td>{{ row.workCenterName || row.workCenterCode }}</td>
    </ng-template>
  </app-period-table>

  <app-period-modal
    [title]="modalTitle()"
    [visible]="modalVisible()"
    [saving]="saving()"
    [submitEnabled]="isSubmitEnabled()"
    [showCloseAction]="modalMode() === 'edit' && editingIsActive()"
    (visibleChange)="modalVisible.set($event)"
    (submitted)="submit()"
    (cancelled)="closeModal()"
    (closeActionClicked)="switchToClose()"
  >
    @if (modalMode() !== 'close') {
      <app-ui-select label="Centro de trabajo" [options]="workCenterOptions()"
        [value]="workCenterCodeDraft()" (valueChange)="workCenterCodeDraft.set($event)" />
      <app-ui-date-input label="Fecha inicio" [value]="startDateDraft()" (valueChange)="startDateDraft.set($event)" />
      <app-ui-date-input label="Fecha fin (opcional)" [value]="endDateDraft()" (valueChange)="endDateDraft.set($event)" />
    }
    @if (modalMode() === 'close') {
      <app-ui-date-input label="Fecha fin" [value]="endDateDraft()" (valueChange)="endDateDraft.set($event)" />
    }
  </app-period-modal>
</div>
```

- [ ] **Step 3: Update spec — verify createWorkCenter, correctWorkCenter, closeWorkCenter, deleteWorkCenter**

- [ ] **Step 4: Run tests and commit**

```bash
npm run test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|work-center"
git add src/app/features/employee/presence/components/employee-work-center-section.component.*
git commit -m "feat(employee): redesign work-center section with period-table + modal"
```

---

## Task 8: Redesign `employee-cost-center-section`

**Store signals:** `currentDistribution()`, `history()` (ReadonlyArray of windows)

**Store methods:** `createDistribution(key, draft)`, `replaceDistribution(key, draft)`, `closeDistribution(key, startDate, endDate)`

**Approach:** Flatten current + history into a single rows array for the period table. The modal reuses the existing `EmployeeCostCenterDistributionEditorComponent` unchanged.

- [ ] **Step 1: Replace `employee-cost-center-section.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';

import { EmployeeCostCenterStore } from '../../data-access/employee-cost-center.store';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeCostCenterWindowModel } from '../../models/employee-cost-center.model';
import { employeeTexts } from '../../employee.texts';
import { PeriodTableComponent } from '../../shared/ui/period-table/period-table.component';
import { PeriodModalComponent } from '../../shared/ui/period-modal/period-modal.component';
import { PeriodTableRow } from '../../shared/ui/period-table/period-table.model';
import { EmployeeCostCenterDistributionEditorComponent } from './employee-cost-center-distribution-editor.component';
import { UiDateInputComponent } from '../../../../shared/ui/date-input/ui-date-input.component';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { SlotKeyOption } from '../../shared/ui/section/editable-slot-section.model';
import { take } from 'rxjs';
import { currentLocalDate } from '../../../../shared/utils/local-date.util';

type CostCenterModalMode = 'replace' | 'close';

interface CostCenterPeriodRow extends PeriodTableRow {
  window: EmployeeCostCenterWindowModel;
  totalPercentage: number;
  itemsSummary: string;
}

@Component({
  selector: 'app-employee-cost-center-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PeriodTableComponent, PeriodModalComponent,
            EmployeeCostCenterDistributionEditorComponent, UiDateInputComponent],
  templateUrl: './employee-cost-center-section.component.html',
  styleUrl: './employee-cost-center-section.component.scss',
})
export class EmployeeCostCenterSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly costCenterStore = inject(EmployeeCostCenterStore);
  private readonly fieldCatalogService = inject(EmployeeFieldCatalogService);

  protected readonly editor = viewChild(EmployeeCostCenterDistributionEditorComponent);

  protected readonly modalVisible = signal(false);
  protected readonly modalMode = signal<CostCenterModalMode>('replace');
  protected readonly closingStartDate = signal<string | null>(null);
  protected readonly endDateDraft = signal('');
  protected readonly costCenterOptions = signal<ReadonlyArray<SlotKeyOption<string>>>([]);

  protected readonly texts = employeeTexts;

  protected readonly rows = computed<ReadonlyArray<CostCenterPeriodRow>>(() => {
    const current = this.costCenterStore.currentDistribution();
    const history = this.costCenterStore.history() ?? [];
    const all: EmployeeCostCenterWindowModel[] = [];
    if (current) all.push(current);
    all.push(...history);
    return all.map((w) => ({
      startDate: w.startDate,
      endDate: w.endDate ?? null,
      isActive: !w.endDate,
      canEdit: !w.endDate, // only active window is editable
      canDelete: false,
      window: w,
      totalPercentage: w.totalAllocationPercentage,
      itemsSummary: w.items.map((i) => `${i.costCenterName ?? i.costCenterCode} (${i.allocationPercentage}%)`).join(', '),
    }));
  });

  protected readonly saving = computed(() => this.costCenterStore.mutating());
  protected readonly isSubmitEnabled = computed(() =>
    this.modalMode() === 'close' ? !!this.endDateDraft() : true,
  );

  constructor() {
    effect(() => {
      const key = this.employeeKey();
      untracked(() => {
        this.costCenterStore.loadByBusinessKey(key);
        this.loadCostCenterOptions(key?.ruleSystemCode ?? null);
      });
    });
    effect(() => {
      if (this.costCenterStore.success() && this.modalVisible()) untracked(() => this.closeModal());
    });
  }

  protected openReplace(): void {
    this.costCenterStore.clearFeedback();
    this.modalMode.set('replace');
    this.modalVisible.set(true);
  }

  protected openClose(): void {
    const current = this.costCenterStore.currentDistribution();
    if (!current) return;
    this.costCenterStore.clearFeedback();
    this.closingStartDate.set(current.startDate);
    this.endDateDraft.set(currentLocalDate());
    this.modalMode.set('close');
    this.modalVisible.set(true);
  }

  protected openEdit(index: number): void {
    const row = this.rows()[index];
    if (!row || !row.isActive) return;
    this.openReplace();
  }

  protected submit(): void {
    const key = this.employeeKey();
    if (!key || this.costCenterStore.mutating()) return;
    if (this.modalMode() === 'replace') {
      const draft = this.editor()?.getDraft();
      if (draft) this.costCenterStore.replaceDistribution(key, draft);
    } else {
      this.costCenterStore.closeDistribution(key, this.closingStartDate()!, this.endDateDraft());
    }
  }

  protected closeModal(): void {
    this.modalVisible.set(false);
    this.costCenterStore.clearFeedback();
  }

  private loadCostCenterOptions(ruleSystemCode: string | null): void {
    if (!ruleSystemCode) { this.costCenterOptions.set([]); return; }
    this.fieldCatalogService.loadCostCenterOptions(ruleSystemCode).pipe(take(1)).subscribe({
      next: (opts) => this.costCenterOptions.set(opts),
    });
  }
}
```

- [ ] **Step 2: Replace template**

```html
<div class="cost-center-section">
  <app-period-table
    sectionTitle="Centro de coste"
    [rows]="rows()"
    addLabel="+ Nueva distribución"
    (addClicked)="openReplace()"
    (editClicked)="openEdit($event)"
  >
    <ng-template #columnHeaders>
      <th>Centros</th>
      <th>Total</th>
    </ng-template>
    <ng-template #cellContent let-row>
      <td class="cost-center-section__summary">{{ row.itemsSummary }}</td>
      <td [class.cost-center-section__total--ok]="row.totalPercentage === 100"
          [class.cost-center-section__total--err]="row.totalPercentage !== 100">
        {{ row.totalPercentage }}%
      </td>
    </ng-template>
  </app-period-table>

  <app-period-modal
    [title]="modalMode() === 'close' ? 'Cerrar distribución' : 'Nueva distribución de coste'"
    [visible]="modalVisible()"
    [saving]="saving()"
    [submitEnabled]="isSubmitEnabled()"
    (visibleChange)="modalVisible.set($event)"
    (submitted)="submit()"
    (cancelled)="closeModal()"
  >
    @if (modalMode() === 'replace') {
      <app-employee-cost-center-distribution-editor [costCenterOptions]="costCenterOptions()" />
    }
    @if (modalMode() === 'close') {
      <app-ui-date-input label="Fecha fin" [value]="endDateDraft()" (valueChange)="endDateDraft.set($event)" />
    }
  </app-period-modal>
</div>
```

Add minimal SCSS: `.cost-center-section__summary { font-size: 12px; color: #6b7280; max-width: 220px; }`, `.cost-center-section__total--ok { color: #166534; font-weight: 600; }`, `.cost-center-section__total--err { color: #dc2626; font-weight: 600; }`

- [ ] **Step 3: Commit**

```bash
git add src/app/features/employee/organization/components/employee-cost-center-section.component.*
git commit -m "feat(employee): redesign cost-center section with period-table + modal"
```

---

## Task 9: Remove org-page future placeholder + delete temporal-section

- [ ] **Step 1: Remove the future section from `employee-organization-page.component.html`**

Remove:
```html
<section class="employee-area__module employee-area__module--future" aria-live="polite">
  <h3>{{ texts.organizationFutureTitle }}</h3>
  <p>{{ texts.organizationFutureDescription }}</p>
  <ul>...</ul>
</section>
```

- [ ] **Step 2: Verify no component still imports `TemporalSectionComponent`**

```bash
grep -r "TemporalSectionComponent\|temporal-section.model" \
  src/app/features/employee/ --include="*.ts" | grep -v "temporal-section.component"
```

Expected: no output.

- [ ] **Step 3: Delete temporal-section files**

```bash
rm src/app/features/employee/shared/ui/section/temporal-section.component.ts
rm src/app/features/employee/shared/ui/section/temporal-section.model.ts
```

- [ ] **Step 4: Run full test suite**

```bash
npm run test 2>&1 | tail -20
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(employee): remove temporal-section and org future placeholder"
```

---

## Task 10: Redesign `employee-journey-timeline` → Style C

**Files:**
- Modify: `shell/components/employee-journey-timeline.component.ts` (add one method)
- Modify: `shell/components/employee-journey-timeline.component.html` (full replace)
- Modify: `shell/components/employee-journey-timeline.component.scss` (full replace)

- [ ] **Step 1: Add `resolveGroupIconBackground` to the component TS**

In `employee-journey-timeline.component.ts`, add one protected method at the bottom (all other logic unchanged):

```typescript
protected resolveGroupIconBackground(group: PresenceDateGroupViewModel): string {
  const label = (group.semanticLabel ?? group.primaryEventLabel).toLowerCase();
  if (label.includes('alta') || label.includes('reingreso')) return '#dcfce7';
  if (label.includes('baja') || label.includes('terminac') || label.includes('despido')) return '#fee2e2';
  if (label.includes('contrato')) return '#ede9fe';
  if (label.includes('jornada')) return '#e0f2fe';
  if (label.includes('clasificac') || label.includes('convenio')) return '#eef2ff';
  return '#f3f4f6';
}
```

- [ ] **Step 2: Replace `employee-journey-timeline.component.html`**

```html
<section class="journey-timeline" aria-labelledby="journey-title">
  <header>
    <button type="button" class="journey-timeline__toggle"
      [attr.aria-expanded]="isExpanded()"
      [attr.aria-label]="toggleAriaLabel()"
      aria-controls="journey-timeline-content"
      (click)="toggle()">
      <span class="journey-timeline__headline">
        <h2 id="journey-title" class="journey-timeline__title">{{ texts.timelineTitle }}</h2>
        <p class="journey-timeline__summary">{{ collapsedSummary() }}</p>
      </span>
      <span class="journey-timeline__chevron" aria-hidden="true">{{ isExpanded() ? '▴' : '▾' }}</span>
    </button>
  </header>

  @if (isExpanded()) {
    <div id="journey-timeline-content">
      @if (loading()) {
        <div class="journey-timeline__loading">
          <div class="journey-timeline__skeleton"></div>
          <div class="journey-timeline__skeleton"></div>
        </div>
      } @else if (error()) {
        <p class="journey-timeline__error">{{ texts.timelineLoadFailedMessage }}</p>
      } @else if (!hasEvents()) {
        <p class="journey-timeline__empty">{{ texts.timelineNoEventsMessage }}</p>
      } @else {
        <ol class="journey-timeline__presences" role="list">
          @for (presence of presenceGroups(); track trackPresenceBy($index, presence)) {
            <li class="journey-presence-card">
              <div class="journey-presence-card__header"
                [class.journey-presence-card__header--active]="presence.isActive"
                [class.journey-presence-card__header--closed]="!presence.isActive">
                <div class="journey-presence-card__header-row">
                  <div>
                    <p class="journey-presence-card__company">{{ presence.company || texts.timelineNoCompanyLabel }}</p>
                    <p class="journey-presence-card__period">
                      {{ presence.start }}
                      @if (presence.end) { → {{ presence.end }} } @else { · {{ texts.timelineCurrentPeriodLabel }} }
                    </p>
                  </div>
                  <span class="journey-presence-card__badge"
                    [class.journey-presence-card__badge--active]="presence.isActive"
                    [class.journey-presence-card__badge--closed]="!presence.isActive">
                    {{ presence.isActive ? texts.timelineCurrentPresenceLabel : texts.timelineClosedPresenceLabel }}
                  </span>
                </div>
                <button type="button" class="journey-presence-card__toggle"
                  [attr.aria-expanded]="isPresenceExpanded(presence.id, presence.isActive)"
                  (click)="togglePresence(presence.id)">
                  {{ isPresenceExpanded(presence.id, presence.isActive) ? texts.timelineCollapseActionLabel : texts.timelineExpandActionLabel }}
                  <span aria-hidden="true">{{ isPresenceExpanded(presence.id, presence.isActive) ? '▴' : '▾' }}</span>
                </button>
              </div>

              @if (isPresenceExpanded(presence.id, presence.isActive)) {
                <ul class="journey-presence-card__events" role="list">
                  @for (group of presence.groupedEvents; track group.eventDate) {
                    <li class="journey-event-row" role="listitem">
                      <div class="journey-event-row__icon"
                        [style.background]="resolveGroupIconBackground(group)"
                        aria-hidden="true"></div>
                      <div class="journey-event-row__body">
                        <p class="journey-event-row__date">{{ group.eventDate }}</p>
                        <p class="journey-event-row__label">{{ group.primaryEventLabel }}</p>
                        @if (group.secondaryEvents.length > 0) {
                          <ul class="journey-event-row__secondary" role="list">
                            @for (ev of group.secondaryEvents; track ev.id) {
                              <li class="journey-event-row__secondary-item">{{ ev.summary }}</li>
                            }
                          </ul>
                        }
                      </div>
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ol>
      }
    </div>
  }
</section>
```

- [ ] **Step 3: Replace `employee-journey-timeline.component.scss`**

```scss
.journey-timeline {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  overflow: hidden;

  &__toggle {
    width: 100%; display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px; background: none; border: none; cursor: pointer; text-align: left;
    &:hover { background: #fafafa; }
  }
  &__headline { display: flex; flex-direction: column; gap: 2px; }
  &__title { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
  &__summary { font-size: 12px; color: #6b7280; margin: 0; }
  &__chevron { color: #9ca3af; font-size: 12px; }

  &__presences { list-style: none; margin: 0; padding: 12px; display: flex; flex-direction: column; gap: 12px; }

  &__loading { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  &__skeleton { height: 80px; background: #f3f4f6; border-radius: 8px; animation: journey-pulse 1.5s ease-in-out infinite; }
  &__error, &__empty { padding: 16px; color: #9ca3af; font-size: 13px; }
}

@keyframes journey-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

// Presence card (Style C)
.journey-presence-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;

  &__header {
    padding: 14px 16px;
    &--active { background: linear-gradient(135deg, #1d4ed8, #4f46e5); color: white; }
    &--closed { background: #f3f4f6; color: #374151; }
  }
  &__header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  &__company { font-size: 14px; font-weight: 600; margin: 0 0 2px; }
  &__period { font-size: 12px; opacity: 0.75; margin: 0; }
  &__badge {
    display: inline-flex; padding: 2px 10px; border-radius: 9999px;
    font-size: 11px; font-weight: 500; white-space: nowrap;
    &--active { background: rgba(255,255,255,0.25); color: white; }
    &--closed { background: #e5e7eb; color: #6b7280; }
  }
  &__toggle {
    margin-top: 8px; background: none; border: none; cursor: pointer;
    font-size: 11px; padding: 0; display: flex; gap: 4px; align-items: center;
    .journey-presence-card__header--active & { color: rgba(255,255,255,0.8); }
    .journey-presence-card__header--closed & { color: #6b7280; }
    &:hover { opacity: 0.8; }
  }
  &__events { list-style: none; margin: 0; padding: 0; }
}

// Event row
.journey-event-row {
  display: flex; gap: 12px; padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }

  &__icon {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
  }
  &__body { flex: 1; }
  &__date { font-size: 11px; color: #9ca3af; margin: 0 0 2px; }
  &__label { font-size: 13px; font-weight: 500; color: #111827; margin: 0 0 4px; }
  &__secondary { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px; }
  &__secondary-item {
    font-size: 11px; color: #6b7280; background: #f9fafb;
    border: 1px solid #f3f4f6; border-radius: 4px; padding: 1px 6px;
  }
}
```

- [ ] **Step 4: Run full test suite**

```bash
npm run test 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add src/app/features/employee/shell/components/employee-journey-timeline.component.*
git commit -m "feat(employee): redesign journey timeline to Style C (color-coded presence cards)"
```

---

## Done criteria per task

| Task | Done when |
|------|-----------|
| 1 period-table | Spec passes; renders custom columns via ContentChild |
| 2 period-modal | Spec passes; wraps PrimeNG Dialog |
| 3 presence block | Compact horizontal card renders in browser |
| 4 contract | Store calls verified in spec; modal opens/closes correctly |
| 5 working time | `createWorkingTime` / `closeWorkingTime` calls verified |
| 6 labor classification | Same behavior as contract, different fields |
| 7 work center | Delete confirmation works; `canDelete` rows show 🗑 |
| 8 cost center | Existing distribution editor renders inside modal |
| 9 cleanup | No imports of `TemporalSectionComponent` remain; future placeholder gone |
| 10 journey | Style C cards visible; icon colors match event category |
