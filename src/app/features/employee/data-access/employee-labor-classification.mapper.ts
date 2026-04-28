import {
  CloseLaborClassificationRequest,
  CreateLaborClassificationRequest,
  ReplaceLaborClassificationFromDateRequest,
  UpdateLaborClassificationRequest,
} from '../../../core/api/generated/model/models';
import { EmployeeLaborClassificationModel } from '../models/employee-labor-classification.model';

export interface LaborClassificationReplaceDraft {
  effectiveDate: string;
  agreementCode: string;
  agreementCategoryCode: string;
}

export interface LaborClassificationCorrectDraft {
  startDate: string;
  agreementCode: string;
  agreementCategoryCode: string;
}

export interface LaborClassificationCloseDraft {
  endDate: string;
}

export function createEmptyLaborClassificationReplaceDraft(): LaborClassificationReplaceDraft {
  return {
    effectiveDate: '',
    agreementCode: '',
    agreementCategoryCode: '',
  };
}

export function createEmptyLaborClassificationCorrectDraft(): LaborClassificationCorrectDraft {
  return {
    startDate: '',
    agreementCode: '',
    agreementCategoryCode: '',
  };
}

export function createEmptyLaborClassificationCloseDraft(): LaborClassificationCloseDraft {
  return {
    endDate: '',
  };
}

export function mapLaborClassificationReplaceDraftToRequest(
  source: LaborClassificationReplaceDraft,
): ReplaceLaborClassificationFromDateRequest {
  return {
    effectiveDate: source.effectiveDate.trim(),
    agreementCode: source.agreementCode.trim().toUpperCase(),
    agreementCategoryCode: source.agreementCategoryCode.trim().toUpperCase(),
  };
}

export function mapLaborClassificationCorrectDraftToRequest(
  source: LaborClassificationCorrectDraft,
): UpdateLaborClassificationRequest {
  return {
    startDate: source.startDate.trim() || null,
    agreementCode: source.agreementCode.trim().toUpperCase(),
    agreementCategoryCode: source.agreementCategoryCode.trim().toUpperCase(),
  };
}

export function mapLaborClassificationCloseDraftToRequest(
  source: LaborClassificationCloseDraft,
): CloseLaborClassificationRequest {
  return {
    endDate: source.endDate.trim(),
  };
}

export function mapLaborClassificationCreateDraftToRequest(
  source: LaborClassificationReplaceDraft,
): CreateLaborClassificationRequest {
  return {
    agreementCode: source.agreementCode.trim().toUpperCase(),
    agreementCategoryCode: source.agreementCategoryCode.trim().toUpperCase(),
    startDate: source.effectiveDate.trim(),
    endDate: null,
  };
}
