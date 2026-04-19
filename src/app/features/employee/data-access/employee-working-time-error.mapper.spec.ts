import { mapEmployeeWorkingTimeErrorCode } from './employee-working-time-error.mapper';

describe('mapEmployeeWorkingTimeErrorCode', () => {
  it('recognizes WORKING_TIME_OVERLAP from direct code property', () => {
    expect(mapEmployeeWorkingTimeErrorCode({ code: 'WORKING_TIME_OVERLAP' })).toBe(
      'WORKING_TIME_OVERLAP',
    );
  });

  it('recognizes WORKING_TIME_NOT_FOUND from nested error.code', () => {
    expect(mapEmployeeWorkingTimeErrorCode({ error: { code: 'WORKING_TIME_NOT_FOUND' } })).toBe(
      'WORKING_TIME_NOT_FOUND',
    );
  });

  it('recognizes all known functional error codes', () => {
    const knownCodes = [
      'WORKING_TIME_NOT_FOUND',
      'WORKING_TIME_INVALID_PERCENTAGE',
      'WORKING_TIME_INVALID_PERIOD',
      'WORKING_TIME_OVERLAP',
      'WORKING_TIME_OUTSIDE_PRESENCE',
      'WORKING_TIME_NUMBER_CONFLICT',
      'WORKING_TIME_ALREADY_CLOSED',
    ];
    for (const code of knownCodes) {
      expect(mapEmployeeWorkingTimeErrorCode({ code })).toBe(code);
    }
  });

  it('returns request-failed for an unknown code', () => {
    expect(mapEmployeeWorkingTimeErrorCode({ code: 'UNKNOWN' })).toBe('request-failed');
  });

  it('returns request-failed when error is null', () => {
    expect(mapEmployeeWorkingTimeErrorCode(null)).toBe('request-failed');
  });
});
