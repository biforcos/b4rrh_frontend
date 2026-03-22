export interface EmployeeIdentifierModel {
  typeCode: string;
  typeName?: string | null;
  value: string;
  issuingCountryCode: string | null;
  expirationDate: string | null;
  isPrimary: boolean;
}
