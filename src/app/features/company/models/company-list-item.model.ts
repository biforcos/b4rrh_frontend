export interface CompanyListItemModel {
  ruleSystemCode: string;
  companyCode: string;
  name: string;
  legalName: string;
  taxIdentifier: string | null;
  countryCode: string | null;
  active: boolean;
  startDate: string;
  endDate: string | null;
}
