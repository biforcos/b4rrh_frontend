import { PayrollSummaryResponseStatusEnum } from '../../../../core/api/generated/model/payroll-summary-response';
import { PayrollBusinessKey } from './payroll-business-key.model';

export type PayrollStatus = `${PayrollSummaryResponseStatusEnum}`;

export interface PayrollSummaryModel extends PayrollBusinessKey {
  status: PayrollStatus;
  calculatedAt: string;
}
