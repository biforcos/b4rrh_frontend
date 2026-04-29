export type TargetSelectionMode = 'ALL' | 'LIST' | 'SINGLE';

export interface TargetSelectionPayload {
  selectionType: 'ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD' | 'EMPLOYEE_LIST' | 'SINGLE_EMPLOYEE';
  employee?: { employeeTypeCode: string; employeeNumber: string };
  employees?: Array<{ employeeTypeCode: string; employeeNumber: string }>;
}

export function buildTargetSelectionPayload(
  mode: TargetSelectionMode,
  listText: string,
  singleTypeCode: string,
  singleNumber: string,
): TargetSelectionPayload {
  if (mode === 'ALL') {
    return { selectionType: 'ALL_EMPLOYEES_WITH_PRESENCE_IN_PERIOD' };
  }
  if (mode === 'LIST') {
    const employees = listText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.includes(':'))
      .map((l) => {
        const colonIdx = l.indexOf(':');
        return {
          employeeTypeCode: l.slice(0, colonIdx).trim(),
          employeeNumber: l.slice(colonIdx + 1).trim(),
        };
      });
    return { selectionType: 'EMPLOYEE_LIST', employees };
  }
  return {
    selectionType: 'SINGLE_EMPLOYEE',
    employee: { employeeTypeCode: singleTypeCode.trim(), employeeNumber: singleNumber.trim() },
  };
}
