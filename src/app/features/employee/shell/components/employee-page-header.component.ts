import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { employeeTexts } from '../../employee.texts';
import {
  EntityHeaderComponent,
  EntityHeaderMetadataItem,
  EntityHeaderStatus,
} from '../../../../shared/ui/entity-header/entity-header.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';

type EmployeeStatus = 'ACTIVE' | 'TERMINATED';

@Component({
  selector: 'app-employee-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntityHeaderComponent, UiButtonComponent],
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
  readonly rehireRequested = output<void>();
  readonly printRequested = output<void>();

  protected readonly texts = employeeTexts;
  protected readonly isActive = computed(() => this.status() === 'ACTIVE');
  protected readonly metadata = computed<ReadonlyArray<EntityHeaderMetadataItem>>(() => [
    { label: this.texts.detailHeaderEmployeeNumberLabel, value: this.employeeNumber() },
    { label: this.texts.employeePageHeaderCompanyLabel, value: this.companyCode() },
    { label: this.texts.employeePageHeaderWorkCenterLabel, value: this.workCenterCode() },
    { label: this.texts.employeePageHeaderHireDateLabel, value: this.hireDate() },
    { label: this.texts.detailHeaderEmployeeTypeLabel, value: this.employeeTypeCode() },
    { label: this.texts.detailHeaderRuleSystemLabel, value: this.ruleSystemCode() },
  ]);
  protected readonly initials = computed(() => {
    const parts = this.fullName().trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  });

  protected readonly statusBadge = computed<EntityHeaderStatus>(() => ({
    label: this.isActive()
      ? this.texts.employeeStatusActiveLabel
      : this.texts.employeeStatusInactiveLabel,
    severity: this.isActive() ? 'success' : 'secondary',
  }));
  protected readonly subtitle = computed(() => {
    const parts = [
      this.normalizeSecondaryValue(this.email(), this.texts.employeePageHeaderEmailLabel),
      this.normalizeSecondaryValue(this.phone(), this.texts.employeePageHeaderPhoneLabel),
    ].filter((value): value is string => value !== null);

    return parts.length > 0 ? parts.join(' · ') : null;
  });

  protected requestEditIdentity(): void {
    this.editIdentityRequested.emit();
  }

  protected requestTerminate(): void {
    this.terminateRequested.emit();
  }

  protected requestRehire(): void {
    this.rehireRequested.emit();
  }

  protected requestPrint(): void {
    this.printRequested.emit();
  }

  private normalizeSecondaryValue(value: string, label: string): string | null {
    const normalized = value.trim();
    if (!normalized || normalized === this.texts.employeePageHeaderEmptyValue) {
      return null;
    }

    return `${label}: ${normalized}`;
  }
}
