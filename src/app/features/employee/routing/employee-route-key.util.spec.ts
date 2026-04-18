import {
  areEmployeeBusinessKeysEqual,
  readEmployeeBusinessKeyFromParamMap,
  toEmployeeBusinessKey,
} from './employee-route-key.util';

const paramMapOf = (params: Record<string, string>) => ({
  get: (key: string) => params[key] ?? null,
  has: (key: string) => key in params,
  getAll: (key: string) => (params[key] ? [params[key]] : []),
  keys: Object.keys(params),
});

describe('toEmployeeBusinessKey', () => {
  it('trims all key segments', () => {
    const result = toEmployeeBusinessKey({
      ruleSystemCode: ' ESP ',
      employeeTypeCode: ' ORD ',
      employeeNumber: ' 00001 ',
    });

    expect(result.ruleSystemCode).toBe('ESP');
    expect(result.employeeTypeCode).toBe('ORD');
    expect(result.employeeNumber).toBe('00001');
  });
});

describe('readEmployeeBusinessKeyFromParamMap', () => {
  it('returns a business key when all params are present', () => {
    const paramMap = paramMapOf({
      ruleSystemCode: 'ESP',
      employeeTypeCode: 'ORD',
      employeeNumber: '00001',
    });

    const result = readEmployeeBusinessKeyFromParamMap(paramMap as any);

    expect(result).toEqual({ ruleSystemCode: 'ESP', employeeTypeCode: 'ORD', employeeNumber: '00001' });
  });

  it('returns null when ruleSystemCode is missing', () => {
    const paramMap = paramMapOf({ employeeTypeCode: 'ORD', employeeNumber: '00001' });

    expect(readEmployeeBusinessKeyFromParamMap(paramMap as any)).toBeNull();
  });

  it('returns null when employeeNumber is missing', () => {
    const paramMap = paramMapOf({ ruleSystemCode: 'ESP', employeeTypeCode: 'ORD' });

    expect(readEmployeeBusinessKeyFromParamMap(paramMap as any)).toBeNull();
  });

  it('trims whitespace from param values', () => {
    const paramMap = paramMapOf({
      ruleSystemCode: ' ESP ',
      employeeTypeCode: ' ORD ',
      employeeNumber: ' 00001 ',
    });

    const result = readEmployeeBusinessKeyFromParamMap(paramMap as any);

    expect(result?.ruleSystemCode).toBe('ESP');
  });
});

describe('areEmployeeBusinessKeysEqual', () => {
  const key = { ruleSystemCode: 'ESP', employeeTypeCode: 'ORD', employeeNumber: '00001' };

  it('returns true for identical keys', () => {
    expect(areEmployeeBusinessKeysEqual(key, { ...key })).toBe(true);
  });

  it('returns false when employeeNumber differs', () => {
    expect(areEmployeeBusinessKeysEqual(key, { ...key, employeeNumber: '00002' })).toBe(false);
  });

  it('returns false when left is null', () => {
    expect(areEmployeeBusinessKeysEqual(null, key)).toBe(false);
  });

  it('returns false when right is null', () => {
    expect(areEmployeeBusinessKeysEqual(key, null)).toBe(false);
  });
});
