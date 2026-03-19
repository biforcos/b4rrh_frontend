export interface EmployeeAddressModel {
  addressNumber: number;
  addressTypeCode: string;
  street: string;
  city: string;
  countryCode: string;
  postalCode: string | null;
  regionCode: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}
