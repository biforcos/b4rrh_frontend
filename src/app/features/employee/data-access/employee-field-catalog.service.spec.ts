import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DefaultService } from '../../../core/api/generated/api/default.service';
import { CatalogFieldBindingResponseCatalogKindEnum } from '../../../core/api/generated/model/catalog-field-binding-response';
import { EmployeeFieldCatalogService } from './employee-field-catalog.service';

describe('EmployeeFieldCatalogService', () => {
  let service: EmployeeFieldCatalogService;
  let apiMock: {
    getCatalogBindingsByResourceCode: ReturnType<typeof vi.fn>;
    getDirectCatalogOptions: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiMock = {
      getCatalogBindingsByResourceCode: vi.fn().mockReturnValue(
        of({
          resourceCode: 'employee.contact',
          fields: [
            {
              fieldCode: 'contactTypeCode',
              catalogKind: CatalogFieldBindingResponseCatalogKindEnum.Direct,
              ruleEntityTypeCode: 'EMPLOYEE_CONTACT_TYPE',
              active: true,
            },
          ],
        }),
      ),
      getDirectCatalogOptions: vi.fn().mockReturnValue(
        of({
          ruleSystemCode: 'PA-ES',
          ruleEntityTypeCode: 'EMPLOYEE_CONTACT_TYPE',
          referenceDate: '2026-03-23',
          items: [
            {
              code: 'WORK_EMAIL',
              name: 'Correo laboral',
              active: true,
              startDate: '2020-01-01',
              endDate: null,
            },
            {
              code: 'INACTIVE',
              name: 'No usar',
              active: false,
              startDate: '2020-01-01',
              endDate: null,
            },
          ],
        }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: DefaultService, useValue: apiMock }],
    });

    service = TestBed.inject(EmployeeFieldCatalogService);
  });

  it('loads direct options for contact type using backend binding and maps option labels', () => {
    let result: ReadonlyArray<{ value: string; label: string }> = [];

    service.loadContactTypeOptions('PA-ES').subscribe((options) => {
      result = options;
    });

    expect(apiMock.getCatalogBindingsByResourceCode).toHaveBeenCalledWith({
      resourceCode: 'employee.contact',
    });
    expect(apiMock.getDirectCatalogOptions).toHaveBeenCalledWith({
      ruleSystemCode: 'PA-ES',
      ruleEntityTypeCode: 'EMPLOYEE_CONTACT_TYPE',
    });
    expect(result).toEqual([
      {
        value: 'WORK_EMAIL',
        label: 'Correo laboral · WORK_EMAIL',
      },
    ]);
  });

  it('reuses cached binding and option requests for repeated calls', () => {
    service.loadContactTypeOptions('PA-ES').subscribe();
    service.loadContactTypeOptions('PA-ES').subscribe();

    expect(apiMock.getCatalogBindingsByResourceCode).toHaveBeenCalledTimes(1);
    expect(apiMock.getDirectCatalogOptions).toHaveBeenCalledTimes(1);
  });

  it('returns empty options when binding is missing for expected field', () => {
    apiMock.getCatalogBindingsByResourceCode.mockReturnValue(
      of({
        resourceCode: 'employee.contact',
        fields: [],
      }),
    );

    let result: ReadonlyArray<{ value: string; label: string }> = [];

    service.loadContactTypeOptions('PA-ES').subscribe((options) => {
      result = options;
    });

    expect(result).toEqual([]);
    expect(apiMock.getDirectCatalogOptions).not.toHaveBeenCalled();
  });

  it('returns empty options when direct catalog request fails', () => {
    apiMock.getDirectCatalogOptions.mockReturnValue(throwError(() => new Error('backend unavailable')));

    let result: ReadonlyArray<{ value: string; label: string }> = [];

    service.loadContactTypeOptions('PA-ES').subscribe((options) => {
      result = options;
    });

    expect(result).toEqual([]);
  });
});
