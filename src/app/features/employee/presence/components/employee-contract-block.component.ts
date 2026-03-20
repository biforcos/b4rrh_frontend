import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';

export interface EmployeeContractBlockItemModel {
  contractCode: string;
  contractSubtypeCode: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export type EmployeeContractCurrentKind = 'active' | 'active-most-recent' | 'latest-closed';

export interface EmployeeContractBlockModel {
  currentContract?: EmployeeContractBlockItemModel | null;
  currentContractKind?: EmployeeContractCurrentKind | null;
  contractHistory?: ReadonlyArray<EmployeeContractBlockItemModel>;
}

@Component({
  selector: 'app-employee-contract-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-contract-block.component.html',
  styleUrl: './employee-contract-block.component.scss',
})
export class EmployeeContractBlockComponent {
  readonly contract = input<EmployeeContractBlockModel | null>(null);

  protected readonly texts = employeeTexts;
  protected readonly currentContract = computed(() => this.contract()?.currentContract ?? null);
  protected readonly currentContractKind = computed(() => this.contract()?.currentContractKind ?? null);
  protected readonly contractHistory = computed(() => this.contract()?.contractHistory ?? []);
  protected readonly hasAnyData = computed(
    () => Boolean(this.currentContract()) || this.contractHistory().length > 0,
  );
  protected readonly hasHistory = computed(() => this.contractHistory().length > 0);

  protected buildPeriodLabel(contract: EmployeeContractBlockItemModel): string {
    if (!contract.endDate) {
      return `${contract.startDate} - ${this.texts.contractBlockOpenPeriodLabel}`;
    }

    return `${contract.startDate} - ${contract.endDate}`;
  }

  protected resolveCurrentKindLabel(): string {
    const currentKind = this.currentContractKind();

    if (currentKind === 'active') {
      return this.texts.contractBlockCurrentActiveLabel;
    }

    if (currentKind === 'active-most-recent') {
      return this.texts.contractBlockCurrentActiveMostRecentLabel;
    }

    return this.texts.contractBlockCurrentLatestClosedLabel;
  }

  protected resolveCurrentSectionLabel(): string {
    const currentKind = this.currentContractKind();

    if (currentKind === 'active' || currentKind === 'active-most-recent') {
      return this.texts.contractBlockCurrentActiveSectionLabel;
    }

    return this.texts.contractBlockCurrentSectionLabel;
  }

  protected buildContractIdentityLabel(contract: EmployeeContractBlockItemModel): string {
    if (contract.contractSubtypeCode) {
      return `${contract.contractCode} · ${contract.contractSubtypeCode}`;
    }

    return contract.contractCode;
  }

  protected resolveStatusLabel(contract: EmployeeContractBlockItemModel): string {
    return contract.isActive ? this.texts.contractBlockStatusActive : this.texts.contractBlockStatusClosed;
  }
}
