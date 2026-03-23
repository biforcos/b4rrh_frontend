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
    const bindingsByResource: Record<string, ReadonlyArray<unknown>> = {
      'employee.contact': [
        {
          fieldCode: 'contactTypeCode',
          catalogKind: CatalogFieldBindingResponseCatalogKindEnum.Direct,
          ruleEntityTypeCode: 'EMPLOYEE_CONTACT_TYPE',
          active: true,
        },
      ],
      'employee.presence': [
        {
          fieldCode: 'companyCode',
          catalogKind: CatalogFieldBindingResponseCatalogKindEnum.Direct,
          ruleEntityTypeCode: 'EMPLOYEE_COMPANY',
          active: true,
        },
        {
          fieldCode: 'entryReasonCode',
          catalogKind: CatalogFieldBindingResponseCatalogKindEnum.Direct,
          ruleEntityTypeCode: 'EMPLOYEE_ENTRY_REASON',
          active: true,
        },
        {
          fieldCode: 'exitReasonCode',
          catalogKind: CatalogFieldBindingResponseCatalogKindEnum.Direct,
          ruleEntityTypeCode: 'EMPLOYEE_EXIT_REASON',
          active: true,
        },
      ],
      'employee.work_center': [
        {
          fieldCode: 'workCenterCode',
          catalogKind: CatalogFieldBindingResponseCatalogKindEnum.Direct,
          ruleEntityTypeCode: 'EMPLOYEE_WORK_CENTER',
          active: true,
        },
      ],
      'employee.labor_classification': [
        {
          fieldCode: 'agreementCode',
          catalogKind: CatalogFieldBindingResponseCatalogKindEnum.Direct,
          ruleEntityTypeCode: 'AGREEMENT',
          active: true,
        },
      ],
    };

    const directItemsByEntity: Record<string, ReadonlyArray<unknown>> = {
      EMPLOYEE_CONTACT_TYPE: [
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
      EMPLOYEE_COMPANY: [
        {
          code: 'COMP-ES',
          name: 'Compania Espana',
          active: true,
          startDate: '2020-01-01',
          endDate: null,
        },
      ],
      EMPLOYEE_ENTRY_REASON: [
        {
          code: 'HIRE',
          name: 'Alta inicial',
          active: true,
          startDate: '2020-01-01',
          endDate: null,
        },
      ],
      EMPLOYEE_EXIT_REASON: [
        {
          code: 'END',
          name: 'Fin de relacion',
          active: true,
          startDate: '2020-01-01',
          endDate: null,
        },
      ],
      EMPLOYEE_WORK_CENTER: [
        {
          code: 'MADRID-01',
          name: 'Madrid Centro',
          active: true,
          startDate: '2020-01-01',
          endDate: null,
        },
      ],
      AGREEMENT: [
        {
          code: 'AGR-TECH',
          name: 'Convenio tecnico',
          active: true,
          startDate: '2020-01-01',
          endDate: null,
        },
      ],
    };

    apiMock = {
      getCatalogBindingsByResourceCode: vi.fn().mockImplementation(({ resourceCode }: { resourceCode: string }) =>
        of({
          resourceCode,
          fields: bindingsByResource[resourceCode] ?? [],
        }),
      ),
      getDirectCatalogOptions: vi
        .fn()
        .mockImplementation(({ ruleSystemCode, ruleEntityTypeCode }: { ruleSystemCode: string; ruleEntityTypeCode: string }) =>
          of({
            ruleSystemCode,
            ruleEntityTypeCode,
            referenceDate: '2026-03-23',
            items: directItemsByEntity[ruleEntityTypeCode] ?? [],
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

  it('loads presence DIRECT options for company, entry reason and exit reason from employee.presence bindings', () => {
    let companyResult: ReadonlyArray<{ value: string; label: string }> = [];
    let entryReasonResult: ReadonlyArray<{ value: string; label: string }> = [];
    let exitReasonResult: ReadonlyArray<{ value: string; label: string }> = [];

    service.loadPresenceCompanyOptions('PA-ES').subscribe((options) => {
      companyResult = options;
    });

    service.loadPresenceEntryReasonOptions('PA-ES').subscribe((options) => {
      entryReasonResult = options;
    });

    service.loadPresenceExitReasonOptions('PA-ES').subscribe((options) => {
      exitReasonResult = options;
    });

    expect(apiMock.getCatalogBindingsByResourceCode).toHaveBeenCalledWith({
      resourceCode: 'employee.presence',
    });
    expect(apiMock.getDirectCatalogOptions).toHaveBeenCalledWith({
      ruleSystemCode: 'PA-ES',
      ruleEntityTypeCode: 'EMPLOYEE_COMPANY',
    });
    expect(apiMock.getDirectCatalogOptions).toHaveBeenCalledWith({
      ruleSystemCode: 'PA-ES',
      ruleEntityTypeCode: 'EMPLOYEE_ENTRY_REASON',
    });
    expect(apiMock.getDirectCatalogOptions).toHaveBeenCalledWith({
      ruleSystemCode: 'PA-ES',
      ruleEntityTypeCode: 'EMPLOYEE_EXIT_REASON',
    });

    expect(companyResult).toEqual([{ value: 'COMP-ES', label: 'Compania Espana · COMP-ES' }]);
    expect(entryReasonResult).toEqual([{ value: 'HIRE', label: 'Alta inicial · HIRE' }]);
    expect(exitReasonResult).toEqual([{ value: 'END', label: 'Fin de relacion · END' }]);
  });

  it('does not mix presence catalog options between fields', () => {
    let companyResult: ReadonlyArray<{ value: string; label: string }> = [];
    let entryReasonResult: ReadonlyArray<{ value: string; label: string }> = [];

    service.loadPresenceCompanyOptions('PA-ES').subscribe((options) => {
      companyResult = options;
    });

    service.loadPresenceEntryReasonOptions('PA-ES').subscribe((options) => {
      entryReasonResult = options;
    });

    expect(companyResult).toEqual([{ value: 'COMP-ES', label: 'Compania Espana · COMP-ES' }]);
    expect(entryReasonResult).toEqual([{ value: 'HIRE', label: 'Alta inicial · HIRE' }]);
  });

  it('returns empty options for one presence field without affecting the others', () => {
    apiMock.getDirectCatalogOptions.mockImplementation(
      ({ ruleSystemCode, ruleEntityTypeCode }: { ruleSystemCode: string; ruleEntityTypeCode: string }) => {
        if (ruleEntityTypeCode === 'EMPLOYEE_EXIT_REASON') {
          return of({
            ruleSystemCode,
            ruleEntityTypeCode,
            referenceDate: '2026-03-23',
            items: [],
          });
        }

        const itemsByEntity: Record<string, ReadonlyArray<unknown>> = {
          EMPLOYEE_COMPANY: [
            {
              code: 'COMP-ES',
              name: 'Compania Espana',
              active: true,
              startDate: '2020-01-01',
              endDate: null,
            },
          ],
          EMPLOYEE_ENTRY_REASON: [
            {
              code: 'HIRE',
              name: 'Alta inicial',
              active: true,
              startDate: '2020-01-01',
              endDate: null,
            },
          ],
        };

        return of({
          ruleSystemCode,
          ruleEntityTypeCode,
          referenceDate: '2026-03-23',
          items: itemsByEntity[ruleEntityTypeCode] ?? [],
        });
      },
    );

    let companyResult: ReadonlyArray<{ value: string; label: string }> = [];
    let entryReasonResult: ReadonlyArray<{ value: string; label: string }> = [];
    let exitReasonResult: ReadonlyArray<{ value: string; label: string }> = [];

    service.loadPresenceCompanyOptions('PA-ES').subscribe((options) => {
      companyResult = options;
    });

    service.loadPresenceEntryReasonOptions('PA-ES').subscribe((options) => {
      entryReasonResult = options;
    });

    service.loadPresenceExitReasonOptions('PA-ES').subscribe((options) => {
      exitReasonResult = options;
    });

    expect(companyResult).toEqual([{ value: 'COMP-ES', label: 'Compania Espana · COMP-ES' }]);
    expect(entryReasonResult).toEqual([{ value: 'HIRE', label: 'Alta inicial · HIRE' }]);
    expect(exitReasonResult).toEqual([]);
  });

  it('loads DIRECT options for employee.work_center workCenterCode', () => {
    let result: ReadonlyArray<{ value: string; label: string }> = [];

    service.loadWorkCenterOptions('PA-ES').subscribe((options) => {
      result = options;
    });

    expect(apiMock.getCatalogBindingsByResourceCode).toHaveBeenCalledWith({
      resourceCode: 'employee.work_center',
    });
    expect(apiMock.getDirectCatalogOptions).toHaveBeenCalledWith({
      ruleSystemCode: 'PA-ES',
      ruleEntityTypeCode: 'EMPLOYEE_WORK_CENTER',
    });
    expect(result).toEqual([{ value: 'MADRID-01', label: 'Madrid Centro · MADRID-01' }]);
  });

  it('loads DIRECT options for employee.labor_classification agreementCode', () => {
    let result: ReadonlyArray<{ value: string; label: string }> = [];

    service.loadLaborClassificationAgreementOptions('PA-ES').subscribe((options) => {
      result = options;
    });

    expect(apiMock.getCatalogBindingsByResourceCode).toHaveBeenCalledWith({
      resourceCode: 'employee.labor_classification',
    });
    expect(apiMock.getDirectCatalogOptions).toHaveBeenCalledWith({
      ruleSystemCode: 'PA-ES',
      ruleEntityTypeCode: 'AGREEMENT',
    });
    expect(result).toEqual([{ value: 'AGR-TECH', label: 'Convenio tecnico · AGR-TECH' }]);
  });
});
