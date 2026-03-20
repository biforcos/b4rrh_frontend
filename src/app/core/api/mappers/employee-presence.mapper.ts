import { EmployeePresenceApiModel } from '../clients/employee-presence-read.client';

export interface EmployeePresenceReadModel {
  presenceNumber: number;
  companyCode: string;
  entryReasonCode: string;
  exitReasonCode: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export function mapEmployeePresenceApiToReadModel(
  source: EmployeePresenceApiModel,
): EmployeePresenceReadModel | null {
  const companyCode = source.companyCode.trim().toUpperCase();
  const entryReasonCode = source.entryReasonCode.trim().toUpperCase();
  const startDate = source.startDate.trim();

  if (!companyCode || !entryReasonCode || !startDate) {
    return null;
  }

  const endDate = normalizeOptionalValue(source.endDate);

  return {
    presenceNumber: source.presenceNumber,
    companyCode,
    entryReasonCode,
    exitReasonCode: normalizeOptionalValue(source.exitReasonCode),
    startDate,
    endDate,
    isActive: endDate === null,
  };
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}
