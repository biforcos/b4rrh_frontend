import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { RecibosGateway } from '../gateway/recibos.gateway';
import { PayrollBusinessKey } from '../models/payroll-business-key.model';
import { PayrollConceptModel } from '../models/payroll-concept.model';
import { PayrollSummaryModel } from '../models/payroll-summary.model';
import { RecibosStore } from './recibos.store';

const MOCK_KEY: PayrollBusinessKey = {
  ruleSystemCode: 'MAS',
  employeeTypeCode: 'EMP',
  employeeNumber: 'MAS000001',
  payrollPeriodCode: '202604',
  payrollTypeCode: 'MENSUAL',
  presenceNumber: 1,
};

const MOCK_SUMMARY: PayrollSummaryModel = {
  ...MOCK_KEY,
  status: 'CALCULATED',
  calculatedAt: '2026-04-24T10:00:00',
};

describe('RecibosStore', () => {
  let store: RecibosStore;
  let gatewayMock: {
    search: ReturnType<typeof vi.fn>;
    getDetail: ReturnType<typeof vi.fn>;
    invalidate: ReturnType<typeof vi.fn>;
    validate: ReturnType<typeof vi.fn>;
    recalculate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    gatewayMock = {
      search: vi.fn(),
      getDetail: vi.fn(),
      invalidate: vi.fn(),
      validate: vi.fn(),
      recalculate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [RecibosStore, { provide: RecibosGateway, useValue: gatewayMock }],
    });

    store = TestBed.inject(RecibosStore);
  });

  it('initialises with empty state', () => {
    expect(store.payrolls()).toEqual([]);
    expect(store.selectedKey()).toBeNull();
    expect(store.concepts()).toEqual([]);
    expect(store.listLoading()).toBe(false);
  });

  it('loads payrolls on search', () => {
    gatewayMock.search.mockReturnValue(of([MOCK_SUMMARY]));

    store.search({ payrollPeriodCode: '202604', employeeNumber: '', status: '' });

    expect(store.payrolls()).toHaveLength(1);
    expect(store.payrolls()[0].employeeNumber).toBe('MAS000001');
  });

  it('sets listError on search failure', () => {
    gatewayMock.search.mockReturnValue(throwError(() => new Error('fail')));

    store.search({ payrollPeriodCode: '', employeeNumber: '', status: '' });

    expect(store.listError()).toBe('request-failed');
  });

  it('loads concepts when selecting a payroll', () => {
    const concept: PayrollConceptModel = {
      lineNumber: 1,
      conceptCode: '001',
      conceptLabel: 'Salario base',
      amount: 2100,
      quantity: 30,
      rate: 70,
      conceptNatureCode: 'EARNING',
      originPeriodCode: '202604',
      displayOrder: 10,
    };
    gatewayMock.getDetail.mockReturnValue(
      of({ concepts: [concept], companyProfile: null, employeeProfile: null }),
    );

    store.selectPayroll(MOCK_KEY);

    expect(store.selectedKey()).toEqual(MOCK_KEY);
    expect(store.concepts()).toHaveLength(1);
  });
});
