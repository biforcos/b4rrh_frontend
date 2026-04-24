import { PayrollBusinessKey } from './payroll-business-key.model';

export type PayrollStatus = 'NOT_VALID' | 'CALCULATED' | 'EXPLICIT_VALIDATED' | 'DEFINITIVE';

export interface PayrollSummaryModel extends PayrollBusinessKey {
  status: PayrollStatus;
  calculatedAt: string;
}
