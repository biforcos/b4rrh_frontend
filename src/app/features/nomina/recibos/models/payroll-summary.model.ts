import { PayrollSummaryResponseStatusEnum } from '../../../../core/api/generated/model/payroll-summary-response';
import { PayrollBusinessKey } from './payroll-business-key.model';

export type PayrollStatus = `${PayrollSummaryResponseStatusEnum}`;

export interface PayrollSummaryModel extends PayrollBusinessKey {
  status: PayrollStatus;
  calculatedAt: string;
}

export interface PayrollCompanyProfileModel {
  legalName: string | null;
  taxIdentifier: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
}

export interface PayrollEmployeeProfileModel {
  fullName: string | null;
  nif: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
}
