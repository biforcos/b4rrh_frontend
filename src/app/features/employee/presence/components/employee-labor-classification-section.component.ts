import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import {
  EmployeeLaborClassificationRowTexts,
  LaborClassificationCloseDraft,
  LaborClassificationCorrectDraft,
  LaborClassificationReplaceDraft,
  createEmptyLaborClassificationCloseDraft,
  createEmptyLaborClassificationCorrectDraft,
  createEmptyLaborClassificationReplaceDraft,
  mapLaborClassificationToTemporalRow,
} from '../../data-access/employee-labor-classification.mapper';
import { EmployeeLaborClassificationStore } from '../../data-access/employee-labor-classification.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { TemporalSectionComponent } from '../../shared/ui/section/temporal-section.component';
import {
  TemporalDisplayMode,
  TemporalRowViewModel,
  TemporalSectionTexts,
} from '../../shared/ui/section/temporal-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';

@Component({
  selector: 'app-employee-labor-classification-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemporalSectionComponent],
  templateUrl: './employee-labor-classification-section.component.html',
  styleUrl: './employee-labor-classification-section.component.scss',
})
export class EmployeeLaborClassificationSectionComponent {
  readonly employeeBusinessKey = input<EmployeeBusinessKey | null>(null);

  private readonly laborClassificationStore = inject(EmployeeLaborClassificationStore);

  private readonly displayModeState = signal<TemporalDisplayMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly confirmingCloseKeyState = signal<number | null>(null);
  private readonly correctingKeyState = signal<number | null>(null);
  private readonly replaceDraftState = signal<LaborClassificationReplaceDraft>(
    createEmptyLaborClassificationReplaceDraft(),
  );
  private readonly correctDraftState = signal<LaborClassificationCorrectDraft>(
    createEmptyLaborClassificationCorrectDraft(),
  );
  private readonly closeDraftState = signal<LaborClassificationCloseDraft>(
    createEmptyLaborClassificationCloseDraft(),
  );

  protected readonly texts = employeeTexts;
  protected readonly sectionSubtitle = this.texts.laborClassificationSectionSubtitle;
  protected readonly sectionTexts: TemporalSectionTexts = {
    manageAction: this.texts.laborClassificationSectionManageAction,
    exitManageAction: this.texts.laborClassificationSectionExitManageAction,
    addAction: this.texts.laborClassificationSectionReplaceAction,
    editCurrentAction: this.texts.laborClassificationSectionCorrectAction,
    correctAction: this.texts.laborClassificationSectionCorrectAction,
    closeAction: this.texts.laborClassificationSectionCloseAction,
    deleteAction: this.texts.laborClassificationSectionDeleteAction,
    cancelAction: this.texts.laborClassificationSectionCancelAction,
    saveCreateAction: this.texts.laborClassificationSectionSaveReplaceAction,
    saveEditCurrentAction: this.texts.laborClassificationSectionSaveCorrectAction,
    saveCorrectAction: this.texts.laborClassificationSectionSaveCorrectAction,
    confirmCloseMessage: this.texts.laborClassificationSectionConfirmCloseMessage,
    confirmCloseAction: this.texts.laborClassificationSectionConfirmCloseAction,
    confirmDeleteMessage: this.texts.laborClassificationSectionConfirmDeleteMessage,
    confirmDeleteAction: this.texts.laborClassificationSectionConfirmDeleteAction,
    emptyMessage: this.texts.laborClassificationSectionEmptyMessage,
  };
  protected readonly rowTexts: EmployeeLaborClassificationRowTexts = {
    activeStatus: this.texts.laborClassificationSectionStatusActive,
    closedStatus: this.texts.laborClassificationSectionStatusClosed,
    currentPeriodLabel: this.texts.laborClassificationSectionCurrentPeriodLabel,
    periodPrefix: this.texts.laborClassificationSectionPeriodPrefix,
  };

  protected readonly rows = computed<ReadonlyArray<TemporalRowViewModel<number>>>(() =>
    this.laborClassificationStore
      .laborClassifications()
      .map((classification) => mapLaborClassificationToTemporalRow(classification, this.rowTexts)),
  );
  protected readonly displayMode = this.displayModeState.asReadonly();
  protected readonly confirmingCloseKey = this.confirmingCloseKeyState.asReadonly();
  protected readonly correctingKey = this.correctingKeyState.asReadonly();
  protected readonly replaceDraft = this.replaceDraftState.asReadonly();
  protected readonly correctDraft = this.correctDraftState.asReadonly();
  protected readonly closeDraft = this.closeDraftState.asReadonly();
  protected readonly supportedActions = computed(() => ({
    canReplaceFromDate: true,
    canCorrect: true,
    canClose: true,
    canDelete: false,
  }));

  protected readonly currentOccurrence = computed(() =>
    this.laborClassificationStore.laborClassifications().find((item) => item.isActive) ?? null,
  );
  protected readonly correctingOccurrence = computed(() => {
    const key = this.correctingKeyState();
    if (key === null) {
      return null;
    }

    return this.laborClassificationStore
      .laborClassifications()
      .find((item) => this.toRowKey(item.startDate) === key) ?? null;
  });
  protected readonly isReplaceDraftValid = computed(() => {
    const draft = this.replaceDraftState();
    if (this.normalizeRequiredValue(draft.effectiveDate).length === 0) {
      return false;
    }

    if (this.normalizeRequiredValue(draft.agreementCode).length === 0) {
      return false;
    }

    return this.normalizeRequiredValue(draft.agreementCategoryCode).length > 0;
  });
  protected readonly isCorrectDraftValid = computed(() => {
    const draft = this.correctDraftState();
    if (this.normalizeRequiredValue(draft.agreementCode).length === 0) {
      return false;
    }

    return this.normalizeRequiredValue(draft.agreementCategoryCode).length > 0;
  });
  protected readonly isCloseDraftValid = computed(() => {
    const closeKey = this.confirmingCloseKeyState();
    if (closeKey === null) {
      return false;
    }

    const occurrence = this.laborClassificationStore
      .laborClassifications()
      .find((item) => this.toRowKey(item.startDate) === closeKey);
    if (!occurrence) {
      return false;
    }

    const closeEndDate = this.normalizeRequiredValue(this.closeDraftState().endDate);
    if (closeEndDate.length === 0) {
      return false;
    }

    return closeEndDate >= occurrence.startDate;
  });

  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.laborClassificationStore.loading() || this.laborClassificationStore.mutating();

    return {
      mode: isBusy ? 'submitting' : this.toSectionMode(this.displayModeState()),
      dirty:
        this.displayModeState() === 'creating' ||
        this.displayModeState() === 'correcting' ||
        this.displayModeState() === 'confirmingClose',
      busy: isBusy,
      errorMessage: this.resolveErrorMessage(),
      successMessage: this.resolveSuccessMessage(),
    };
  });

  constructor() {
    effect(() => {
      const activeEmployeeKey = this.employeeBusinessKey();

      untracked(() => {
        this.laborClassificationStore.loadLaborClassificationsByBusinessKey(activeEmployeeKey);
        this.enterManageMode();
      });
    });

    effect(() => {
      const successCode = this.laborClassificationStore.success();
      const mode = this.displayModeState();

      if (!successCode) {
        return;
      }

      if (mode === 'creating' || mode === 'correcting' || mode === 'confirmingClose') {
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

  protected startReplaceFromDate(): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || !this.canStartInteraction()) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterReplaceFromDateMode();
  }

  protected submitReplaceFromDate(): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || this.laborClassificationStore.mutating()) {
      return;
    }

    if (!this.isReplaceDraftValid()) {
      this.localErrorMessageState.set(this.texts.laborClassificationSectionInvalidDataMessage);
      return;
    }

    this.clearLocalError();
    this.laborClassificationStore.replaceFromDate(activeEmployeeKey, this.replaceDraftState());
  }

  protected startCorrect(rowKey: number): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || !this.canStartInteraction()) {
      return;
    }

    const occurrence = this.laborClassificationStore
      .laborClassifications()
      .find((item) => this.toRowKey(item.startDate) === rowKey);
    if (!occurrence) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterCorrectingMode(rowKey, {
      agreementCode: occurrence.agreementCode,
      agreementCategoryCode: occurrence.agreementCategoryCode,
    });
  }

  protected submitCorrect(rowKey: number): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || this.laborClassificationStore.mutating()) {
      return;
    }

    const occurrence = this.laborClassificationStore
      .laborClassifications()
      .find((item) => this.toRowKey(item.startDate) === rowKey);
    if (!occurrence) {
      return;
    }

    if (!this.isCorrectDraftValid()) {
      this.localErrorMessageState.set(this.texts.laborClassificationSectionInvalidDataMessage);
      return;
    }

    this.clearLocalError();
    this.laborClassificationStore.correctOccurrence(activeEmployeeKey, occurrence.startDate, this.correctDraftState());
  }

  protected requestClose(rowKey: number): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const occurrence = this.laborClassificationStore
      .laborClassifications()
      .find((item) => this.toRowKey(item.startDate) === rowKey);
    if (!occurrence || !occurrence.isActive) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterConfirmingCloseMode(rowKey, this.currentBusinessDate());
  }

  protected confirmClose(rowKey: number): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || this.laborClassificationStore.mutating()) {
      return;
    }

    const occurrence = this.laborClassificationStore
      .laborClassifications()
      .find((item) => this.toRowKey(item.startDate) === rowKey);
    if (!occurrence) {
      return;
    }

    if (!this.isCloseDraftValid()) {
      this.localErrorMessageState.set(this.texts.laborClassificationSectionCloseDateInvalidMessage);
      return;
    }

    this.clearLocalError();
    this.laborClassificationStore.closeOccurrence(activeEmployeeKey, occurrence.startDate, this.closeDraftState());
  }

  protected cancel(): void {
    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected updateReplaceField(field: keyof LaborClassificationReplaceDraft, value: string): void {
    this.replaceDraftState.set({
      ...this.replaceDraftState(),
      [field]: value,
    });

    this.clearInteractionFeedback();
  }

  protected updateCorrectField(field: keyof LaborClassificationCorrectDraft, value: string): void {
    this.correctDraftState.set({
      ...this.correctDraftState(),
      [field]: value,
    });

    this.clearInteractionFeedback();
  }

  protected updateCloseField(field: keyof LaborClassificationCloseDraft, value: string): void {
    this.closeDraftState.set({
      ...this.closeDraftState(),
      [field]: value,
    });
    this.clearInteractionFeedback();
  }

  private canStartInteraction(): boolean {
    if (!this.employeeBusinessKey()) {
      return false;
    }

    return !this.laborClassificationStore.mutating();
  }

  private enterViewMode(): void {
    this.displayModeState.set('view');
    this.resetOperationContext();
  }

  private enterManageMode(): void {
    this.displayModeState.set('manage');
    this.resetOperationContext();
  }

  private enterReplaceFromDateMode(): void {
    this.displayModeState.set('creating');
    this.correctingKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.replaceDraftState.set(createEmptyLaborClassificationReplaceDraft());
    this.correctDraftState.set(createEmptyLaborClassificationCorrectDraft());
    this.closeDraftState.set(createEmptyLaborClassificationCloseDraft());
  }

  private enterCorrectingMode(rowKey: number, draft: LaborClassificationCorrectDraft): void {
    this.displayModeState.set('correcting');
    this.correctingKeyState.set(rowKey);
    this.confirmingCloseKeyState.set(null);
    this.replaceDraftState.set(createEmptyLaborClassificationReplaceDraft());
    this.correctDraftState.set(draft);
    this.closeDraftState.set(createEmptyLaborClassificationCloseDraft());
  }

  private enterConfirmingCloseMode(rowKey: number, endDate: string): void {
    this.displayModeState.set('confirmingClose');
    this.correctingKeyState.set(null);
    this.confirmingCloseKeyState.set(rowKey);
    this.replaceDraftState.set(createEmptyLaborClassificationReplaceDraft());
    this.correctDraftState.set(createEmptyLaborClassificationCorrectDraft());
    this.closeDraftState.set({ endDate });
  }

  private clearInteractionFeedback(): void {
    this.laborClassificationStore.clearFeedback();
    this.clearLocalError();
  }

  private clearLocalError(): void {
    this.localErrorMessageState.set(null);
  }

  private resetOperationContext(): void {
    this.correctingKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.replaceDraftState.set(createEmptyLaborClassificationReplaceDraft());
    this.correctDraftState.set(createEmptyLaborClassificationCorrectDraft());
    this.closeDraftState.set(createEmptyLaborClassificationCloseDraft());
  }

  private toSectionMode(displayMode: TemporalDisplayMode): SectionMode {
    if (displayMode === 'creating' || displayMode === 'correcting' || displayMode === 'editingCurrent') {
      return 'editing';
    }

    if (displayMode === 'confirmingClose') {
      return 'confirming';
    }

    return 'view';
  }

  private resolveErrorMessage(): string | null {
    if (this.localErrorMessageState()) {
      return this.localErrorMessageState();
    }

    const errorCode = this.laborClassificationStore.error();

    if (errorCode === 'LABOR_CLASSIFICATION_OVERLAP') {
      return this.texts.laborClassificationSectionOverlapMessage;
    }

    if (errorCode === 'LABOR_CLASSIFICATION_OUTSIDE_PRESENCE') {
      return this.texts.laborClassificationSectionOutsidePresenceMessage;
    }

    if (errorCode === 'LABOR_CLASSIFICATION_INCOMPLETE_COVERAGE') {
      return this.texts.laborClassificationSectionIncompleteCoverageMessage;
    }

    if (errorCode === 'LABOR_CLASSIFICATION_INVALID_PERIOD') {
      return this.texts.laborClassificationSectionInvalidPeriodMessage;
    }

    if (errorCode === 'LABOR_CLASSIFICATION_ALREADY_CLOSED') {
      return this.texts.laborClassificationSectionAlreadyClosedMessage;
    }

    if (errorCode === 'LABOR_CLASSIFICATION_NOT_FOUND') {
      return this.texts.laborClassificationSectionNotFoundMessage;
    }

    if (errorCode === 'AGREEMENT_NOT_FOUND') {
      return this.texts.laborClassificationSectionAgreementNotFoundMessage;
    }

    if (errorCode === 'AGREEMENT_CATEGORY_NOT_FOUND') {
      return this.texts.laborClassificationSectionAgreementCategoryNotFoundMessage;
    }

    if (errorCode === 'AGREEMENT_CATEGORY_RELATION_INVALID') {
      return this.texts.laborClassificationSectionAgreementCategoryRelationInvalidMessage;
    }

    if (errorCode === 'request-failed') {
      return this.texts.laborClassificationSectionRequestFailedMessage;
    }

    return null;
  }

  private resolveSuccessMessage(): string | null {
    const successCode = this.laborClassificationStore.success();

    if (successCode === 'replaced') {
      return this.texts.laborClassificationSectionReplaceSuccessMessage;
    }

    if (successCode === 'corrected') {
      return this.texts.laborClassificationSectionCorrectSuccessMessage;
    }

    if (successCode === 'closed') {
      return this.texts.laborClassificationSectionCloseSuccessMessage;
    }

    return null;
  }

  private currentBusinessDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private normalizeRequiredValue(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }

  private toRowKey(startDate: string): number {
    return Number(startDate.replaceAll('-', ''));
  }
}
