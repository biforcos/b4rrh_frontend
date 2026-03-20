import { EmployeeIdentifierApiModel } from '../clients/employee-identifier-read.client';

export interface EmployeeIdentifierReadModel {
  typeCode: string;
  value: string;
  issuingCountryCode: string | null;
  expirationDate: string | null;
  isPrimary: boolean;
}

export function mapEmployeeIdentifierApiToReadModel(
  source: EmployeeIdentifierApiModel,
): EmployeeIdentifierReadModel | null {
  const typeCode = source.identifierTypeCode.trim().toUpperCase();
  const value = source.identifierValue.trim();

  if (!typeCode || !value) {
    return null;
  }

  const issuingCountryCode = normalizeOptionalValue(source.issuingCountryCode);

  return {
    typeCode,
    value,
    issuingCountryCode: issuingCountryCode ? issuingCountryCode.toUpperCase() : null,
    expirationDate: normalizeOptionalValue(source.expirationDate),
    isPrimary: source.isPrimary === true,
  };
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}
