import { CreateContactRequest, UpdateContactRequest } from '../../../core/api/generated/model/models';
import { EmployeeContactApiModel } from '../../../core/api/clients/employee-contact-read.client';
import { SlotDraft, SlotRowViewModel } from '../shared/ui/section/editable-slot-section.model';
import { EmployeeContactModel } from '../models/employee-contact.model';

export function mapEmployeeContactApiToSlotRow(source: EmployeeContactApiModel): SlotRowViewModel<string> {
  const contactTypeCode = source.contactTypeCode.trim();
  const contactValue = source.contactValue.trim();

  return {
    key: contactTypeCode,
    keyLabel: contactTypeCode,
    value: contactValue,
    valueLabel: null,
  };
}

export function mapEmployeeContactModelToSlotRow(source: EmployeeContactModel): SlotRowViewModel<string> {
  return mapEmployeeContactApiToSlotRow({
    contactTypeCode: source.contactTypeCode,
    contactValue: source.contactValue,
  });
}

export function mapSlotDraftToCreateContactRequest(draft: SlotDraft<string>): CreateContactRequest {
  return {
    contactTypeCode: normalizeKey(draft.key),
    contactValue: normalizeValue(draft.value),
  };
}

export function mapSlotDraftToUpdateContactRequest(draft: SlotDraft<string>): UpdateContactRequest {
  return {
    contactValue: normalizeValue(draft.value),
  };
}

function normalizeKey(value: string | null): string {
  return value?.trim() ?? '';
}

function normalizeValue(value: string): string {
  return value.trim();
}
