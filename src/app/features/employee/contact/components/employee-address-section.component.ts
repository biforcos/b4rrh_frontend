import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import { AddressCreateDraft, mapEmployeeAddressModelToTemporalRow } from '../../data-access/employee-address-edit.mapper';
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
  template: `
    <app-temporal-section
      [title]="texts.addressesSectionTitle"
      [subtitle]="null"
      [state]="sectionState()"
      [displayMode]="displayMode()"
      [rows]="rows()"
      [texts]="sectionTexts"
      [confirmingCloseKey]="confirmingCloseKey()"
      [canCreate]="true"
      [canClose]="true"
      [createSubmitEnabled]="isCreateDraftValid()"
      (manageStarted)="onManageStarted()"
      (manageExited)="onManageExited()"
      (createStarted)="onCreateStarted()"
      (closeRequested)="onCloseRequested($event)"
      (closeConfirmed)="onCloseConfirmed($event)"
      (cancelled)="onCancelled()"
      (createSubmitted)="onCreateSubmitted()"
    >
      <div temporalCreateForm class="employee-address-section__form-grid">
        <label>
          <span>{{ texts.addressesSectionTypeLabel }}</span>
          <input type="text" [value]="createDraft().addressTypeCode" (input)="onDraftAddressTypeCodeChanged($event)" />
        </label>

        <label>
          <span>{{ texts.addressesSectionStreetLabel }}</span>
          <input type="text" [value]="createDraft().street" (input)="onDraftStreetChanged($event)" />
        </label>

        <label>
          <span>{{ texts.addressesSectionCityLabel }}</span>
          <input type="text" [value]="createDraft().city" (input)="onDraftCityChanged($event)" />
        </label>

        <label>
          <span>{{ texts.addressesSectionCountryLabel }}</span>
          <input type="text" [value]="createDraft().countryCode" (input)="onDraftCountryCodeChanged($event)" />
        </label>

        <label>
          <span>{{ texts.addressesSectionStartDateLabel }}</span>
          <input type="date" [value]="createDraft().startDate" (input)="onDraftStartDateChanged($event)" />
        </label>

        <label>
          <span>{{ texts.addressesSectionPostalCodeLabel }}</span>
          <input type="text" [value]="createDraft().postalCode" (input)="onDraftPostalCodeChanged($event)" />
        </label>

        <label>
          <span>{{ texts.addressesSectionRegionLabel }}</span>
          <input type="text" [value]="createDraft().regionCode" (input)="onDraftRegionCodeChanged($event)" />
        </label>
      </div>
    </app-temporal-section>
  `,
  styles: `
    .employee-address-section__form-grid {
      display: grid;
      gap: 0.26rem;
    }

    .employee-address-section__form-grid label {
      display: grid;
      gap: 0.08rem;
    }

    .employee-address-section__form-grid span {
      font-size: 0.62rem;
      line-height: 1.2;
      color: #5f7386;
    }

    .employee-address-section__form-grid input {
      border: 1px solid #cedae7;
      border-radius: 0.42rem;
      background: #ffffff;
      color: #1f3246;
      font-size: 0.68rem;
      line-height: 1.2;
      padding: 0.26rem 0.34rem;
    }
  `,
})
export class EmployeeAddressSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  private readonly addressStore = inject(EmployeeAddressStore);
  private readonly displayModeState = signal<TemporalDisplayMode>('view');
  private readonly localErrorMessageState = signal<string | null>(null);
  private readonly confirmingCloseKeyState = signal<number | null>(null);
  private readonly createDraftState = signal<AddressCreateDraft>(emptyDraft);

  protected readonly texts = employeeTexts;
  protected readonly sectionTexts: TemporalSectionTexts = {
    manageAction: this.texts.addressesSectionManageAction,
    exitManageAction: this.texts.addressesSectionExitManageAction,
    addAction: this.texts.addressesSectionAddAction,
    closeAction: this.texts.addressesSectionCloseAction,
    cancelAction: this.texts.addressesSectionCancelAction,
    saveCreateAction: this.texts.addressesSectionSaveCreateAction,
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
  protected readonly createDraft = this.createDraftState.asReadonly();
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
  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.addressStore.loading() || this.addressStore.mutating();

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
        this.addressStore.loadAddresses(activeEmployeeKey);
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

  protected onCloseRequested(addressNumber: number): void {
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

  protected onCloseConfirmed(addressNumber: number): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.addressStore.mutating()) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.addressStore.closeAddress(activeEmployeeKey, addressNumber, this.currentBusinessDate());
  }

  protected onCancelled(): void {
    this.clearInteractionFeedback();
    this.enterManageMode();
  }

  protected onCreateSubmitted(): void {
    const activeEmployeeKey = this.employeeKey();
    if (!activeEmployeeKey || this.addressStore.mutating() || !this.isCreateDraftValid()) {
      return;
    }

    this.clearLocalError();
    this.enterManageMode();
    this.addressStore.createAddress(activeEmployeeKey, this.createDraftState());
  }

  protected onDraftAddressTypeCodeChanged(event: Event): void {
    this.updateDraftField('addressTypeCode', this.readInputValue(event));
  }

  protected onDraftStreetChanged(event: Event): void {
    this.updateDraftField('street', this.readInputValue(event));
  }

  protected onDraftCityChanged(event: Event): void {
    this.updateDraftField('city', this.readInputValue(event));
  }

  protected onDraftCountryCodeChanged(event: Event): void {
    this.updateDraftField('countryCode', this.readInputValue(event));
  }

  protected onDraftPostalCodeChanged(event: Event): void {
    this.updateDraftField('postalCode', this.readInputValue(event));
  }

  protected onDraftRegionCodeChanged(event: Event): void {
    this.updateDraftField('regionCode', this.readInputValue(event));
  }

  protected onDraftStartDateChanged(event: Event): void {
    this.updateDraftField('startDate', this.readInputValue(event));
  }

  private updateDraftField(field: keyof AddressCreateDraft, value: string): void {
    this.createDraftState.update((draft) => ({
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
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(emptyDraft);
  }

  private enterConfirmingCloseMode(addressNumber: number): void {
    this.displayModeState.set('confirmingClose');
    this.confirmingCloseKeyState.set(addressNumber);
    this.createDraftState.set(emptyDraft);
  }

  private clearInteractionFeedback(): void {
    this.addressStore.clearFeedback();
    this.clearLocalError();
  }

  private clearLocalError(): void {
    this.localErrorMessageState.set(null);
  }

  private resetOperationContext(): void {
    this.confirmingCloseKeyState.set(null);
    this.createDraftState.set(emptyDraft);
  }

  private toSectionMode(displayMode: TemporalDisplayMode): SectionMode {
    if (displayMode === 'creating') {
      return 'creating';
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
