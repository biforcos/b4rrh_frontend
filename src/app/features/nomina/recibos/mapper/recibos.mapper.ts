import { PayrollSummaryResponse } from '../../../../core/api/generated/model/payroll-summary-response';
import { PayrollConceptResponse } from '../../../../core/api/generated/model/payroll-concept-response';
import { PayrollCompanyProfileResponse } from '../../../../core/api/generated/model/payroll-company-profile-response';
import { PayrollEmployeeProfileResponse } from '../../../../core/api/generated/model/payroll-employee-profile-response';
import { PayrollSummaryModel, PayrollCompanyProfileModel, PayrollEmployeeProfileModel } from '../models/payroll-summary.model';
import { PayrollConceptModel } from '../models/payroll-concept.model';

export function mapPayrollSummaryResponseToModel(response: PayrollSummaryResponse): PayrollSummaryModel {
  return {
    ruleSystemCode: response.ruleSystemCode,
    employeeTypeCode: response.employeeTypeCode,
    employeeNumber: response.employeeNumber,
    payrollPeriodCode: response.payrollPeriodCode,
    payrollTypeCode: response.payrollTypeCode,
    presenceNumber: response.presenceNumber,
    status: response.status,
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

export function mapCompanyProfileResponseToModel(
  response: PayrollCompanyProfileResponse | undefined,
): PayrollCompanyProfileModel | null {
  if (!response) return null;
  return {
    legalName: response.legalName ?? null,
    taxIdentifier: response.taxIdentifier ?? null,
    street: response.street ?? null,
    city: response.city ?? null,
    postalCode: response.postalCode ?? null,
  };
}

export function mapEmployeeProfileResponseToModel(
  response: PayrollEmployeeProfileResponse | undefined,
): PayrollEmployeeProfileModel | null {
  if (!response) return null;
  return {
    fullName: response.fullName ?? null,
    nif: response.nif ?? null,
    street: response.street ?? null,
    city: response.city ?? null,
    postalCode: response.postalCode ?? null,
  };
}
