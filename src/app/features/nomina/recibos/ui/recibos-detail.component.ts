import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecibosStore } from '../store/recibos.store';
import { RecibosFolioComponent } from './recibos-folio.component';

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
  imports: [CommonModule, RecibosFolioComponent],
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
          />
        }
      </div>
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
      .btn-invalidar {
        background: #f38ba8;
        color: #1e1e2e;
      }
      .btn-validar {
        background: #89b4fa;
        color: #1e1e2e;
      }
      .btn-recalcular {
        background: #fab387;
        color: #1e1e2e;
      }
      .transition-error {
        max-width: 780px;
        background: #f38ba8;
        color: #1e1e2e;
        padding: 8px 14px;
        border-radius: 4px;
        font-size: 11px;
      }
      .folio-wrapper {
        max-width: 780px;
      }
      .loading-msg,
      .no-selection {
        color: #6c757d;
        font-size: 12px;
        padding: 20px;
      }
    `,
  ],
})
export class RecibosDetailComponent {
  protected readonly store = inject(RecibosStore);

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
