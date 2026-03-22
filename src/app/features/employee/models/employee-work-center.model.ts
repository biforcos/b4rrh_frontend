export interface EmployeeWorkCenterModel {
  workCenterAssignmentNumber: number;
  workCenterCode: string;
  workCenterName?: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  canDelete: boolean;
  startsAtPresenceStart: boolean;
  deleteForbiddenReason: 'starts-at-presence-start' | null;
}
