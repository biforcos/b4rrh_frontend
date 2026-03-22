const workCenterFunctionalErrorCodes = [
  'WORK_CENTER_OVERLAP',
  'WORK_CENTER_OUTSIDE_PRESENCE',
  'WORK_CENTER_CATALOG_NOT_FOUND',
  'WORK_CENTER_NOT_FOUND',
  'WORK_CENTER_ALREADY_CLOSED',
  'WORK_CENTER_INVALID_PERIOD',
] as const;

export type EmployeeWorkCenterFunctionalErrorCode = (typeof workCenterFunctionalErrorCodes)[number];

export type EmployeeWorkCenterErrorCode = EmployeeWorkCenterFunctionalErrorCode | 'request-failed';

const workCenterFunctionalErrorCodeSet = new Set<string>(workCenterFunctionalErrorCodes);

export function mapEmployeeWorkCenterErrorCode(error: unknown): EmployeeWorkCenterErrorCode {
  const functionalCode = extractFunctionalCode(error);

  if (functionalCode && workCenterFunctionalErrorCodeSet.has(functionalCode)) {
    return functionalCode as EmployeeWorkCenterFunctionalErrorCode;
  }

  return 'request-failed';
}

function extractFunctionalCode(error: unknown): string | null {
  if (!isRecord(error)) {
    return null;
  }

  if (typeof error['code'] === 'string') {
    return error['code'];
  }

  if (isRecord(error['error']) && typeof error['error']['code'] === 'string') {
    return error['error']['code'];
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
