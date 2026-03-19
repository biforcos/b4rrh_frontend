import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EmployeeAddressModel } from '../models/employee-address.model';
import { EmployeeAddressReadGateway } from './employee-address-read.gateway';
import { EmployeeAddressStore } from './employee-address.store';

const employeeBusinessKey = {
  ruleSystemCode: 'PA-ES',
  employeeTypeCode: 'CONTRACTOR',
  employeeNumber: '00012345',
} as const;

const addressesFixture: ReadonlyArray<EmployeeAddressModel> = [
  {
    addressNumber: 1,
    addressTypeCode: 'HOME',
    street: 'Calle Mayor 10',
    city: 'Madrid',
    countryCode: 'ESP',
    postalCode: '28013',
    regionCode: 'M',
    startDate: '2025-01-01',
    endDate: null,
    isActive: true,
  },
];

describe('EmployeeAddressStore', () => {
  let store: EmployeeAddressStore;
  let readGatewayMock: {
    readEmployeeAddressesByBusinessKey: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    readGatewayMock = {
      readEmployeeAddressesByBusinessKey: vi.fn().mockReturnValue(of(addressesFixture)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: EmployeeAddressReadGateway, useValue: readGatewayMock }],
    });

    store = TestBed.inject(EmployeeAddressStore);
  });

  it('loads addresses by business key and exposes addresses state', () => {
    store.loadAddressesByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeAddressesByBusinessKey).toHaveBeenCalledTimes(1);
    expect(readGatewayMock.readEmployeeAddressesByBusinessKey).toHaveBeenCalledWith(employeeBusinessKey);
    expect(store.addresses()).toEqual(addressesFixture);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('keeps empty addresses when backend returns no addresses', () => {
    readGatewayMock.readEmployeeAddressesByBusinessKey.mockReturnValue(of([]));

    store.loadAddressesByBusinessKey(employeeBusinessKey);

    expect(store.addresses()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets request-failed error when addresses request fails', () => {
    readGatewayMock.readEmployeeAddressesByBusinessKey.mockReturnValue(
      throwError(() => new Error('backend unavailable')),
    );

    store.loadAddressesByBusinessKey(employeeBusinessKey);

    expect(store.addresses()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('request-failed');
  });

  it('resets addresses state when route has no active business key', () => {
    store.loadAddressesByBusinessKey(employeeBusinessKey);

    store.loadAddressesByBusinessKey(null);

    expect(store.selectedEmployeeKey()).toBeNull();
    expect(store.addresses()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('does not reload addresses when same business key is already loaded', () => {
    store.loadAddressesByBusinessKey(employeeBusinessKey);
    store.loadAddressesByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeAddressesByBusinessKey).toHaveBeenCalledTimes(1);
  });
});
