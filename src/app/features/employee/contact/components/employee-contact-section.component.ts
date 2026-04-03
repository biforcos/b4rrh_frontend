import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { take } from 'rxjs';

import { mapEmployeeContactModelToSlotRow } from '../../data-access/employee-contact-edit.mapper';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeContactStore } from '../../data-access/employee-contact.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeSectionShellComponent } from '../../shared/ui/section/employee-section-shell.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiSelectComponent } from '../../../../shared/ui/select/ui-select.component';
import {
  SlotDraft,
  SlotKeyOption,
} from '../../shared/ui/section/editable-slot-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';

interface ContactRowViewModel {
  key: string;
  typeLabel: string;
  value: string;
}

function createEmptyContactDraft(): SlotDraft<string> {
  return {
    key: null,
    value: '',
  };
}

@Component({
  selector: 'app-employee-contact-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeSectionShellComponent, UiButtonComponent, UiSelectComponent, InputTextModule],
  templateUrl: './employee-contact-section.component.html',
  styleUrl: './employee-contact-section.component.scss',
})
export class EmployeeContactSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly contactStore = inject(EmployeeContactStore);
  private readonly fieldCatalogService = inject(EmployeeFieldCatalogService);
  private readonly creatingState = signal(false);
  private readonly editingKeyState = signal<string | null>(null);
  private readonly deletingKeyState = signal<string | null>(null);
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly createDraftState = signal<SlotDraft<string>>(createEmptyContactDraft());
  private readonly editDraftValueState = signal('');
  private readonly availableContactTypeOptionsState = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  private readonly catalogLoadingState = signal(false);

  private catalogRequestId = 0;

  protected readonly texts = employeeTexts;
  protected readonly sectionTitle = this.texts.contactsSectionTitle;
  protected readonly sectionSubtitle = this.texts.contactsSectionSubtitle;
  protected readonly rows = computed<ReadonlyArray<ContactRowViewModel>>(() =>
    this.contactStore
      .contacts()
      .map((contact) => mapEmployeeContactModelToSlotRow(contact))
      .map((row) => ({
        key: row.key,
        typeLabel: row.keyLabel,
        value: row.value,
      }))
      .sort((left, right) => left.key.localeCompare(right.key)),
  );
  protected readonly hasRows = computed(() => this.rows().length > 0);
  protected readonly creating = this.creatingState.asReadonly();
  protected readonly createDraft = this.createDraftState.asReadonly();
  protected readonly editDraftValue = this.editDraftValueState.asReadonly();
  protected readonly availableContactTypeOptions = this.availableContactTypeOptionsState.asReadonly();
  protected readonly catalogOptionsLoading = this.catalogLoadingState.asReadonly();
  protected readonly editingKey = this.editingKeyState.asReadonly();
  protected readonly deletingKey = this.deletingKeyState.asReadonly();
  protected readonly canSaveCreate = computed(() => {
    const draft = this.createDraftState();
    return !!draft.key && draft.value.trim().length > 0;
  });
  protected readonly canSaveEdit = computed(() => this.editDraftValueState().trim().length > 0);
  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.contactStore.loading() || this.contactStore.mutating();

    return {
      mode: isBusy ? 'submitting' : this.resolveSectionMode(),
      dirty: this.creatingState() || this.editingKeyState() !== null,
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
        this.resetInteractionState();
      });
    });
  }

  protected startCreate(): void {
    if (!this.canStartInteraction()) {
      return;
    }

    this.clearInteractionFeedback();
    this.creatingState.set(true);
    this.editingKeyState.set(null);
    this.deletingKeyState.set(null);
    this.createDraftState.set(createEmptyContactDraft());
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
    this.creatingState.set(false);
    this.deletingKeyState.set(null);
    this.editingKeyState.set(row.key);
    this.editDraftValueState.set(row.value);
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
    this.creatingState.set(false);
    this.editingKeyState.set(null);
    this.deletingKeyState.set(row.key);
  }

  protected confirmDelete(contactTypeCode: string): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    this.clearLocalError();
    this.resetInteractionState();
    this.contactStore.deleteContact(activeEmployeeKey, contactTypeCode);
  }

  protected cancelCreate(): void {
    this.clearInteractionFeedback();
    this.resetInteractionState();
  }

  protected cancelEdit(): void {
    this.clearInteractionFeedback();
    this.resetInteractionState();
  }

  protected cancelDelete(): void {
    this.clearInteractionFeedback();
    this.resetInteractionState();
  }

  protected updateCreateDraftKey(contactTypeCode: string | null): void {
    this.createDraftState.update((draft) => ({
      ...draft,
      key: contactTypeCode,
    }));
    this.clearInteractionFeedback();
  }

  protected updateCreateDraftValue(contactValue: string): void {
    this.createDraftState.update((draft) => ({
      ...draft,
      value: contactValue,
    }));
    this.clearInteractionFeedback();
  }

  protected updateEditDraftValue(contactValue: string): void {
    this.editDraftValueState.set(contactValue);
    this.clearInteractionFeedback();
  }

  protected submitCreate(): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    const draft = this.createDraftState();
    if (!draft.key) {
      return;
    }

    if (!draft.value.trim()) {
      return;
    }

    const isDuplicateType = this.rows().some((row) => row.key === draft.key);
    if (isDuplicateType) {
      this.localErrorMessageState.set(this.texts.contactsSectionDuplicateTypeMessage);
      return;
    }

    this.clearLocalError();
    this.resetInteractionState();
    this.contactStore.createContact(activeEmployeeKey, draft);
  }

  protected submitEdit(contactTypeCode: string): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.contactStore.mutating()) {
      return;
    }

    const contactValue = this.editDraftValueState().trim();
    if (!contactValue) {
      return;
    }

    this.clearLocalError();
    this.resetInteractionState();
    this.contactStore.updateContact(activeEmployeeKey, contactTypeCode, {
      key: contactTypeCode,
      value: contactValue,
    });
  }

  private canStartInteraction(): boolean {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey) {
      return false;
    }

    return !this.contactStore.mutating();
  }

  private findRowByKey(contactTypeCode: string): ContactRowViewModel | null {
    return this.rows().find((row) => row.key === contactTypeCode) ?? null;
  }

  private resetInteractionState(): void {
    this.creatingState.set(false);
    this.editingKeyState.set(null);
    this.deletingKeyState.set(null);
    this.createDraftState.set(createEmptyContactDraft());
    this.editDraftValueState.set('');
  }

  private clearInteractionFeedback(): void {
    this.contactStore.clearFeedback();
    this.clearLocalError();
  }

  private clearLocalError(): void {
    this.localErrorMessageState.set(null);
  }

  private resolveSectionMode(): SectionMode {
    if (this.creatingState()) {
      return 'creating';
    }

    if (this.editingKeyState() !== null) {
      return 'editing';
    }

    if (this.deletingKeyState() !== null) {
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
      this.createDraftState.update((draft) => ({ ...draft, key: null }));
      return;
    }

    const requestId = ++this.catalogRequestId;
    this.catalogLoadingState.set(true);
    this.fieldCatalogService
      .loadContactTypeOptions(normalizedRuleSystemCode)
      .pipe(take(1))
      .subscribe({
        next: (options) => {
          if (requestId !== this.catalogRequestId) {
            return;
          }

          this.catalogLoadingState.set(false);
          this.availableContactTypeOptionsState.set(options);
          this.syncDraftKeyWithAvailableOptions(options);
        },
        error: () => {
          if (requestId !== this.catalogRequestId) {
            return;
          }

          this.catalogLoadingState.set(false);
          this.localErrorMessageState.set(this.texts.catalogLoadFailedMessage);
        },
      });
  }

  private syncDraftKeyWithAvailableOptions(options: ReadonlyArray<SlotKeyOption<string>>): void {
    const currentDraftKey = this.createDraftState().key;
    if (!currentDraftKey) {
      return;
    }

    const hasMatchingKey = options.some((option) => option.value === currentDraftKey);
    if (hasMatchingKey) {
      return;
    }

    this.createDraftState.update((draft) => ({
      ...draft,
      key: null,
    }));
  }
}
