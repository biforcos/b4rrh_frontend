export type EmployeeContractErrorCode = 'request-failed' | string;

export function mapEmployeeContractErrorCode(error: unknown): EmployeeContractErrorCode {
  const backendMessage =
    typeof error === 'object' && error !== null && 'error' in error
      ? (error as { error?: { message?: unknown } }).error?.message
      : null;

  if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
    return backendMessage.trim();
  }

  return 'request-failed';
}
