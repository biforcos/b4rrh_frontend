import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeLaborClassificationCatalogGateway } from '../../data-access/employee-labor-classification-catalog.gateway';
import { EmployeeLaborClassificationStore } from '../../data-access/employee-labor-classification.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeLaborClassificationModel } from '../../models/employee-labor-classification.model';
import { EmployeeLaborClassificationSectionComponent } from './employee-labor-classification-section.component';

class MockEmployeeLaborClassificationStore {
  readonly laborClassificationsState = signal<ReadonlyArray<EmployeeLaborClassificationModel>>([]);
  readonly loadingState = signal(false);
  readonly mutatingState = signal(false);
  readonly errorState = signal<ReturnType<EmployeeLaborClassificationStore['error']>>(null);
  readonly successState = signal<ReturnType<EmployeeLaborClassificationStore['success']>>(null);

  readonly laborClassifications = this.laborClassificationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly mutating = this.mutatingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  readonly loadLaborClassificationsByBusinessKey = vi.fn();
  readonly replaceFromDate = vi.fn();
  readonly correctOccurrence = vi.fn();
  readonly closeOccurrence = vi.fn();
  readonly clearFeedback = vi.fn();
}

describe('EmployeeLaborClassificationSectionComponent', () => {
  let fixture: ComponentFixture<EmployeeLaborClassificationSectionComponent>;
  let laborStore: MockEmployeeLaborClassificationStore;
  let fieldCatalogService: {
    loadLaborClassificationAgreementOptions: ReturnType<typeof vi.fn>;
  };
  let laborCatalogGateway: {
    loadAgreementCategories: ReturnType<typeof vi.fn>;
  };

  const employeeBusinessKey = {
    ruleSystemCode: 'RS1',
    employeeTypeCode: 'EMP',
    employeeNumber: '0001',
  };

  beforeEach(async () => {
    laborStore = new MockEmployeeLaborClassificationStore();
    fieldCatalogService = {
      loadLaborClassificationAgreementOptions: vi.fn().mockReturnValue(
        of([
          {
            value: 'AGR-A',
            label: 'Convenio A · AGR-A',
          },
          {
            value: 'AGR-B',
            label: 'Convenio B · AGR-B',
          },
        ]),
      ),
    };
    laborCatalogGateway = {
      loadAgreementCategories: vi.fn().mockImplementation((_ruleSystemCode: string, agreementCode: string) => {
        if (agreementCode === 'AGR-A') {
          return of([
            {
              code: 'CAT-A',
              name: 'Categoria A',
              label: 'Categoria A · CAT-A',
              startDate: '2020-01-01',
              endDate: null,
            },
          ]);
        }

        if (agreementCode === 'AGR-B') {
          return of([
            {
              code: 'CAT-B',
              name: 'Categoria B',
              label: 'Categoria B · CAT-B',
              startDate: '2020-01-01',
              endDate: null,
            },
          ]);
        }

        return of([]);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [EmployeeLaborClassificationSectionComponent],
      providers: [
        { provide: EmployeeLaborClassificationStore, useValue: laborStore },
        { provide: EmployeeFieldCatalogService, useValue: fieldCatalogService },
        { provide: EmployeeLaborClassificationCatalogGateway, useValue: laborCatalogGateway },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLaborClassificationSectionComponent);
  });

  it('shows Cambiar clasificacion desde fecha as primary block action', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const actionTexts = buttonTexts();
    expect(actionTexts).toContain('Cambiar clasificacion desde fecha');
    expect(actionTexts).not.toContain('Administrar clasificacion');
  });

  it('loads agreement options from DIRECT binding and renders Name · CODE in select', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.laborClassificationSectionReplaceAction);
    fixture.detectChanges();

    const agreementSelect = getActiveCreateSelects().agreement;
    const agreementOptionTexts = Array.from(agreementSelect.querySelectorAll('option')).map(
      (option) => option.textContent?.trim() ?? '',
    );

    expect(fieldCatalogService.loadLaborClassificationAgreementOptions).toHaveBeenCalledWith('RS1');
    expect(agreementOptionTexts).toContain('Convenio A · AGR-A');
    expect(agreementOptionTexts).toContain('Convenio B · AGR-B');
  });

  it('shows current row actions: Corregir ocurrencia and Cerrar', () => {
    laborStore.laborClassificationsState.set([
      {
        agreementCode: 'CONV-A',
        agreementName: null,
        agreementCategoryCode: 'CAT-A',
        agreementCategoryName: null,
        startDate: '2025-01-01',
        endDate: null,
        isActive: true,
      },
      {
        agreementCode: 'CONV-B',
        agreementName: null,
        agreementCategoryCode: 'CAT-B',
        agreementCategoryName: null,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: false,
      },
    ]);

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const currentRowButtons = rowButtons('CONV-A');
    const currentRowTexts = currentRowButtons.map((button) => button.textContent?.trim() ?? '');

    expect(currentRowTexts).toContain(employeeTexts.laborClassificationSectionCorrectAction);
    expect(currentRowTexts).toContain(employeeTexts.laborClassificationSectionCloseAction);
    expect(currentRowTexts).not.toContain(employeeTexts.laborClassificationSectionDeleteAction);
  });

  it('shows historical row action: Corregir ocurrencia only', () => {
    laborStore.laborClassificationsState.set([
      {
        agreementCode: 'CONV-A',
        agreementName: null,
        agreementCategoryCode: 'CAT-A',
        agreementCategoryName: null,
        startDate: '2025-01-01',
        endDate: null,
        isActive: true,
      },
      {
        agreementCode: 'CONV-B',
        agreementName: null,
        agreementCategoryCode: 'CAT-B',
        agreementCategoryName: null,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: false,
      },
    ]);

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const historicalRowButtons = rowButtons('CONV-B');
    const historicalRowTexts = historicalRowButtons.map((button) => button.textContent?.trim() ?? '');

    expect(historicalRowTexts).toContain(employeeTexts.laborClassificationSectionCorrectAction);
    expect(historicalRowTexts).not.toContain(employeeTexts.laborClassificationSectionCloseAction);
    expect(historicalRowTexts).not.toContain(employeeTexts.laborClassificationSectionDeleteAction);
  });

  it('loads dependent agreement categories from specific endpoint when agreement changes', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.laborClassificationSectionReplaceAction);
    setSelectValue(getActiveCreateSelects().agreement, 'AGR-A');
    fixture.detectChanges();

    const categorySelect = getActiveCreateSelects().category;
    const categoryOptionTexts = Array.from(categorySelect.querySelectorAll('option')).map(
      (option) => option.textContent?.trim() ?? '',
    );

    expect(laborCatalogGateway.loadAgreementCategories).toHaveBeenCalledWith('RS1', 'AGR-A', '');
    expect(categoryOptionTexts).toContain('Categoria A · CAT-A');
  });

  it('resets category when agreement changes and previous category is no longer valid', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.laborClassificationSectionReplaceAction);
    setSelectValue(getActiveCreateSelects().agreement, 'AGR-A');
    setSelectValue(getActiveCreateSelects().category, 'CAT-A');

    setSelectValue(getActiveCreateSelects().agreement, 'AGR-B');
    fixture.detectChanges();

    const categorySelect = getActiveCreateSelects().category;
    const categoryOptionValues = Array.from(categorySelect.querySelectorAll('option')).map(
      (option) => option.value,
    );

    expect(categorySelect.value).toBe('');
    expect(categoryOptionValues).toContain('CAT-B');
    expect(categoryOptionValues).not.toContain('CAT-A');
  });

  it('does not load dependent categories when agreement is empty', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.laborClassificationSectionReplaceAction);
    fixture.detectChanges();

    const categorySelect = getActiveCreateSelects().category;

    expect(laborCatalogGateway.loadAgreementCategories).not.toHaveBeenCalled();
    expect(categorySelect.disabled).toBe(true);
  });

  it('keeps correction action working with catalog-driven selects', () => {
    laborStore.laborClassificationsState.set([
      {
        agreementCode: 'AGR-A',
        agreementName: 'Convenio A',
        agreementCategoryCode: 'CAT-A',
        agreementCategoryName: 'Categoria A',
        startDate: '2025-01-01',
        endDate: null,
        isActive: true,
      },
    ]);

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickInRow('AGR-A', employeeTexts.laborClassificationSectionCorrectAction);
    fixture.detectChanges();

    const correctSelects = getActiveCorrectSelects();
    setSelectValue(correctSelects.agreement, 'AGR-B');
    setSelectValue(correctSelects.category, 'CAT-B');
    clickByText(employeeTexts.laborClassificationSectionSaveCorrectAction);

    expect(laborStore.correctOccurrence).toHaveBeenCalledWith(employeeBusinessKey, '2025-01-01', {
      agreementCode: 'AGR-B',
      agreementCategoryCode: 'CAT-B',
    });
  });

  it('renders names as primary values and falls back to code per field when names are missing', () => {
    laborStore.laborClassificationsState.set([
      {
        agreementCode: 'AGR-A',
        agreementName: 'Convenio A',
        agreementCategoryCode: 'CAT-A',
        agreementCategoryName: 'Categoria A',
        startDate: '2025-01-01',
        endDate: null,
        isActive: true,
      },
      {
        agreementCode: 'AGR-B',
        agreementName: 'Convenio B',
        agreementCategoryCode: 'CAT-B',
        agreementCategoryName: null,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: false,
      },
      {
        agreementCode: 'AGR-C',
        agreementName: null,
        agreementCategoryCode: 'CAT-C',
        agreementCategoryName: null,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        isActive: false,
      },
    ]);

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const content = (root.textContent ?? '').replace(/\s+/g, ' ');

    expect(content).toContain('Convenio A');
    expect(content).toContain('AGR-A');
    expect(content).toContain('Categoria A');
    expect(content).toContain('CAT-A');

    expect(content).toContain('Convenio B');
    expect(content).toContain('AGR-B');
    expect(content).toContain('CAT-B');

    expect(content).toContain('AGR-C');
    expect(content).toContain('CAT-C');
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

  function clickInRow(rowTitle: string, buttonText: string): void {
    const row = findRow(rowTitle);
    const button = Array.from(row.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === buttonText,
    ) as HTMLButtonElement | undefined;

    expect(button).toBeDefined();
    button?.click();
    fixture.detectChanges();
  }

  function getActiveCreateSelects(): { agreement: HTMLSelectElement; category: HTMLSelectElement } {
    const root = fixture.nativeElement as HTMLElement;
    const form = root.querySelector('div.employee-labor-classification-section__form-grid--create') as HTMLElement | null;

    expect(form).toBeTruthy();

    const selects = Array.from(form?.querySelectorAll('select') ?? []) as HTMLSelectElement[];
    expect(selects.length).toBe(2);

    return {
      agreement: selects[0],
      category: selects[1],
    };
  }

  function getActiveCorrectSelects(): { agreement: HTMLSelectElement; category: HTMLSelectElement } {
    const root = fixture.nativeElement as HTMLElement;
    const form = root.querySelector('div.employee-labor-classification-section__form-grid--correct') as HTMLElement | null;

    expect(form).toBeTruthy();

    const selects = Array.from(form?.querySelectorAll('select') ?? []) as HTMLSelectElement[];
    expect(selects.length).toBe(2);

    return {
      agreement: selects[0],
      category: selects[1],
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

  function rowButtons(rowTitle: string): HTMLButtonElement[] {
    const row = findRow(rowTitle);
    return Array.from(row.querySelectorAll('button'));
  }

  function buttonTexts(): string[] {
    const root = fixture.nativeElement as HTMLElement;
    return Array.from(root.querySelectorAll('button')).map(
      (button) => button.textContent?.trim() ?? '',
    );
  }
});
