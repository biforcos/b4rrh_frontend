import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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
  let component: EmployeeContractSectionComponent;
  let contractStore: MockEmployeeContractStore;

  const employeeBusinessKey = {
    ruleSystemCode: 'RS1',
    employeeTypeCode: 'EMP',
    employeeNumber: '0001',
  };

  beforeEach(async () => {
    contractStore = new MockEmployeeContractStore();

    await TestBed.configureTestingModule({
      imports: [EmployeeContractSectionComponent],
      providers: [{ provide: EmployeeContractStore, useValue: contractStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeContractSectionComponent);
    component = fixture.componentInstance;
  });

  it('shows Cambiar contrato desde fecha as primary block action', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const actionTexts = buttonTexts();
    expect(actionTexts).toContain('Cambiar contrato desde fecha');
    expect(actionTexts).not.toContain('Gestionar');
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

  it('does not render fake selects and uses simple text inputs', () => {
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickByText(employeeTexts.contractSectionReplaceAction);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('select').length).toBe(0);
    expect(root.querySelectorAll('input[type="text"]').length).toBe(2);
  });

  it('maps busy and backend error into section ui state', () => {
    contractStore.mutatingState.set(true);
    contractStore.errorState.set('Backend validation message');

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    const sectionState = (component as unknown as { sectionState: () => { busy: boolean; mode: string; errorMessage: string | null } }).sectionState();
    expect(sectionState.busy).toBe(true);
    expect(sectionState.mode).toBe('submitting');
    expect(sectionState.errorMessage).toBe('Backend validation message');
  });

  it('submits correction for selected occurrence', () => {
    contractStore.contractsState.set([
      {
        contractCode: 'CONTRACT-A',
        contractSubtypeCode: 'SUB-A',
        startDate: '2025-01-01',
        endDate: null,
        isActive: true,
      },
    ]);

    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();

    clickInRow('CONTRACT-A', employeeTexts.contractSectionCorrectAction);
    setTextInput(0, 'CONTRACT-C');
    setTextInput(1, 'SUB-C');
    clickByText(employeeTexts.contractSectionSaveCorrectAction);

    expect(contractStore.correctOccurrence).toHaveBeenCalledWith(employeeBusinessKey, '2025-01-01', {
      contractCode: 'CONTRACT-C',
      contractSubtypeCode: 'SUB-C',
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
    const root = fixture.nativeElement as HTMLElement;
    const rowItems = Array.from(root.querySelectorAll('li.temporal-section__row'));
    const row = rowItems.find((candidate) => {
      const title = candidate.querySelector('.temporal-section__title')?.textContent?.trim() ?? '';
      return title === rowTitle;
    }) as HTMLElement | undefined;

    expect(row).toBeDefined();
    return Array.from(row?.querySelectorAll('button') ?? []);
  }

  function clickInRow(rowTitle: string, buttonText: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const rowItems = Array.from(root.querySelectorAll('li.temporal-section__row'));
    const row = rowItems.find((candidate) => {
      const title = candidate.querySelector('.temporal-section__title')?.textContent?.trim() ?? '';
      return title === rowTitle;
    }) as HTMLElement | undefined;

    expect(row).toBeDefined();
    const button = Array.from(row?.querySelectorAll('button') ?? []).find(
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

  function buttonTexts(): string[] {
    const root = fixture.nativeElement as HTMLElement;
    return Array.from(root.querySelectorAll('button')).map(
      (button) => button.textContent?.trim() ?? '',
    );
  }
});
