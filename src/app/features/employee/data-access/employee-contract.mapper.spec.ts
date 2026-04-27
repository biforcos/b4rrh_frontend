import {
  mapContractReplaceDraftToRequest,
  mapContractCorrectDraftToRequest,
  mapContractCloseDraftToRequest,
} from './employee-contract.mapper';

describe('employee-contract.mapper', () => {
  it('maps replace draft to request normalizing codes', () => {
    expect(
      mapContractReplaceDraftToRequest({
        effectiveDate: '2026-01-01',
        contractCode: 'perm',
        contractSubtypeCode: 'full',
      }),
    ).toEqual({ effectiveDate: '2026-01-01', contractCode: 'PERM', contractSubtypeCode: 'FULL' });
  });

  it('maps correct draft to request with unchanged startDate as null', () => {
    expect(
      mapContractCorrectDraftToRequest({
        startDate: '',
        contractCode: 'temp',
        contractSubtypeCode: 'evt',
      }),
    ).toEqual({ startDate: null, contractCode: 'TEMP', contractSubtypeCode: 'EVT' });
  });

  it('maps correct draft to request with corrected startDate', () => {
    expect(
      mapContractCorrectDraftToRequest({
        startDate: '2026-02-01',
        contractCode: 'temp',
        contractSubtypeCode: 'evt',
      }),
    ).toEqual({ startDate: '2026-02-01', contractCode: 'TEMP', contractSubtypeCode: 'EVT' });
  });

  it('maps close draft to request', () => {
    expect(mapContractCloseDraftToRequest({ endDate: '2026-12-31' })).toEqual({
      endDate: '2026-12-31',
    });
  });
});
