import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeLaborClassificationCatalogGateway } from '../../data-access/employee-labor-classification-catalog.gateway';
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
import { EmployeeLaborClassificationCatalogItemModel } from '../../models/employee-labor-classification-catalog-item.model';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { SlotKeyOption } from '../../shared/ui/section/editable-slot-section.model';
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
  private readonly fieldCatalogService = inject(EmployeeFieldCatalogService);
  private readonly laborClassificationCatalogGateway = inject(EmployeeLaborClassificationCatalogGateway);

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
  private readonly agreementOptionsState = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  private readonly replaceCategoryOptionsState = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  private readonly correctCategoryOptionsState = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  private readonly agreementOptionsLoadingState = signal(false);
  private readonly replaceCategoryLoadingState = signal(false);
  private readonly correctCategoryLoadingState = signal(false);

  private agreementOptionsRequestId = 0;
  private replaceCategoryRequestId = 0;
  private correctCategoryRequestId = 0;

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
  protected readonly agreementOptions = computed(() =>
    this.withCurrentCodeOption(this.agreementOptionsState(), this.activeAgreementCode()),
  );
  protected readonly replaceCategoryOptions = computed(() =>
    this.withCurrentCodeOption(this.replaceCategoryOptionsState(), this.replaceDraftState().agreementCategoryCode),
  );
  protected readonly correctCategoryOptions = computed(() =>
    this.withCurrentCodeOption(this.correctCategoryOptionsState(), this.correctDraftState().agreementCategoryCode),
  );
  protected readonly agreementOptionsLoading = this.agreementOptionsLoadingState.asReadonly();
  protected readonly replaceCategoryLoading = this.replaceCategoryLoadingState.asReadonly();
  protected readonly correctCategoryLoading = this.correctCategoryLoadingState.asReadonly();
  protected readonly replaceCategoryDisabled = computed(
    () => this.normalizeRequiredValue(this.replaceDraftState().agreementCode).length === 0 || this.replaceCategoryLoadingState(),
  );
  protected readonly correctCategoryDisabled = computed(
    () => this.normalizeRequiredValue(this.correctDraftState().agreementCode).length === 0 || this.correctCategoryLoadingState(),
  );
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
        this.loadAgreementOptions(activeEmployeeKey?.ruleSystemCode ?? null);
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
    }, occurrence.startDate);
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
    const currentDraft = this.replaceDraftState();

    if (field === 'agreementCode') {
      const agreementChanged =
        this.normalizeRequiredValue(currentDraft.agreementCode) !== this.normalizeRequiredValue(value);

      this.replaceDraftState.set({
        ...currentDraft,
        agreementCode: value,
        agreementCategoryCode: agreementChanged ? '' : currentDraft.agreementCategoryCode,
      });

      if (agreementChanged) {
        this.loadReplaceCategoryOptions(value, currentDraft.effectiveDate, null);
      }

      this.clearInteractionFeedback();
      return;
    }

    if (field === 'effectiveDate') {
      this.replaceDraftState.set({
        ...currentDraft,
        effectiveDate: value,
      });

      if (this.normalizeRequiredValue(currentDraft.agreementCode).length > 0) {
        this.loadReplaceCategoryOptions(currentDraft.agreementCode, value, currentDraft.agreementCategoryCode);
      }

      this.clearInteractionFeedback();
      return;
    }

    this.replaceDraftState.set({
      ...currentDraft,
      [field]: value,
    });

    this.clearInteractionFeedback();
  }

  protected updateCorrectField(field: keyof LaborClassificationCorrectDraft, value: string): void {
    const currentDraft = this.correctDraftState();

    if (field === 'agreementCode') {
      const agreementChanged =
        this.normalizeRequiredValue(currentDraft.agreementCode) !== this.normalizeRequiredValue(value);

      this.correctDraftState.set({
        ...currentDraft,
        agreementCode: value,
        agreementCategoryCode: agreementChanged ? '' : currentDraft.agreementCategoryCode,
      });

      if (agreementChanged) {
        this.loadCorrectCategoryOptions(value, this.correctingOccurrence()?.startDate ?? null, null);
      }

      this.clearInteractionFeedback();
      return;
    }

    this.correctDraftState.set({
      ...currentDraft,
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
    this.replaceCategoryOptionsState.set([]);
    this.replaceCategoryLoadingState.set(false);
  }

  private enterCorrectingMode(rowKey: number, draft: LaborClassificationCorrectDraft, referenceDate: string): void {
    this.displayModeState.set('correcting');
    this.correctingKeyState.set(rowKey);
    this.confirmingCloseKeyState.set(null);
    this.replaceDraftState.set(createEmptyLaborClassificationReplaceDraft());
    this.correctDraftState.set(draft);
    this.closeDraftState.set(createEmptyLaborClassificationCloseDraft());
    this.loadCorrectCategoryOptions(draft.agreementCode, referenceDate, draft.agreementCategoryCode);
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
    this.replaceCategoryOptionsState.set([]);
    this.correctCategoryOptionsState.set([]);
    this.replaceCategoryLoadingState.set(false);
    this.correctCategoryLoadingState.set(false);
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

  private loadAgreementOptions(ruleSystemCode: string | null): void {
    const normalizedRuleSystemCode = ruleSystemCode?.trim() ?? '';

    if (!normalizedRuleSystemCode) {
      this.agreementOptionsRequestId += 1;
      this.agreementOptionsLoadingState.set(false);
      this.agreementOptionsState.set([]);
      return;
    }

    const requestId = ++this.agreementOptionsRequestId;
    this.agreementOptionsLoadingState.set(true);

    this.fieldCatalogService
      .loadLaborClassificationAgreementOptions(normalizedRuleSystemCode)
      .pipe(take(1))
      .subscribe((options) => {
        if (requestId !== this.agreementOptionsRequestId) {
          return;
        }

        this.agreementOptionsState.set(options);
        this.agreementOptionsLoadingState.set(false);
      });
  }

  private loadReplaceCategoryOptions(
    agreementCode: string | null,
    referenceDate: string | null,
    preferredCategoryCode: string | null,
  ): void {
    const normalizedAgreementCode = this.normalizeRequiredValue(agreementCode);

    if (!normalizedAgreementCode) {
      this.replaceCategoryRequestId += 1;
      this.replaceCategoryOptionsState.set([]);
      this.replaceCategoryLoadingState.set(false);
      this.replaceDraftState.update((draft) => ({
        ...draft,
        agreementCategoryCode: '',
      }));
      return;
    }

    const ruleSystemCode = this.employeeBusinessKey()?.ruleSystemCode?.trim() ?? '';
    if (!ruleSystemCode) {
      this.replaceCategoryRequestId += 1;
      this.replaceCategoryOptionsState.set([]);
      this.replaceCategoryLoadingState.set(false);
      return;
    }

    const requestId = ++this.replaceCategoryRequestId;
    this.replaceCategoryLoadingState.set(true);

    this.laborClassificationCatalogGateway
      .loadAgreementCategories(ruleSystemCode, normalizedAgreementCode, referenceDate)
      .pipe(take(1))
      .subscribe({
        next: (categories) => {
          if (requestId !== this.replaceCategoryRequestId) {
            return;
          }

          const options = this.toSlotOptions(categories);
          this.replaceCategoryOptionsState.set(options);
          this.replaceCategoryLoadingState.set(false);

          const effectiveCategory = this.resolveEffectiveCategoryCode(options, preferredCategoryCode);
          if (!effectiveCategory) {
            this.replaceDraftState.update((draft) => ({
              ...draft,
              agreementCategoryCode: '',
            }));
          }
        },
        error: () => {
          if (requestId !== this.replaceCategoryRequestId) {
            return;
          }

          this.replaceCategoryOptionsState.set([]);
          this.replaceCategoryLoadingState.set(false);
        },
      });
  }

  private loadCorrectCategoryOptions(
    agreementCode: string | null,
    referenceDate: string | null,
    preferredCategoryCode: string | null,
  ): void {
    const normalizedAgreementCode = this.normalizeRequiredValue(agreementCode);

    if (!normalizedAgreementCode) {
      this.correctCategoryRequestId += 1;
      this.correctCategoryOptionsState.set([]);
      this.correctCategoryLoadingState.set(false);
      this.correctDraftState.update((draft) => ({
        ...draft,
        agreementCategoryCode: '',
      }));
      return;
    }

    const ruleSystemCode = this.employeeBusinessKey()?.ruleSystemCode?.trim() ?? '';
    if (!ruleSystemCode) {
      this.correctCategoryRequestId += 1;
      this.correctCategoryOptionsState.set([]);
      this.correctCategoryLoadingState.set(false);
      return;
    }

    const requestId = ++this.correctCategoryRequestId;
    this.correctCategoryLoadingState.set(true);

    this.laborClassificationCatalogGateway
      .loadAgreementCategories(ruleSystemCode, normalizedAgreementCode, referenceDate)
      .pipe(take(1))
      .subscribe({
        next: (categories) => {
          if (requestId !== this.correctCategoryRequestId) {
            return;
          }

          const options = this.toSlotOptions(categories);
          this.correctCategoryOptionsState.set(options);
          this.correctCategoryLoadingState.set(false);

          const effectiveCategory = this.resolveEffectiveCategoryCode(options, preferredCategoryCode);
          if (!effectiveCategory) {
            this.correctDraftState.update((draft) => ({
              ...draft,
              agreementCategoryCode: '',
            }));
          }
        },
        error: () => {
          if (requestId !== this.correctCategoryRequestId) {
            return;
          }

          this.correctCategoryOptionsState.set([]);
          this.correctCategoryLoadingState.set(false);
        },
      });
  }

  private toSlotOptions(
    items: ReadonlyArray<EmployeeLaborClassificationCatalogItemModel>,
  ): ReadonlyArray<SlotKeyOption<string>> {
    return items.map((item) => ({
      value: item.code,
      label: item.label,
    }));
  }

  private resolveEffectiveCategoryCode(
    options: ReadonlyArray<SlotKeyOption<string>>,
    preferredCategoryCode: string | null,
  ): string | null {
    const normalizedPreferredCategoryCode = this.normalizeRequiredValue(preferredCategoryCode);
    if (!normalizedPreferredCategoryCode) {
      return null;
    }

    return options.some((option) => option.value === normalizedPreferredCategoryCode)
      ? normalizedPreferredCategoryCode
      : null;
  }

  private withCurrentCodeOption(
    options: ReadonlyArray<SlotKeyOption<string>>,
    currentCode: string,
  ): ReadonlyArray<SlotKeyOption<string>> {
    const normalizedCurrentCode = this.normalizeRequiredValue(currentCode);
    if (!normalizedCurrentCode) {
      return options;
    }

    if (options.some((option) => option.value === normalizedCurrentCode)) {
      return options;
    }

    return [{ value: normalizedCurrentCode, label: normalizedCurrentCode }, ...options];
  }

  private activeAgreementCode(): string {
    if (this.displayModeState() === 'correcting') {
      return this.correctDraftState().agreementCode;
    }

    return this.replaceDraftState().agreementCode;
  }

  private toRowKey(startDate: string): number {
    return Number(startDate.replaceAll('-', ''));
  }
}
