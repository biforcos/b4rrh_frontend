export interface CompanyAddressModel {
  street: string | null;
  city: string | null;
  postalCode: string | null;
  regionCode: string | null;
  countryCode: string | null;
}

export interface CompanyDetailModel {
  ruleSystemCode: string;
  companyCode: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  legalName: string;
  taxIdentifier: string | null;
  address: CompanyAddressModel;
}
