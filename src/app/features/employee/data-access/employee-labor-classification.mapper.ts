import {
  CloseLaborClassificationRequest,
  CreateLaborClassificationRequest,
  ReplaceLaborClassificationFromDateRequest,
  UpdateLaborClassificationRequest,
} from '../../../core/api/generated/model/models';
import { EmployeeLaborClassificationModel } from '../models/employee-labor-classification.model';
import { TemporalRowViewModel } from '../shared/ui/section/temporal-section.model';

export interface LaborClassificationReplaceDraft {
  effectiveDate: string;
  agreementCode: string;
  agreementCategoryCode: string;
}

export interface LaborClassificationCorrectDraft {
  agreementCode: string;
  agreementCategoryCode: string;
}

export interface LaborClassificationCloseDraft {
  endDate: string;
}

export interface EmployeeLaborClassificationRowTexts {
  activeStatus: string;
  closedStatus: string;
  currentPeriodLabel: string;
  periodPrefix: string;
  categoryPrefix: string;
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
    agreementCode: '',
    agreementCategoryCode: '',
  };
}

export function createEmptyLaborClassificationCloseDraft(): LaborClassificationCloseDraft {
  return {
    endDate: '',
  };
}

export function mapLaborClassificationToTemporalRow(
  source: EmployeeLaborClassificationModel,
  rowTexts: EmployeeLaborClassificationRowTexts,
): TemporalRowViewModel<number> {
  const key = Number(source.startDate.replaceAll('-', ''));

  return {
    key,
    title: source.agreementCode,
    subtitle: `${rowTexts.categoryPrefix}: ${source.agreementCategoryCode}`,
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
