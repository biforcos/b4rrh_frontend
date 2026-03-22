import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import {
  AddressCreateDraft,
  AddressEditCurrentDraft,
  mapEmployeeAddressModelToTemporalRow,
} from '../../data-access/employee-address-edit.mapper';
import { EmployeeAddressStore } from '../../data-access/employee-address.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { TemporalSectionComponent } from '../../shared/ui/section/temporal-section.component';
import { TemporalDisplayMode, TemporalRowViewModel, TemporalSectionTexts } from '../../shared/ui/section/temporal-section.model';
import { SectionMode, SectionUiState } from '../../shared/ui/section/section-ui-state.model';

const emptyDraft: AddressCreateDraft = {
  addressTypeCode: '',
  street: '',
  city: '',
  countryCode: '',
  postalCode: '',
  regionCode: '',
  startDate: '',
};

@Component({
  selector: 'app-employee-address-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemporalSectionComponent],
  templateUrl: './employee-address-section.component.html',
  styleUrl: './employee-address-section.component.scss',
})
export class EmployeeAddressSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly addressStore = inject(EmployeeAddressStore);
  private readonly displayModeState = signal<TemporalDisplayMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly confirmingCloseKeyState = signal<number | null>(null);
  private readonly editingCurrentKeyState = signal<number | null>(null);
  private readonly createDraftState = signal<AddressCreateDraft>(emptyDraft);
  private readonly editCurrentDraftState = signal<AddressEditCurrentDraft>({
    street: '',
    city: '',
    countryCode: '',
    postalCode: '',
    regionCode: '',
  });

  protected readonly texts = employeeTexts;
  protected readonly sectionSubtitle = this.texts.addressesSectionSubtitle;
  protected readonly sectionTexts: TemporalSectionTexts = {
    manageAction: this.texts.addressesSectionManageAction,
    exitManageAction: this.texts.addressesSectionExitManageAction,
    addAction: this.texts.addressesSectionAddAction,
    editCurrentAction: this.texts.addressesSectionEditCurrentAction,
    closeAction: this.texts.addressesSectionCloseAction,
    cancelAction: this.texts.addressesSectionCancelAction,
    saveCreateAction: this.texts.addressesSectionSaveCreateAction,
    saveEditCurrentAction: this.texts.addressesSectionSaveEditCurrentAction,
    confirmCloseMessage: this.texts.addressesSectionConfirmCloseMessage,
    confirmCloseAction: this.texts.addressesSectionConfirmCloseAction,
    emptyMessage: this.texts.addressesSectionEmptyMessage,
  };
  protected readonly rows = computed<ReadonlyArray<TemporalRowViewModel<number>>>(() =>
    [...this.addressStore.addresses()]
      .sort((left, right) => this.compareAddressOrder(left, right))
      .map((address) =>
        mapEmployeeAddressModelToTemporalRow(address, {
          currentStatus: this.texts.addressesSectionCurrentStatus,
          closedStatus: this.texts.addressesSectionClosedStatus,
          currentPeriodLabel: this.texts.addressesSectionCurrentPeriodLabel,
        }),
      ),
  );
  protected readonly displayMode = this.displayModeState.asReadonly();
  protected readonly confirmingCloseKey = this.confirmingCloseKeyState.asReadonly();
  protected readonly editingCurrentKey = this.editingCurrentKeyState.asReadonly();
  protected readonly createDraft = this.createDraftState.asReadonly();
  protected readonly editCurrentDraft = this.editCurrentDraftState.asReadonly();
  protected readonly currentAddress = computed(
    () => this.addressStore.addresses().find((address) => address.isActive) ?? null,
  );
  protected readonly isCreateDraftValid = computed(() => {
    const draft = this.createDraftState();

    return (
      this.normalizeRequiredValue(draft.addressTypeCode).length > 0 &&
      this.normalizeRequiredValue(draft.street).length > 0 &&
      this.normalizeRequiredValue(draft.city).length > 0 &&
      this.normalizeRequiredValue(draft.countryCode).length > 0 &&
      this.normalizeRequiredValue(draft.startDate).length > 0
    );
  });
  protected readonly isEditCurrentDraftValid = computed(() => {
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
      mode: isBusy ? 'submitting' : this.toSectionMode(this.displayModeState()),
      dirty: this.displayModeState() === 'creating' || this.displayModeState() === 'editingCurrent',
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
    this.enterEditingCurrentMode(activeAddress.addressNumber, {
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
    this.enterConfirmingCloseMode(addressNumber);
  }

  protected confirmCloseCurrent(addressNumber: number): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.addressStore.mutating()) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.addressStore.closeAddress(activeEmployeeKey, addressNumber, this.currentBusinessDate());
  }

  protected cancel(): void {
    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected submitCreate(): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.addressStore.mutating() || !this.isCreateDraftValid()) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.addressStore.createAddress(activeEmployeeKey, this.createDraftState());
  }

  protected submitEditCurrent(): void {
    const activeEmployeeKey = this.employeeKey();
    const editingAddressNumber = this.editingCurrentKeyState();
    if (!activeEmployeeKey || editingAddressNumber === null || this.addressStore.mutating() || !this.isEditCurrentDraftValid()) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.addressStore.updateAddress(activeEmployeeKey, editingAddressNumber, this.editCurrentDraftState());
  }

  protected updateCreateDraftAddressTypeCode(event: Event): void {
    this.updateDraftField('addressTypeCode', this.readInputValue(event));
  }

  protected updateCreateDraftStreet(event: Event): void {
    this.updateDraftField('street', this.readInputValue(event));
  }

  protected updateCreateDraftCity(event: Event): void {
    this.updateDraftField('city', this.readInputValue(event));
  }

  protected updateCreateDraftCountryCode(event: Event): void {
    this.updateDraftField('countryCode', this.readInputValue(event));
  }

  protected updateCreateDraftPostalCode(event: Event): void {
    this.updateDraftField('postalCode', this.readInputValue(event));
  }

  protected updateCreateDraftRegionCode(event: Event): void {
    this.updateDraftField('regionCode', this.readInputValue(event));
  }

  protected updateCreateDraftStartDate(event: Event): void {
    this.updateDraftField('startDate', this.readInputValue(event));
  }

  protected updateEditCurrentDraftStreet(event: Event): void {
    this.updateEditCurrentDraftField('street', this.readInputValue(event));
  }

  protected updateEditCurrentDraftCity(event: Event): void {
    this.updateEditCurrentDraftField('city', this.readInputValue(event));
  }

  protected updateEditCurrentDraftCountryCode(event: Event): void {
    this.updateEditCurrentDraftField('countryCode', this.readInputValue(event));
  }

  protected updateEditCurrentDraftPostalCode(event: Event): void {
    this.updateEditCurrentDraftField('postalCode', this.readInputValue(event));
  }

  protected updateEditCurrentDraftRegionCode(event: Event): void {
    this.updateEditCurrentDraftField('regionCode', this.readInputValue(event));
  }

  private updateDraftField(field: keyof AddressCreateDraft, value: string): void {
    this.createDraftState.update((draft) => ({
      ...draft,
      [field]: value,
    }));
    this.clearInteractionFeedback();
  }

  private updateEditCurrentDraftField(field: keyof AddressEditCurrentDraft, value: string): void {
    this.editCurrentDraftState.update((draft) => ({
      ...draft,
      [field]: value,
    }));
    this.clearInteractionFeedback();
  }

  private readInputValue(event: Event): string {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return '';
    }

    return target.value;
  }

  private canStartInteraction(): boolean {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey) {
      return false;
    }

    return !this.addressStore.mutating();
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
    this.editingCurrentKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(emptyDraft);
    this.editCurrentDraftState.set({
      street: '',
      city: '',
      countryCode: '',
      postalCode: '',
      regionCode: '',
    });
  }

  private enterEditingCurrentMode(addressNumber: number, draft: AddressEditCurrentDraft): void {
    this.displayModeState.set('editingCurrent');
    this.editingCurrentKeyState.set(addressNumber);
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(emptyDraft);
    this.editCurrentDraftState.set(draft);
  }

  private enterConfirmingCloseMode(addressNumber: number): void {
    this.displayModeState.set('confirmingClose');
    this.editingCurrentKeyState.set(null);
    this.confirmingCloseKeyState.set(addressNumber);
    this.createDraftState.set(emptyDraft);
    this.editCurrentDraftState.set({
      street: '',
      city: '',
      countryCode: '',
      postalCode: '',
      regionCode: '',
    });
  }

  private clearInteractionFeedback(): void {
    this.addressStore.clearFeedback();
    this.clearLocalError();
  }

  private clearLocalError(): void {
    this.localErrorMessageState.set(null);
  }

  private resetOperationContext(): void {
    this.editingCurrentKeyState.set(null);
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(emptyDraft);
    this.editCurrentDraftState.set({
      street: '',
      city: '',
      countryCode: '',
      postalCode: '',
      regionCode: '',
    });
  }

  private toSectionMode(displayMode: TemporalDisplayMode): SectionMode {
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
}
