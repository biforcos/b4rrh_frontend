import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { take } from 'rxjs';

import {
  AddressCreateDraft,
  AddressEditCurrentDraft,
  mapEmployeeAddressModelToTemporalRow,
} from '../../data-access/employee-address-edit.mapper';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeAddressStore } from '../../data-access/employee-address.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeSectionShellComponent } from '../../shared/ui/section/employee-section-shell.component';
import { SlotKeyOption } from '../../shared/ui/section/editable-slot-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';

type AddressInteractionMode = 'view' | 'creating' | 'editingCurrent' | 'confirmingClose';

interface AddressRowViewModel {
  key: number;
  title: string;
  titleSecondary: string | null;
  subtitle: string | null;
  detailText: string | null;
  periodText: string | null;
  statusLabel: string | null;
  isCurrent: boolean;
  closeable: boolean;
}

function createEmptyAddressCreateDraft(): AddressCreateDraft {
  return {
    addressTypeCode: '',
    street: '',
    city: '',
    countryCode: '',
    postalCode: '',
    regionCode: '',
    startDate: '',
  };
}

function createEmptyAddressEditCurrentDraft(): AddressEditCurrentDraft {
  return {
    street: '',
    city: '',
    countryCode: '',
    postalCode: '',
    regionCode: '',
  };
}

@Component({
  selector: 'app-employee-address-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeSectionShellComponent],
  templateUrl: './employee-address-section.component.html',
  styleUrl: './employee-address-section.component.scss',
})
export class EmployeeAddressSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly addressStore = inject(EmployeeAddressStore);
  private readonly fieldCatalogService = inject(EmployeeFieldCatalogService);
  private readonly modeState = signal<AddressInteractionMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly confirmingCloseKeyState = signal<number | null>(null);
  private readonly editingCurrentKeyState = signal<number | null>(null);
  private readonly createDraftState = signal<AddressCreateDraft>(createEmptyAddressCreateDraft());
  private readonly editCurrentDraftState = signal<AddressEditCurrentDraft>(createEmptyAddressEditCurrentDraft());
  private readonly availableAddressTypeOptionsState = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  private readonly catalogLoadingState = signal(false);

  private catalogRequestId = 0;

  protected readonly texts = employeeTexts;
  protected readonly sectionTitle = this.texts.addressesSectionTitle;
  protected readonly sectionSubtitle = this.texts.addressesSectionSubtitle;
  protected readonly rows = computed<ReadonlyArray<AddressRowViewModel>>(() =>
    [...this.addressStore.addresses()]
      .sort((left, right) => this.compareAddressOrder(left, right))
      .map((address) =>
        mapEmployeeAddressModelToTemporalRow(address, {
          currentStatus: this.texts.addressesSectionCurrentStatus,
          closedStatus: this.texts.addressesSectionClosedStatus,
          currentPeriodLabel: this.texts.addressesSectionCurrentPeriodLabel,
        }),
      )
      .map((row) => ({
        key: row.key,
        title: row.title,
        titleSecondary: row.titleSecondary ?? null,
        subtitle: row.subtitle ?? null,
        detailText: row.detailText ?? null,
        periodText: row.periodText ?? null,
        statusLabel: row.statusLabel ?? null,
        isCurrent: row.isCurrent === true,
        closeable: row.closeable === true,
      })),
  );
  protected readonly currentAddresses = computed(() => this.rows().filter((row) => row.isCurrent === true));
  protected readonly historicalAddresses = computed(() => this.rows().filter((row) => row.isCurrent === false));
  protected readonly hasCurrentAddresses = computed(() => this.currentAddresses().length > 0);
  protected readonly hasHistoricalAddresses = computed(() => this.historicalAddresses().length > 0);
  protected readonly creating = computed(() => this.modeState() === 'creating');
  protected readonly editingCurrent = computed(() => this.modeState() === 'editingCurrent');
  protected readonly confirmingClose = computed(() => this.modeState() === 'confirmingClose');
  protected readonly confirmingCloseKey = this.confirmingCloseKeyState.asReadonly();
  protected readonly editingCurrentKey = this.editingCurrentKeyState.asReadonly();
  protected readonly createDraft = this.createDraftState.asReadonly();
  protected readonly editCurrentDraft = this.editCurrentDraftState.asReadonly();
  protected readonly availableAddressTypeOptions = this.availableAddressTypeOptionsState.asReadonly();
  protected readonly catalogOptionsLoading = this.catalogLoadingState.asReadonly();
  protected readonly canSaveCreate = computed(() => {
    const draft = this.createDraftState();

    return (
      this.normalizeRequiredValue(draft.addressTypeCode).length > 0 &&
      this.normalizeRequiredValue(draft.street).length > 0 &&
      this.normalizeRequiredValue(draft.city).length > 0 &&
      this.normalizeRequiredValue(draft.countryCode).length > 0 &&
      this.normalizeRequiredValue(draft.startDate).length > 0
    );
  });
  protected readonly canSaveEditCurrent = computed(() => {
    const draft = this.editCurrentDraftState();

    return (
      this.normalizeRequiredValue(draft.street).length > 0 &&
      this.normalizeRequiredValue(draft.city).length > 0 &&
      this.normalizeRequiredValue(draft.countryCode).length > 0
    );
  });
  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.addressStore.loading() || this.addressStore.mutating();

    return {
      mode: isBusy ? 'submitting' : this.toSectionMode(this.modeState()),
      dirty: this.modeState() === 'creating' || this.modeState() === 'editingCurrent',
      busy: isBusy,
      errorMessage: this.resolveErrorMessage(),
      successMessage: this.resolveSuccessMessage(),
    };
  });

  constructor() {
    effect(() => {
      const activeEmployeeKey = this.employeeKey();

      untracked(() => {
        this.addressStore.loadAddresses(activeEmployeeKey);
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
    this.modeState.set('creating');
    this.editingCurrentKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(createEmptyAddressCreateDraft());
    this.editCurrentDraftState.set(createEmptyAddressEditCurrentDraft());
  }

  protected startEditCurrent(addressNumber: number): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const activeAddress = this.addressStore.addresses().find(
      (address) => address.addressNumber === addressNumber && address.isActive,
    );
    if (!activeAddress) {
      return;
    }

    this.clearInteractionFeedback();
    this.modeState.set('editingCurrent');
    this.editingCurrentKeyState.set(activeAddress.addressNumber);
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(createEmptyAddressCreateDraft());
    this.editCurrentDraftState.set({
      street: activeAddress.street,
      city: activeAddress.city,
      countryCode: activeAddress.countryCode,
      postalCode: activeAddress.postalCode ?? '',
      regionCode: activeAddress.regionCode ?? '',
    });
  }

  protected requestCloseCurrent(addressNumber: number): void {
    if (!this.canStartInteraction()) {
      return;
    }

    const selectedRow = this.rows().find((row) => row.key === addressNumber);
    if (!selectedRow || selectedRow.closeable !== true) {
      return;
    }

    this.clearInteractionFeedback();
    this.modeState.set('confirmingClose');
    this.editingCurrentKeyState.set(null);
    this.confirmingCloseKeyState.set(addressNumber);
  }

  protected confirmCloseCurrent(addressNumber: number): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.addressStore.mutating()) {
      return;
    }

    this.clearLocalError();
    this.resetInteractionState();
    this.addressStore.closeAddress(activeEmployeeKey, addressNumber, this.currentBusinessDate());
  }

  protected cancelCreate(): void {
    this.clearInteractionFeedback();
    this.resetInteractionState();
  }

  protected cancelEditCurrent(): void {
    this.clearInteractionFeedback();
    this.resetInteractionState();
  }

  protected cancelCloseCurrent(): void {
    this.clearInteractionFeedback();
    this.resetInteractionState();
  }

  protected submitCreate(): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.addressStore.mutating() || !this.canSaveCreate()) {
      return;
    }

    const draft = this.createDraftState();
    this.clearLocalError();
    this.resetInteractionState();
    this.addressStore.createAddress(activeEmployeeKey, draft);
  }

  protected submitEditCurrent(addressNumber: number): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.addressStore.mutating() || !this.canSaveEditCurrent()) {
      return;
    }

    const draft = this.editCurrentDraftState();
    this.clearLocalError();
    this.resetInteractionState();
    this.addressStore.updateAddress(activeEmployeeKey, addressNumber, draft);
  }

  protected updateCreateField(field: keyof AddressCreateDraft, value: string): void {
    this.createDraftState.set({
      ...this.createDraftState(),
      [field]: value,
    });
    this.clearInteractionFeedback();
  }

  protected updateEditCurrentField(field: keyof AddressEditCurrentDraft, value: string): void {
    this.editCurrentDraftState.set({
      ...this.editCurrentDraftState(),
      [field]: value,
    });
    this.clearInteractionFeedback();
  }

  private canStartInteraction(): boolean {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey) {
      return false;
    }

    return !this.addressStore.mutating();
  }

  private resetInteractionState(): void {
    this.modeState.set('view');
    this.editingCurrentKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(createEmptyAddressCreateDraft());
    this.editCurrentDraftState.set(createEmptyAddressEditCurrentDraft());
  }

  private clearInteractionFeedback(): void {
    this.addressStore.clearFeedback();
    this.clearLocalError();
  }

  private clearLocalError(): void {
    this.localErrorMessageState.set(null);
  }

  private toSectionMode(displayMode: AddressInteractionMode): SectionMode {
    if (displayMode === 'creating') {
      return 'creating';
    }

    if (displayMode === 'editingCurrent') {
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

    if (this.addressStore.error() === 'request-failed') {
      return this.texts.addressesSectionRequestFailedMessage;
    }

    return null;
  }

  private resolveSuccessMessage(): string | null {
    const successCode = this.addressStore.success();

    if (successCode === 'created') {
      return this.texts.addressesSectionCreateSuccessMessage;
    }

    if (successCode === 'updated') {
      return this.texts.addressesSectionEditCurrentSuccessMessage;
    }

    if (successCode === 'closed') {
      return this.texts.addressesSectionCloseSuccessMessage;
    }

    return null;
  }

  private compareAddressOrder(
    left: { isActive: boolean; startDate: string; addressNumber: number },
    right: { isActive: boolean; startDate: string; addressNumber: number },
  ): number {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    const startDateOrder = right.startDate.localeCompare(left.startDate);
    if (startDateOrder !== 0) {
      return startDateOrder;
    }

    return left.addressNumber - right.addressNumber;
  }

  private currentBusinessDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private normalizeRequiredValue(value: string): string {
    return value.trim();
  }

  private loadCatalogOptions(ruleSystemCode: string | null): void {
    const normalizedRuleSystemCode = ruleSystemCode?.trim() ?? '';

    if (!normalizedRuleSystemCode) {
      this.catalogRequestId += 1;
      this.catalogLoadingState.set(false);
      this.availableAddressTypeOptionsState.set([]);
      this.createDraftState.update((draft) => ({
        ...draft,
        addressTypeCode: '',
      }));
      return;
    }

    const requestId = ++this.catalogRequestId;
    this.catalogLoadingState.set(true);
    this.fieldCatalogService
      .loadAddressTypeOptions(normalizedRuleSystemCode)
      .pipe(take(1))
      .subscribe((options) => {
        if (requestId !== this.catalogRequestId) {
          return;
        }

        this.catalogLoadingState.set(false);
        this.availableAddressTypeOptionsState.set(options);
        this.syncCreateDraftTypeWithAvailableOptions(options);
      });
  }

  private syncCreateDraftTypeWithAvailableOptions(options: ReadonlyArray<SlotKeyOption<string>>): void {
    const currentTypeCode = this.createDraftState().addressTypeCode;
    if (!currentTypeCode) {
      return;
    }

    const hasMatchingTypeCode = options.some((option) => option.value === currentTypeCode);
    if (hasMatchingTypeCode) {
      return;
    }

    this.createDraftState.update((draft) => ({
      ...draft,
      addressTypeCode: '',
    }));
  }
}
