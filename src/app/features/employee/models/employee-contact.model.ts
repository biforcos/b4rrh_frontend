export type EmployeeContactType = 'phone' | 'email' | 'other';

export interface EmployeeContactModel {
  contactTypeCode: string;
  contactTypeName?: string | null;
  contactValue: string;
  type: EmployeeContactType;
  label: string | null;
  value: string;
}
