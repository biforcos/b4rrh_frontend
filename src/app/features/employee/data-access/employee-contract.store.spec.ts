import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EmployeeContractModel } from '../models/employee-contract.model';
import { EmployeeContractReadGateway } from './employee-contract-read.gateway';
import { EmployeeContractStore } from './employee-contract.store';

const employeeBusinessKey = {
  ruleSystemCode: 'PA-ES',
  employeeTypeCode: 'CONTRACTOR',
  employeeNumber: '00012345',
} as const;

const contractsFixture: ReadonlyArray<EmployeeContractModel> = [
  {
    contractCode: 'INDEFINITE',
    contractSubtypeCode: 'FULL_TIME',
    startDate: '2024-06-01',
    endDate: null,
    isActive: true,
  },
  {
    contractCode: 'TEMPORARY',
    contractSubtypeCode: 'PROJECT',
    startDate: '2023-01-01',
    endDate: '2024-05-31',
    isActive: false,
  },
];

describe('EmployeeContractStore', () => {
  let store: EmployeeContractStore;
  let readGatewayMock: {
    readEmployeeContractsByBusinessKey: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    readGatewayMock = {
      readEmployeeContractsByBusinessKey: vi.fn().mockReturnValue(of(contractsFixture)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: EmployeeContractReadGateway, useValue: readGatewayMock }],
    });

    store = TestBed.inject(EmployeeContractStore);
  });

  it('loads contracts by business key and exposes contracts state', () => {
    store.loadContractsByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeContractsByBusinessKey).toHaveBeenCalledTimes(1);
    expect(readGatewayMock.readEmployeeContractsByBusinessKey).toHaveBeenCalledWith(employeeBusinessKey);
    expect(store.contracts()).toEqual(contractsFixture);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('keeps empty contracts when backend returns no contracts', () => {
    readGatewayMock.readEmployeeContractsByBusinessKey.mockReturnValue(of([]));

    store.loadContractsByBusinessKey(employeeBusinessKey);

    expect(store.contracts()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets request-failed error when contracts request fails', () => {
    readGatewayMock.readEmployeeContractsByBusinessKey.mockReturnValue(
      throwError(() => new Error('backend unavailable')),
    );

    store.loadContractsByBusinessKey(employeeBusinessKey);

    expect(store.contracts()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('request-failed');
  });

  it('resets contracts state when route has no active business key', () => {
    store.loadContractsByBusinessKey(employeeBusinessKey);

    store.loadContractsByBusinessKey(null);

    expect(store.selectedEmployeeKey()).toBeNull();
    expect(store.contracts()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('does not reload contracts when same business key is already loaded', () => {
    store.loadContractsByBusinessKey(employeeBusinessKey);
    store.loadContractsByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeContractsByBusinessKey).toHaveBeenCalledTimes(1);
  });
});
