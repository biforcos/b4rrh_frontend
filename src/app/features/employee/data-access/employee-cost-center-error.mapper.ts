const costCenterFunctionalErrorCodes = [
  'COST_CENTER_INVALID_WINDOW',
  'COST_CENTER_OVERLAP',
  'COST_CENTER_OUTSIDE_PRESENCE',
  'COST_CENTER_CATALOG_NOT_FOUND',
  'COST_CENTER_DISTRIBUTION_NOT_FOUND',
  'COST_CENTER_DISTRIBUTION_ALREADY_CLOSED',
  'COST_CENTER_REPLACE_NO_ACTIVE_WINDOW',
  'COST_CENTER_CLOSE_IMPOSSIBLE_START_DATE',
] as const;

export type EmployeeCostCenterFunctionalErrorCode = (typeof costCenterFunctionalErrorCodes)[number];

export type EmployeeCostCenterErrorCode = EmployeeCostCenterFunctionalErrorCode | 'request-failed';

const costCenterFunctionalErrorCodeSet = new Set<string>(costCenterFunctionalErrorCodes);

export function mapEmployeeCostCenterErrorCode(error: unknown): EmployeeCostCenterErrorCode {
  const functionalCode = extractFunctionalCode(error);

  if (functionalCode && costCenterFunctionalErrorCodeSet.has(functionalCode)) {
    return functionalCode as EmployeeCostCenterFunctionalErrorCode;
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
