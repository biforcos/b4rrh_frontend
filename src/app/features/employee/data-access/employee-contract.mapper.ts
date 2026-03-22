import {
  CloseContractRequest,
  CreateContractRequest,
  ReplaceContractFromDateRequest,
  UpdateContractRequest,
} from '../../../core/api/generated/model/models';
import { EmployeeContractModel } from '../models/employee-contract.model';
import { TemporalRowViewModel } from '../shared/ui/section/temporal-section.model';

export interface ContractReplaceDraft {
  effectiveDate: string;
  contractCode: string;
  contractSubtypeCode: string;
}

export interface ContractCorrectDraft {
  contractCode: string;
  contractSubtypeCode: string;
}

export interface ContractCloseDraft {
  endDate: string;
}

export interface EmployeeContractRowTexts {
  activeStatus: string;
  closedStatus: string;
  currentPeriodLabel: string;
  periodPrefix: string;
  subtypePrefix: string;
}

export function createEmptyContractReplaceDraft(): ContractReplaceDraft {
  return {
    effectiveDate: '',
    contractCode: '',
    contractSubtypeCode: '',
  };
}

export function createEmptyContractCorrectDraft(): ContractCorrectDraft {
  return {
    contractCode: '',
    contractSubtypeCode: '',
  };
}

export function createEmptyContractCloseDraft(): ContractCloseDraft {
  return {
    endDate: '',
  };
}

export function mapContractToTemporalRow(
  source: EmployeeContractModel,
  rowTexts: EmployeeContractRowTexts,
): TemporalRowViewModel<number> {
  const key = Number(source.startDate.replaceAll('-', ''));

  return {
    key,
    title: source.contractCode,
    subtitle: `${rowTexts.subtypePrefix}: ${source.contractSubtypeCode ?? '-'}`,
    detailText: `${rowTexts.periodPrefix}: ${source.startDate}`,
    periodText: source.endDate
      ? `${source.startDate} - ${source.endDate}`
      : `${source.startDate} - ${rowTexts.currentPeriodLabel}`,
    statusLabel: source.isActive ? rowTexts.activeStatus : rowTexts.closedStatus,
    isCurrent: source.isActive,
    canCorrect: true,
    canClose: source.isActive,
    canDelete: false,
    closeable: source.isActive,
    deletable: false,
  };
}

export function mapContractReplaceDraftToRequest(
  source: ContractReplaceDraft,
): ReplaceContractFromDateRequest {
  return {
    effectiveDate: source.effectiveDate.trim(),
    contractCode: source.contractCode.trim().toUpperCase(),
    contractSubtypeCode: source.contractSubtypeCode.trim().toUpperCase(),
  };
}

export function mapContractCorrectDraftToRequest(source: ContractCorrectDraft): UpdateContractRequest {
  return {
    contractCode: source.contractCode.trim().toUpperCase(),
    contractSubtypeCode: source.contractSubtypeCode.trim().toUpperCase(),
  };
}

export function mapContractCloseDraftToRequest(source: ContractCloseDraft): CloseContractRequest {
  return {
    endDate: source.endDate.trim(),
  };
}

export function mapContractCreateDraftToRequest(source: ContractReplaceDraft): CreateContractRequest {
  return {
    contractCode: source.contractCode.trim().toUpperCase(),
    contractSubtypeCode: source.contractSubtypeCode.trim().toUpperCase(),
    startDate: source.effectiveDate.trim(),
    endDate: null,
  };
}
