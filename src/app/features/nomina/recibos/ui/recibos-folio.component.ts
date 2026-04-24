import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollConceptModel } from '../models/payroll-concept.model';

@Component({
  selector: 'app-recibos-folio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="folio">
      <div class="folio-header">
        <div class="header-company">
          <div class="company-name">EMPRESA EJEMPLO S.L.</div>
          <div class="company-meta">CIF: B-12345678 · C/ Ejemplo, 1 · 28001 Madrid</div>
        </div>
        <div class="header-title">
          <div class="payslip-title">Recibo de Salarios</div>
          <div class="payslip-period">Período: {{ payrollPeriodCode }}</div>
        </div>
      </div>

      <div class="header-employee">
        <span class="label">Trabajador: </span><strong>— (pendiente integración)</strong>
        <span class="label" style="margin-left:16px">Nº emp.: </span><strong>{{ employeeNumber }}</strong>
      </div>

      <table class="concept-table">
        <thead>
          <tr>
            <th class="col-period">Período</th>
            <th class="col-code">Clave</th>
            <th class="col-label">Concepto</th>
            <th class="col-qty">Cantidad</th>
            <th class="col-rate">Tarifa/Base</th>
            <th class="col-earning">Devengos</th>
            <th class="col-deduction">Deducciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let concept of concepts; trackBy: trackConcept" [class.row-total]="isTotal(concept)">
            <td>{{ concept.originPeriodCode ?? '—' }}</td>
            <td>{{ concept.conceptCode }}</td>
            <td>{{ concept.conceptLabel }}</td>
            <td class="text-right">{{ concept.quantity != null ? formatNum(concept.quantity) : '—' }}</td>
            <td class="text-right">{{ concept.rate != null ? formatNum(concept.rate) : '—' }}</td>
            <td class="text-right amount-earning">
              {{ isEarning(concept) && concept.amount != null ? formatNum(concept.amount) : '—' }}
            </td>
            <td class="text-right amount-deduction">
              {{ isDeduction(concept) && concept.amount != null ? formatNum(concept.amount) : '—' }}
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="netPayConcept && netPayConcept.amount != null" class="net-pay-footer">
        <span class="net-pay-label">Líquido total a percibir</span>
        <span class="net-pay-amount">{{ formatNum(netPayConcept.amount) }} €</span>
      </div>
    </div>
  `,
  styles: [`
    .folio { background: white; padding: 24px 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.18); max-width: 780px; }
    .folio-header { display: flex; justify-content: space-between; border-bottom: 2px solid #212529; padding-bottom: 12px; margin-bottom: 10px; }
    .company-name { font-weight: 700; font-size: 14px; color: #212529; }
    .company-meta { color: #6c757d; font-size: 10px; margin-top: 2px; }
    .payslip-title { font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #212529; }
    .payslip-period { color: #6c757d; font-size: 11px; margin-top: 2px; }
    .header-employee { font-size: 11px; padding: 8px 0 12px; border-bottom: 1px solid #dee2e6; margin-bottom: 12px; }
    .label { color: #6c757d; }
    .concept-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .concept-table th { background: #343a40; color: white; padding: 6px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .concept-table td { padding: 5px 8px; border-bottom: 1px solid #f1f3f5; color: #212529; }
    .text-right { text-align: right; }
    .amount-earning, .amount-deduction { font-weight: 600; }
    .row-total td { font-weight: 700; border-top: 2px solid #adb5bd; background: #f8f9fa; }
    .net-pay-footer { background: #212529; color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 0; }
    .net-pay-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: #adb5bd; }
    .net-pay-amount { font-size: 26px; font-weight: 700; color: #a6e3a1; }
    .col-period { width: 8%; }
    .col-code { width: 7%; }
    .col-label { width: 35%; }
    .col-qty, .col-rate { width: 10%; }
    .col-earning, .col-deduction { width: 15%; }
  `],
})
export class RecibosFolioComponent {
  @Input() concepts: ReadonlyArray<PayrollConceptModel> = [];
  @Input() employeeNumber = '';
  @Input() payrollPeriodCode = '';

  get netPayConcept(): PayrollConceptModel | null {
    return this.concepts.find((c) => c.conceptNatureCode === 'NET_PAY') ?? null;
  }

  isEarning(concept: PayrollConceptModel): boolean {
    return concept.conceptNatureCode === 'EARNING' || concept.conceptNatureCode === 'TOTAL_EARNING';
  }

  isDeduction(concept: PayrollConceptModel): boolean {
    return concept.conceptNatureCode === 'DEDUCTION' || concept.conceptNatureCode === 'TOTAL_DEDUCTION';
  }

  isTotal(concept: PayrollConceptModel): boolean {
    return concept.conceptNatureCode === 'TOTAL_EARNING' || concept.conceptNatureCode === 'TOTAL_DEDUCTION';
  }

  formatNum(value: number): string {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  trackConcept(_index: number, concept: PayrollConceptModel): number {
    return concept.lineNumber;
  }
}
