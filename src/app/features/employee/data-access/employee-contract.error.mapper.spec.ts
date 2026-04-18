import { mapEmployeeContractErrorCode } from './employee-contract.error.mapper';

describe('mapEmployeeContractErrorCode', () => {
  it('extracts message from nested error object', () => {
    const error = { error: { message: 'CONTRACT_OVERLAP' } };
    expect(mapEmployeeContractErrorCode(error)).toBe('CONTRACT_OVERLAP');
  });

  it('returns request-failed when error message is absent', () => {
    expect(mapEmployeeContractErrorCode({})).toBe('request-failed');
  });

  it('returns request-failed when error is null', () => {
    expect(mapEmployeeContractErrorCode(null)).toBe('request-failed');
  });

  it('returns request-failed when error is a plain string', () => {
    expect(mapEmployeeContractErrorCode('something went wrong')).toBe('request-failed');
  });

  it('returns request-failed when message is empty after trim', () => {
    const error = { error: { message: '   ' } };
    expect(mapEmployeeContractErrorCode(error)).toBe('request-failed');
  });

  it('trims whitespace from the extracted message', () => {
    const error = { error: { message: '  CONTRACT_NOT_FOUND  ' } };
    expect(mapEmployeeContractErrorCode(error)).toBe('CONTRACT_NOT_FOUND');
  });
});
