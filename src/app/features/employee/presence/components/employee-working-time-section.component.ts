import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import { EmployeeWorkingTimeStore } from '../../data-access/employee-working-time.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeWorkingTimeModel } from '../../models/employee-working-time.model';
import { UiDateInputComponent } from '../../../../shared/ui/date-input/ui-date-input.component';
import { UiInputNumberComponent } from '../../../../shared/ui/input-number/ui-input-number.component';
import { PeriodTableComponent } from '../../shared/ui/period-table/period-table.component';
import { PeriodModalComponent } from '../../shared/ui/period-modal/period-modal.component';
import { PeriodTableRow } from '../../shared/ui/period-table/period-table.model';
import { currentLocalDate } from '../../../../shared/utils/local-date.util';

type WorkingTimeModalMode = 'create' | 'close';

interface WorkingTimePeriodRow extends PeriodTableRow {
  workingTimeNumber: number;
  workingTimePercentage: number;
  weeklyHours: number;
  dailyHours: number;
}

@Component({
  selector: 'app-employee-working-time-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PeriodTableComponent, PeriodModalComponent, UiDateInputComponent, UiInputNumberComponent],
  templateUrl: './employee-working-time-section.component.html',
  styleUrl: './employee-working-time-section.component.scss',
})
export class EmployeeWorkingTimeSectionComponent {
  readonly employeeBusinessKey = input<EmployeeBusinessKey | null>(null);

  private readonly workingTimeStore = inject(EmployeeWorkingTimeStore);

  protected readonly modalVisible = signal(false);
  protected readonly modalMode = signal<WorkingTimeModalMode>('create');
  protected readonly editingNumber = signal<number | null>(null);
  protected readonly startDateDraft = signal(currentLocalDate());
  protected readonly percentageDraft = signal(100);
  protected readonly endDateDraft = signal('');

  protected readonly texts = employeeTexts;

  protected readonly rows = computed<ReadonlyArray<WorkingTimePeriodRow>>(() =>
    this.workingTimeStore.workingTimes().map((wt: EmployeeWorkingTimeModel) => ({
      startDate: wt.startDate,
      endDate: wt.endDate,
      isActive: wt.isActive,
      canEdit: wt.isActive,
      canDelete: false,
      workingTimeNumber: wt.workingTimeNumber,
      workingTimePercentage: wt.workingTimePercentage,
      weeklyHours: wt.weeklyHours,
      dailyHours: wt.dailyHours,
    })),
  );

  protected readonly saving = computed(() => this.workingTimeStore.mutating());

  protected readonly modalTitle = computed(() =>
    this.modalMode() === 'create' ? 'Nueva jornada' : 'Cerrar período — Jornada',
  );

  protected readonly isSubmitEnabled = computed(() =>
    this.modalMode() === 'create' ? !!this.startDateDraft() : !!this.endDateDraft(),
  );

  constructor() {
    effect(() => {
      const key = this.employeeBusinessKey();
      untracked(() => this.workingTimeStore.loadWorkingTimesByBusinessKey(key));
    });

    effect(() => {
      const success = this.workingTimeStore.success();
      if (success) untracked(() => { if (this.modalVisible()) this.closeModal(); });
    });
  }

  protected openCreate(): void {
    this.workingTimeStore.clearFeedback();
    this.modalMode.set('create');
    this.startDateDraft.set(currentLocalDate());
    this.percentageDraft.set(100);
    this.modalVisible.set(true);
  }

  protected openEdit(index: number): void {
    const row = this.rows()[index];
    if (!row || !row.isActive) return;
    this.workingTimeStore.clearFeedback();
    this.modalMode.set('close');
    this.editingNumber.set(row.workingTimeNumber);
    this.endDateDraft.set(currentLocalDate());
    this.modalVisible.set(true);
  }

  protected submit(): void {
    const key = this.employeeBusinessKey();
    if (!key || this.workingTimeStore.mutating()) return;

    if (this.modalMode() === 'create') {
      this.workingTimeStore.createWorkingTime(key, {
        startDate: this.startDateDraft(),
        workingTimePercentage: this.percentageDraft(),
      });
    } else {
      this.workingTimeStore.closeWorkingTime(key, this.editingNumber()!, { endDate: this.endDateDraft() });
    }
  }

  protected closeModal(): void {
    this.modalVisible.set(false);
    this.workingTimeStore.clearFeedback();
  }
}
