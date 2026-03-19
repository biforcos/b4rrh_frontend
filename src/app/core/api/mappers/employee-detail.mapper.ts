import { EmployeeReadApiModel } from '../clients/employee-read.client';

export interface EmployeeDetailReadModel {
  id: number;
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
  firstName: string;
  lastName1: string;
  lastName2: string | null;
  preferredName: string | null;
  displayName: string;
  statusLabel: string;
  workCenter: string;
}

const pendingWorkCenterLabel = 'Pending assignment';

export function mapEmployeeReadApiToDetailModel(source: EmployeeReadApiModel): EmployeeDetailReadModel {
  return {
    id: source.id,
    ruleSystemCode: source.ruleSystemCode,
    employeeTypeCode: source.employeeTypeCode,
    employeeNumber: source.employeeNumber,
    firstName: source.firstName,
    lastName1: source.lastName1,
    lastName2: source.lastName2,
    preferredName: source.preferredName,
    displayName: buildDisplayName(source),
    statusLabel: source.status,
    workCenter: pendingWorkCenterLabel,
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
