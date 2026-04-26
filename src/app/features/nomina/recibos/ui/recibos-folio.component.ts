import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PayrollConceptModel } from '../models/payroll-concept.model';
import {
  PayrollCompanyProfileModel,
  PayrollEmployeeProfileModel,
  PayrollAgreementProfileModel,
} from '../models/payroll-summary.model';

const MONTH_NAMES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

@Component({
  selector: 'app-recibos-folio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
  template: `
    <div class="folio">
      <!-- TITLE -->
      <div class="folio-title">
        <span class="title-text">Recibo de Nómina</span>
      </div>

      <!-- HEADER: empresa | trabajador -->
      <div class="folio-header">
        <div class="header-box">
          <div class="box-name">{{ companyProfile?.legalName ?? '—' }}</div>
          @if (companyProfile?.taxIdentifier) {
            <div class="box-meta">CIF: {{ companyProfile!.taxIdentifier }}</div>
          }
          @if (companyProfile?.street) {
            <div class="box-meta">{{ companyProfile!.street }}</div>
          }
          @if (companyCityLine) {
            <div class="box-meta">{{ companyCityLine }}</div>
          }
        </div>
        <div class="header-box header-box-right">
          <div class="box-name">{{ employeeProfile?.fullName ?? '—' }}</div>
          @if (employeeProfile?.nif) {
            <div class="box-meta">NIF: {{ employeeProfile!.nif }}</div>
          }
          @if (employeeProfile?.street) {
            <div class="box-meta">{{ employeeProfile!.street }}</div>
          }
          @if (employeeCityLine) {
            <div class="box-meta">{{ employeeCityLine }}</div>
          }
        </div>
      </div>

      <!-- DATOS LABORALES -->
      <div class="labor-section">
        <div class="labor-title">Datos laborales</div>
        <div class="labor-grid">
          <div class="labor-cell">
            <span class="labor-label">Convenio</span>
            <span class="labor-value">{{ agreementProfile?.displayName ?? '—' }}</span>
          </div>
          <div class="labor-cell">
            <span class="labor-label">Categoría</span>
            <span class="labor-value">{{ agreementProfile?.agreementCategoryCode ?? '—' }}</span>
          </div>
          <div class="labor-cell labor-cell-period">
            <span class="labor-label">Período de liquidación</span>
            <span class="labor-value">{{ periodLabel }}</span>
          </div>
          <div class="labor-cell">
            <span class="labor-label">Puesto</span>
            <span class="labor-value">—</span>
          </div>
          <div class="labor-cell">
            <span class="labor-label">Antigüedad</span>
            <span class="labor-value">—</span>
          </div>
          <div class="labor-cell labor-cell-period">
            <span class="labor-label">Matrícula</span>
            <span class="labor-value">{{ employeeNumber }}</span>
          </div>
        </div>
      </div>

      <!-- CONCEPT TABLE -->
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
          @for (concept of bodyConcepts; track concept.lineNumber) {
            <tr>
              <td>{{ concept.originPeriodCode ?? '—' }}</td>
              <td>{{ concept.conceptCode }}</td>
              <td>{{ concept.conceptLabel }}</td>
              <td class="text-right">
                {{ concept.quantity != null ? formatNum(concept.quantity) : '—' }}
              </td>
              <td class="text-right">{{ concept.rate != null ? formatNum(concept.rate) : '—' }}</td>
              <td class="text-right amount-earning">
                {{ isEarning(concept) && concept.amount != null ? formatNum(concept.amount) : '—' }}
              </td>
              <td class="text-right amount-deduction">
                {{
                  isDeduction(concept) && concept.amount != null ? formatNum(concept.amount) : '—'
                }}
              </td>
            </tr>
          }
        </tbody>
        <tfoot>
          <tr class="row-totals">
            <td colspan="5" class="totals-label">Totales</td>
            <td class="text-right amount-earning">
              {{
                totalEarningConcept?.amount != null ? formatNum(totalEarningConcept!.amount!) : '—'
              }}
            </td>
            <td class="text-right amount-deduction">
              {{
                totalDeductionConcept?.amount != null
                  ? formatNum(totalDeductionConcept!.amount!)
                  : '—'
              }}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- NET PAY -->
      @if (netPayConcept && netPayConcept.amount != null) {
        <div class="net-pay-footer">
          <span class="net-pay-label">Líquido total a percibir</span>
          <span class="net-pay-amount">{{ formatNum(netPayConcept.amount) }} €</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .folio {
        background: white;
        padding: 24px 28px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
        max-width: 820px;
        font-family: inherit;
      }

      /* TITLE */
      .folio-title {
        text-align: center;
        border-bottom: 2px solid #212529;
        padding-bottom: 10px;
        margin-bottom: 12px;
      }
      .title-text {
        font-size: 16px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #212529;
      }

      /* HEADER BOXES */
      .folio-header {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        border: 1px solid #dee2e6;
        margin-bottom: 0;
      }
      .header-box {
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .header-box-right {
        border-left: 1px solid #dee2e6;
      }
      .box-name {
        font-size: 12px;
        font-weight: 700;
        color: #212529;
      }
      .box-meta {
        font-size: 10px;
        color: #6c757d;
      }

      /* DATOS LABORALES */
      .labor-section {
        border: 1px solid #dee2e6;
        border-top: none;
        margin-bottom: 14px;
      }
      .labor-title {
        background: #f1f3f5;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        color: #495057;
        padding: 4px 14px;
        border-bottom: 1px solid #dee2e6;
      }
      .labor-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 2fr;
        border-top: none;
      }
      .labor-cell {
        padding: 6px 14px;
        display: flex;
        flex-direction: column;
        gap: 1px;
        border-right: 1px solid #dee2e6;
        border-bottom: 1px solid #dee2e6;
      }
      .labor-cell:nth-child(3),
      .labor-cell:nth-child(6) {
        border-right: none;
      }
      .labor-cell:nth-child(4),
      .labor-cell:nth-child(5),
      .labor-cell:nth-child(6) {
        border-bottom: none;
      }
      .labor-label {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #adb5bd;
        font-weight: 600;
      }
      .labor-value {
        font-size: 11px;
        font-weight: 600;
        color: #212529;
      }

      /* CONCEPT TABLE */
      .concept-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .concept-table th {
        background: #343a40;
        color: white;
        padding: 6px 8px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .concept-table td {
        padding: 5px 8px;
        border-bottom: 1px solid #f1f3f5;
        color: #212529;
      }
      .text-right {
        text-align: right;
      }
      .amount-earning,
      .amount-deduction {
        font-weight: 600;
      }
      .row-totals td {
        font-weight: 700;
        border-top: 2px solid #adb5bd;
        background: #f8f9fa;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }
      .totals-label {
        color: #6c757d;
      }

      /* NET PAY */
      .net-pay-footer {
        background: #212529;
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .net-pay-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #adb5bd;
      }
      .net-pay-amount {
        font-size: 26px;
        font-weight: 700;
        color: #a6e3a1;
      }

      /* COL WIDTHS */
      .col-period {
        width: 8%;
      }
      .col-code {
        width: 7%;
      }
      .col-label {
        width: 35%;
      }
      .col-qty,
      .col-rate {
        width: 10%;
      }
      .col-earning,
      .col-deduction {
        width: 15%;
      }
    `,
  ],
})
export class RecibosFolioComponent {
  @Input() concepts: ReadonlyArray<PayrollConceptModel> = [];
  @Input() employeeNumber = '';
  @Input() payrollPeriodCode = '';
  @Input() companyProfile: PayrollCompanyProfileModel | null = null;
  @Input() employeeProfile: PayrollEmployeeProfileModel | null = null;
  @Input() agreementProfile: PayrollAgreementProfileModel | null = null;

  get periodLabel(): string {
    const code = this.payrollPeriodCode;
    if (!code || code.length < 6) return code;
    const year = parseInt(code.substring(0, 4), 10);
    const month = parseInt(code.substring(4, 6), 10);
    const lastDay = new Date(year, month, 0).getDate();
    const monthName = MONTH_NAMES_ES[month - 1] ?? '';
    return `Del 1 al ${lastDay} de ${monthName} de ${year}`;
  }

  get companyCityLine(): string {
    return [this.companyProfile?.postalCode, this.companyProfile?.city].filter(Boolean).join(' ');
  }

  get employeeCityLine(): string {
    return [this.employeeProfile?.postalCode, this.employeeProfile?.city].filter(Boolean).join(' ');
  }

  get bodyConcepts(): ReadonlyArray<PayrollConceptModel> {
    return this.concepts.filter(
      (c) => c.conceptNatureCode === 'EARNING' || c.conceptNatureCode === 'DEDUCTION',
    );
  }

  get netPayConcept(): PayrollConceptModel | null {
    return this.concepts.find((c) => c.conceptNatureCode === 'NET_PAY') ?? null;
  }

  get totalEarningConcept(): PayrollConceptModel | null {
    return this.concepts.find((c) => c.conceptNatureCode === 'TOTAL_EARNING') ?? null;
  }

  get totalDeductionConcept(): PayrollConceptModel | null {
    return this.concepts.find((c) => c.conceptNatureCode === 'TOTAL_DEDUCTION') ?? null;
  }

  isEarning(concept: PayrollConceptModel): boolean {
    return concept.conceptNatureCode === 'EARNING';
  }

  isDeduction(concept: PayrollConceptModel): boolean {
    return concept.conceptNatureCode === 'DEDUCTION';
  }

  formatNum(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
