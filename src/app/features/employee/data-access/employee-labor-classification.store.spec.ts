import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EmployeeLaborClassificationModel } from '../models/employee-labor-classification.model';
import { EmployeeLaborClassificationReadGateway } from './employee-labor-classification-read.gateway';
import { EmployeeLaborClassificationStore } from './employee-labor-classification.store';

const employeeBusinessKey = {
  ruleSystemCode: 'PA-ES',
  employeeTypeCode: 'CONTRACTOR',
  employeeNumber: '00012345',
} as const;

const laborClassificationsFixture: ReadonlyArray<EmployeeLaborClassificationModel> = [
  {
    agreementCode: 'AGREE-01',
    agreementCategoryCode: 'CAT-A',
    startDate: '2024-06-01',
    endDate: null,
    isActive: true,
  },
  {
    agreementCode: 'AGREE-01',
    agreementCategoryCode: 'CAT-B',
    startDate: '2022-01-01',
    endDate: '2024-05-31',
    isActive: false,
  },
];

describe('EmployeeLaborClassificationStore', () => {
  let store: EmployeeLaborClassificationStore;
  let readGatewayMock: {
    readEmployeeLaborClassificationsByBusinessKey: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    readGatewayMock = {
      readEmployeeLaborClassificationsByBusinessKey: vi.fn().mockReturnValue(of(laborClassificationsFixture)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: EmployeeLaborClassificationReadGateway, useValue: readGatewayMock }],
    });

    store = TestBed.inject(EmployeeLaborClassificationStore);
  });

  it('loads labor classifications by business key and exposes labor classifications state', () => {
    store.loadLaborClassificationsByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeLaborClassificationsByBusinessKey).toHaveBeenCalledTimes(1);
    expect(readGatewayMock.readEmployeeLaborClassificationsByBusinessKey).toHaveBeenCalledWith(
      employeeBusinessKey,
    );
    expect(store.laborClassifications()).toEqual(laborClassificationsFixture);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('keeps empty labor classifications when backend returns no labor classifications', () => {
    readGatewayMock.readEmployeeLaborClassificationsByBusinessKey.mockReturnValue(of([]));

    store.loadLaborClassificationsByBusinessKey(employeeBusinessKey);

    expect(store.laborClassifications()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets request-failed error when labor classifications request fails', () => {
    readGatewayMock.readEmployeeLaborClassificationsByBusinessKey.mockReturnValue(
      throwError(() => new Error('backend unavailable')),
    );

    store.loadLaborClassificationsByBusinessKey(employeeBusinessKey);

    expect(store.laborClassifications()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('request-failed');
  });

  it('resets labor classifications state when route has no active business key', () => {
    store.loadLaborClassificationsByBusinessKey(employeeBusinessKey);

    store.loadLaborClassificationsByBusinessKey(null);

    expect(store.selectedEmployeeKey()).toBeNull();
    expect(store.laborClassifications()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('does not reload labor classifications when same business key is already loaded', () => {
    store.loadLaborClassificationsByBusinessKey(employeeBusinessKey);
    store.loadLaborClassificationsByBusinessKey(employeeBusinessKey);

    expect(readGatewayMock.readEmployeeLaborClassificationsByBusinessKey).toHaveBeenCalledTimes(1);
  });
});