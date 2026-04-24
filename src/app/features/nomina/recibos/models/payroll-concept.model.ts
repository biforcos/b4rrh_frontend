export interface PayrollConceptModel {
  lineNumber: number;
  conceptCode: string;
  conceptLabel: string;
  amount: number | null;
  quantity: number | null;
  rate: number | null;
  conceptNatureCode: string;
  originPeriodCode: string | null;
  displayOrder: number;
}
