import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { employeeDirectorySeed } from './employee-directory.seed';
import { EmployeeDirectoryReadGateway } from './employee-directory-read.gateway';
import { EmployeeDirectoryStore } from './employee-directory.store';

describe('EmployeeDirectoryStore', () => {
  let store: EmployeeDirectoryStore;
  let readGatewayMock: {
    readDirectory: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    readGatewayMock = {
      readDirectory: vi.fn().mockReturnValue(of(employeeDirectorySeed)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: EmployeeDirectoryReadGateway, useValue: readGatewayMock }],
    });

    store = TestBed.inject(EmployeeDirectoryStore);
  });

  it('loads directory through read gateway', () => {
    expect(readGatewayMock.readDirectory).toHaveBeenCalledTimes(1);
    expect(store.employees().length).toBeGreaterThan(0);
  });

  it('filters employees using employee number and name text', () => {
    store.setQuery('lidia');

    const results = store.filteredEmployees();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.displayName).toContain('Lidia');
  });

  it('returns employee data by business key employee number', () => {
    const employee = store.findEmployeeByBusinessKey({
      ruleSystemCode: 'PA-ES',
      employeeTypeCode: 'CONTRACTOR',
      employeeNumber: '00012345',
    });

    expect(employee).not.toBeNull();
    expect(employee?.employeeNumber).toBe('00012345');
    expect(employee?.employeeTypeCode).toBe('CONTRACTOR');
  });

  it('returns null when business key does not match all identity fields', () => {
    const employee = store.findEmployeeByBusinessKey({
      ruleSystemCode: 'PA-ES',
      employeeTypeCode: 'STAFF',
      employeeNumber: '99999999',
    });

    expect(employee).toBeNull();
  });
});
