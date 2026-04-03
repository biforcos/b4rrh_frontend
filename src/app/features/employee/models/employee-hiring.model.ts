import { EmployeeBusinessKey } from './employee-business-key.model';

export interface HireEmployeeCostCenterItemDraft {
  costCenterCode: string;
  allocationPercentage: number;
}

export interface HireEmployeeDraft {
  ruleSystemCode: string;
  employeeTypeCode?: string;
  employeeNumber: string;
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
  costCenterDistribution: {
    items: HireEmployeeCostCenterItemDraft[];
  } | null;
}

export interface HireEmployeeResult {
  employeeKey: EmployeeBusinessKey;
  displayName: string;
}
