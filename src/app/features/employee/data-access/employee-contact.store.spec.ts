import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EmployeeContactModel } from '../models/employee-contact.model';
import { EmployeeContactReadGateway } from './employee-contact-read.gateway';
import { EmployeeContactStore } from './employee-contact.store';

const employeeBusinessKey = {
  ruleSystemCode: 'PA-ES',
  employeeTypeCode: 'CONTRACTOR',
  employeeNumber: '00012345',
} as const;

const contactsFixture: ReadonlyArray<EmployeeContactModel> = [
  { type: 'phone', label: 'MOBILE', value: '+34 600000001' },
  { type: 'email', label: 'EMAIL', value: 'user@b4rrhh.local' },
];

describe('EmployeeContactStore', () => {
  let store: EmployeeContactStore;
  let readGatewayMock: {
    readEmployeeContactsByBusinessKey: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    readGatewayMock = {
      readEmployeeContactsByBusinessKey: vi.fn().mockReturnValue(of(contactsFixture)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: EmployeeContactReadGateway, useValue: readGatewayMock }],
    });

    store = TestBed.inject(EmployeeContactStore);
  });

  it('loads contacts by business key and exposes contacts state', () => {
    store.loadContactsByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeContactsByBusinessKey).toHaveBeenCalledTimes(1);
    expect(readGatewayMock.readEmployeeContactsByBusinessKey).toHaveBeenCalledWith(employeeBusinessKey);
    expect(store.contacts()).toEqual(contactsFixture);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('keeps empty contacts when backend returns no contacts', () => {
    readGatewayMock.readEmployeeContactsByBusinessKey.mockReturnValue(of([]));

    store.loadContactsByBusinessKey(employeeBusinessKey);

    expect(store.contacts()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets request-failed error when contacts request fails', () => {
    readGatewayMock.readEmployeeContactsByBusinessKey.mockReturnValue(
      throwError(() => new Error('backend unavailable')),
    );

    store.loadContactsByBusinessKey(employeeBusinessKey);

    expect(store.contacts()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('request-failed');
  });

  it('resets contacts state when route has no active business key', () => {
    store.loadContactsByBusinessKey(employeeBusinessKey);

    store.loadContactsByBusinessKey(null);

    expect(store.selectedEmployeeKey()).toBeNull();
    expect(store.contacts()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('does not reload contacts when same business key is already loaded', () => {
    store.loadContactsByBusinessKey(employeeBusinessKey);
    store.loadContactsByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeContactsByBusinessKey).toHaveBeenCalledTimes(1);
  });
});
