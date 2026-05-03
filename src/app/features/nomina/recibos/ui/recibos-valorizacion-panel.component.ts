import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
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
    <div class="overlay" (click)="onClose()"></div>

    <div class="drawer">
      <div class="drawer-header">
        <div>
          <div class="drawer-title">Valorización</div>
          <div class="drawer-subtitle">{{ payrollKey }}</div>
        </div>
        <button class="close-btn" (click)="onClose()">✕</button>
      </div>

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

      <div class="legend">
        @for (item of legendItems; track item.nature) {
          <span class="legend-item" [style.color]="item.color">■ {{ item.label }}</span>
        }
      </div>

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
                <th>Clave</th>
                <th>Concepto</th>
                <th class="col-num">Cant.</th>
                <th class="col-num">Tarifa</th>
                <th class="col-num">Importe</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredConcepts(); track c.lineNumber) {
                <tr class="val-row">
                  <td class="col-stripe-cell" [style.background]="colorFor(c.conceptNatureCode)"></td>
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
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
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
      .col-stripe {
        width: 10px;
        text-align: left !important;
      }
      .col-num {
        width: 70px;
        text-align: right !important;
      }
      .val-row {
        border-bottom: 1px solid #313244;
      }
      .val-row:hover {
        background: #24273a;
      }
      .col-stripe-cell {
        width: 3px;
        padding: 0;
      }
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

  @Input() set concepts(val: ReadonlyArray<PayrollConceptModel>) {
    this._concepts.set(val);
  }

  @Input() loading = false;
  @Input() payrollKey = '';

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
    { nature: 'EARNING', label: 'Devengo', color: '#a6e3a1' },
    { nature: 'DEDUCTION', label: 'Deducción', color: '#f38ba8' },
    { nature: 'BASE', label: 'Base', color: '#89b4fa' },
    { nature: 'TECHNICAL', label: 'Técnico', color: '#cba6f7' },
    { nature: 'INFORMATIONAL', label: 'Informativo', color: '#fab387' },
    { nature: 'NET_PAY', label: 'Totales/Liq.', color: '#6c7086' },
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
