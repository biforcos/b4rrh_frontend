import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EmployeeContractCatalogGateway } from '../../data-access/employee-contract-catalog.gateway';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeContractStore } from '../../data-access/employee-contract.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeContractModel } from '../../models/employee-contract.model';
import { EmployeeContractSectionComponent } from './employee-contract-section.component';

class MockEmployeeContractStore {
  readonly contractsState = signal<ReadonlyArray<EmployeeContractModel>>([]);
  readonly loadingState = signal(false);
  readonly mutatingState = signal(false);
  readonly errorState = signal<ReturnType<EmployeeContractStore['error']>>(null);
  readonly successState = signal<ReturnType<EmployeeContractStore['success']>>(null);

  readonly contracts = this.contractsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly mutating = this.mutatingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  readonly loadContractsByBusinessKey = vi.fn();
  readonly replaceFromDate = vi.fn();
  readonly correctOccurrence = vi.fn();
  readonly closeOccurrence = vi.fn();
  readonly clearFeedback = vi.fn();
}

describe('EmployeeContractSectionComponent', () => {
  let fixture: ComponentFixture<EmployeeContractSectionComponent>;
  let contractStore: MockEmployeeContractStore;
  let fieldCatalogService: {
    loadContractTypeOptions: ReturnType<typeof vi.fn>;
  };
  let contractCatalogGateway: {
    loadContractSubtypes: ReturnType<typeof vi.fn>;
  };

  const employeeBusinessKey = {
    ruleSystemCode: 'RS1',
    employeeTypeCode: 'EMP',
    employeeNumber: '0001',
  };

  beforeEach(async () => {
    contractStore = new MockEmployeeContractStore();
    fieldCatalogService = {
      loadContractTypeOptions: vi.fn().mockReturnValue(
        of([
          {
            value: 'PERM',
            label: 'Indefinido · PERM',
          },
          {
            value: 'TEMP',
            label: 'Temporal · TEMP',
          },
        ]),
      ),
    };
    contractCatalogGateway = {
      loadContractSubtypes: vi.fn().mockImplementation((_ruleSystemCode: string, contractCode: string) => {
        if (contractCode === 'PERM') {
          return of([
            {
              code: 'PERM-FULL',
              name: 'Indefinido jornada completa',
              label: 'Indefinido jornada completa · PERM-FULL',
              startDate: '2020-01-01',
              endDate: null,
            },
          ]);
        }

        if (contractCode === 'TEMP') {
          return of([
            {
              code: 'TEMP-EVT',
              name: 'Temporal eventual',
              label: 'Temporal eventual · TEMP-EVT',
              startDate: '2020-01-01',
              endDate: null,
            },
          ]);
        }

        return of([]);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [EmployeeContractSectionComponent],
      providers: [
        { provide: EmployeeContractStore, useValue: contractStore },
        { provide: EmployeeFieldCatalogService, useValue: fieldCatalogService },
        { provide: EmployeeContractCatalogGateway, useValue: contractCatalogGateway },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeContractSectionComponent);
  });

  it('shows Cambiar contrato desde fecha as primary block action', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const actionTexts = buttonTexts();
    expect(actionTexts).toContain('Cambiar contrato desde fecha');
    expect(actionTexts).not.toContain('Gestionar');
  });

  it('loads contract type options from DIRECT binding and renders Name · CODE in select', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.contractSectionReplaceAction);
    fixture.detectChanges();

    const contractSelect = getActiveCreateSelects().contract;
    const contractOptionTexts = Array.from(contractSelect.querySelectorAll('option')).map(
      (option) => option.textContent?.trim() ?? '',
    );

    expect(fieldCatalogService.loadContractTypeOptions).toHaveBeenCalledWith('RS1');
    expect(contractOptionTexts).toContain('Indefinido · PERM');
    expect(contractOptionTexts).toContain('Temporal · TEMP');
  });

  it('shows current row actions: Corregir ocurrencia and Cerrar', () => {
    contractStore.contractsState.set([
      {
        contractCode: 'CONTRACT-A',
        contractSubtypeCode: 'SUB-A',
        startDate: '2025-01-01',
        endDate: null,
        isActive: true,
      },
      {
        contractCode: 'CONTRACT-B',
        contractSubtypeCode: 'SUB-B',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: false,
      },
    ]);

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const currentRowButtons = rowButtons('CONTRACT-A');
    const currentRowTexts = currentRowButtons.map((button) => button.textContent?.trim() ?? '');

    expect(currentRowTexts).toContain(employeeTexts.contractSectionCorrectAction);
    expect(currentRowTexts).toContain(employeeTexts.contractSectionCloseAction);
    expect(currentRowTexts).not.toContain(employeeTexts.contractSectionDeleteAction);
  });

  it('shows historical row action: Corregir ocurrencia only', () => {
    contractStore.contractsState.set([
      {
        contractCode: 'CONTRACT-A',
        contractSubtypeCode: 'SUB-A',
        startDate: '2025-01-01',
        endDate: null,
        isActive: true,
      },
      {
        contractCode: 'CONTRACT-B',
        contractSubtypeCode: 'SUB-B',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: false,
      },
    ]);

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const historicalRowButtons = rowButtons('CONTRACT-B');
    const historicalRowTexts = historicalRowButtons.map((button) => button.textContent?.trim() ?? '');

    expect(historicalRowTexts).toContain(employeeTexts.contractSectionCorrectAction);
    expect(historicalRowTexts).not.toContain(employeeTexts.contractSectionCloseAction);
    expect(historicalRowTexts).not.toContain(employeeTexts.contractSectionDeleteAction);
  });

  it('loads dependent subtypes from specific endpoint when contract type changes', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.contractSectionReplaceAction);
    setSelectValue(getActiveCreateSelects().contract, 'PERM');
    fixture.detectChanges();

    const subtypeSelect = getActiveCreateSelects().subtype;
    const subtypeOptionTexts = Array.from(subtypeSelect.querySelectorAll('option')).map(
      (option) => option.textContent?.trim() ?? '',
    );

    expect(contractCatalogGateway.loadContractSubtypes).toHaveBeenCalledWith('RS1', 'PERM', '');
    expect(subtypeOptionTexts).toContain('Indefinido jornada completa · PERM-FULL');
  });

  it('resets subtype when contract type changes and previous subtype is no longer valid', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.contractSectionReplaceAction);
    setSelectValue(getActiveCreateSelects().contract, 'PERM');
    setSelectValue(getActiveCreateSelects().subtype, 'PERM-FULL');

    setSelectValue(getActiveCreateSelects().contract, 'TEMP');
    fixture.detectChanges();

    const subtypeSelect = getActiveCreateSelects().subtype;
    const subtypeOptionValues = Array.from(subtypeSelect.querySelectorAll('option')).map(
      (option) => option.value,
    );

    expect(subtypeSelect.value).toBe('');
    expect(subtypeOptionValues).toContain('TEMP-EVT');
    expect(subtypeOptionValues).not.toContain('PERM-FULL');
  });

  it('does not load dependent subtypes when contract type is empty', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.contractSectionReplaceAction);
    fixture.detectChanges();

    const subtypeSelect = getActiveCreateSelects().subtype;

    expect(contractCatalogGateway.loadContractSubtypes).not.toHaveBeenCalled();
    expect(subtypeSelect.disabled).toBe(true);
  });

  it('maps busy and backend error into section ui state', () => {
    contractStore.mutatingState.set(true);
    contractStore.errorState.set('Backend validation message');

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const sectionState = (
      fixture.componentInstance as unknown as {
        sectionState: () => { busy: boolean; mode: string; errorMessage: string | null };
      }
    ).sectionState();
    expect(sectionState.busy).toBe(true);
    expect(sectionState.mode).toBe('submitting');
    expect(sectionState.errorMessage).toBe('Backend validation message');
  });

  it('keeps correction action working with catalog-driven selects', () => {
    contractStore.contractsState.set([
      {
        contractCode: 'PERM',
        contractSubtypeCode: 'PERM-FULL',
        startDate: '2025-01-01',
        endDate: null,
        isActive: true,
      },
    ]);

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickInRow('PERM', employeeTexts.contractSectionCorrectAction);
    const correctSelects = getActiveCorrectSelects();
    setSelectValue(correctSelects.contract, 'TEMP');
    setSelectValue(correctSelects.subtype, 'TEMP-EVT');
    clickByText(employeeTexts.contractSectionSaveCorrectAction);

    expect(contractStore.correctOccurrence).toHaveBeenCalledWith(employeeBusinessKey, '2025-01-01', {
      contractCode: 'TEMP',
      contractSubtypeCode: 'TEMP-EVT',
    });
  });

  function clickByText(text: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const button = Array.from(root.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === text,
    ) as HTMLButtonElement | undefined;

    expect(button).toBeDefined();
    button?.click();
    fixture.detectChanges();
  }

  function rowButtons(rowTitle: string): HTMLButtonElement[] {
    return Array.from(findRow(rowTitle).querySelectorAll('button'));
  }

  function clickInRow(rowTitle: string, buttonText: string): void {
    const row = findRow(rowTitle);
    const button = Array.from(row.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === buttonText,
    ) as HTMLButtonElement | undefined;

    expect(button).toBeDefined();
    button?.click();
    fixture.detectChanges();
  }

  function getActiveCreateSelects(): { contract: HTMLSelectElement; subtype: HTMLSelectElement } {
    const root = fixture.nativeElement as HTMLElement;
    const form = root.querySelector('div.employee-contract-section__form-grid--create') as HTMLElement | null;

    expect(form).toBeTruthy();

    const selects = Array.from(form?.querySelectorAll('select') ?? []) as HTMLSelectElement[];
    expect(selects.length).toBe(2);

    return {
      contract: selects[0],
      subtype: selects[1],
    };
  }

  function getActiveCorrectSelects(): { contract: HTMLSelectElement; subtype: HTMLSelectElement } {
    const root = fixture.nativeElement as HTMLElement;
    const form = root.querySelector('div.employee-contract-section__form-grid--correct') as HTMLElement | null;

    expect(form).toBeTruthy();

    const selects = Array.from(form?.querySelectorAll('select') ?? []) as HTMLSelectElement[];
    expect(selects.length).toBe(2);

    return {
      contract: selects[0],
      subtype: selects[1],
    };
  }

  function setSelectValue(select: HTMLSelectElement, value: string): void {
    expect(select).toBeDefined();
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function findRow(rowTitle: string): HTMLElement {
    const root = fixture.nativeElement as HTMLElement;
    const rowItems = Array.from(root.querySelectorAll('li.temporal-section__row'));
    const row = rowItems.find((candidate) => {
      const title = candidate.querySelector('.temporal-section__title')?.textContent?.trim() ?? '';
      return title.includes(rowTitle);
    }) as HTMLElement | undefined;

    expect(row).toBeDefined();
    return row as HTMLElement;
  }

  function buttonTexts(): string[] {
    const root = fixture.nativeElement as HTMLElement;
    return Array.from(root.querySelectorAll('button')).map(
      (button) => button.textContent?.trim() ?? '',
    );
  }
});
