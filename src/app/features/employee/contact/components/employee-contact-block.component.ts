import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';

export type EmployeeSecondaryContactType = 'phone' | 'email' | 'other';

export interface EmployeeSecondaryContactModel {
  type: EmployeeSecondaryContactType;
  label?: string | null;
  value: string;
}

export interface EmployeeContactBlockModel {
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  secondaryContacts?: ReadonlyArray<EmployeeSecondaryContactModel>;
}

@Component({
  selector: 'app-employee-contact-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-contact-block.component.html',
  styleUrl: './employee-contact-block.component.scss',
})
export class EmployeeContactBlockComponent {
  readonly contact = input<EmployeeContactBlockModel | null>(null);

  protected readonly texts = employeeTexts;
  protected readonly primaryPhone = computed(() => this.normalizeValue(this.contact()?.primaryPhone));
  protected readonly primaryEmail = computed(() => this.normalizeValue(this.contact()?.primaryEmail));
  protected readonly secondaryContacts = computed<ReadonlyArray<EmployeeSecondaryContactModel>>(() => {
    const source = this.contact()?.secondaryContacts ?? [];

    return source
      .map((item) => ({
        type: item.type,
        label: this.normalizeLabel(item.label),
        value: this.normalizeValue(item.value) ?? '',
      }))
      .filter((item) => item.value.length > 0)
      .slice(0, 3);
  });
  protected readonly hasAnyData = computed(
    () => Boolean(this.primaryPhone() || this.primaryEmail() || this.secondaryContacts().length > 0),
  );

  protected copyContactValue(value: string): void {
    const normalizedValue = value.trim();
    if (!normalizedValue || !('clipboard' in navigator)) {
      return;
    }

    void navigator.clipboard.writeText(normalizedValue);
  }

  protected resolveSecondaryTypeLabel(contact: EmployeeSecondaryContactModel): string {
    const normalizedLabel = contact.label?.trim();
    if (normalizedLabel) {
      return normalizedLabel;
    }

    if (contact.type === 'phone') {
      return this.texts.contactBlockTypePhone;
    }

    if (contact.type === 'email') {
      return this.texts.contactBlockTypeEmail;
    }

    return this.texts.contactBlockTypeOther;
  }

  private normalizeValue(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private normalizeLabel(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
  }
}
