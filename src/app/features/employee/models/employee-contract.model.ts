export interface EmployeeContractModel {
  contractCode: string;
  contractTypeName?: string | null;
  contractSubtypeCode: string | null;
  contractSubtypeName?: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}
