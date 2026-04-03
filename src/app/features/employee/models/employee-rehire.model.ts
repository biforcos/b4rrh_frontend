import { EmployeeBusinessKey } from './employee-business-key.model';

export interface RehireEmployeeCostCenterItemDraft {
  costCenterCode: string;
  allocationPercentage: number;
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
  costCenterDistribution?: { items: ReadonlyArray<RehireEmployeeCostCenterItemDraft> } | null;
}

export interface RehireEmployeeResult {
  employeeKey: EmployeeBusinessKey;
}
