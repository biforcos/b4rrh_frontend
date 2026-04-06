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
      entryReasonCode: draft.entryReasonCode,
      companyCode: draft.companyCode,
    },
    laborClassification: {
      agreementCode: draft.agreementCode,
      agreementCategoryCode: draft.agreementCategoryCode,
    },
    contract: {
      contractTypeCode: draft.contractTypeCode,
      contractSubtypeCode: draft.contractSubtypeCode || '',
    },
    workCenter: {
      workCenterCode: draft.workCenterCode,
    },
  };
}

export function mapResponseToResult(response: HireEmployeeResponse): HireEmployeeResult {
  const displayNameParts = [response.preferredName ?? response.firstName, response.lastName1, response.lastName2 ?? ''];

  return {
    employeeKey: {
      ruleSystemCode: response.ruleSystemCode,
      employeeTypeCode: response.employeeTypeCode,
      employeeNumber: response.employeeNumber,
    },
    displayName: displayNameParts.join(' ').trim(),
  };
}
