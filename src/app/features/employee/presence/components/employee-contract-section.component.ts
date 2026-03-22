import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import {
  ContractCloseDraft,
  ContractCorrectDraft,
  ContractReplaceDraft,
  EmployeeContractRowTexts,
  createEmptyContractCloseDraft,
  createEmptyContractCorrectDraft,
  createEmptyContractReplaceDraft,
  mapContractToTemporalRow,
} from '../../data-access/employee-contract.mapper';
import { EmployeeContractStore } from '../../data-access/employee-contract.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';
import { TemporalSectionComponent } from '../../shared/ui/section/temporal-section.component';
import {
  TemporalDisplayMode,
  TemporalRowViewModel,
  TemporalSectionTexts,
} from '../../shared/ui/section/temporal-section.model';

@Component({
  selector: 'app-employee-contract-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemporalSectionComponent],
  templateUrl: './employee-contract-section.component.html',
  styleUrl: './employee-contract-section.component.scss',
})
export class EmployeeContractSectionComponent {
  readonly employeeBusinessKey = input<EmployeeBusinessKey | null>(null);

  private readonly contractStore = inject(EmployeeContractStore);

  private readonly displayModeState = signal<TemporalDisplayMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly confirmingCloseKeyState = signal<number | null>(null);
  private readonly correctingKeyState = signal<number | null>(null);
  private readonly replaceDraftState = signal<ContractReplaceDraft>(createEmptyContractReplaceDraft());
  private readonly correctDraftState = signal<ContractCorrectDraft>(createEmptyContractCorrectDraft());
  private readonly closeDraftState = signal<ContractCloseDraft>(createEmptyContractCloseDraft());

  protected readonly texts = employeeTexts;
  protected readonly sectionSubtitle = this.texts.contractSectionSubtitle;
  protected readonly sectionTexts: TemporalSectionTexts = {
    manageAction: this.texts.contractSectionManageAction,
    exitManageAction: this.texts.contractSectionExitManageAction,
    addAction: this.texts.contractSectionReplaceAction,
    editCurrentAction: this.texts.contractSectionCorrectAction,
    correctAction: this.texts.contractSectionCorrectAction,
    closeAction: this.texts.contractSectionCloseAction,
    deleteAction: this.texts.contractSectionDeleteAction,
    cancelAction: this.texts.contractSectionCancelAction,
    saveCreateAction: this.texts.contractSectionSaveReplaceAction,
    saveEditCurrentAction: this.texts.contractSectionSaveCorrectAction,
    saveCorrectAction: this.texts.contractSectionSaveCorrectAction,
    confirmCloseMessage: this.texts.contractSectionConfirmCloseMessage,
    confirmCloseAction: this.texts.contractSectionConfirmCloseAction,
    confirmDeleteMessage: this.texts.contractSectionConfirmDeleteMessage,
    confirmDeleteAction: this.texts.contractSectionConfirmDeleteAction,
    emptyMessage: this.texts.contractSectionEmptyMessage,
  };
  protected readonly rowTexts: EmployeeContractRowTexts = {
    activeStatus: this.texts.contractSectionStatusActive,
    closedStatus: this.texts.contractSectionStatusClosed,
    currentPeriodLabel: this.texts.contractSectionCurrentPeriodLabel,
    periodPrefix: this.texts.contractSectionPeriodPrefix,
    subtypePrefix: this.texts.contractSectionSubtypePrefix,
  };

  protected readonly rows = computed<ReadonlyArray<TemporalRowViewModel<number>>>(() =>
    this.contractStore.contracts().map((contract) => mapContractToTemporalRow(contract, this.rowTexts)),
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

  protected readonly correctingOccurrence = computed(() => {
    const key = this.correctingKeyState();
    if (key === null) {
      return null;
    }

    return this.contractStore.contracts().find((item) => this.toRowKey(item.startDate) === key) ?? null;
  });
  protected readonly isReplaceDraftValid = computed(() => {
    const draft = this.replaceDraftState();
    if (this.normalizeRequiredValue(draft.effectiveDate).length === 0) {
      return false;
    }

    if (this.normalizeRequiredValue(draft.contractCode).length === 0) {
      return false;
    }

    return this.normalizeRequiredValue(draft.contractSubtypeCode).length > 0;
  });
  protected readonly isCorrectDraftValid = computed(() => {
    const draft = this.correctDraftState();
    if (this.normalizeRequiredValue(draft.contractCode).length === 0) {
      return false;
    }

    return this.normalizeRequiredValue(draft.contractSubtypeCode).length > 0;
  });
  protected readonly isCloseDraftValid = computed(() => {
    const closeKey = this.confirmingCloseKeyState();
    if (closeKey === null) {
      return false;
    }

    const occurrence = this.contractStore.contracts().find((item) => this.toRowKey(item.startDate) === closeKey);
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
    const isBusy = this.contractStore.loading() || this.contractStore.mutating();

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
        this.contractStore.loadContractsByBusinessKey(activeEmployeeKey);
        this.enterManageMode();
      });
    });

    effect(() => {
      const successCode = this.contractStore.success();
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
    if (!activeEmployeeKey || this.contractStore.mutating()) {
      return;
    }

    if (!this.isReplaceDraftValid()) {
      this.localErrorMessageState.set(this.texts.contractSectionInvalidDataMessage);
      return;
    }

    this.clearLocalError();
    this.contractStore.replaceFromDate(activeEmployeeKey, this.replaceDraftState());
  }

  protected startCorrect(rowKey: number): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || !this.canStartInteraction()) {
      return;
    }

    const occurrence = this.contractStore.contracts().find((item) => this.toRowKey(item.startDate) === rowKey);
    if (!occurrence) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterCorrectingMode(rowKey, {
      contractCode: occurrence.contractCode,
      contractSubtypeCode: occurrence.contractSubtypeCode ?? '',
    });
  }

  protected submitCorrect(rowKey: number): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || this.contractStore.mutating()) {
      return;
    }

    const occurrence = this.contractStore.contracts().find((item) => this.toRowKey(item.startDate) === rowKey);
    if (!occurrence) {
      return;
    }

    if (!this.isCorrectDraftValid()) {
      this.localErrorMessageState.set(this.texts.contractSectionInvalidDataMessage);
      return;
    }

    this.clearLocalError();
    this.contractStore.correctOccurrence(activeEmployeeKey, occurrence.startDate, this.correctDraftState());
  }

  protected requestClose(rowKey: number): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const occurrence = this.contractStore.contracts().find((item) => this.toRowKey(item.startDate) === rowKey);
    if (!occurrence || !occurrence.isActive) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterConfirmingCloseMode(rowKey, this.currentBusinessDate());
  }

  protected confirmClose(rowKey: number): void {
    const activeEmployeeKey = this.employeeBusinessKey();
    if (!activeEmployeeKey || this.contractStore.mutating()) {
      return;
    }

    const occurrence = this.contractStore.contracts().find((item) => this.toRowKey(item.startDate) === rowKey);
    if (!occurrence) {
      return;
    }

    if (!this.isCloseDraftValid()) {
      this.localErrorMessageState.set(this.texts.contractSectionCloseDateInvalidMessage);
      return;
    }

    this.clearLocalError();
    this.contractStore.closeOccurrence(activeEmployeeKey, occurrence.startDate, this.closeDraftState());
  }

  protected cancel(): void {
    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected updateReplaceField(field: keyof ContractReplaceDraft, value: string): void {
    this.replaceDraftState.set({
      ...this.replaceDraftState(),
      [field]: value,
    });
    this.clearInteractionFeedback();
  }

  protected updateCorrectField(field: keyof ContractCorrectDraft, value: string): void {
    this.correctDraftState.set({
      ...this.correctDraftState(),
      [field]: value,
    });
    this.clearInteractionFeedback();
  }

  protected updateCloseField(field: keyof ContractCloseDraft, value: string): void {
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

    return !this.contractStore.mutating();
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
    this.replaceDraftState.set(createEmptyContractReplaceDraft());
    this.correctDraftState.set(createEmptyContractCorrectDraft());
    this.closeDraftState.set(createEmptyContractCloseDraft());
  }

  private enterCorrectingMode(rowKey: number, draft: ContractCorrectDraft): void {
    this.displayModeState.set('correcting');
    this.correctingKeyState.set(rowKey);
    this.confirmingCloseKeyState.set(null);
    this.replaceDraftState.set(createEmptyContractReplaceDraft());
    this.correctDraftState.set(draft);
    this.closeDraftState.set(createEmptyContractCloseDraft());
  }

  private enterConfirmingCloseMode(rowKey: number, endDate: string): void {
    this.displayModeState.set('confirmingClose');
    this.correctingKeyState.set(null);
    this.confirmingCloseKeyState.set(rowKey);
    this.replaceDraftState.set(createEmptyContractReplaceDraft());
    this.correctDraftState.set(createEmptyContractCorrectDraft());
    this.closeDraftState.set({ endDate });
  }

  private clearInteractionFeedback(): void {
    this.contractStore.clearFeedback();
    this.clearLocalError();
  }

  private clearLocalError(): void {
    this.localErrorMessageState.set(null);
  }

  private resetOperationContext(): void {
    this.correctingKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.replaceDraftState.set(createEmptyContractReplaceDraft());
    this.correctDraftState.set(createEmptyContractCorrectDraft());
    this.closeDraftState.set(createEmptyContractCloseDraft());
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

    const errorCode = this.contractStore.error();
    if (!errorCode) {
      return null;
    }

    if (errorCode === 'request-failed') {
      return this.texts.contractSectionRequestFailedMessage;
    }

    return errorCode;
  }

  private resolveSuccessMessage(): string | null {
    const successCode = this.contractStore.success();

    if (successCode === 'replaced') {
      return this.texts.contractSectionReplaceSuccessMessage;
    }

    if (successCode === 'corrected') {
      return this.texts.contractSectionCorrectSuccessMessage;
    }

    if (successCode === 'closed') {
      return this.texts.contractSectionCloseSuccessMessage;
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
