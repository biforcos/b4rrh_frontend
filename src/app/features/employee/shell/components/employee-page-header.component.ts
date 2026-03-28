import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { employeeTexts } from '../../employee.texts';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiTagComponent } from '../../../../shared/ui/tag/ui-tag.component';

type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-employee-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiTagComponent],
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
  readonly editIdentityRequested = output<void>();
  readonly terminateRequested = output<void>();

  protected readonly texts = employeeTexts;
  protected readonly isActive = computed(() => this.status() === 'ACTIVE');

  protected requestEditIdentity(): void {
    this.editIdentityRequested.emit();
  }

  protected requestTerminate(): void {
    this.terminateRequested.emit();
  }
}
