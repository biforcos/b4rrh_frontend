import { EmployeeBusinessKey } from './employee-business-key.model';

export interface HireEmployeeCostCenterItemDraft {
  costCenterCode: string;
  allocationPercentage: number;
}

export interface HireEmployeeWorkingTimeDraft {
  workingTimePercentage: number | null;
}

export interface HireEmployeeWorkingTimeResult {
  workingTimeNumber: number;
  workingTimePercentage: number;
  weeklyHours: number;
  dailyHours: number;
  monthlyHours: number;
  startDate: string;
  endDate: string | null;
}

export interface HireEmployeeDraft {
  ruleSystemCode: string;
  employeeTypeCode?: string;
  firstName: string;
  lastName1: string;
  lastName2: string;
  preferredName: string;
  hireDate: string;
  entryReasonCode: string;
  companyCode: string;
  workCenterCode: string;
  contractTypeCode: string;
  contractSubtypeCode: string;
  agreementCode: string;
  agreementCategoryCode: string;
  workingTime: HireEmployeeWorkingTimeDraft;
  costCenterDistribution: {
    items: HireEmployeeCostCenterItemDraft[];
  } | null;
}

export interface HireEmployeeResult {
  employeeKey: EmployeeBusinessKey;
  displayName: string;
  hireDate: string;
  status: string;
  workingTime?: HireEmployeeWorkingTimeResult;
}
