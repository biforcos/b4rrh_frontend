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
    presence: {
      companyCode: draft.companyCode,
      entryReasonCode: draft.entryReasonCode,
    },
    laborClassification: {
      agreementCode: draft.agreementCode,
      agreementCategoryCode: draft.agreementCategoryCode,
    },
    contract: {
      contractTypeCode: draft.contractTypeCode,
      contractSubtypeCode: draft.contractSubtypeCode || null,
    },
    workCenter: {
      workCenterCode: draft.workCenterCode,
    },
    ...(draft.costCenterDistribution && { costCenterDistribution: draft.costCenterDistribution })
  } as any;
}

export function mapResponseToResult(response: HireEmployeeResponse): HireEmployeeResult {
  return {
    employeeKey: {
      ruleSystemCode: response.ruleSystemCode,
      employeeTypeCode: response.employeeTypeCode,
      employeeNumber: response.employeeNumber
    },
    displayName: `${response.firstName} ${response.lastName1}`
  };
}
