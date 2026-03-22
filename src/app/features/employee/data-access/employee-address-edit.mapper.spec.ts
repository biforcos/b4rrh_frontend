import { mapEmployeeAddressModelToTemporalRow } from './employee-address-edit.mapper';

describe('employee-address-edit.mapper', () => {
  const texts = {
    currentStatus: 'actual',
    closedStatus: 'cerrada',
    currentPeriodLabel: 'actual',
  } as const;

  it('renders Name · CODE semantics when addressTypeName is present', () => {
    const row = mapEmployeeAddressModelToTemporalRow(
      {
        addressNumber: 1,
        addressTypeCode: 'HOME',
        addressTypeName: 'Domicilio',
        street: 'Calle Mayor 10',
        city: 'Madrid',
        countryCode: 'ESP',
        postalCode: '28013',
        regionCode: 'M',
        startDate: '2026-01-10',
        endDate: null,
        isActive: true,
      },
      texts,
    );

    expect(row.title).toBe('Domicilio');
    expect(row.titleSecondary).toBe('HOME');
  });

  it('falls back to CODE when addressTypeName is missing', () => {
    const row = mapEmployeeAddressModelToTemporalRow(
      {
        addressNumber: 1,
        addressTypeCode: 'HOME',
        addressTypeName: null,
        street: 'Calle Mayor 10',
        city: 'Madrid',
        countryCode: 'ESP',
        postalCode: '28013',
        regionCode: 'M',
        startDate: '2026-01-10',
        endDate: null,
        isActive: true,
      },
      texts,
    );

    expect(row.title).toBe('HOME');
    expect(row.titleSecondary).toBeUndefined();
  });
});
