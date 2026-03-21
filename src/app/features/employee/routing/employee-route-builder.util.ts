import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { employeeRouteParamNames, toEmployeeBusinessKey } from './employee-route-key.util';

export const employeeRouteSections = ['overview', 'contact', 'presence'] as const;
export type EmployeeRouteSection = (typeof employeeRouteSections)[number];

export const employeeRouteBaseSegment = 'personas/empleados';

export function buildEmployeeDetailRouteCommands(
  key: EmployeeBusinessKey,
  section: EmployeeRouteSection,
): ReadonlyArray<string> {
  const normalizedKey = toEmployeeBusinessKey(key);

  return [
    `/${employeeRouteBaseSegment}`,
    normalizedKey.ruleSystemCode,
    normalizedKey.employeeTypeCode,
    normalizedKey.employeeNumber,
    section,
  ];
}

export function buildEmployeeKeyRoutePath(): string {
  return `:${employeeRouteParamNames.ruleSystemCode}/:${employeeRouteParamNames.employeeTypeCode}/:${employeeRouteParamNames.employeeNumber}`;
}

export function buildEmployeeUnknownSectionRoutePath(): string {
  return `${buildEmployeeKeyRoutePath()}/:section`;
}

export function buildEmployeeDetailRoutePath(section: EmployeeRouteSection): string {
  return `${buildEmployeeKeyRoutePath()}/${section}`;
}
