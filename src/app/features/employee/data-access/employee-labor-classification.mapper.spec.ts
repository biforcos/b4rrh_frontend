import {
  mapLaborClassificationReplaceDraftToRequest,
  mapLaborClassificationCorrectDraftToRequest,
  mapLaborClassificationCloseDraftToRequest,
} from './employee-labor-classification.mapper';

describe('employee-labor-classification.mapper', () => {
  it('maps replace draft to request normalizing codes', () => {
    expect(
      mapLaborClassificationReplaceDraftToRequest({
        effectiveDate: '2026-01-01',
        agreementCode: 'ag1',
        agreementCategoryCode: 'cat1',
      }),
    ).toEqual({ effectiveDate: '2026-01-01', agreementCode: 'AG1', agreementCategoryCode: 'CAT1' });
  });

  it('maps correct draft to request with unchanged startDate as null', () => {
    expect(
      mapLaborClassificationCorrectDraftToRequest({
        startDate: '',
        agreementCode: 'ag2',
        agreementCategoryCode: 'cat2',
      }),
    ).toEqual({ startDate: null, agreementCode: 'AG2', agreementCategoryCode: 'CAT2' });
  });

  it('maps correct draft to request with corrected startDate', () => {
    expect(
      mapLaborClassificationCorrectDraftToRequest({
        startDate: '2026-02-01',
        agreementCode: 'ag2',
        agreementCategoryCode: 'cat2',
      }),
    ).toEqual({ startDate: '2026-02-01', agreementCode: 'AG2', agreementCategoryCode: 'CAT2' });
  });

  it('maps close draft to request', () => {
    expect(mapLaborClassificationCloseDraftToRequest({ endDate: '2026-12-31' })).toEqual({
      endDate: '2026-12-31',
    });
  });
});
