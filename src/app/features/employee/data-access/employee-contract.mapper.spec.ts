import {
  mapContractReplaceDraftToRequest,
  mapContractCorrectDraftToRequest,
  mapContractCloseDraftToRequest,
} from './employee-contract.mapper';

describe('employee-contract.mapper', () => {
  it('maps replace draft to request normalizing codes', () => {
    expect(mapContractReplaceDraftToRequest({ effectiveDate: '2026-01-01', contractCode: 'perm', contractSubtypeCode: 'full' }))
      .toEqual({ effectiveDate: '2026-01-01', contractCode: 'PERM', contractSubtypeCode: 'FULL' });
  });

  it('maps correct draft to request', () => {
    expect(mapContractCorrectDraftToRequest({ contractCode: 'temp', contractSubtypeCode: 'evt' }))
      .toEqual({ contractCode: 'TEMP', contractSubtypeCode: 'EVT' });
  });

  it('maps close draft to request', () => {
    expect(mapContractCloseDraftToRequest({ endDate: '2026-12-31' })).toEqual({ endDate: '2026-12-31' });
  });
});
