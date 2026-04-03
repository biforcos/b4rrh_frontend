export interface EmployeeCostCenterItemModel {
  costCenterCode: string;
  costCenterName: string;
  allocationPercentage: number;
}

export interface EmployeeCostCenterWindowModel {
  startDate: string;
  endDate?: string | null;
  totalAllocationPercentage: number;
  items: ReadonlyArray<EmployeeCostCenterItemModel>;
}

export interface EmployeeCostCenterHistoryModel {
  currentDistribution?: EmployeeCostCenterWindowModel | null;
  distributionHistory: ReadonlyArray<EmployeeCostCenterWindowModel>;
}
