import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { UiDateInputComponent } from '../../../../shared/ui/date-input/ui-date-input.component';
import { UiInputNumberComponent } from '../../../../shared/ui/input-number/ui-input-number.component';
import { TemporalSectionComponent } from '../../shared/ui/section/temporal-section.component';
import { TemporalDisplayMode, TemporalRowViewModel, TemporalSectionTexts } from '../../shared/ui/section/temporal-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';
import {
  EmployeeWorkingTimeRowTexts,
  WorkingTimeCloseDraft,
  WorkingTimeCreateDraft,
  createEmptyWorkingTimeCloseDraft,
  createEmptyWorkingTimeCreateDraft,
  mapEmployeeWorkingTimeModelToTemporalRow,
} from '../../data-access/employee-working-time.mapper';
import { EmployeeWorkingTimeStore } from '../../data-access/employee-working-time.store';
import { currentLocalDate } from '../../../../shared/utils/local-date.util';

@Component({
  selector: 'app-employee-working-time-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemporalSectionComponent, UiDateInputComponent, UiInputNumberComponent],
  templateUrl: './employee-working-time-section.component.html',
  styleUrl: './employee-working-time-section.component.scss',
})
export class EmployeeWorkingTimeSectionComponent {
  readonly employeeBusinessKey = input<EmployeeBusinessKey | null>(null);

  private readonly workingTimeStore = inject(EmployeeWorkingTimeStore);
  private readonly displayModeState = signal<TemporalDisplayMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly confirmingCloseKeyState = signal<number | null>(null);
  private readonly createDraftState = signal<WorkingTimeCreateDraft>(createEmptyWorkingTimeCreateDraft());
  private readonly closeDraftState = signal<WorkingTimeCloseDraft>(createEmptyWorkingTimeCloseDraft());

  protected readonly texts = employeeTexts;
  protected readonly sectionSubtitle = this.texts.workingTimeSectionSubtitle;
  protected readonly sectionTexts: TemporalSectionTexts = {
    manageAction: this.texts.workingTimeSectionManageAction,
    exitManageAction: this.texts.workingTimeSectionExitManageAction,
    addAction: this.texts.workingTimeSectionAddAction,
    editCurrentAction: this.texts.workingTimeSectionEditCurrentAction,
    correctAction: this.texts.workingTimeSectionCorrectAction,
    closeAction: this.texts.workingTimeSectionCloseAction,
    deleteAction: this.texts.workingTimeSectionDeleteAction,
    cancelAction: this.texts.workingTimeSectionCancelAction,
    saveCreateAction: this.texts.workingTimeSectionSaveCreateAction,
    saveEditCurrentAction: this.texts.workingTimeSectionSaveEditCurrentAction,
    saveCorrectAction: this.texts.workingTimeSectionSaveCorrectAction,
    confirmCloseMessage: this.texts.workingTimeSectionConfirmCloseMessage,
    confirmCloseAction: this.texts.workingTimeSectionConfirmCloseAction,
    confirmDeleteMessage: this.texts.workingTimeSectionConfirmDeleteMessage,
    confirmDeleteAction: this.texts.workingTimeSectionConfirmDeleteAction,
    emptyMessage: this.texts.workingTimeSectionEmptyMessage,
  };
  protected readonly rowTexts: EmployeeWorkingTimeRowTexts = {
    activeStatus: this.texts.workingTimeSectionStatusActive,
    closedStatus: this.texts.workingTimeSectionStatusClosed,
    currentPeriodLabel: this.texts.workingTimeSectionCurrentPeriodLabel,
    periodPrefix: this.texts.workingTimeSectionPeriodPrefix,
    percentageLabel: this.texts.workingTimeSectionPercentageLabel,
    weeklyHoursLabel: this.texts.workingTimeSectionWeeklyHoursLabel,
    dailyHoursLabel: this.texts.workingTimeSectionDailyHoursLabel,
    monthlyHoursLabel: this.texts.workingTimeSectionMonthlyHoursLabel,
  };

  protected readonly rows = computed<ReadonlyArray<TemporalRowViewModel<number>>>(() =>
    this.workingTimeStore.workingTimes().map((item) => mapEmployeeWorkingTimeModelToTemporalRow(item, this.rowTexts)),
  );
  protected readonly displayMode = this.displayModeState.asReadonly();
  protected readonly confirmingCloseKey = this.confirmingCloseKeyState.asReadonly();
  protected readonly createDraft = this.createDraftState.asReadonly();
  protected readonly closeDraft = this.closeDraftState.asReadonly();
  protected readonly isCreateDraftValid = computed(() => {
    const draft = this.createDraftState();
    return this.normalizeRequiredValue(draft.startDate).length > 0
      && Number.isFinite(draft.workingTimePercentage)
      && draft.workingTimePercentage > 0
      && draft.workingTimePercentage <= 100;
  });
  protected readonly isCloseDraftValid = computed(() => {
    const closeKey = this.confirmingCloseKeyState();
    if (closeKey === null) {
      return false;
    }

    const occurrence = this.workingTimeStore.workingTimes().find((item) => item.workingTimeNumber === closeKey);
    if (!occurrence) {
      return false;
    }

    const endDate = this.normalizeRequiredValue(this.closeDraftState().endDate);
    return endDate.length > 0 && endDate >= occurrence.startDate;
  });
  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.workingTimeStore.loading() || this.workingTimeStore.mutating();

    return {
      mode: isBusy ? 'submitting' : this.toSectionMode(this.displayModeState()),
      dirty: this.displayModeState() === 'creating' || this.displayModeState() === 'confirmingClose',
      busy: isBusy,
      errorMessage: this.resolveErrorMessage(),
      successMessage: this.resolveSuccessMessage(),
    };
  });

  constructor() {
    effect(() => {
      const activeEmployeeKey = this.employeeBusinessKey();

      untracked(() => {
        this.workingTimeStore.loadWorkingTimesByBusinessKey(activeEmployeeKey);
        this.enterViewMode();
      });
    });

    effect(() => {
      const successCode = this.workingTimeStore.success();

      if (!successCode) {
        return;
      }

      if (this.displayModeState() === 'creating' || this.displayModeState() === 'confirmingClose') {
        this.enterViewMode();
      }
    });
  }

  protected startManage(): void {
    if (!this.canStartInteraction()) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterCreateMode();
  }

  protected exitManage(): void {
    this.clearInteractionFeedback();
    this.enterViewMode();
  }

  protected startCreate(): void {
    if (!this.canStartInteraction()) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterCreateMode();
  }

  protected requestClose(workingTimeNumber: number): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const occurrence = this.workingTimeStore.workingTimes().find((item) => item.workingTimeNumber === workingTimeNumber);
    if (!occurrence || !occurrence.isActive) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterConfirmingCloseMode(workingTimeNumber, this.currentBusinessDate());
  }

  protected submitCreate(): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || this.workingTimeStore.mutating()) {
      return;
    }

    if (!this.isCreateDraftValid()) {
      this.localErrorMessageState.set(this.texts.workingTimeSectionInvalidDataMessage);
      return;
    }

    this.clearLocalError();
    this.workingTimeStore.createWorkingTime(activeEmployeeKey, this.createDraftState());
  }

  protected confirmClose(workingTimeNumber: number): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || this.workingTimeStore.mutating()) {
      return;
    }

    if (!this.isCloseDraftValid()) {
      this.localErrorMessageState.set(this.texts.workingTimeSectionCloseDateInvalidMessage);
      return;
    }

    this.clearLocalError();
    this.workingTimeStore.closeWorkingTime(activeEmployeeKey, workingTimeNumber, this.closeDraftState());
  }

  protected cancel(): void {
    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected updateCreateField(field: keyof WorkingTimeCreateDraft, value: string | number): void {
    this.createDraftState.update((draft) => ({
      ...draft,
      [field]: field === 'workingTimePercentage' ? this.normalizePercentageValue(value) : this.normalizeRequiredValue(value),
    }));
  }

  protected updateCloseField(field: keyof WorkingTimeCloseDraft, value: string): void {
    this.closeDraftState.update((draft) => ({
      ...draft,
      [field]: this.normalizeRequiredValue(value),
    }));
  }

  private enterViewMode(): void {
    this.displayModeState.set('view');
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(createEmptyWorkingTimeCreateDraft());
    this.closeDraftState.set(createEmptyWorkingTimeCloseDraft());
  }

  private enterManageMode(): void {
    this.displayModeState.set('manage');
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(createEmptyWorkingTimeCreateDraft());
    this.closeDraftState.set(createEmptyWorkingTimeCloseDraft());
  }

  private enterCreateMode(): void {
    this.displayModeState.set('creating');
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(createEmptyWorkingTimeCreateDraft());
    this.closeDraftState.set(createEmptyWorkingTimeCloseDraft());
  }

  private enterConfirmingCloseMode(workingTimeNumber: number, defaultEndDate: string): void {
    this.displayModeState.set('confirmingClose');
    this.confirmingCloseKeyState.set(workingTimeNumber);
    this.closeDraftState.set({ endDate: defaultEndDate });
  }

  private resolveErrorMessage(): string | null {
    if (this.localErrorMessageState()) {
      return this.localErrorMessageState();
    }

    switch (this.workingTimeStore.error()) {
      case 'WORKING_TIME_OVERLAP':
        return this.texts.workingTimeSectionOverlapMessage;
      case 'WORKING_TIME_OUTSIDE_PRESENCE':
        return this.texts.workingTimeSectionOutsidePresenceMessage;
      case 'WORKING_TIME_INVALID_PERCENTAGE':
        return this.texts.workingTimeSectionInvalidPercentageMessage;
      case 'WORKING_TIME_INVALID_PERIOD':
        return this.texts.workingTimeSectionInvalidPeriodMessage;
      case 'WORKING_TIME_ALREADY_CLOSED':
        return this.texts.workingTimeSectionAlreadyClosedMessage;
      case 'WORKING_TIME_NOT_FOUND':
        return this.texts.workingTimeSectionNotFoundMessage;
      case 'WORKING_TIME_NUMBER_CONFLICT':
        return this.texts.workingTimeSectionNumberConflictMessage;
      case 'request-failed':
        return this.texts.workingTimeSectionRequestFailedMessage;
      default:
        return null;
    }
  }

  private resolveSuccessMessage(): string | null {
    switch (this.workingTimeStore.success()) {
      case 'created':
        return this.texts.workingTimeSectionCreateSuccessMessage;
      case 'closed':
        return this.texts.workingTimeSectionCloseSuccessMessage;
      default:
        return null;
    }
  }

  private toSectionMode(displayMode: TemporalDisplayMode): SectionMode {
    switch (displayMode) {
      case 'manage':
        return 'editing';
      case 'creating':
        return 'creating';
      case 'confirmingClose':
        return 'confirming';
      default:
        return 'view';
    }
  }

  private clearInteractionFeedback(): void {
    this.clearLocalError();
    this.workingTimeStore.clearFeedback();
  }

  private clearLocalError(): void {
    this.localErrorMessageState.set(null);
  }

  private canStartInteraction(): boolean {
    return !this.workingTimeStore.loading() && !this.workingTimeStore.mutating();
  }

  private currentBusinessDate(): string {
    return currentLocalDate();
  }

  private normalizeRequiredValue(value: string | number | null | undefined): string {
    return typeof value === 'string' ? value.trim() : `${value ?? ''}`.trim();
  }

  private normalizePercentageValue(value: string | number): number {
    const normalizedValue = this.clampPercentageValue(this.parsePercentageValue(value));

    return Number.isFinite(normalizedValue) ? normalizedValue : 0;
  }

  private parsePercentageValue(value: string | number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const parsed = Number.parseFloat(`${value}`);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private clampPercentageValue(value: number): number {
    if (value < 0) {
      return 0;
    }

    if (value > 100) {
      return 100;
    }

    return value;
  }
}