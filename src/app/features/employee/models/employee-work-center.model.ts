export interface EmployeeWorkCenterModel {
  workCenterAssignmentNumber: number;
  workCenterCode: string;
  workCenterLabel?: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}
