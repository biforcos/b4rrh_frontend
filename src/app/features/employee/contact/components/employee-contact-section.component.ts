import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import { mapEmployeeContactModelToSlotRow } from '../../data-access/employee-contact-edit.mapper';
import { EmployeeContactStore } from '../../data-access/employee-contact.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import {
  EditableSlotSectionComponent,
} from '../../shared/ui/section/editable-slot-section.component';
import {
  SlotDraft,
  SlotDisplayMode,
  SlotEditSubmission,
  SlotKeyOption,
  SlotSectionTexts,
  SlotRowViewModel,
} from '../../shared/ui/section/editable-slot-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';

const emptyDraft: SlotDraft<string> = {
  key: null,
  value: '',
};

@Component({
  selector: 'app-employee-contact-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditableSlotSectionComponent],
  template: `
    <app-editable-slot-section
      [title]="texts.contactsSectionTitle"
      [subtitle]="null"
      [state]="sectionState()"
      [displayMode]="displayMode()"
      [rows]="rows()"
      [texts]="slotTexts"
      [draft]="draft()"
      [editingKey]="editingKey()"
      [deletingKey]="deletingKey()"
      [availableKeys]="availableKeys()"
      [canCreate]="true"
      [canEdit]="true"
      [canDelete]="true"
      (manageStarted)="onManageStarted()"
      (manageExited)="onManageExited()"
      (createStarted)="onCreateStarted()"
      (editStarted)="onEditStarted($event)"
      (deleteRequested)="onDeleteRequested($event)"
      (deleteConfirmed)="onDeleteConfirmed($event)"
      (cancelled)="onCancelled()"
      (draftKeyChanged)="onDraftKeyChanged($event)"
      (draftValueChanged)="onDraftValueChanged($event)"
      (createSubmitted)="onCreateSubmitted($event)"
      (editSubmitted)="onEditSubmitted($event)"
    />
  `,
})
export class EmployeeContactSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly contactStore = inject(EmployeeContactStore);
  private readonly manageModeActiveState = signal(false);
  private readonly modeState = signal<SectionMode>('view');
  private readonly dirtyState = signal(false);
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly editingKeyState = signal<string | null>(null);
  private readonly deletingKeyState = signal<string | null>(null);
  private readonly draftState = signal<SlotDraft<string>>(emptyDraft);

  protected readonly texts = employeeTexts;
  protected readonly slotTexts: SlotSectionTexts = {
    manageAction: this.texts.contactsSectionManageAction,
    exitManageAction: this.texts.contactsSectionExitManageAction,
    addAction: this.texts.contactsSectionAddAction,
    editAction: this.texts.contactsSectionEditAction,
    deleteAction: this.texts.contactsSectionDeleteAction,
    cancelAction: this.texts.contactsSectionCancelAction,
    saveCreateAction: this.texts.contactsSectionSaveCreateAction,
    saveEditAction: this.texts.contactsSectionSaveEditAction,
    confirmDeleteMessage: this.texts.contactsSectionConfirmDeleteMessage,
    confirmDeleteAction: this.texts.contactsSectionConfirmDeleteAction,
    emptyMessage: this.texts.contactsSectionEmptyMessage,
    keyFieldLabel: this.texts.contactsSectionKeyFieldLabel,
    valueFieldLabel: this.texts.contactsSectionValueFieldLabel,
  };
  protected readonly rows = computed<ReadonlyArray<SlotRowViewModel<string>>>(() =>
    this.contactStore
      .contacts()
      .map((contact) => mapEmployeeContactModelToSlotRow(contact))
      .sort((left, right) => left.key.localeCompare(right.key)),
  );
  protected readonly availableKeys = computed<ReadonlyArray<SlotKeyOption<string>>>(() => []);
  protected readonly displayMode = computed<SlotDisplayMode>(() => {
    const mode = this.modeState();

    if (mode === 'creating') {
      return 'creating';
    }

    if (mode === 'editing') {
      return 'editing';
    }

    if (mode === 'confirming') {
      return 'confirmingDelete';
    }

    return this.manageModeActiveState() ? 'manage' : 'view';
  });
  protected readonly draft = this.draftState.asReadonly();
  protected readonly editingKey = this.editingKeyState.asReadonly();
  protected readonly deletingKey = this.deletingKeyState.asReadonly();
  protected readonly sectionState = computed<SectionUiState>(() => ({
    mode: this.modeState(),
    dirty: this.dirtyState(),
    busy: this.contactStore.loading() || this.contactStore.mutating(),
    errorMessage: this.resolveErrorMessage(),
    successMessage: this.resolveSuccessMessage(),
  }));

  constructor() {
    effect(() => {
      const activeEmployeeKey = this.employeeKey();

      untracked(() => {
        this.contactStore.loadContacts(activeEmployeeKey);
        this.resetAllUi();
      });
    });

    effect(() => {
      if (this.contactStore.mutating()) {
        return;
      }

      if (this.modeState() === 'submitting') {
        this.resetOperationUi();
      }
    });
  }

  protected onManageStarted(): void {
    if (!this.canEditData()) {
      return;
    }

    this.clearInteractionFeedback();
    this.manageModeActiveState.set(true);
    this.resetOperationUi();
  }

  protected onManageExited(): void {
    this.clearInteractionFeedback();
    this.manageModeActiveState.set(false);
    this.resetOperationUi();
  }

  protected onCreateStarted(): void {
    if (!this.canEditData()) {
      return;
    }

    this.clearInteractionFeedback();
    this.manageModeActiveState.set(true);
    this.modeState.set('creating');
    this.dirtyState.set(false);
    this.editingKeyState.set(null);
    this.deletingKeyState.set(null);
    this.draftState.set(emptyDraft);
  }

  protected onEditStarted(contactTypeCode: string): void {
    if (!this.canEditData()) {
      return;
    }

    const row = this.rows().find((item) => item.key === contactTypeCode);
    if (!row) {
      return;
    }

    this.clearInteractionFeedback();
    this.manageModeActiveState.set(true);
    this.modeState.set('editing');
    this.dirtyState.set(false);
    this.editingKeyState.set(row.key);
    this.deletingKeyState.set(null);
    this.draftState.set({
      key: row.key,
      value: row.value,
    });
  }

  protected onDeleteRequested(contactTypeCode: string): void {
    if (!this.canEditData()) {
      return;
    }

    const row = this.rows().find((item) => item.key === contactTypeCode);
    if (!row) {
      return;
    }

    this.clearInteractionFeedback();
    this.manageModeActiveState.set(true);
    this.modeState.set('confirming');
    this.dirtyState.set(false);
    this.editingKeyState.set(null);
    this.deletingKeyState.set(row.key);
    this.draftState.set(emptyDraft);
  }

  protected onDeleteConfirmed(contactTypeCode: string): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    this.modeState.set('submitting');
    this.localErrorMessageState.set(null);
    this.contactStore.deleteContact(activeEmployeeKey, contactTypeCode);
  }

  protected onCancelled(): void {
    this.clearInteractionFeedback();
    this.manageModeActiveState.set(true);
    this.resetOperationUi();
  }

  protected onDraftKeyChanged(contactTypeCode: string | null): void {
    this.draftState.update((draft) => ({
      ...draft,
      key: contactTypeCode,
    }));
    this.contactStore.clearFeedback();
    this.dirtyState.set(true);
    this.localErrorMessageState.set(null);
  }

  protected onDraftValueChanged(contactValue: string): void {
    this.draftState.update((draft) => ({
      ...draft,
      value: contactValue,
    }));
    this.contactStore.clearFeedback();
    this.dirtyState.set(true);
    this.localErrorMessageState.set(null);
  }

  protected onCreateSubmitted(draft: SlotDraft<string>): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    const normalizedDraft = {
      key: draft.key?.trim() ?? null,
      value: draft.value.trim(),
    };
    if (!normalizedDraft.key || !normalizedDraft.value) {
      return;
    }

    const isDuplicateType = this.rows().some((row) => row.key === normalizedDraft.key);
    if (isDuplicateType) {
      this.localErrorMessageState.set(this.texts.contactsSectionDuplicateTypeMessage);
      return;
    }

    this.modeState.set('submitting');
    this.dirtyState.set(false);
    this.localErrorMessageState.set(null);
    this.draftState.set(normalizedDraft);
    this.contactStore.createContact(activeEmployeeKey, normalizedDraft);
  }

  protected onEditSubmitted(submission: SlotEditSubmission<string>): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    const normalizedValue = submission.value.trim();
    if (!normalizedValue) {
      return;
    }

    const normalizedDraft: SlotDraft<string> = {
      key: submission.key,
      value: normalizedValue,
    };

    this.modeState.set('submitting');
    this.dirtyState.set(false);
    this.localErrorMessageState.set(null);
    this.draftState.set(normalizedDraft);
    this.contactStore.updateContact(activeEmployeeKey, submission.key, normalizedDraft);
  }

  private canEditData(): boolean {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey) {
      return false;
    }

    return !this.contactStore.mutating();
  }

  private clearInteractionFeedback(): void {
    this.contactStore.clearFeedback();
    this.localErrorMessageState.set(null);
  }

  private resetOperationUi(): void {
    this.modeState.set('view');
    this.dirtyState.set(false);
    this.localErrorMessageState.set(null);
    this.editingKeyState.set(null);
    this.deletingKeyState.set(null);
    this.draftState.set(emptyDraft);
  }

  private resetAllUi(): void {
    this.manageModeActiveState.set(false);
    this.resetOperationUi();
  }

  private resolveErrorMessage(): string | null {
    if (this.localErrorMessageState()) {
      return this.localErrorMessageState();
    }

    if (this.contactStore.error() === 'request-failed') {
      return this.texts.contactsSectionRequestFailedMessage;
    }

    return null;
  }

  private resolveSuccessMessage(): string | null {
    const successCode = this.contactStore.success();

    if (successCode === 'created') {
      return this.texts.contactsSectionCreateSuccessMessage;
    }

    if (successCode === 'updated') {
      return this.texts.contactsSectionEditSuccessMessage;
    }

    if (successCode === 'deleted') {
      return this.texts.contactsSectionDeleteSuccessMessage;
    }

    return null;
  }
}
