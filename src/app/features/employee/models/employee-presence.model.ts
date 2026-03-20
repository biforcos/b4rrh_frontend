export interface EmployeePresenceModel {
  presenceNumber: number;
  companyCode: string;
  entryReasonCode: string;
  exitReasonCode: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}
