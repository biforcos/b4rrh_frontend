import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeWorkCenterStore } from '../../data-access/employee-work-center.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeWorkCenterModel } from '../../models/employee-work-center.model';
import { EmployeeWorkCenterSectionComponent } from './employee-work-center-section.component';

class MockEmployeeWorkCenterStore {
  readonly workCentersState = signal<ReadonlyArray<EmployeeWorkCenterModel>>([]);
  readonly loadingState = signal(false);
  readonly mutatingState = signal(false);
  readonly errorState = signal<ReturnType<EmployeeWorkCenterStore['error']>>(null);
  readonly successState = signal<ReturnType<EmployeeWorkCenterStore['success']>>(null);

  readonly workCenters = this.workCentersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly mutating = this.mutatingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  readonly loadWorkCenters = vi.fn();
  readonly createWorkCenter = vi.fn();
  readonly correctWorkCenter = vi.fn();
  readonly closeWorkCenter = vi.fn();
  readonly deleteWorkCenter = vi.fn();
  readonly clearFeedback = vi.fn();
}

describe('EmployeeWorkCenterSectionComponent', () => {
  let fixture: ComponentFixture<EmployeeWorkCenterSectionComponent>;
  let workCenterStore: MockEmployeeWorkCenterStore;
  let fieldCatalogService: { loadWorkCenterOptions: ReturnType<typeof vi.fn> };

  const employeeBusinessKey = {
    ruleSystemCode: 'RS1',
    employeeTypeCode: 'EMP',
    employeeNumber: '0001',
  };

  beforeEach(async () => {
    workCenterStore = new MockEmployeeWorkCenterStore();
    fieldCatalogService = {
      loadWorkCenterOptions: vi.fn().mockReturnValue(
        of([{ value: 'MADRID-01', label: 'Madrid Centro · MADRID-01' }]),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [EmployeeWorkCenterSectionComponent],
      providers: [
        { provide: EmployeeWorkCenterStore, useValue: workCenterStore },
        { provide: EmployeeFieldCatalogService, useValue: fieldCatalogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeWorkCenterSectionComponent);
  });

  it('loads work center DIRECT options and renders Name · CODE in create select', () => {
    fixture.componentRef.setInput('employeeKey', employeeBusinessKey);
    fixture.detectChanges();

    enterCreateMode();

    const select = getFirstSelect();
    const optionTexts = Array.from(select.querySelectorAll('option')).map((option) => option.textContent?.trim() ?? '');

    expect(fieldCatalogService.loadWorkCenterOptions).toHaveBeenCalledWith('RS1');
    expect(optionTexts).toContain('Madrid Centro · MADRID-01');
  });

  it('keeps component stable when work center catalog returns empty list', () => {
    fieldCatalogService.loadWorkCenterOptions.mockReturnValue(of([]));

    fixture.componentRef.setInput('employeeKey', employeeBusinessKey);
    fixture.detectChanges();

    enterCreateMode();

    const select = getFirstSelect();
    const options = Array.from(select.querySelectorAll('option'));

    expect(options.length).toBe(1);
    expect(options[0].value).toBe('');
  });

  it('keeps create action working with catalog-backed workCenterCode', () => {
    fixture.componentRef.setInput('employeeKey', employeeBusinessKey);
    fixture.detectChanges();

    enterCreateMode();

    setSelectValue(0, 'MADRID-01');
    setDateInput(0, '2026-03-01');
    clickByText(employeeTexts.workCenterSectionSaveCreateAction);

    expect(workCenterStore.createWorkCenter).toHaveBeenCalledWith(employeeBusinessKey, {
      workCenterCode: 'MADRID-01',
      startDate: '2026-03-01',
      endDate: '',
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

  function enterCreateMode(): void {
    clickByText(employeeTexts.workCenterSectionManageAction);
    clickByText(employeeTexts.workCenterSectionAddAction);
  }

  function getFirstSelect(): HTMLSelectElement {
    const root = fixture.nativeElement as HTMLElement;
    const select = root.querySelector('select') as HTMLSelectElement | null;

    expect(select).toBeTruthy();
    return select as HTMLSelectElement;
  }

  function setSelectValue(index: number, value: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const selects = Array.from(root.querySelectorAll('select')) as HTMLSelectElement[];
    const select = selects[index];

    expect(select).toBeDefined();
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function setDateInput(index: number, value: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const inputs = Array.from(root.querySelectorAll('input[type="date"]')) as HTMLInputElement[];
    const input = inputs[index];

    expect(input).toBeDefined();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
});
