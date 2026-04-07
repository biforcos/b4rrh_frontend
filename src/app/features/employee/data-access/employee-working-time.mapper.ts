import {
  CloseWorkingTimeRequest,
  CreateWorkingTimeRequest,
} from '../../../core/api/generated/model/models';
import { EmployeeWorkingTimeModel } from '../models/employee-working-time.model';
import { TemporalRowViewModel } from '../shared/ui/section/temporal-section.model';

export interface WorkingTimeCreateDraft {
  startDate: string;
  workingTimePercentage: number;
}

export interface WorkingTimeCloseDraft {
  endDate: string;
}

export interface EmployeeWorkingTimeRowTexts {
  activeStatus: string;
  closedStatus: string;
  currentPeriodLabel: string;
  periodPrefix: string;
  percentageLabel: string;
  weeklyHoursLabel: string;
  dailyHoursLabel: string;
  monthlyHoursLabel: string;
}

export function createEmptyWorkingTimeCreateDraft(): WorkingTimeCreateDraft {
  return {
    startDate: '',
    workingTimePercentage: 0,
  };
}

export function createEmptyWorkingTimeCloseDraft(): WorkingTimeCloseDraft {
  return {
    endDate: '',
  };
}

export function mapEmployeeWorkingTimeModelToTemporalRow(
  source: EmployeeWorkingTimeModel,
  texts: EmployeeWorkingTimeRowTexts,
): TemporalRowViewModel<number> {
  return {
    key: source.workingTimeNumber,
    title: `${texts.percentageLabel}: ${formatNumber(source.workingTimePercentage)} %`,
    titleSecondary: null,
    subtitle: `${texts.weeklyHoursLabel}: ${formatNumber(source.weeklyHours)} · ${texts.dailyHoursLabel}: ${formatNumber(source.dailyHours)}`,
    detailText: `${texts.monthlyHoursLabel}: ${formatNumber(source.monthlyHours)}`,
    periodText: buildPeriodText(source.startDate, source.endDate, texts.currentPeriodLabel, texts.periodPrefix),
    statusLabel: source.isActive ? texts.activeStatus : texts.closedStatus,
    isCurrent: source.isActive,
    canClose: source.isActive,
    closeable: source.isActive,
    deletable: false,
  };
}

export function mapWorkingTimeCreateDraftToRequest(
  draft: WorkingTimeCreateDraft,
): CreateWorkingTimeRequest {
  return {
    startDate: draft.startDate.trim(),
    workingTimePercentage: draft.workingTimePercentage,
  };
}

export function mapWorkingTimeCloseDraftToRequest(
  draft: WorkingTimeCloseDraft,
): CloseWorkingTimeRequest {
  return {
    endDate: draft.endDate.trim(),
  };
}

function buildPeriodText(startDate: string, endDate: string | null, currentPeriodLabel: string, periodPrefix: string): string {
  if (!endDate) {
    return `${periodPrefix}: ${startDate} - ${currentPeriodLabel}`;
  }

  return `${periodPrefix}: ${startDate} - ${endDate}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}