import {
  mapWorkingTimeCloseDraftToRequest,
  mapWorkingTimeCreateDraftToRequest,
} from './employee-working-time.mapper';

describe('employee-working-time.mapper', () => {
  it('maps create draft to request', () => {
    const request = mapWorkingTimeCreateDraftToRequest({
      startDate: '2026-04-01',
      workingTimePercentage: 80,
    });

    expect(request).toEqual({
      startDate: '2026-04-01',
      workingTimePercentage: 80,
    });
  });

  it('maps close draft to request', () => {
    expect(mapWorkingTimeCloseDraftToRequest({ endDate: '2026-12-31' })).toEqual({
      endDate: '2026-12-31',
    });
  });
});
