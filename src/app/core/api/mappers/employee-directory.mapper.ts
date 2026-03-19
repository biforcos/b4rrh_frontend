import { EmployeeDirectoryApiModel } from '../clients/employee-read.client';

export interface EmployeeDirectoryReadModel {
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
  displayName: string;
  workCenter: string;
  statusLabel: string;
}

const pendingWorkCenterLabel = 'Pending assignment';

export function mapEmployeeDirectoryApiToDirectoryModel(
  source: EmployeeDirectoryApiModel,
): EmployeeDirectoryReadModel {
  return {
    ruleSystemCode: source.ruleSystemCode,
    employeeTypeCode: source.employeeTypeCode,
    employeeNumber: source.employeeNumber,
    displayName: source.displayName,
    workCenter: mapWorkCenterLabel(source.workCenterCode),
    statusLabel: source.status,
  };
}

function mapWorkCenterLabel(workCenterCode: string | null): string {
  const normalizedCode = workCenterCode?.trim();
  return normalizedCode && normalizedCode.length > 0 ? normalizedCode : pendingWorkCenterLabel;
}