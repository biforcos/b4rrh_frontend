import {
  mapCostCenterResponsesToHistoryModel,
  mapCostCenterDistributionCreateDraftToRequests,
  mapCostCenterDistributionReplaceDraftToRequests,
  mapCostCenterDistributionCloseDateToRequest,
} from './employee-cost-center.mapper';
import { CostCenterDistributionWindowResponse } from '../../../core/api/generated/model/models';

const item = (code: string, pct: number) => ({
  costCenterCode: code,
  costCenterName: `Centro ${code}`,
  allocationPercentage: pct,
});

const window = (start: string, end: string | undefined, pct: number, code: string) =>
  ({
    startDate: start,
    endDate: end,
    totalAllocationPercentage: pct,
    items: [item(code, pct)],
  }) as CostCenterDistributionWindowResponse;

describe('mapCostCenterResponsesToHistoryModel', () => {
  it('maps a single open window as currentDistribution', () => {
    const result = mapCostCenterResponsesToHistoryModel([window('2024-01-01', undefined, 100, 'CC1')]);

    expect(result.currentDistribution).not.toBeNull();
    expect(result.currentDistribution!.startDate).toBe('2024-01-01');
    expect(result.currentDistribution!.endDate).toBeNull();
  });

  it('returns null currentDistribution when all windows are closed', () => {
    const result = mapCostCenterResponsesToHistoryModel([window('2023-01-01', '2023-12-31', 100, 'CC1')]);

    expect(result.currentDistribution).toBeNull();
  });

  it('merges windows with the same period key', () => {
    const responses = [
      window('2024-01-01', undefined, 60, 'CC1'),
      window('2024-01-01', undefined, 40, 'CC2'),
    ];

    const result = mapCostCenterResponsesToHistoryModel(responses);

    expect(result.distributionHistory).toHaveLength(1);
    expect(result.distributionHistory[0].totalAllocationPercentage).toBe(100);
    expect(result.distributionHistory[0].items).toHaveLength(2);
  });

  it('sorts history descending by startDate', () => {
    const responses = [
      window('2023-01-01', '2023-12-31', 100, 'CC1'),
      window('2024-01-01', undefined, 100, 'CC2'),
    ];

    const result = mapCostCenterResponsesToHistoryModel(responses);

    expect(result.distributionHistory[0].startDate).toBe('2024-01-01');
    expect(result.distributionHistory[1].startDate).toBe('2023-01-01');
  });

  it('maps item names correctly', () => {
    const result = mapCostCenterResponsesToHistoryModel([window('2024-01-01', undefined, 100, 'CC1')]);

    expect(result.distributionHistory[0].items[0].costCenterCode).toBe('CC1');
    expect(result.distributionHistory[0].items[0].costCenterName).toBe('Centro CC1');
  });
});

describe('mapCostCenterDistributionCreateDraftToRequests', () => {
  it('maps startDate and items', () => {
    const result = mapCostCenterDistributionCreateDraftToRequests({
      startDate: '2024-01-01',
      items: [{ costCenterCode: ' cc1 ', allocationPercentage: 100 }],
    });

    expect(result.startDate).toBe('2024-01-01');
    expect(result.items[0].costCenterCode).toBe('CC1');
    expect(result.items[0].allocationPercentage).toBe(100);
  });
});

describe('mapCostCenterDistributionReplaceDraftToRequests', () => {
  it('maps effectiveDate and normalizes item codes', () => {
    const result = mapCostCenterDistributionReplaceDraftToRequests({
      effectiveDate: '2024-06-01',
      items: [{ costCenterCode: ' cc2 ', allocationPercentage: 50 }],
    });

    expect(result.effectiveDate).toBe('2024-06-01');
    expect(result.items[0].costCenterCode).toBe('CC2');
  });
});

describe('mapCostCenterDistributionCloseDateToRequest', () => {
  it('trims the end date', () => {
    const result = mapCostCenterDistributionCloseDateToRequest('  2024-12-31  ');
    expect(result.endDate).toBe('2024-12-31');
  });
});
