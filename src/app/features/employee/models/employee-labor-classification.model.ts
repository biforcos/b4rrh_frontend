export interface EmployeeLaborClassificationModel {
  agreementCode: string;
  agreementName?: string | null;
  agreementCategoryCode: string;
  agreementCategoryName?: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}