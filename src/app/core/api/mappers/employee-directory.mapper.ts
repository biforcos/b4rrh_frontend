import { EmployeeDirectoryApiModel, EmployeeReadApiModel } from '../clients/employee-read.client';

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

export function mapEmployeeReadApiToDirectoryModel(
  source: EmployeeReadApiModel,
): EmployeeDirectoryReadModel {
  return {
    ruleSystemCode: source.ruleSystemCode,
    employeeTypeCode: source.employeeTypeCode,
    employeeNumber: source.employeeNumber,
    displayName: buildDisplayName(source),
    workCenter: pendingWorkCenterLabel,
    statusLabel: source.status,
  };
}

function buildDisplayName(source: EmployeeReadApiModel): string {
  const preferredName = source.preferredName?.trim();
  if (preferredName) {
    return preferredName;
  }

  const nameParts = [source.firstName, source.lastName1, source.lastName2 ?? '']
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return nameParts.join(' ');
}

function mapWorkCenterLabel(workCenterCode: string | null): string {
  const normalizedCode = workCenterCode?.trim();
  return normalizedCode && normalizedCode.length > 0 ? normalizedCode : pendingWorkCenterLabel;
}