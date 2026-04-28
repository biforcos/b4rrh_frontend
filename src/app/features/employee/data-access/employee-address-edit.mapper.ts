import {
  CloseAddressRequest,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '../../../core/api/generated/model/models';
import { EmployeeAddressModel } from '../models/employee-address.model';

export interface AddressCreateDraft {
  addressTypeCode: string;
  street: string;
  city: string;
  countryCode: string;
  postalCode: string;
  regionCode: string;
  startDate: string;
}

export function mapAddressDraftToCreateAddressRequest(
  draft: AddressCreateDraft,
): CreateAddressRequest {
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

export function mapAddressEditCurrentDraftToUpdateAddressRequest(
  draft: AddressEditCurrentDraft,
): UpdateAddressRequest {
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

export interface EmployeeAddressRowTexts {
  currentStatus: string;
  closedStatus: string;
  currentPeriodLabel: string;
}

interface EmployeeAddressRow {
  key: number;
  title: string;
  titleSecondary: string | null;
  subtitle: string | null;
  detailText: string | null;
  periodText: string | null;
  statusLabel: string | null;
  isCurrent: boolean;
  closeable: boolean;
}

export function mapEmployeeAddressModelToTemporalRow(
  address: EmployeeAddressModel,
  texts: EmployeeAddressRowTexts,
): EmployeeAddressRow {
  return {
    key: address.addressNumber,
    title: address.addressTypeName ?? address.addressTypeCode,
    titleSecondary: null,
    subtitle: buildLocality(address),
    detailText: address.street,
    periodText: buildPeriodText(address, texts.currentPeriodLabel),
    statusLabel: address.isActive ? texts.currentStatus : texts.closedStatus,
    isCurrent: address.isActive,
    closeable: address.isActive,
  };
}

function buildLocality(address: EmployeeAddressModel): string | null {
  const parts = [address.city, address.countryCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function buildPeriodText(
  address: { startDate: string; endDate: string | null },
  currentPeriodLabel: string,
): string | null {
  if (!address.endDate) {
    return `${currentPeriodLabel} ${address.startDate}`;
  }
  return `${address.startDate} – ${address.endDate}`;
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
