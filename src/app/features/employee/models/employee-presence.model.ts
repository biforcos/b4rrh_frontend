export interface EmployeePresenceModel {
  presenceNumber: number;
  companyCode: string;
  companyName?: string | null;
  entryReasonCode: string;
  exitReasonCode: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}
