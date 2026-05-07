import { EmployeeTaxInformationModel } from '../../../features/employee/models/employee-tax-information.model';

export function mapTaxInformationFromApi(raw: EmployeeTaxInformationModel): EmployeeTaxInformationModel {
  return { ...raw };
}
