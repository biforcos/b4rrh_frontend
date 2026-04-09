import { EmployeeBusinessKey } from './employee-business-key.model';

export interface RehireEmployeeCostCenterItemDraft {
  costCenterCode: string;
  allocationPercentage: number;
}

export interface RehireEmployeeWorkingTimeDraft {
  workingTimePercentage: number | null;
}

export interface RehireEmployeeWorkingTimeResult {
  workingTimeNumber: number;
  workingTimePercentage: number;
  weeklyHours: number;
  dailyHours: number;
  monthlyHours: number;
  startDate: string;
  endDate: string | null;
}

export interface RehireEmployeeDraft {
  ruleSystemCode: string;
  employeeTypeCode?: string;
  employeeNumber: string;
  rehireDate: string;
  entryReasonCode: string;
  companyCode: string;
  workCenterCode: string;
  contractTypeCode: string;
  contractSubtypeCode?: string | null;
  agreementCode: string;
  agreementCategoryCode: string;
  workingTime: RehireEmployeeWorkingTimeDraft;
  costCenterDistribution?: { items: ReadonlyArray<RehireEmployeeCostCenterItemDraft> } | null;
}

export interface RehireEmployeeResult {
  employeeKey: EmployeeBusinessKey;
  rehireDate: string;
  status: string;
  newWorkingTime?: RehireEmployeeWorkingTimeResult;
}
