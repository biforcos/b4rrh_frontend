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
  private readonly displayModeState = signal<SlotDisplayMode>('view');
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
  protected readonly displayMode = this.displayModeState.asReadonly();
  protected readonly draft = this.draftState.asReadonly();
  protected readonly editingKey = this.editingKeyState.asReadonly();
  protected readonly deletingKey = this.deletingKeyState.asReadonly();
  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.contactStore.loading() || this.contactStore.mutating();

    return {
      mode: isBusy ? 'submitting' : this.toSectionMode(this.displayModeState()),
      dirty: false,
      busy: isBusy,
      errorMessage: this.resolveErrorMessage(),
      successMessage: this.resolveSuccessMessage(),
    };
  });

  constructor() {
    effect(() => {
      const activeEmployeeKey = this.employeeKey();

      untracked(() => {
        this.contactStore.loadContacts(activeEmployeeKey);
        this.enterViewMode();
      });
    });
  }

  protected onManageStarted(): void {
    if (!this.canStartInteraction()) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected onManageExited(): void {
    this.clearInteractionFeedback();
    this.enterViewMode();
  }

  protected onCreateStarted(): void {
    if (!this.canStartInteraction()) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterCreateMode();
  }

  protected onEditStarted(contactTypeCode: string): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const row = this.findRowByKey(contactTypeCode);
    if (!row) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterEditMode(row);
  }

  protected onDeleteRequested(contactTypeCode: string): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const row = this.findRowByKey(contactTypeCode);
    if (!row) {
      return;
    }

    this.clearInteractionFeedback();
    this.enterDeleteConfirmMode(row.key);
  }

  protected onDeleteConfirmed(contactTypeCode: string): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.contactStore.deleteContact(activeEmployeeKey, contactTypeCode);
  }

  protected onCancelled(): void {
    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected onDraftKeyChanged(contactTypeCode: string | null): void {
    this.draftState.update((draft) => ({
      ...draft,
      key: contactTypeCode,
    }));
    this.clearInteractionFeedback();
  }

  protected onDraftValueChanged(contactValue: string): void {
    this.draftState.update((draft) => ({
      ...draft,
      value: contactValue,
    }));
    this.clearInteractionFeedback();
  }

  protected onCreateSubmitted(draft: SlotDraft<string>): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    if (!draft.key) {
      return;
    }

    const isDuplicateType = this.rows().some((row) => row.key === draft.key);
    if (isDuplicateType) {
      this.localErrorMessageState.set(this.texts.contactsSectionDuplicateTypeMessage);
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.contactStore.createContact(activeEmployeeKey, draft);
  }

  protected onEditSubmitted(submission: SlotEditSubmission<string>): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.contactStore.updateContact(activeEmployeeKey, submission.key, submission);
  }

  private canStartInteraction(): boolean {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey) {
      return false;
    }

    return !this.contactStore.mutating();
  }

  private findRowByKey(contactTypeCode: string): SlotRowViewModel<string> | null {
    return this.rows().find((row) => row.key === contactTypeCode) ?? null;
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

  private enterDeleteConfirmMode(contactTypeCode: string): void {
    this.displayModeState.set('confirmingDelete');
    this.editingKeyState.set(null);
    this.deletingKeyState.set(contactTypeCode);
    this.draftState.set(emptyDraft);
  }

  private clearInteractionFeedback(): void {
    this.contactStore.clearFeedback();
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
