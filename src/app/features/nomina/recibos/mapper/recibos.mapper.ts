import { PayrollSummaryResponse } from '../../../../core/api/generated/model/payroll-summary-response';
import { PayrollConceptResponse } from '../../../../core/api/generated/model/payroll-concept-response';
import { PayrollSummaryModel } from '../models/payroll-summary.model';
import { PayrollConceptModel } from '../models/payroll-concept.model';

export function mapPayrollSummaryResponseToModel(response: PayrollSummaryResponse): PayrollSummaryModel {
  return {
    ruleSystemCode: response.ruleSystemCode,
    employeeTypeCode: response.employeeTypeCode,
    employeeNumber: response.employeeNumber,
    payrollPeriodCode: response.payrollPeriodCode,
    payrollTypeCode: response.payrollTypeCode,
    presenceNumber: response.presenceNumber,
    status: response.status as PayrollSummaryModel['status'],
    calculatedAt: response.calculatedAt,
  };
}

export function mapPayrollConceptResponseToModel(response: PayrollConceptResponse): PayrollConceptModel {
  return {
    lineNumber: response.lineNumber,
    conceptCode: response.conceptCode,
    conceptLabel: response.conceptLabel,
    amount: response.amount ?? null,
    quantity: response.quantity ?? null,
    rate: response.rate ?? null,
    conceptNatureCode: response.conceptNatureCode,
    originPeriodCode: response.originPeriodCode ?? null,
    displayOrder: response.displayOrder,
  };
}
