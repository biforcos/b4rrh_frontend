import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';

export interface EmployeeAddressBlockItemModel {
  typeLabel: string;
  street: string;
  locality: string;
  validity: string | null;
  isActive: boolean;
}

export interface EmployeeAddressBlockModel {
  primaryAddress?: EmployeeAddressBlockItemModel | null;
  secondaryAddresses?: ReadonlyArray<EmployeeAddressBlockItemModel>;
}

@Component({
  selector: 'app-employee-address-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-address-block.component.html',
  styleUrl: './employee-address-block.component.scss',
})
export class EmployeeAddressBlockComponent {
  readonly address = input<EmployeeAddressBlockModel | null>(null);

  protected readonly texts = employeeTexts;
  protected readonly primaryAddress = computed(() => this.address()?.primaryAddress ?? null);
  protected readonly secondaryAddresses = computed(() => this.address()?.secondaryAddresses ?? []);
  protected readonly hasAnyData = computed(
    () => Boolean(this.primaryAddress()) || this.secondaryAddresses().length > 0,
  );
}
