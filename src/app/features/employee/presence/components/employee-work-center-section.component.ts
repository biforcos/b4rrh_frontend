import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import {
  EmployeeWorkCenterRowTexts,
  WorkCenterCorrectDraft,
  WorkCenterCreateDraft,
  mapEmployeeWorkCenterModelToTemporalRow,
} from '../../data-access/employee-work-center.mapper';
import { EmployeeWorkCenterStore } from '../../data-access/employee-work-center.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { TemporalSectionComponent } from '../../shared/ui/section/temporal-section.component';
import { TemporalDisplayMode, TemporalRowViewModel, TemporalSectionTexts } from '../../shared/ui/section/temporal-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';

function createEmptyWorkCenterCreateDraft(): WorkCenterCreateDraft {
  return {
    workCenterCode: '',
    startDate: '',
    endDate: '',
  };
}

function createEmptyWorkCenterCorrectDraft(): WorkCenterCorrectDraft {
  return {
    workCenterCode: '',
    startDate: '',
    endDate: '',
  };
}

@Component({
  selector: 'app-employee-work-center-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemporalSectionComponent],
  templateUrl: './employee-work-center-section.component.html',
  styleUrl: './employee-work-center-section.component.scss',
})
export class EmployeeWorkCenterSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly workCenterStore = inject(EmployeeWorkCenterStore);
  private readonly displayModeState = signal<TemporalDisplayMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly confirmingCloseKeyState = signal<number | null>(null);
  private readonly confirmingDeleteKeyState = signal<number | null>(null);
  private readonly correctingKeyState = signal<number | null>(null);
  private readonly createDraftState = signal<WorkCenterCreateDraft>(createEmptyWorkCenterCreateDraft());
  private readonly correctDraftState = signal<WorkCenterCorrectDraft>(createEmptyWorkCenterCorrectDraft());
  private readonly closeEndDateState = signal<string>('');

  protected readonly texts = employeeTexts;
  protected readonly sectionSubtitle = this.texts.workCenterSectionSubtitle;
  protected readonly sectionTexts: TemporalSectionTexts = {
    manageAction: this.texts.workCenterSectionManageAction,
    exitManageAction: this.texts.workCenterSectionExitManageAction,
    addAction: this.texts.workCenterSectionAddAction,
    editCurrentAction: this.texts.workCenterSectionCorrectAction,
    correctAction: this.texts.workCenterSectionCorrectAction,
    closeAction: this.texts.workCenterSectionCloseAction,
    deleteAction: this.texts.workCenterSectionDeleteAction,
    cancelAction: this.texts.workCenterSectionCancelAction,
    saveCreateAction: this.texts.workCenterSectionSaveCreateAction,
    saveEditCurrentAction: this.texts.workCenterSectionSaveCorrectAction,
    saveCorrectAction: this.texts.workCenterSectionSaveCorrectAction,
    confirmCloseMessage: this.texts.workCenterSectionConfirmCloseMessage,
    confirmCloseAction: this.texts.workCenterSectionConfirmCloseAction,
    confirmDeleteMessage: this.texts.workCenterSectionConfirmDeleteMessage,
    confirmDeleteAction: this.texts.workCenterSectionConfirmDeleteAction,
    emptyMessage: this.texts.workCenterSectionEmptyMessage,
  };
  protected readonly rowTexts: EmployeeWorkCenterRowTexts = {
    currentStatus: this.texts.workCenterSectionCurrentStatus,
    closedStatus: this.texts.workCenterSectionClosedStatus,
    currentPeriodLabel: this.texts.workCenterSectionCurrentPeriodLabel,
    periodPrefix: this.texts.workCenterSectionPeriodPrefix,
    assignmentPrefix: this.texts.workCenterSectionAssignmentPrefix,
    deleteDisabledPresenceStartReason: this.texts.workCenterSectionDeleteDisabledPresenceStartReason,
  };
  protected readonly rows = computed<ReadonlyArray<TemporalRowViewModel<number>>>(() =>
    [...this.workCenterStore.workCenters()]
      .sort((left, right) => this.compareWorkCenterOrder(left, right))
      .map((workCenter) => mapEmployeeWorkCenterModelToTemporalRow(workCenter, this.rowTexts)),
  );
  protected readonly displayMode = this.displayModeState.asReadonly();
  protected readonly confirmingCloseKey = this.confirmingCloseKeyState.asReadonly();
  protected readonly confirmingDeleteKey = this.confirmingDeleteKeyState.asReadonly();
  protected readonly correctingKey = this.correctingKeyState.asReadonly();
  protected readonly createDraft = this.createDraftState.asReadonly();
  protected readonly correctDraft = this.correctDraftState.asReadonly();
  protected readonly closeEndDate = this.closeEndDateState.asReadonly();
  protected readonly correctingRow = computed(() => {
    const correctingKey = this.correctingKeyState();
    if (correctingKey === null) {
      return null;
    }

    return this.workCenterStore.workCenters().find((workCenter) => workCenter.workCenterAssignmentNumber === correctingKey) ?? null;
  });
  protected readonly isCreateDraftValid = computed(() => {
    const draft = this.createDraftState();
    if (this.normalizeRequiredValue(draft.workCenterCode).length === 0) {
      return false;
    }

    return this.isValidPeriod(draft.startDate, draft.endDate);
  });
  protected readonly isCorrectDraftValid = computed(() => {
    const draft = this.correctDraftState();
    if (this.normalizeRequiredValue(draft.workCenterCode).length === 0) {
      return false;
    }

    return this.isValidPeriod(draft.startDate, draft.endDate);
  });
  protected readonly isCloseDraftValid = computed(() => {
    const closeKey = this.confirmingCloseKeyState();
    if (closeKey === null) {
      return false;
    }

    const row = this.workCenterStore.workCenters().find((workCenter) => workCenter.workCenterAssignmentNumber === closeKey);
    if (!row) {
      return false;
    }

    const closeEndDate = this.normalizeRequiredValue(this.closeEndDateState());
    if (closeEndDate.length === 0) {
      return false;
    }

    return closeEndDate >= row.startDate;
  });
  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.workCenterStore.loading() || this.workCenterStore.mutating();

    return {
      mode: isBusy ? 'submitting' : this.toSectionMode(this.displayModeState()),
      dirty:
        this.displayModeState() === 'creating' ||
        this.displayModeState() === 'correcting' ||
        this.displayModeState() === 'confirmingClose' ||
        this.displayModeState() === 'confirmingDelete',
      busy: isBusy,
      errorMessage: this.resolveErrorMessage(),
      successMessage: this.resolveSuccessMessage(),
    };
  });

  constructor() {
    effect(() => {
      const activeEmployeeKey = this.employeeKey();

      untracked(() => {
        this.workCenterStore.loadWorkCenters(activeEmployeeKey);
        this.enterViewMode();
      });
    });

    effect(() => {
      const successCode = this.workCenterStore.success();
      const mode = this.displayModeState();

      if (!successCode) {
        return;
      }

      if (mode === 'creating' || mode === 'correcting' || mode === 'confirmingClose' || mode === 'confirmingDelete') {
        this.enterManageMode();
      }
    });
  }

  protected startManage(): void {
    if (!this.canStartInteraction()) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterManageMode();
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

  protected startCorrect(workCenterAssignmentNumber: number): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const row = this.workCenterStore
      .workCenters()
      .find((workCenter) => workCenter.workCenterAssignmentNumber === workCenterAssignmentNumber);
    if (!row) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterCorrectingMode(row.workCenterAssignmentNumber, {
      workCenterCode: row.workCenterCode,
      startDate: row.startDate,
      endDate: row.endDate ?? '',
    });
  }

  protected requestClose(workCenterAssignmentNumber: number): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const row = this.rows().find((item) => item.key === workCenterAssignmentNumber);
    if (!row || row.closeable !== true) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterConfirmingCloseMode(workCenterAssignmentNumber, this.currentBusinessDate());
  }

  protected requestDelete(workCenterAssignmentNumber: number): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const row = this.rows().find((item) => item.key === workCenterAssignmentNumber);
    if (!row || row.deletable !== true) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterConfirmingDeleteMode(workCenterAssignmentNumber);
  }

  protected submitCreate(): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.workCenterStore.mutating()) {
      return;
    }

    const draft = this.createDraftState();
    if (!this.isCreateDraftValid()) {
      this.localErrorMessageState.set(this.texts.workCenterSectionInvalidPeriodMessage);
      return;
    }

    this.clearLocalError();
    this.workCenterStore.createWorkCenter(activeEmployeeKey, draft);
  }

  protected confirmClose(workCenterAssignmentNumber: number): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.workCenterStore.mutating()) {
      return;
    }

    const closeEndDate = this.normalizeRequiredValue(this.closeEndDateState());
    if (!this.isCloseDraftValid()) {
      this.localErrorMessageState.set(this.texts.workCenterSectionCloseDateInvalidMessage);
      return;
    }

    this.clearLocalError();
    this.workCenterStore.closeWorkCenter(activeEmployeeKey, workCenterAssignmentNumber, closeEndDate);
  }

  protected confirmDelete(workCenterAssignmentNumber: number): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.workCenterStore.mutating()) {
      return;
    }

    this.clearLocalError();
    this.workCenterStore.deleteWorkCenter(activeEmployeeKey, workCenterAssignmentNumber);
  }

  protected submitCorrect(workCenterAssignmentNumber: number): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.workCenterStore.mutating()) {
      return;
    }

    const draft = this.correctDraftState();
    if (!this.isCorrectDraftValid()) {
      this.localErrorMessageState.set(this.texts.workCenterSectionInvalidPeriodMessage);
      return;
    }

    this.clearLocalError();
    this.workCenterStore.correctWorkCenter(activeEmployeeKey, workCenterAssignmentNumber, draft);
  }

  protected cancel(): void {
    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected updateCreateField(field: keyof WorkCenterCreateDraft, value: string): void {
    this.createDraftState.set({
      ...this.createDraftState(),
      [field]: value,
    });
    this.clearInteractionFeedback();
  }

  protected updateCorrectField(field: keyof WorkCenterCorrectDraft, value: string): void {
    this.correctDraftState.set({
      ...this.correctDraftState(),
      [field]: value,
    });
    this.clearInteractionFeedback();
  }

  protected updateCloseEndDate(value: string): void {
    this.closeEndDateState.set(value);
    this.clearInteractionFeedback();
  }

  private canStartInteraction(): boolean {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey) {
      return false;
    }

    return !this.workCenterStore.mutating();
  }

  private enterViewMode(): void {
    this.displayModeState.set('view');
    this.resetOperationContext();
  }

  private enterManageMode(): void {
    this.displayModeState.set('manage');
    this.resetOperationContext();
  }

  private enterCreateMode(): void {
    this.displayModeState.set('creating');
    this.correctingKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.confirmingDeleteKeyState.set(null);
    this.createDraftState.set(createEmptyWorkCenterCreateDraft());
    this.correctDraftState.set(createEmptyWorkCenterCorrectDraft());
    this.closeEndDateState.set('');
  }

  private enterCorrectingMode(workCenterAssignmentNumber: number, draft: WorkCenterCorrectDraft): void {
    this.displayModeState.set('correcting');
    this.correctingKeyState.set(workCenterAssignmentNumber);
    this.confirmingCloseKeyState.set(null);
    this.confirmingDeleteKeyState.set(null);
    this.createDraftState.set(createEmptyWorkCenterCreateDraft());
    this.correctDraftState.set(draft);
    this.closeEndDateState.set('');
  }

  private enterConfirmingCloseMode(workCenterAssignmentNumber: number, defaultEndDate: string): void {
    this.displayModeState.set('confirmingClose');
    this.correctingKeyState.set(null);
    this.confirmingCloseKeyState.set(workCenterAssignmentNumber);
    this.confirmingDeleteKeyState.set(null);
    this.createDraftState.set(createEmptyWorkCenterCreateDraft());
    this.correctDraftState.set(createEmptyWorkCenterCorrectDraft());
    this.closeEndDateState.set(defaultEndDate);
  }

  private enterConfirmingDeleteMode(workCenterAssignmentNumber: number): void {
    this.displayModeState.set('confirmingDelete');
    this.correctingKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.confirmingDeleteKeyState.set(workCenterAssignmentNumber);
    this.createDraftState.set(createEmptyWorkCenterCreateDraft());
    this.correctDraftState.set(createEmptyWorkCenterCorrectDraft());
    this.closeEndDateState.set('');
  }

  private clearInteractionFeedback(): void {
    this.workCenterStore.clearFeedback();
    this.clearLocalError();
  }

  private clearLocalError(): void {
    this.localErrorMessageState.set(null);
  }

  private resetOperationContext(): void {
    this.correctingKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.confirmingDeleteKeyState.set(null);
    this.createDraftState.set(createEmptyWorkCenterCreateDraft());
    this.correctDraftState.set(createEmptyWorkCenterCorrectDraft());
    this.closeEndDateState.set('');
  }

  private toSectionMode(displayMode: TemporalDisplayMode): SectionMode {
    if (displayMode === 'creating' || displayMode === 'correcting' || displayMode === 'editingCurrent') {
      return 'editing';
    }

    if (displayMode === 'confirmingClose') {
      return 'confirming';
    }

    if (displayMode === 'confirmingDelete') {
      return 'confirming';
    }

    return 'view';
  }

  private resolveErrorMessage(): string | null {
    if (this.localErrorMessageState()) {
      return this.localErrorMessageState();
    }

    const errorCode = this.workCenterStore.error();

    if (errorCode === 'WORK_CENTER_OVERLAP') {
      return this.texts.workCenterSectionOverlapMessage;
    }

    if (errorCode === 'WORK_CENTER_OUTSIDE_PRESENCE') {
      return this.texts.workCenterSectionOutsidePresenceMessage;
    }

    if (errorCode === 'WORK_CENTER_CATALOG_NOT_FOUND') {
      return this.texts.workCenterSectionCatalogNotFoundMessage;
    }

    if (errorCode === 'WORK_CENTER_NOT_FOUND') {
      return this.texts.workCenterSectionNotFoundMessage;
    }

    if (errorCode === 'WORK_CENTER_ALREADY_CLOSED') {
      return this.texts.workCenterSectionAlreadyClosedMessage;
    }

    if (errorCode === 'WORK_CENTER_INVALID_PERIOD') {
      return this.texts.workCenterSectionFunctionalInvalidPeriodMessage;
    }

    if (errorCode === 'WORK_CENTER_DELETE_FORBIDDEN_AT_PRESENCE_START') {
      return this.texts.workCenterSectionDeleteForbiddenAtPresenceStartMessage;
    }

    if (errorCode === 'request-failed') {
      return this.texts.workCenterSectionRequestFailedMessage;
    }

    return null;
  }

  private resolveSuccessMessage(): string | null {
    const successCode = this.workCenterStore.success();

    if (successCode === 'created') {
      return this.texts.workCenterSectionCreateSuccessMessage;
    }

    if (successCode === 'corrected') {
      return this.texts.workCenterSectionCorrectSuccessMessage;
    }

    if (successCode === 'closed') {
      return this.texts.workCenterSectionCloseSuccessMessage;
    }

    if (successCode === 'deleted') {
      return this.texts.workCenterSectionDeleteSuccessMessage;
    }

    return null;
  }

  private compareWorkCenterOrder(
    left: { isActive: boolean; startDate: string; workCenterAssignmentNumber: number },
    right: { isActive: boolean; startDate: string; workCenterAssignmentNumber: number },
  ): number {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    const startDateOrder = right.startDate.localeCompare(left.startDate);
    if (startDateOrder !== 0) {
      return startDateOrder;
    }

    return right.workCenterAssignmentNumber - left.workCenterAssignmentNumber;
  }

  private currentBusinessDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private isValidPeriod(startDate: string, endDate: string): boolean {
    const normalizedStartDate = this.normalizeRequiredValue(startDate);
    if (normalizedStartDate.length === 0) {
      return false;
    }

    const normalizedEndDate = this.normalizeOptionalValue(endDate);
    if (!normalizedEndDate) {
      return true;
    }

    return normalizedEndDate >= normalizedStartDate;
  }

  private normalizeRequiredValue(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }

  private normalizeOptionalValue(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
  }
}
