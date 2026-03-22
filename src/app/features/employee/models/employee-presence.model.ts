export interface EmployeePresenceModel {
  presenceNumber: number;
  companyCode: string;
  companyName?: string | null;
  entryReasonCode: string;
  entryReasonName?: string | null;
  exitReasonCode: string | null;
  exitReasonName?: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}
