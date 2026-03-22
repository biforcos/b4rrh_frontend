import { CloseAddressRequest, CreateAddressRequest, UpdateAddressRequest } from '../../../core/api/generated/model/models';
import { EmployeeAddressModel } from '../models/employee-address.model';
import { TemporalRowViewModel } from '../shared/ui/section/temporal-section.model';

export interface AddressCreateDraft {
  addressTypeCode: string;
  street: string;
  city: string;
  countryCode: string;
  postalCode: string;
  regionCode: string;
  startDate: string;
}

export interface EmployeeAddressRowTexts {
  currentStatus: string;
  closedStatus: string;
  currentPeriodLabel: string;
}

export function mapEmployeeAddressModelToTemporalRow(
  source: EmployeeAddressModel,
  texts: EmployeeAddressRowTexts,
): TemporalRowViewModel<number> {
  return {
    key: source.addressNumber,
    title: source.addressTypeCode,
    subtitle: source.street,
    detailText: buildLocality(source),
    periodText: buildPeriodText(source, texts.currentPeriodLabel),
    statusLabel: source.isActive ? texts.currentStatus : texts.closedStatus,
    isCurrent: source.isActive,
    closeable: source.isActive,
  };
}

export function mapAddressDraftToCreateAddressRequest(draft: AddressCreateDraft): CreateAddressRequest {
  return {
    addressTypeCode: normalizeCode(draft.addressTypeCode),
    street: normalizeRequiredValue(draft.street),
    city: normalizeRequiredValue(draft.city),
    countryCode: normalizeCode(draft.countryCode),
    postalCode: normalizeOptionalValue(draft.postalCode),
    regionCode: normalizeOptionalValue(draft.regionCode),
    startDate: normalizeRequiredValue(draft.startDate),
    endDate: null,
  };
}

export function mapAddressCloseDateToRequest(endDate: string): CloseAddressRequest {
  return {
    endDate: normalizeRequiredValue(endDate),
  };
}

export function mapAddressEditCurrentDraftToUpdateAddressRequest(draft: AddressEditCurrentDraft): UpdateAddressRequest {
  return {
    street: normalizeRequiredValue(draft.street),
    city: normalizeRequiredValue(draft.city),
    countryCode: normalizeCode(draft.countryCode),
    postalCode: normalizeOptionalValue(draft.postalCode),
    regionCode: normalizeOptionalValue(draft.regionCode),
  };
}

export interface AddressEditCurrentDraft {
  street: string;
  city: string;
  countryCode: string;
  postalCode: string;
  regionCode: string;
}

function buildLocality(source: EmployeeAddressModel): string | null {
  const localitySegments = [source.postalCode, source.city, source.regionCode, source.countryCode]
    .map((segment) => normalizeOptionalValue(segment))
    .filter((segment): segment is string => Boolean(segment));

  return localitySegments.length > 0 ? localitySegments.join(' · ') : null;
}

function buildPeriodText(source: EmployeeAddressModel, currentPeriodLabel: string): string | null {
  const startDate = normalizeOptionalValue(source.startDate);
  const endDate = normalizeOptionalValue(source.endDate);

  if (!startDate && !endDate) {
    return null;
  }

  if (!endDate && startDate) {
    return `${startDate} - ${currentPeriodLabel}`;
  }

  if (!startDate && endDate) {
    return endDate;
  }

  return `${startDate} - ${endDate}`;
}

function normalizeCode(value: string | null | undefined): string {
  return normalizeRequiredValue(value).toUpperCase();
}

function normalizeRequiredValue(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}
