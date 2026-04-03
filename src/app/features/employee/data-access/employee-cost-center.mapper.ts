import {
  CostCenterCurrentDistributionResponse,
  CostCenterDistributionHistoryResponse,
  CostCenterDistributionWindowResponse,
  CreateCostCenterDistributionRequest,
  ReplaceCostCenterDistributionFromDateRequest,
  CloseCostCenterDistributionRequest,
  CostCenterDistributionItemResponse,
  CostCenterDistributionItemRequest,
} from '../../../core/api/generated/model/models';
import {
  EmployeeCostCenterHistoryModel,
  EmployeeCostCenterItemModel,
  EmployeeCostCenterWindowModel,
} from '../models/employee-cost-center.model';

export interface CostCenterDistributionItemDraft {
  costCenterCode: string;
  allocationPercentage: number;
}

export interface CostCenterDistributionCreateDraft {
  startDate: string;
  items: ReadonlyArray<CostCenterDistributionItemDraft>;
}

export interface CostCenterDistributionReplaceDraft {
  effectiveDate: string;
  items: ReadonlyArray<CostCenterDistributionItemDraft>;
}

export function mapCostCenterCurrentDistributionResponseToModel(
  response: CostCenterCurrentDistributionResponse,
): EmployeeCostCenterWindowModel | null {
  return response.currentDistribution ? mapCostCenterDistributionWindowResponseToModel(response.currentDistribution) : null;
}

export function mapCostCenterDistributionHistoryResponseToModel(
  response: CostCenterDistributionHistoryResponse,
): EmployeeCostCenterHistoryModel {
  const history = response.windows.map((window) => mapCostCenterDistributionWindowResponseToModel(window));
  const current = history.find((w) => !w.endDate) ?? null;

  return {
    currentDistribution: current,
    distributionHistory: history,
  };
}

export function mapCostCenterDistributionWindowResponseToModel(
  response: CostCenterDistributionWindowResponse,
): EmployeeCostCenterWindowModel {
  return {
    startDate: response.startDate,
    endDate: response.endDate ?? null,
    totalAllocationPercentage: response.totalAllocationPercentage,
    items: response.items.map((item) => mapCostCenterDistributionItemResponseToModel(item)),
  };
}

function mapCostCenterDistributionItemResponseToModel(
  response: CostCenterDistributionItemResponse,
): EmployeeCostCenterItemModel {
  return {
    costCenterCode: response.costCenterCode,
    costCenterName: response.costCenterName ?? '',
    allocationPercentage: response.allocationPercentage,
  };
}

export function mapCostCenterDistributionCreateDraftToRequest(
  draft: CostCenterDistributionCreateDraft,
): CreateCostCenterDistributionRequest {
  return {
    startDate: draft.startDate,
    items: draft.items.map((item) => mapCostCenterDistributionItemDraftToRequest(item)),
  };
}

export function mapCostCenterDistributionReplaceDraftToRequest(
  draft: CostCenterDistributionReplaceDraft,
): ReplaceCostCenterDistributionFromDateRequest {
  return {
    effectiveDate: draft.effectiveDate,
    items: draft.items.map((item) => mapCostCenterDistributionItemDraftToRequest(item)),
  };
}

function mapCostCenterDistributionItemDraftToRequest(
  draft: CostCenterDistributionItemDraft,
): CostCenterDistributionItemRequest {
  return {
    costCenterCode: draft.costCenterCode.trim().toUpperCase(),
    allocationPercentage: draft.allocationPercentage,
  };
}

export function mapCostCenterDistributionCloseDateToRequest(endDate: string): CloseCostCenterDistributionRequest {
  return {
    endDate: endDate.trim(),
  };
}
