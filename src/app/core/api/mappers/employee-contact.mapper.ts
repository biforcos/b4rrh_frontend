import { EmployeeContactApiModel } from '../clients/employee-contact-read.client';

export type EmployeeContactReadType = 'phone' | 'email' | 'other';

export interface EmployeeContactReadModel {
  contactTypeCode: string;
  contactTypeName?: string | null;
  contactValue: string;
  type: EmployeeContactReadType;
  label: string | null;
  value: string;
}

const phoneTypeMarkers = ['PHONE', 'MOBILE', 'TEL', 'SMS', 'WHATSAPP', 'FAX'];
const emailTypeMarkers = ['EMAIL', 'MAIL'];
const phoneValuePattern = /^[+]?[-()\s0-9]{6,}$/;

export function mapEmployeeContactApiToReadModel(
  source: EmployeeContactApiModel,
): EmployeeContactReadModel | null {
  const normalizedValue = source.contactValue.trim();
  if (!normalizedValue) {
    return null;
  }

  const normalizedTypeCode = source.contactTypeCode.trim();
  const normalizedTypeCodeForDetection = normalizedTypeCode.toUpperCase();

  return {
    contactTypeCode: normalizedTypeCode,
    contactTypeName: normalizeOptionalValue(source.contactTypeName),
    contactValue: normalizedValue,
    type: resolveContactType(normalizedTypeCodeForDetection, normalizedValue),
    label: normalizedTypeCode.length > 0 ? normalizedTypeCode : null,
    value: normalizedValue,
  };
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function resolveContactType(typeCode: string, contactValue: string): EmployeeContactReadType {
  if (isEmail(typeCode, contactValue)) {
    return 'email';
  }

  if (isPhone(typeCode, contactValue)) {
    return 'phone';
  }

  return 'other';
}

function isEmail(typeCode: string, contactValue: string): boolean {
  if (contactValue.includes('@')) {
    return true;
  }

  return emailTypeMarkers.some((marker) => typeCode.includes(marker));
}

function isPhone(typeCode: string, contactValue: string): boolean {
  if (phoneTypeMarkers.some((marker) => typeCode.includes(marker))) {
    return true;
  }

  return phoneValuePattern.test(contactValue);
}
