import {
  CloseContractRequest,
  CreateContractRequest,
  ReplaceContractFromDateRequest,
  UpdateContractRequest,
} from '../../../core/api/generated/model/models';
import { EmployeeContractModel } from '../models/employee-contract.model';

export interface ContractReplaceDraft {
  effectiveDate: string;
  contractCode: string;
  contractSubtypeCode: string;
}

export interface ContractCorrectDraft {
  startDate: string;
  contractCode: string;
  contractSubtypeCode: string;
}

export interface ContractCloseDraft {
  endDate: string;
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
    startDate: '',
    contractCode: '',
    contractSubtypeCode: '',
  };
}

export function createEmptyContractCloseDraft(): ContractCloseDraft {
  return {
    endDate: '',
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

export function mapContractCorrectDraftToRequest(
  source: ContractCorrectDraft,
): UpdateContractRequest {
  return {
    startDate: source.startDate.trim() || null,
    contractCode: source.contractCode.trim().toUpperCase(),
    contractSubtypeCode: source.contractSubtypeCode.trim().toUpperCase(),
  };
}

export function mapContractCloseDraftToRequest(source: ContractCloseDraft): CloseContractRequest {
  return {
    endDate: source.endDate.trim(),
  };
}

export function mapContractCreateDraftToRequest(
  source: ContractReplaceDraft,
): CreateContractRequest {
  return {
    contractCode: source.contractCode.trim().toUpperCase(),
    contractSubtypeCode: source.contractSubtypeCode.trim().toUpperCase(),
    startDate: source.effectiveDate.trim(),
    endDate: null,
  };
}
