import { mapEmployeeWorkCenterErrorCode } from './employee-work-center-error.mapper';

describe('mapEmployeeWorkCenterErrorCode', () => {
  it('recognizes WORK_CENTER_OVERLAP from direct code property', () => {
    expect(mapEmployeeWorkCenterErrorCode({ code: 'WORK_CENTER_OVERLAP' })).toBe('WORK_CENTER_OVERLAP');
  });

  it('recognizes WORK_CENTER_NOT_FOUND from nested error.code', () => {
    expect(mapEmployeeWorkCenterErrorCode({ error: { code: 'WORK_CENTER_NOT_FOUND' } }))
      .toBe('WORK_CENTER_NOT_FOUND');
  });

  it('recognizes all known functional error codes', () => {
    const knownCodes = [
      'WORK_CENTER_OVERLAP',
      'WORK_CENTER_OUTSIDE_PRESENCE',
      'WORK_CENTER_CATALOG_NOT_FOUND',
      'WORK_CENTER_NOT_FOUND',
      'WORK_CENTER_ALREADY_CLOSED',
      'WORK_CENTER_INVALID_PERIOD',
      'WORK_CENTER_DELETE_FORBIDDEN_AT_PRESENCE_START',
    ];
    for (const code of knownCodes) {
      expect(mapEmployeeWorkCenterErrorCode({ code })).toBe(code);
    }
  });

  it('returns request-failed for an unknown code', () => {
    expect(mapEmployeeWorkCenterErrorCode({ code: 'UNKNOWN' })).toBe('request-failed');
  });

  it('returns request-failed when error is null', () => {
    expect(mapEmployeeWorkCenterErrorCode(null)).toBe('request-failed');
  });

  it('prefers direct code over nested error.code', () => {
    expect(mapEmployeeWorkCenterErrorCode({ code: 'WORK_CENTER_OVERLAP', error: { code: 'WORK_CENTER_NOT_FOUND' } }))
      .toBe('WORK_CENTER_OVERLAP');
  });
});
