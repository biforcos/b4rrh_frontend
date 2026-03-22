import {
  CloseWorkCenterRequest,
  CreateWorkCenterRequest,
  UpdateWorkCenterRequest,
} from '../../../core/api/generated/model/models';
import { EmployeeWorkCenterModel } from '../models/employee-work-center.model';
import { TemporalRowViewModel } from '../shared/ui/section/temporal-section.model';

export interface WorkCenterCreateDraft {
  workCenterCode: string;
  startDate: string;
  endDate: string;
}

export interface WorkCenterCorrectDraft {
  workCenterCode: string;
  startDate: string;
  endDate: string;
}

export interface EmployeeWorkCenterRowTexts {
  currentStatus: string;
  closedStatus: string;
  currentPeriodLabel: string;
  periodPrefix: string;
  assignmentPrefix: string;
}

export function mapEmployeeWorkCenterModelToTemporalRow(
  source: EmployeeWorkCenterModel,
  texts: EmployeeWorkCenterRowTexts,
): TemporalRowViewModel<number> {
  const title = buildTitle(source);

  return {
    key: source.workCenterAssignmentNumber,
    title,
    subtitle: source.isActive ? `${texts.assignmentPrefix} ${source.workCenterAssignmentNumber}` : null,
    periodText: buildPeriodText(source.startDate, source.endDate, texts.currentPeriodLabel, texts.periodPrefix),
    statusLabel: source.isActive ? texts.currentStatus : texts.closedStatus,
    isCurrent: source.isActive,
    closeable: source.isActive,
  };
}

export function mapWorkCenterCreateDraftToRequest(draft: WorkCenterCreateDraft): CreateWorkCenterRequest {
  return {
    workCenterCode: normalizeCode(draft.workCenterCode),
    startDate: normalizeRequiredValue(draft.startDate),
    endDate: normalizeOptionalValue(draft.endDate),
  };
}

export function mapWorkCenterCorrectDraftToRequest(draft: WorkCenterCorrectDraft): UpdateWorkCenterRequest {
  return {
    workCenterCode: normalizeCode(draft.workCenterCode),
    startDate: normalizeRequiredValue(draft.startDate),
    endDate: normalizeOptionalValue(draft.endDate),
  };
}

export function mapWorkCenterCloseDateToRequest(endDate: string): CloseWorkCenterRequest {
  return {
    endDate: normalizeRequiredValue(endDate),
  };
}

function buildPeriodText(startDate: string, endDate: string | null, currentPeriodLabel: string, periodPrefix: string): string {
  if (!endDate) {
    return `${periodPrefix}: ${startDate} - ${currentPeriodLabel}`;
  }

  return `${periodPrefix}: ${startDate} - ${endDate}`;
}

function buildTitle(source: EmployeeWorkCenterModel): string {
  const normalizedLabel = source.workCenterLabel?.trim() ?? '';
  if (normalizedLabel.length === 0) {
    return source.workCenterCode;
  }

  return `${source.workCenterCode} · ${normalizedLabel}`;
}

function normalizeCode(value: string | null | undefined): string {
  return normalizeRequiredValue(value).toUpperCase();
}

function normalizeRequiredValue(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}
