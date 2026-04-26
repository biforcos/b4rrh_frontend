import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecibosStore } from '../store/recibos.store';
import { RecibosFilters } from '../models/recibos-filters.model';
import { PayrollSummaryModel } from '../models/payroll-summary.model';

const STATUS_LABELS: Record<string, string> = {
  CALCULATED: 'CALCULADA',
  NOT_VALID: 'INVÁLIDA',
  EXPLICIT_VALIDATED: 'VALIDADA',
  DEFINITIVE: 'DEFINITIVA',
};

@Component({
  selector: 'app-recibos-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="list-panel">
      <div class="filters">
        <div class="filter-row">
          <div class="filter-field">
            <label>PERÍODO</label>
            <input
              [ngModel]="filters().payrollPeriodCode"
              (ngModelChange)="patchFilter('payrollPeriodCode', $event)"
              placeholder="202604"
            />
          </div>
          <div class="filter-field">
            <label>ESTADO</label>
            <select [ngModel]="filters().status" (ngModelChange)="patchFilter('status', $event)">
              <option value="">Todos</option>
              <option value="CALCULATED">CALCULADA</option>
              <option value="NOT_VALID">INVÁLIDA</option>
              <option value="EXPLICIT_VALIDATED">VALIDADA</option>
              <option value="DEFINITIVE">DEFINITIVA</option>
            </select>
          </div>
        </div>
        <div class="filter-field">
          <label>EMPLEADO</label>
          <input
            [ngModel]="filters().employeeNumber"
            (ngModelChange)="patchFilter('employeeNumber', $event)"
            placeholder="Número o nombre..."
          />
        </div>
        <button class="search-btn" (click)="search()">Buscar</button>
      </div>

      <div class="results">
        @for (payroll of store.payrolls(); track trackPayroll(payroll)) {
          <div class="payroll-row" [class.selected]="isSelected(payroll)" (click)="select(payroll)">
            <div class="row-top">
              <span class="employee-number" [class.bold]="isSelected(payroll)">{{
                payroll.employeeNumber
              }}</span>
              <span class="status-badge" [class]="'badge-' + payroll.status.toLowerCase()">{{
                statusLabel(payroll.status)
              }}</span>
            </div>
            <div class="row-sub">
              {{ payroll.payrollPeriodCode }} · {{ payroll.payrollTypeCode }}
            </div>
          </div>
        }
        @if (store.listLoading()) {
          <div class="list-msg">Buscando...</div>
        }
        @if (store.listError()) {
          <div class="list-msg error">Error al cargar las nóminas.</div>
        }
      </div>

      <div class="list-footer">{{ store.payrolls().length }} nóminas encontradas</div>
    </div>
  `,
  styles: [
    `
      .list-panel {
        width: 300px;
        border-right: 1px solid #313244;
        background: #181825;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }
      .filters {
        padding: 10px;
        border-bottom: 1px solid #313244;
        background: #1e1e2e;
      }
      .filter-row {
        display: flex;
        gap: 6px;
        margin-bottom: 6px;
      }
      .filter-field {
        display: flex;
        flex-direction: column;
        flex: 1;
        margin-bottom: 6px;
      }
      label {
        color: #6c7086;
        font-size: 10px;
        margin-bottom: 2px;
      }
      input,
      select {
        background: #313244;
        padding: 4px 8px;
        border-radius: 4px;
        color: #cdd6f4;
        font-size: 11px;
        border: none;
      }
      .search-btn {
        background: #89b4fa;
        color: #1e1e2e;
        padding: 5px;
        border-radius: 4px;
        text-align: center;
        font-weight: 600;
        font-size: 11px;
        border: none;
        cursor: pointer;
        width: 100%;
      }
      .results {
        overflow-y: auto;
        flex: 1;
      }
      .payroll-row {
        padding: 8px 10px;
        border-bottom: 1px solid #313244;
        border-left: 3px solid transparent;
        cursor: pointer;
      }
      .payroll-row.selected {
        background: #313244;
        border-left-color: #89b4fa;
      }
      .row-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .employee-number {
        color: #cdd6f4;
        font-size: 11px;
      }
      .employee-number.bold {
        font-weight: 600;
      }
      .row-sub {
        color: #6c7086;
        font-size: 10px;
        margin-top: 2px;
      }
      .status-badge {
        padding: 1px 7px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        color: #1e1e2e;
      }
      .badge-calculated {
        background: #a6e3a1;
      }
      .badge-not_valid {
        background: #f38ba8;
      }
      .badge-explicit_validated {
        background: #89b4fa;
      }
      .badge-definitive {
        background: #cba6f7;
      }
      .list-msg {
        padding: 12px;
        color: #6c7086;
        font-size: 11px;
      }
      .list-msg.error {
        color: #f38ba8;
      }
      .list-footer {
        padding: 8px 10px;
        border-top: 1px solid #313244;
        color: #6c7086;
        font-size: 10px;
        background: #1e1e2e;
      }
    `,
  ],
})
export class RecibosListComponent {
  protected readonly store = inject(RecibosStore);
  protected readonly filters = signal<RecibosFilters>({
    payrollPeriodCode: '',
    employeeNumber: '',
    status: '',
  });

  patchFilter<K extends keyof RecibosFilters>(key: K, value: RecibosFilters[K]): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }

  search(): void {
    this.store.search(this.filters());
  }

  select(payroll: PayrollSummaryModel): void {
    this.store.selectPayroll(payroll);
  }

  isSelected(payroll: PayrollSummaryModel): boolean {
    const key = this.store.selectedKey();
    return (
      key?.ruleSystemCode === payroll.ruleSystemCode &&
      key?.employeeTypeCode === payroll.employeeTypeCode &&
      key?.employeeNumber === payroll.employeeNumber &&
      key?.payrollPeriodCode === payroll.payrollPeriodCode &&
      key?.payrollTypeCode === payroll.payrollTypeCode &&
      key?.presenceNumber === payroll.presenceNumber
    );
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  trackPayroll(payroll: PayrollSummaryModel): string {
    return `${payroll.ruleSystemCode}-${payroll.employeeTypeCode}-${payroll.employeeNumber}-${payroll.payrollPeriodCode}-${payroll.payrollTypeCode}-${payroll.presenceNumber}`;
  }
}
