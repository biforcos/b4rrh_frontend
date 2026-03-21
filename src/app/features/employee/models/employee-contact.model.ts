export type EmployeeContactType = 'phone' | 'email' | 'other';

export interface EmployeeContactModel {
  contactTypeCode: string;
  contactValue: string;
  type: EmployeeContactType;
  label: string | null;
  value: string;
}
