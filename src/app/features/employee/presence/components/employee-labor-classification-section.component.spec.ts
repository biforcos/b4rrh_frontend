import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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
  let component: EmployeeLaborClassificationSectionComponent;
  let laborStore: MockEmployeeLaborClassificationStore;

  const employeeBusinessKey = {
    ruleSystemCode: 'RS1',
    employeeTypeCode: 'EMP',
    employeeNumber: '0001',
  };

  beforeEach(async () => {
    laborStore = new MockEmployeeLaborClassificationStore();

    await TestBed.configureTestingModule({
      imports: [EmployeeLaborClassificationSectionComponent],
      providers: [{ provide: EmployeeLaborClassificationStore, useValue: laborStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLaborClassificationSectionComponent);
    component = fixture.componentInstance;
  });

  it('shows Cambiar clasificacion desde fecha as primary block action', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const actionTexts = buttonTexts();
    expect(actionTexts).toContain('Cambiar clasificacion desde fecha');
    expect(actionTexts).not.toContain('Administrar clasificacion');
  });

  it('does not render fake selects and uses simple text inputs', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.laborClassificationSectionReplaceAction);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('select').length).toBe(0);
    expect(root.querySelectorAll('input[type="text"]').length).toBe(2);
    expect(root.textContent ?? '').toContain(employeeTexts.laborClassificationSectionLookupPendingHint);
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

  it('maps busy and backend error into section ui state', () => {
    laborStore.mutatingState.set(true);
    laborStore.errorState.set('AGREEMENT_CATEGORY_RELATION_INVALID');

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const sectionState = (component as unknown as { sectionState: () => { busy: boolean; mode: string; errorMessage: string | null } }).sectionState();
    expect(sectionState.busy).toBe(true);
    expect(sectionState.mode).toBe('submitting');
    expect(sectionState.errorMessage).toBe(employeeTexts.laborClassificationSectionAgreementCategoryRelationInvalidMessage);
  });

  it('submits correction with text inputs and keeps backend errors visible', () => {
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
    ]);

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickInRow('CONV-A', employeeTexts.laborClassificationSectionCorrectAction);
    fixture.detectChanges();

    setTextInput(0, 'NEW-AGREEMENT');
    setTextInput(1, 'NEW-CATEGORY');
    clickByText(employeeTexts.laborClassificationSectionSaveCorrectAction);

    expect(laborStore.correctOccurrence).toHaveBeenCalledWith(employeeBusinessKey, '2025-01-01', {
      agreementCode: 'NEW-AGREEMENT',
      agreementCategoryCode: 'NEW-CATEGORY',
    });

    laborStore.errorState.set('AGREEMENT_CATEGORY_RELATION_INVALID');
    fixture.detectChanges();

    const sectionState = (component as unknown as { sectionState: () => { errorMessage: string | null } }).sectionState();
    expect(sectionState.errorMessage).toBe(employeeTexts.laborClassificationSectionAgreementCategoryRelationInvalidMessage);
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
    const content = root.textContent ?? '';

    expect(content).toContain('Convenio A · AGR-A');
    expect(content).toContain('Categoria A · CAT-A');

    expect(content).toContain('Convenio B · AGR-B');
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

  function setTextInput(index: number, value: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const inputs = Array.from(root.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    const input = inputs[index];

    expect(input).toBeDefined();
    input.value = value;
    input.dispatchEvent(new Event('input'));
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
