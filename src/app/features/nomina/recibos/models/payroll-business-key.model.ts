export interface PayrollBusinessKey {
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
  payrollPeriodCode: string;
  payrollTypeCode: 'NORMAL' | 'EXTRA';
  presenceNumber: number;
}
