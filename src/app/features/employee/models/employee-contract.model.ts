export interface EmployeeContractModel {
  contractCode: string;
  contractSubtypeCode: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}
