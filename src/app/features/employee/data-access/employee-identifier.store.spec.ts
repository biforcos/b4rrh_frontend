import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EmployeeIdentifierModel } from '../models/employee-identifier.model';
import { EmployeeIdentifierReadGateway } from './employee-identifier-read.gateway';
import { EmployeeIdentifierStore } from './employee-identifier.store';

const employeeBusinessKey = {
  ruleSystemCode: 'PA-ES',
  employeeTypeCode: 'CONTRACTOR',
  employeeNumber: '00012345',
} as const;

const identifiersFixture: ReadonlyArray<EmployeeIdentifierModel> = [
  {
    typeCode: 'NIF',
    value: '12345678A',
    issuingCountryCode: 'ESP',
    expirationDate: null,
    isPrimary: true,
  },
  {
    typeCode: 'PASSPORT',
    value: 'XK000001',
    issuingCountryCode: 'ESP',
    expirationDate: '2030-12-31',
    isPrimary: false,
  },
];

describe('EmployeeIdentifierStore', () => {
  let store: EmployeeIdentifierStore;
  let readGatewayMock: {
    readEmployeeIdentifiersByBusinessKey: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    readGatewayMock = {
      readEmployeeIdentifiersByBusinessKey: vi.fn().mockReturnValue(of(identifiersFixture)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: EmployeeIdentifierReadGateway, useValue: readGatewayMock }],
    });

    store = TestBed.inject(EmployeeIdentifierStore);
  });

  it('loads identifiers by business key and exposes identifier state', () => {
    store.loadIdentifiersByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeIdentifiersByBusinessKey).toHaveBeenCalledTimes(1);
    expect(readGatewayMock.readEmployeeIdentifiersByBusinessKey).toHaveBeenCalledWith(employeeBusinessKey);
    expect(store.identifiers()).toEqual(identifiersFixture);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('keeps empty identifiers when backend returns no identifiers', () => {
    readGatewayMock.readEmployeeIdentifiersByBusinessKey.mockReturnValue(of([]));

    store.loadIdentifiersByBusinessKey(employeeBusinessKey);

    expect(store.identifiers()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets request-failed error when identifiers request fails', () => {
    readGatewayMock.readEmployeeIdentifiersByBusinessKey.mockReturnValue(
      throwError(() => new Error('backend unavailable')),
    );

    store.loadIdentifiersByBusinessKey(employeeBusinessKey);

    expect(store.identifiers()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('request-failed');
  });

  it('resets identifiers state when route has no active business key', () => {
    store.loadIdentifiersByBusinessKey(employeeBusinessKey);

    store.loadIdentifiersByBusinessKey(null);

    expect(store.selectedEmployeeKey()).toBeNull();
    expect(store.identifiers()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('does not reload identifiers when same business key is already loaded', () => {
    store.loadIdentifiersByBusinessKey(employeeBusinessKey);
    store.loadIdentifiersByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeIdentifiersByBusinessKey).toHaveBeenCalledTimes(1);
  });
});
