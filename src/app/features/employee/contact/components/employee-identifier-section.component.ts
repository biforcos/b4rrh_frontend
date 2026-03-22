import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import { mapEmployeeIdentifierModelToSlotRow } from '../../data-access/employee-identifier-edit.mapper';
import { EmployeeIdentifierStore } from '../../data-access/employee-identifier.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeIdentifierModel } from '../../models/employee-identifier.model';
import { EditableSlotSectionComponent } from '../../shared/ui/section/editable-slot-section.component';
import {
  SlotDraft,
  SlotDisplayMode,
  SlotEditSubmission,
  SlotKeyOption,
  SlotRowViewModel,
  SlotSectionTexts,
} from '../../shared/ui/section/editable-slot-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';

const emptyDraft: SlotDraft<string> = {
  key: null,
  value: '',
};

@Component({
  selector: 'app-employee-identifier-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditableSlotSectionComponent],
  templateUrl: './employee-identifier-section.component.html',
})
export class EmployeeIdentifierSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly identifierStore = inject(EmployeeIdentifierStore);
  private readonly displayModeState = signal<SlotDisplayMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly editingKeyState = signal<string | null>(null);
  private readonly deletingKeyState = signal<string | null>(null);
  private readonly draftState = signal<SlotDraft<string>>(emptyDraft);

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
  protected readonly availableKeys = computed<ReadonlyArray<SlotKeyOption<string>>>(() => []);
  protected readonly displayMode = this.displayModeState.asReadonly();
  protected readonly draft = this.draftState.asReadonly();
  protected readonly editingKey = this.editingKeyState.asReadonly();
  protected readonly deletingKey = this.deletingKeyState.asReadonly();
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

  protected submitCreate(draft: SlotDraft<string>): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.identifierStore.mutating()) {
      return;
    }

    const normalizedTypeCode = this.normalizeIdentifierTypeCode(draft.key);
    if (!normalizedTypeCode) {
      return;
    }

    const isDuplicateType = this.rows().some((row) => row.key === normalizedTypeCode);
    if (isDuplicateType) {
      this.localErrorMessageState.set(this.texts.identifiersSectionDuplicateTypeMessage);
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.identifierStore.createIdentifier(activeEmployeeKey, {
      key: normalizedTypeCode,
      value: draft.value,
    });
  }

  protected submitEdit(submission: SlotEditSubmission<string>): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.identifierStore.mutating()) {
      return;
    }

    const sourceIdentifier = this.findIdentifierByTypeCode(submission.key);
    if (!sourceIdentifier) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.identifierStore.updateIdentifier(activeEmployeeKey, submission.key, submission, sourceIdentifier);
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
    this.draftState.set(emptyDraft);
  }

  private enterEditMode(row: SlotRowViewModel<string>): void {
    this.displayModeState.set('editing');
    this.editingKeyState.set(row.key);
    this.deletingKeyState.set(null);
    this.draftState.set({
      key: row.key,
      value: row.value,
    });
  }

  private enterDeleteConfirmMode(identifierTypeCode: string): void {
    this.displayModeState.set('confirmingDelete');
    this.editingKeyState.set(null);
    this.deletingKeyState.set(identifierTypeCode);
    this.draftState.set(emptyDraft);
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
    this.draftState.set(emptyDraft);
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
}
