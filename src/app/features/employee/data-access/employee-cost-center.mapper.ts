import {
  CostCenterResponse,
  CreateCostCenterRequest,
  CloseCostCenterRequest,
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

export function mapCostCenterResponsesToHistoryModel(
  responses: ReadonlyArray<CostCenterResponse>,
): EmployeeCostCenterHistoryModel {
  const windowsByPeriod = new Map<string, EmployeeCostCenterWindowModel>();

  for (const response of responses) {
    const key = `${response.startDate}|${response.endDate ?? ''}`;
    const existing = windowsByPeriod.get(key);

    if (existing) {
      existing.totalAllocationPercentage += response.allocationPercentage;
      existing.items = [...existing.items, mapCostCenterResponseToItemModel(response)];
      continue;
    }

    windowsByPeriod.set(key, {
      startDate: response.startDate,
      endDate: response.endDate ?? null,
      totalAllocationPercentage: response.allocationPercentage,
      items: [mapCostCenterResponseToItemModel(response)],
    });
  }

  const history = Array.from(windowsByPeriod.values()).sort((a, b) => {
    if (a.startDate !== b.startDate) return b.startDate.localeCompare(a.startDate);
    const aEnd = a.endDate ?? '';
    const bEnd = b.endDate ?? '';
    return bEnd.localeCompare(aEnd);
  });
  const current = history.find((w) => !w.endDate) ?? null;

  return {
    currentDistribution: current,
    distributionHistory: history,
  };
}

export function mapCostCenterResponsesToWindowModel(
  responses: ReadonlyArray<CostCenterResponse>,
  startDate: string,
  endDate: string | null,
): EmployeeCostCenterWindowModel {
  const items = responses.map((response) => mapCostCenterResponseToItemModel(response));

  return {
    startDate,
    endDate,
    totalAllocationPercentage: items.reduce((acc, item) => acc + item.allocationPercentage, 0),
    items,
  };
}

function mapCostCenterResponseToItemModel(
  response: CostCenterResponse,
): EmployeeCostCenterItemModel {
  return {
    costCenterCode: response.costCenterCode,
    costCenterName: '',
    allocationPercentage: response.allocationPercentage,
  };
}

export function mapCostCenterDistributionCreateDraftToRequests(
  draft: CostCenterDistributionCreateDraft,
): ReadonlyArray<CreateCostCenterRequest> {
  return draft.items.map((item) => ({
    ...mapCostCenterDistributionItemDraftToRequest(item),
    startDate: draft.startDate,
    endDate: null,
  }));
}

export function mapCostCenterDistributionReplaceDraftToRequests(
  draft: CostCenterDistributionReplaceDraft,
): ReadonlyArray<CreateCostCenterRequest> {
  return draft.items.map((item) => ({
    ...mapCostCenterDistributionItemDraftToRequest(item),
    startDate: draft.effectiveDate,
    endDate: null,
  }));
}

function mapCostCenterDistributionItemDraftToRequest(
  draft: CostCenterDistributionItemDraft,
): Pick<CreateCostCenterRequest, 'costCenterCode' | 'allocationPercentage'> {
  return {
    costCenterCode: draft.costCenterCode.trim().toUpperCase(),
    allocationPercentage: draft.allocationPercentage,
  };
}

export function mapCostCenterDistributionCloseDateToRequest(endDate: string): CloseCostCenterRequest {
  return {
    endDate: endDate.trim(),
  };
}
