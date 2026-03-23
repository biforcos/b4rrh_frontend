import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-employee-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-page-header.component.html',
  styleUrl: './employee-page-header.component.scss',
})
export class EmployeePageHeaderComponent {
  readonly fullName = input('Marina Lopez Ortega');
  readonly employeeNumber = input('EMP-004218');
  readonly ruleSystemCode = input('RS-ES-01');
  readonly employeeTypeCode = input('STAFF');
  readonly status = input<EmployeeStatus>('ACTIVE');
  readonly companyCode = input('B4-ES');
  readonly workCenterCode = input('MAD-01');
  readonly hireDate = input('2024-01-15');
  readonly email = input('marina.lopez@b4rrhh.local');
  readonly phone = input('+34 600 123 456');

  protected readonly isActive = computed(() => this.status() === 'ACTIVE');
  protected readonly statusLabel = computed(() => (this.isActive() ? 'Active' : 'Inactive'));
}
