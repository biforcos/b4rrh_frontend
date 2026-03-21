import { CreateIdentifierRequest, UpdateIdentifierRequest } from '../../../core/api/generated/model/models';
import { EmployeeIdentifierApiModel } from '../../../core/api/clients/employee-identifier-read.client';
import { EmployeeIdentifierModel } from '../models/employee-identifier.model';
import { SlotDraft, SlotRowViewModel } from '../shared/ui/section/editable-slot-section.model';

export function mapEmployeeIdentifierApiToSlotRow(
  source: EmployeeIdentifierApiModel,
): SlotRowViewModel<string> {
  const identifierTypeCode = source.identifierTypeCode.trim().toUpperCase();
  const identifierValue = source.identifierValue.trim();

  return {
    key: identifierTypeCode,
    keyLabel: identifierTypeCode,
    value: identifierValue,
    valueLabel: null,
  };
}

export function mapEmployeeIdentifierModelToSlotRow(
  source: EmployeeIdentifierModel,
): SlotRowViewModel<string> {
  return mapEmployeeIdentifierApiToSlotRow({
    identifierTypeCode: source.typeCode,
    identifierValue: source.value,
    issuingCountryCode: source.issuingCountryCode,
    expirationDate: source.expirationDate,
    isPrimary: source.isPrimary,
  });
}

export function mapSlotDraftToCreateIdentifierRequest(draft: SlotDraft<string>): CreateIdentifierRequest {
  return {
    identifierTypeCode: normalizeIdentifierTypeCode(draft.key),
    identifierValue: normalizeValue(draft.value),
  };
}

export function mapSlotDraftToUpdateIdentifierRequest(
  draft: SlotDraft<string>,
  source: EmployeeIdentifierModel,
): UpdateIdentifierRequest {
  return {
    identifierValue: normalizeValue(draft.value),
    issuingCountryCode: normalizeOptionalCountryCode(source.issuingCountryCode),
    expirationDate: normalizeOptionalValue(source.expirationDate),
    isPrimary: source.isPrimary,
  };
}

function normalizeIdentifierTypeCode(value: string | null): string {
  return value?.trim().toUpperCase() ?? '';
}

function normalizeValue(value: string): string {
  return value.trim();
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeOptionalCountryCode(value: string | null | undefined): string | null {
  const normalizedValue = normalizeOptionalValue(value);
  return normalizedValue ? normalizedValue.toUpperCase() : null;
}
