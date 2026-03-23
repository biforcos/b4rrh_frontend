import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { take } from 'rxjs';

import { mapEmployeeContactModelToSlotRow } from '../../data-access/employee-contact-edit.mapper';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeContactStore } from '../../data-access/employee-contact.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import {
  EditableSlotSectionComponent,
} from '../../shared/ui/section/editable-slot-section.component';
import {
  SlotDraft,
  SlotDisplayMode,
  SlotKeyOption,
  SlotEditSubmission,
  SlotSectionTexts,
  SlotRowViewModel,
} from '../../shared/ui/section/editable-slot-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';

const sectionSubtitle = 'Un contacto por tipo. El tipo no se puede modificar una vez creado.';

function createEmptyContactDraft(): SlotDraft<string> {
  return {
    key: null,
    value: '',
  };
}

@Component({
  selector: 'app-employee-contact-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditableSlotSectionComponent],
  templateUrl: './employee-contact-section.component.html',
  styleUrl: './employee-contact-section.component.scss',
})
export class EmployeeContactSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly contactStore = inject(EmployeeContactStore);
  private readonly fieldCatalogService = inject(EmployeeFieldCatalogService);
  private readonly displayModeState = signal<SlotDisplayMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly editingKeyState = signal<string | null>(null);
  private readonly deletingKeyState = signal<string | null>(null);
  private readonly draftState = signal<SlotDraft<string>>(createEmptyContactDraft());
  private readonly availableContactTypeOptionsState = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  private readonly catalogLoadingState = signal(false);

  private catalogRequestId = 0;

  protected readonly texts = employeeTexts;
  protected readonly slotTexts: SlotSectionTexts = {
    manageAction: 'Gestionar contactos',
    exitManageAction: 'Salir',
    addAction: 'Agregar contacto',
    editAction: this.texts.contactsSectionEditAction,
    deleteAction: this.texts.contactsSectionDeleteAction,
    cancelAction: this.texts.contactsSectionCancelAction,
    saveCreateAction: 'Guardar',
    saveEditAction: 'Guardar',
    confirmDeleteMessage: this.texts.contactsSectionConfirmDeleteMessage,
    confirmDeleteAction: this.texts.contactsSectionConfirmDeleteAction,
    emptyMessage: this.texts.contactsSectionEmptyMessage,
    keyFieldLabel: this.texts.contactsSectionKeyFieldLabel,
    valueFieldLabel: this.texts.contactsSectionValueFieldLabel,
  };
  protected readonly sectionSubtitle = sectionSubtitle;
  protected readonly rows = computed<ReadonlyArray<SlotRowViewModel<string>>>(() =>
    this.contactStore
      .contacts()
      .map((contact) => mapEmployeeContactModelToSlotRow(contact))
      .sort((left, right) => left.key.localeCompare(right.key)),
  );
  protected readonly displayMode = this.displayModeState.asReadonly();
  protected readonly draft = this.draftState.asReadonly();
  protected readonly availableContactTypeOptions = this.availableContactTypeOptionsState.asReadonly();
  protected readonly catalogOptionsLoading = this.catalogLoadingState.asReadonly();
  protected readonly editingKey = this.editingKeyState.asReadonly();
  protected readonly deletingKey = this.deletingKeyState.asReadonly();
  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.contactStore.loading() || this.contactStore.mutating();

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
        this.contactStore.loadContacts(activeEmployeeKey);
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

  protected startEdit(contactTypeCode: string): void {
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

  protected requestDelete(contactTypeCode: string): void {
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

  protected confirmDelete(contactTypeCode: string): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.contactStore.deleteContact(activeEmployeeKey, contactTypeCode);
  }

  protected cancel(): void {
    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected updateDraftKey(contactTypeCode: string | null): void {
    this.draftState.update((draft) => ({
      ...draft,
      key: contactTypeCode,
    }));
    this.clearInteractionFeedback();
  }

  protected updateDraftValue(contactValue: string): void {
    this.draftState.update((draft) => ({
      ...draft,
      value: contactValue,
    }));
    this.clearInteractionFeedback();
  }

  protected submitCreate(draft: SlotDraft<string>): void {
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

  protected submitEdit(submission: SlotEditSubmission<string>): void {
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
    this.draftState.set(createEmptyContactDraft());
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
    this.draftState.set(createEmptyContactDraft());
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
    this.draftState.set(createEmptyContactDraft());
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

  private loadCatalogOptions(ruleSystemCode: string | null): void {
    const normalizedRuleSystemCode = ruleSystemCode?.trim() ?? '';

    if (!normalizedRuleSystemCode) {
      this.catalogRequestId += 1;
      this.catalogLoadingState.set(false);
      this.availableContactTypeOptionsState.set([]);
      this.draftState.update((draft) => ({ ...draft, key: null }));
      return;
    }

    const requestId = ++this.catalogRequestId;
    this.catalogLoadingState.set(true);
    this.fieldCatalogService
      .loadContactTypeOptions(normalizedRuleSystemCode)
      .pipe(take(1))
      .subscribe((options) => {
        if (requestId !== this.catalogRequestId) {
          return;
        }

        this.catalogLoadingState.set(false);
        this.availableContactTypeOptionsState.set(options);
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
