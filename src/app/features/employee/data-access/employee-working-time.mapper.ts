import {
  CloseWorkingTimeRequest,
  CreateWorkingTimeRequest,
  UpdateWorkingTimeRequest,
} from '../../../core/api/generated/model/models';

export interface WorkingTimeCreateDraft {
  startDate: string;
  workingTimePercentage: number;
}

export interface WorkingTimeUpdateDraft {
  startDate: string;
  workingTimePercentage: number;
}

export interface WorkingTimeCloseDraft {
  endDate: string;
}

export function mapWorkingTimeCreateDraftToRequest(
  draft: WorkingTimeCreateDraft,
): CreateWorkingTimeRequest {
  return {
    startDate: draft.startDate.trim(),
    workingTimePercentage: draft.workingTimePercentage,
  };
}

export function mapWorkingTimeUpdateDraftToRequest(
  draft: WorkingTimeUpdateDraft,
): UpdateWorkingTimeRequest {
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
