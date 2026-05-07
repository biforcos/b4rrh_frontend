export type FamilySituation =
  | 'SINGLE_OR_OTHER'
  | 'MARRIED_DEPENDENT_SPOUSE'
  | 'SEPARATED_WITH_CHILDREN';

export type DisabilityDegree = 'NONE' | 'MODERATE' | 'SEVERE';

export type TaxTerritory = 'COMUN' | 'ARABA' | 'GIPUZKOA' | 'BIZKAIA' | 'NAVARRA';

export interface EmployeeTaxInformationModel {
  validFrom: string;
  familySituation: FamilySituation;
  descendantsCount: number;
  ascendantsCount: number;
  disabilityDegree: DisabilityDegree;
  pensionCompensatoria: boolean;
  geographicMobility: boolean;
  habitualResidenceLoan: boolean;
  taxTerritory: TaxTerritory;
}
