import { EmployeeContractApiModel } from '../clients/employee-contract-read.client';

export interface EmployeeContractReadModel {
  contractCode: string;
  contractSubtypeCode: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export function mapEmployeeContractApiToReadModel(
  source: EmployeeContractApiModel,
): EmployeeContractReadModel | null {
  const contractCode = source.contractCode.trim().toUpperCase();
  const startDate = source.startDate.trim();

  if (!contractCode || !startDate) {
    return null;
  }

  const endDate = normalizeOptionalValue(source.endDate);

  return {
    contractCode,
    contractSubtypeCode: normalizeOptionalValue(source.contractSubtypeCode),
    startDate,
    endDate,
    isActive: endDate === null,
  };
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}
