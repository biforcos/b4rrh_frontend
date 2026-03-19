export type EmployeeContactType = 'phone' | 'email' | 'other';

export interface EmployeeContactModel {
  type: EmployeeContactType;
  label: string | null;
  value: string;
}
