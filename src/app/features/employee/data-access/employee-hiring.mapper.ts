import { HireEmployeeRequest, HireEmployeeResponse } from '../../../core/api/generated/model/models';
import { HireEmployeeDraft, HireEmployeeResult } from '../models/employee-hiring.model';
import { HIRE_EMPLOYEE_DEFAULTS } from '../models/hire-employee.defaults';

export function mapDraftToHireRequest(draft: HireEmployeeDraft): HireEmployeeRequest {
  const workingTimePercentage = draft.workingTime.workingTimePercentage;
  if (!isValidWorkingTimePercentage(workingTimePercentage)) {
    throw new Error('workingTime.workingTimePercentage is required');
  }

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
    workingTime: {
      workingTimePercentage,
    },
  };
}

export function mapResponseToResult(response: HireEmployeeResponse): HireEmployeeResult {
  const workingTime = response.workingTime;
  // Use backend-computed displayName (required: true in OpenAPI), fallback to local computation for robustness
  const displayName = (response as unknown as { displayName?: string }).displayName ?? buildDisplayName(response);

  return {
    employeeKey: {
      ruleSystemCode: response.ruleSystemCode,
      employeeTypeCode: response.employeeTypeCode,
      employeeNumber: response.employeeNumber,
    },
    displayName,
    hireDate: response.hireDate,
    status: response.status,
    workingTime: workingTime
      ? {
          workingTimeNumber: workingTime.workingTimeNumber,
          workingTimePercentage: workingTime.workingTimePercentage,
          weeklyHours: workingTime.weeklyHours,
          dailyHours: workingTime.dailyHours,
          monthlyHours: workingTime.monthlyHours,
          startDate: workingTime.startDate,
          endDate: workingTime.endDate,
        }
      : undefined,
  };
}

function isValidWorkingTimePercentage(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0 && value <= 100;
}

function buildDisplayName(response: HireEmployeeResponse): string {
  const preferredName = response.preferredName?.trim();
  if (preferredName) {
    return preferredName;
  }

  return [response.firstName, response.lastName1, response.lastName2 ?? '']
    .map((part) => part?.trim() ?? '')
    .filter((part) => part.length > 0)
    .join(' ');
}
