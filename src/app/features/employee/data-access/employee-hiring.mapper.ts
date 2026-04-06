import { HireEmployeeRequest, HireEmployeeResponse } from '../../../core/api/generated/model/models';
import { HireEmployeeDraft, HireEmployeeResult } from '../models/employee-hiring.model';
import { HIRE_EMPLOYEE_DEFAULTS } from '../models/hire-employee.defaults';

export function mapDraftToHireRequest(draft: HireEmployeeDraft): HireEmployeeRequest {
  return {
    ruleSystemCode: draft.ruleSystemCode,
    employeeTypeCode: draft.employeeTypeCode || HIRE_EMPLOYEE_DEFAULTS.employeeTypeCode,
    employeeNumber: draft.employeeNumber,
    firstName: draft.firstName,
    lastName1: draft.lastName1,
    lastName2: draft.lastName2 || null,
    preferredName: draft.preferredName || null,
    hireDate: draft.hireDate,
    entryReasonCode: draft.entryReasonCode,
    companyCode: draft.companyCode,
    workCenterCode: draft.workCenterCode,
    costCenterDistribution: draft.costCenterDistribution
      ? {
          items: draft.costCenterDistribution.items.map((item) => ({
            costCenterCode: item.costCenterCode.trim().toUpperCase(),
            allocationPercentage: item.allocationPercentage,
          })),
        }
      : undefined,
    laborClassification: {
      agreementCode: draft.agreementCode,
      agreementCategoryCode: draft.agreementCategoryCode,
    },
    contract: {
      contractTypeCode: draft.contractTypeCode,
      contractSubtypeCode: draft.contractSubtypeCode || '',
    },
  };
}

export function mapResponseToResult(response: HireEmployeeResponse): HireEmployeeResult {
  return {
    employeeKey: {
      ruleSystemCode: response.employee.ruleSystemCode,
      employeeTypeCode: response.employee.employeeTypeCode,
      employeeNumber: response.employee.employeeNumber,
    },
    displayName: response.employee.displayName,
  };
}
