import { mapWorkCenterListItemResponseToModel, mapWorkCenterResponseToDetailModel } from './work-center.mapper';

describe('mapWorkCenterListItemResponseToModel', () => {
  it('maps all required fields', () => {
    const result = mapWorkCenterListItemResponseToModel({
      ruleSystemCode: 'ESP',
      workCenterCode: 'MAD-01',
      name: 'Madrid Central',
      companyCode: 'ES01',
      city: 'Madrid',
      countryCode: 'ES',
      active: true,
      startDate: '2020-01-01',
      endDate: '2025-12-31',
    });

    expect(result.ruleSystemCode).toBe('ESP');
    expect(result.workCenterCode).toBe('MAD-01');
    expect(result.companyCode).toBe('ES01');
    expect(result.endDate).toBe('2025-12-31');
  });

  it('normalizes undefined optional fields to null', () => {
    const result = mapWorkCenterListItemResponseToModel({
      ruleSystemCode: 'ESP',
      workCenterCode: 'MAD-01',
      name: 'Madrid',
      companyCode: undefined,
      city: undefined,
      countryCode: undefined,
      active: true,
      startDate: '2020-01-01',
      endDate: undefined,
    });

    expect(result.companyCode).toBeNull();
    expect(result.city).toBeNull();
    expect(result.endDate).toBeNull();
  });
});

describe('mapWorkCenterResponseToDetailModel', () => {
  it('maps address fields', () => {
    const result = mapWorkCenterResponseToDetailModel({
      ruleSystemCode: 'ESP',
      workCenterCode: 'MAD-01',
      name: 'Madrid Central',
      description: 'HQ',
      startDate: '2020-01-01',
      endDate: undefined,
      active: true,
      companyCode: 'ES01',
      address: {
        street: 'Calle Mayor 1',
        city: 'Madrid',
        postalCode: '28001',
        regionCode: 'MD',
        countryCode: 'ES',
      },
    });

    expect(result.address.street).toBe('Calle Mayor 1');
    expect(result.address.countryCode).toBe('ES');
    expect(result.description).toBe('HQ');
    expect(result.endDate).toBeNull();
  });

  it('normalizes missing address fields to null', () => {
    const result = mapWorkCenterResponseToDetailModel({
      ruleSystemCode: 'ESP',
      workCenterCode: 'MAD-01',
      name: 'Madrid',
      description: undefined,
      startDate: '2020-01-01',
      endDate: undefined,
      active: true,
      companyCode: undefined,
      address: undefined as unknown as import('../../../core/api/generated/model/work-center-address').WorkCenterAddress,
    });

    expect(result.description).toBeNull();
    expect(result.address.street).toBeNull();
    expect(result.companyCode).toBeNull();
  });
});
