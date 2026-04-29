import { describe, expect, it } from 'vitest';

import { isRunFinished } from './calculation-run.model';
import type { CalculationRun } from './calculation-run.model';

const base: CalculationRun = {
  runId: 1,
  status: 'COMPLETED',
  ruleSystemCode: 'ESP',
  payrollPeriodCode: '202604',
  totalCandidates: 0,
  totalEligible: 0,
  totalCalculated: 0,
  totalNotValid: 0,
  totalErrors: 0,
  requestedAt: '2026-04-29T08:00:00',
  startedAt: null,
  finishedAt: null,
};

describe('isRunFinished', () => {
  it('returns true for COMPLETED', () =>
    expect(isRunFinished({ ...base, status: 'COMPLETED' })).toBe(true));
  it('returns true for COMPLETED_WITH_ERRORS', () =>
    expect(isRunFinished({ ...base, status: 'COMPLETED_WITH_ERRORS' })).toBe(true));
  it('returns true for FAILED', () =>
    expect(isRunFinished({ ...base, status: 'FAILED' })).toBe(true));
  it('returns false for RUNNING', () =>
    expect(isRunFinished({ ...base, status: 'RUNNING' })).toBe(false));
  it('returns false for REQUESTED', () =>
    expect(isRunFinished({ ...base, status: 'REQUESTED' })).toBe(false));
});
