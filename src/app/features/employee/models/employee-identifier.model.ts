export interface EmployeeIdentifierModel {
  typeCode: string;
  value: string;
  issuingCountryCode: string | null;
  expirationDate: string | null;
  isPrimary: boolean;
}
