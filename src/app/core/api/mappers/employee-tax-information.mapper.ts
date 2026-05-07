import { EmployeeTaxInformationApiModel } from '../clients/employee-tax-information.client';
import {
  DisabilityDegree,
  EmployeeTaxInformationModel,
  FamilySituation,
  TaxTerritory,
} from '../../../features/employee/models/employee-tax-information.model';

export function mapTaxInformationFromApi(
  raw: EmployeeTaxInformationApiModel,
): EmployeeTaxInformationModel {
  return {
    validFrom: raw.validFrom,
    familySituation: raw.familySituation as FamilySituation,
    descendantsCount: raw.descendantsCount,
    ascendantsCount: raw.ascendantsCount,
    disabilityDegree: raw.disabilityDegree as DisabilityDegree,
    pensionCompensatoria: raw.pensionCompensatoria,
    geographicMobility: raw.geographicMobility,
    habitualResidenceLoan: raw.habitualResidenceLoan,
    taxTerritory: raw.taxTerritory as TaxTerritory,
  };
}
