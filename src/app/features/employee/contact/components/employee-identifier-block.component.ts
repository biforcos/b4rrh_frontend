import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';

export interface EmployeeIdentifierBlockItemModel {
  typeCode: string;
  value: string;
  issuingCountryCode: string | null;
  expirationDate: string | null;
  isPrimary: boolean;
}

export interface EmployeeIdentifierBlockModel {
  primaryIdentifier?: EmployeeIdentifierBlockItemModel | null;
  secondaryIdentifiers?: ReadonlyArray<EmployeeIdentifierBlockItemModel>;
}

@Component({
  selector: 'app-employee-identifier-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-identifier-block.component.html',
  styleUrl: './employee-identifier-block.component.scss',
})
export class EmployeeIdentifierBlockComponent {
  readonly identifier = input<EmployeeIdentifierBlockModel | null>(null);

  protected readonly texts = employeeTexts;
  protected readonly primaryIdentifier = computed(() => this.identifier()?.primaryIdentifier ?? null);
  protected readonly secondaryIdentifiers = computed(() => this.identifier()?.secondaryIdentifiers ?? []);
  protected readonly hasAnyData = computed(
    () => Boolean(this.primaryIdentifier()) || this.secondaryIdentifiers().length > 0,
  );
}
