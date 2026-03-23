import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { take } from 'rxjs';

import {
  IdentifierDraft,
  createEmptyIdentifierDraft,
  mapEmployeeIdentifierModelToSlotRow,
} from '../../data-access/employee-identifier-edit.mapper';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeIdentifierStore } from '../../data-access/employee-identifier.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeIdentifierModel } from '../../models/employee-identifier.model';
import { EditableSlotSectionComponent } from '../../shared/ui/section/editable-slot-section.component';
import { isValidSpanishDni } from '../../shared/utils/spanish-dni.util';
import {
  SlotDraft,
  SlotDisplayMode,
  SlotKeyOption,
  SlotRowViewModel,
  SlotSectionTexts,
} from '../../shared/ui/section/editable-slot-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';

@Component({
  selector: 'app-employee-identifier-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditableSlotSectionComponent],
  templateUrl: './employee-identifier-section.component.html',
  styleUrl: './employee-identifier-section.component.scss',
})
export class EmployeeIdentifierSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly identifierStore = inject(EmployeeIdentifierStore);
  private readonly fieldCatalogService = inject(EmployeeFieldCatalogService);
  private readonly displayModeState = signal<SlotDisplayMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly editingKeyState = signal<string | null>(null);
  private readonly deletingKeyState = signal<string | null>(null);
  private readonly draftState = signal<IdentifierDraft>(createEmptyIdentifierDraft());
  private readonly availableKeysState = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  private readonly catalogLoadingState = signal(false);

  private catalogRequestId = 0;

  protected readonly texts = employeeTexts;
  protected readonly sectionSubtitle = this.texts.identifiersSectionSubtitle;
  protected readonly slotTexts: SlotSectionTexts = {
    manageAction: this.texts.identifiersSectionManageAction,
    exitManageAction: this.texts.identifiersSectionExitManageAction,
    addAction: this.texts.identifiersSectionAddAction,
    editAction: this.texts.identifiersSectionEditAction,
    deleteAction: this.texts.identifiersSectionDeleteAction,
    cancelAction: this.texts.identifiersSectionCancelAction,
    saveCreateAction: this.texts.identifiersSectionSaveCreateAction,
    saveEditAction: this.texts.identifiersSectionSaveEditAction,
    confirmDeleteMessage: this.texts.identifiersSectionConfirmDeleteMessage,
    confirmDeleteAction: this.texts.identifiersSectionConfirmDeleteAction,
    emptyMessage: this.texts.identifiersSectionEmptyMessage,
    keyFieldLabel: this.texts.identifiersSectionKeyFieldLabel,
    valueFieldLabel: this.texts.identifiersSectionValueFieldLabel,
  };
  protected readonly rows = computed<ReadonlyArray<SlotRowViewModel<string>>>(() =>
    this.identifierStore
      .identifiers()
      .map((identifier) =>
        mapEmployeeIdentifierModelToSlotRow(identifier, {
          primaryBadge: this.texts.identifiersSectionPrimaryBadge,
          expirationPrefix: this.texts.identifiersSectionExpirationPrefix,
        }),
      )
      .sort((left, right) => left.key.localeCompare(right.key)),
  );
  protected readonly availableKeys = this.availableKeysState.asReadonly();
  protected readonly catalogOptionsLoading = this.catalogLoadingState.asReadonly();
  protected readonly displayMode = this.displayModeState.asReadonly();
  protected readonly draft = this.draftState.asReadonly();
  protected readonly slotDraft = computed<SlotDraft<string>>(() => {
    const draft = this.draftState();

    return {
      key: draft.key,
      value: draft.value,
    };
  });
  protected readonly editingKey = this.editingKeyState.asReadonly();
  protected readonly deletingKey = this.deletingKeyState.asReadonly();
  protected readonly shouldValidateDni = computed(() => this.isDniValidationApplicable(this.draftState()));
  protected readonly isDniInvalid = computed(() => {
    if (!this.shouldValidateDni()) {
      return false;
    }

    const normalizedValue = this.draftState().value.trim();
    if (normalizedValue.length === 0) {
      return false;
    }

    return !isValidSpanishDni(normalizedValue);
  });
  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.identifierStore.loading() || this.identifierStore.mutating();

    return {
      mode: isBusy ? 'submitting' : this.toSectionMode(this.displayModeState()),
      dirty: this.displayModeState() === 'creating' || this.displayModeState() === 'editing',
      busy: isBusy,
      errorMessage: this.resolveErrorMessage(),
      successMessage: this.resolveSuccessMessage(),
    };
  });

  constructor() {
    effect(() => {
      const activeEmployeeKey = this.employeeKey();

      untracked(() => {
        this.identifierStore.loadIdentifiers(activeEmployeeKey);
        this.loadCatalogOptions(activeEmployeeKey?.ruleSystemCode ?? null);
        this.enterViewMode();
      });
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

  protected startEdit(identifierTypeCode: string): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const row = this.findRowByKey(identifierTypeCode);
    if (!row) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterEditMode(row);
  }

  protected requestDelete(identifierTypeCode: string): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const row = this.findRowByKey(identifierTypeCode);
    if (!row) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterDeleteConfirmMode(row.key);
  }

  protected confirmDelete(identifierTypeCode: string): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.identifierStore.mutating()) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.identifierStore.deleteIdentifier(activeEmployeeKey, identifierTypeCode);
  }

  protected cancel(): void {
    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected updateDraftKey(identifierTypeCode: string | null): void {
    this.draftState.update((draft) => ({
      ...draft,
      key: identifierTypeCode,
    }));
    this.clearInteractionFeedback();
  }

  protected updateDraftValue(identifierValue: string): void {
    this.draftState.update((draft) => ({
      ...draft,
      value: identifierValue,
    }));
    this.clearInteractionFeedback();
  }

  protected updateDraftIssuingCountryCode(issuingCountryCode: string): void {
    this.draftState.update((draft) => ({
      ...draft,
      issuingCountryCode,
    }));
    this.clearInteractionFeedback();
  }

  protected updateDraftExpirationDate(expirationDate: string): void {
    this.draftState.update((draft) => ({
      ...draft,
      expirationDate,
    }));
    this.clearInteractionFeedback();
  }

  protected updateDraftIsPrimary(isPrimary: boolean): void {
    this.draftState.update((draft) => ({
      ...draft,
      isPrimary,
    }));
    this.clearInteractionFeedback();
  }

  protected submitCreate(): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.identifierStore.mutating()) {
      return;
    }

    const draft = this.draftState();
    const normalizedTypeCode = this.normalizeIdentifierTypeCode(draft.key);
    if (!normalizedTypeCode) {
      return;
    }

    const isDuplicateType = this.rows().some((row) => row.key === normalizedTypeCode);
    if (isDuplicateType) {
      this.localErrorMessageState.set(this.texts.identifiersSectionDuplicateTypeMessage);
      return;
    }

    if (!this.validateDraftDniForCurrentContext(draft)) {
      return;
    }

    this.clearLocalError();
    this.identifierStore.createIdentifier(activeEmployeeKey, {
      ...draft,
      key: normalizedTypeCode,
    });
    this.enterManageMode();
  }

  protected submitEdit(): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.identifierStore.mutating()) {
      return;
    }

    const draft = this.draftState();
    const normalizedTypeCode = this.normalizeIdentifierTypeCode(draft.key);
    if (!normalizedTypeCode) {
      return;
    }

    if (!this.findIdentifierByTypeCode(normalizedTypeCode)) {
      return;
    }

    if (!this.validateDraftDniForCurrentContext(draft)) {
      return;
    }

    this.clearLocalError();
    this.identifierStore.updateIdentifier(activeEmployeeKey, normalizedTypeCode, {
      ...draft,
      key: normalizedTypeCode,
    });
    this.enterManageMode();
  }

  private canStartInteraction(): boolean {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey) {
      return false;
    }

    return !this.identifierStore.mutating();
  }

  private findRowByKey(identifierTypeCode: string): SlotRowViewModel<string> | null {
    const normalizedTypeCode = this.normalizeIdentifierTypeCode(identifierTypeCode);
    return this.rows().find((row) => row.key === normalizedTypeCode) ?? null;
  }

  private findIdentifierByTypeCode(identifierTypeCode: string): EmployeeIdentifierModel | null {
    const normalizedTypeCode = this.normalizeIdentifierTypeCode(identifierTypeCode);
    return this.identifierStore.identifiers().find((identifier) => identifier.typeCode === normalizedTypeCode) ?? null;
  }

  private normalizeIdentifierTypeCode(identifierTypeCode: string | null): string {
    return identifierTypeCode?.trim().toUpperCase() ?? '';
  }

  private validateDraftDniForCurrentContext(draft: IdentifierDraft): boolean {
    if (!this.isDniValidationApplicable(draft)) {
      return true;
    }

    if (isValidSpanishDni(draft.value)) {
      return true;
    }

    this.localErrorMessageState.set(this.texts.identifiersSectionInvalidDniMessage);
    return false;
  }

  private isDniValidationApplicable(draft: IdentifierDraft): boolean {
    const identifierTypeCode = this.normalizeIdentifierTypeCode(draft.key);
    const issuingCountryCode = (draft.issuingCountryCode ?? '').trim().toUpperCase();

    return identifierTypeCode === 'NATIONAL_ID' && issuingCountryCode === 'ESP';
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
    this.editingKeyState.set(null);
    this.deletingKeyState.set(null);
    this.draftState.set(createEmptyIdentifierDraft());
  }

  private enterEditMode(row: SlotRowViewModel<string>): void {
    const sourceIdentifier = this.findIdentifierByTypeCode(row.key);
    if (!sourceIdentifier) {
      return;
    }

    this.displayModeState.set('editing');
    this.editingKeyState.set(row.key);
    this.deletingKeyState.set(null);
    this.draftState.set({
      key: sourceIdentifier.typeCode,
      value: sourceIdentifier.value,
      issuingCountryCode: sourceIdentifier.issuingCountryCode ?? '',
      expirationDate: sourceIdentifier.expirationDate ?? '',
      isPrimary: sourceIdentifier.isPrimary,
    });
  }

  private enterDeleteConfirmMode(identifierTypeCode: string): void {
    this.displayModeState.set('confirmingDelete');
    this.editingKeyState.set(null);
    this.deletingKeyState.set(identifierTypeCode);
    this.draftState.set(createEmptyIdentifierDraft());
  }

  private clearInteractionFeedback(): void {
    this.identifierStore.clearFeedback();
    this.clearLocalError();
  }

  private clearLocalError(): void {
    this.localErrorMessageState.set(null);
  }

  private resetOperationContext(): void {
    this.editingKeyState.set(null);
    this.deletingKeyState.set(null);
    this.draftState.set(createEmptyIdentifierDraft());
  }

  private toSectionMode(displayMode: SlotDisplayMode): SectionMode {
    if (displayMode === 'creating') {
      return 'creating';
    }

    if (displayMode === 'editing') {
      return 'editing';
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

    if (this.identifierStore.error() === 'request-failed') {
      return this.texts.identifiersSectionRequestFailedMessage;
    }

    return null;
  }

  private resolveSuccessMessage(): string | null {
    const successCode = this.identifierStore.success();

    if (successCode === 'created') {
      return this.texts.identifiersSectionCreateSuccessMessage;
    }

    if (successCode === 'updated') {
      return this.texts.identifiersSectionEditSuccessMessage;
    }

    if (successCode === 'deleted') {
      return this.texts.identifiersSectionDeleteSuccessMessage;
    }

    return null;
  }

  private loadCatalogOptions(ruleSystemCode: string | null): void {
    const normalizedRuleSystemCode = ruleSystemCode?.trim() ?? '';

    if (!normalizedRuleSystemCode) {
      this.catalogRequestId += 1;
      this.catalogLoadingState.set(false);
      this.availableKeysState.set([]);
      this.draftState.update((draft) => ({
        ...draft,
        key: null,
      }));
      return;
    }

    const requestId = ++this.catalogRequestId;
    this.catalogLoadingState.set(true);
    this.fieldCatalogService
      .loadIdentifierTypeOptions(normalizedRuleSystemCode)
      .pipe(take(1))
      .subscribe((options) => {
        if (requestId !== this.catalogRequestId) {
          return;
        }

        this.catalogLoadingState.set(false);
        this.availableKeysState.set(options);
        this.syncDraftKeyWithAvailableOptions(options);
      });
  }

  private syncDraftKeyWithAvailableOptions(options: ReadonlyArray<SlotKeyOption<string>>): void {
    const currentDraftKey = this.draftState().key;
    if (!currentDraftKey) {
      return;
    }

    const hasMatchingKey = options.some((option) => option.value === currentDraftKey);
    if (hasMatchingKey) {
      return;
    }

    this.draftState.update((draft) => ({
      ...draft,
      key: null,
    }));
  }
}
