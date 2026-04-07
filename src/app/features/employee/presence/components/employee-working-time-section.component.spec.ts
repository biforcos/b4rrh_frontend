import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { employeeTexts } from '../../employee.texts';
import { EmployeeWorkingTimeModel } from '../../models/employee-working-time.model';
import { EmployeeWorkingTimeStore } from '../../data-access/employee-working-time.store';
import { EmployeeWorkingTimeSectionComponent } from './employee-working-time-section.component';

class MockEmployeeWorkingTimeStore {
  readonly workingTimesState = signal<ReadonlyArray<EmployeeWorkingTimeModel>>([]);
  readonly loadingState = signal(false);
  readonly mutatingState = signal(false);
  readonly errorState = signal<ReturnType<EmployeeWorkingTimeStore['error']>>(null);
  readonly successState = signal<ReturnType<EmployeeWorkingTimeStore['success']>>(null);

  readonly workingTimes = this.workingTimesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly mutating = this.mutatingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  readonly loadWorkingTimesByBusinessKey = vi.fn();
  readonly createWorkingTime = vi.fn();
  readonly closeWorkingTime = vi.fn();
  readonly clearFeedback = vi.fn();
}

describe('EmployeeWorkingTimeSectionComponent', () => {
  let fixture: ComponentFixture<EmployeeWorkingTimeSectionComponent>;
  let store: MockEmployeeWorkingTimeStore;

  const employeeBusinessKey = {
    ruleSystemCode: 'RS1',
    employeeTypeCode: 'EMP',
    employeeNumber: '0001',
  };

  beforeEach(async () => {
    store = new MockEmployeeWorkingTimeStore();

    await TestBed.configureTestingModule({
      imports: [EmployeeWorkingTimeSectionComponent],
      providers: [{ provide: EmployeeWorkingTimeStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeWorkingTimeSectionComponent);
    fixture.componentRef.setInput('employeeBusinessKey', employeeBusinessKey);
    fixture.detectChanges();
  });

  it('renders empty state', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain(employeeTexts.workingTimeSectionEmptyMessage);
    expect(root.textContent).toContain(employeeTexts.workingTimeSectionManageAction);
  });

  it('renders current plus history and displays derived hours from backend response without technical ids', () => {
    store.workingTimesState.set([
      {
        workingTimeNumber: 2,
        startDate: '2026-01-01',
        endDate: null,
        workingTimePercentage: 80,
        weeklyHours: 32,
        dailyHours: 6.4,
        monthlyHours: 133.33,
        isActive: true,
      } as EmployeeWorkingTimeModel & { id: number },
      {
        workingTimeNumber: 1,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        workingTimePercentage: 50,
        weeklyHours: 20,
        dailyHours: 4,
        monthlyHours: 83.33,
        isActive: false,
        id: 987654,
      } as EmployeeWorkingTimeModel & { id: number },
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';

    expect(text).toContain('Porcentaje de jornada: 80 %');
    expect(text).toContain('Horas semanales: 32');
    expect(text).toContain('Horas diarias: 6,4');
    expect(text).toContain('Horas mensuales: 133,33');
    expect(text).not.toContain('#2');
    expect(text).not.toContain('987654');
  });

  it('submits create form with only startDate and workingTimePercentage', () => {
    const component = fixture.componentInstance as unknown as Record<string, (...args: unknown[]) => void>;

    component['startManage']();
    component['startCreate']();
    component['updateCreateField']('startDate', '2026-04-01');
    component['updateCreateField']('workingTimePercentage', 75);
    component['submitCreate']();

    expect(store.createWorkingTime).toHaveBeenCalledWith(employeeBusinessKey, {
      startDate: '2026-04-01',
      workingTimePercentage: 75,
    });
    expect(store.createWorkingTime.mock.calls[0][1]).not.toHaveProperty('weeklyHours');
    expect(store.createWorkingTime.mock.calls[0][1]).not.toHaveProperty('dailyHours');
    expect(store.createWorkingTime.mock.calls[0][1]).not.toHaveProperty('monthlyHours');
  });

  it('clamps working time percentage input to the 0-100 range', () => {
    const component = fixture.componentInstance as unknown as Record<string, (...args: unknown[]) => void>;
    const componentState = fixture.componentInstance as unknown as Record<string, () => { workingTimePercentage: number }>;

    component['startManage']();
    component['startCreate']();
    component['updateCreateField']('workingTimePercentage', 150);

    expect(componentState['createDraft']().workingTimePercentage).toBe(100);

    component['updateCreateField']('workingTimePercentage', -10);

    expect(componentState['createDraft']().workingTimePercentage).toBe(0);
  });

  it('close action sends workingTimeNumber and endDate', () => {
    store.workingTimesState.set([
      {
        workingTimeNumber: 2,
        startDate: '2026-01-01',
        endDate: null,
        workingTimePercentage: 80,
        weeklyHours: 32,
        dailyHours: 6.4,
        monthlyHours: 133.33,
        isActive: true,
      },
    ]);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as Record<string, (...args: unknown[]) => void>;

    component['startManage']();
    component['requestClose'](2);
    component['updateCloseField']('endDate', '2026-05-31');
    component['confirmClose'](2);

    expect(store.closeWorkingTime).toHaveBeenCalledWith(employeeBusinessKey, 2, {
      endDate: '2026-05-31',
    });
  });

  it('renders close action for the active working time without entering manage mode', () => {
    store.workingTimesState.set([
      {
        workingTimeNumber: 2,
        startDate: '2026-01-01',
        endDate: null,
        workingTimePercentage: 80,
        weeklyHours: 32,
        dailyHours: 6.4,
        monthlyHours: 133.33,
        isActive: true,
      },
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain(employeeTexts.workingTimeSectionCloseAction);
  });
});