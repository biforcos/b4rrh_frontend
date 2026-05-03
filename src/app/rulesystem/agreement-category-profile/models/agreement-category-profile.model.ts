export interface AgreementCategoryWithProfileModel {
  categoryCode: string;
  categoryName: string | null;
  grupoCotizacionCode: string | null;
  tipoNomina: 'MENSUAL' | 'DIARIO' | null;
}

export interface AgreementCategoryProfileDraft {
  grupoCotizacionCode: string;
  tipoNomina: string;
}

export interface SimpleOption {
  code: string;
  name: string | null;
}
