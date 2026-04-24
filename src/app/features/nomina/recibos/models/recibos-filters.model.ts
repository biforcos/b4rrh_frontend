import { PayrollStatus } from './payroll-summary.model';

export interface RecibosFilters {
  payrollPeriodCode: string;
  employeeNumber: string;
  status: PayrollStatus | '';
}
