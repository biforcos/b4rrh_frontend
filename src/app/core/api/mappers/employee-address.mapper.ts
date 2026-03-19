import { EmployeeAddressApiModel } from '../clients/employee-address-read.client';

export interface EmployeeAddressReadModel {
  addressNumber: number;
  addressTypeCode: string;
  street: string;
  city: string;
  countryCode: string;
  postalCode: string | null;
  regionCode: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export function mapEmployeeAddressApiToReadModel(
  source: EmployeeAddressApiModel,
): EmployeeAddressReadModel | null {
  const street = source.street.trim();
  const city = source.city.trim();
  const countryCode = source.countryCode.trim().toUpperCase();

  if (!street && !city && !countryCode) {
    return null;
  }

  const endDate = normalizeOptionalValue(source.endDate);

  return {
    addressNumber: source.addressNumber,
    addressTypeCode: source.addressTypeCode.trim().toUpperCase(),
    street,
    city,
    countryCode,
    postalCode: normalizeOptionalValue(source.postalCode),
    regionCode: normalizeOptionalValue(source.regionCode),
    startDate: source.startDate.trim(),
    endDate,
    isActive: endDate === null,
  };
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}
