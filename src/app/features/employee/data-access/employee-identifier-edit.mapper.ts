import { CreateIdentifierRequest, UpdateIdentifierRequest } from '../../../core/api/generated/model/models';
import { EmployeeIdentifierApiModel } from '../../../core/api/clients/employee-identifier-read.client';
import { EmployeeIdentifierModel } from '../models/employee-identifier.model';
import { SlotDraft, SlotRowViewModel } from '../shared/ui/section/editable-slot-section.model';

export interface EmployeeIdentifierRowTexts {
  primaryBadge: string;
  expirationPrefix: string;
}

export function mapEmployeeIdentifierApiToSlotRow(
  source: EmployeeIdentifierApiModel,
  texts?: EmployeeIdentifierRowTexts,
): SlotRowViewModel<string> {
  const identifierTypeCode = source.identifierTypeCode.trim().toUpperCase();
  const identifierValue = source.identifierValue.trim();

  return {
    key: identifierTypeCode,
    keyLabel: identifierTypeCode,
    value: identifierValue,
    valueLabel: null,
    secondaryText: buildSecondaryText(source, texts),
    badges: buildBadges(source, texts),
  };
}

export function mapEmployeeIdentifierModelToSlotRow(
  source: EmployeeIdentifierModel,
  texts: EmployeeIdentifierRowTexts,
): SlotRowViewModel<string> {
  return mapEmployeeIdentifierApiToSlotRow({
    identifierTypeCode: source.typeCode,
    identifierValue: source.value,
    issuingCountryCode: source.issuingCountryCode,
    expirationDate: source.expirationDate,
    isPrimary: source.isPrimary,
  }, texts);
}

function buildSecondaryText(
  source: EmployeeIdentifierApiModel,
  texts?: EmployeeIdentifierRowTexts,
): string | null {
  const issuingCountryCode = normalizeOptionalCountryCode(source.issuingCountryCode);
  const expirationDate = normalizeOptionalValue(source.expirationDate);
  const expirationSegment = expirationDate && texts ? `${texts.expirationPrefix}: ${expirationDate}` : expirationDate;

  const segments = [issuingCountryCode, expirationSegment].filter((segment): segment is string => Boolean(segment));

  return segments.length > 0 ? segments.join(' · ') : null;
}

function buildBadges(
  source: EmployeeIdentifierApiModel,
  texts?: EmployeeIdentifierRowTexts,
): ReadonlyArray<string> {
  if (!texts || source.isPrimary !== true) {
    return [];
  }

  return [texts.primaryBadge];
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
