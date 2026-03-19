import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';
import { EmployeeDetailModel } from '../../models/employee-detail.model';

@Component({
  selector: 'app-employee-detail-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-detail-header.component.html',
  styleUrl: './employee-detail-header.component.scss',
})
export class EmployeeDetailHeaderComponent {
  readonly employee = input.required<EmployeeDetailModel>();

  protected readonly texts = employeeTexts;
  protected readonly avatarInitials = computed(() => this.buildAvatarInitials(this.employee().displayName));
  protected readonly statusTone = computed(() => this.resolveStatusTone(this.employee().statusLabel));

  private buildAvatarInitials(displayName: string): string {
    const normalizedName = displayName.trim();
    if (!normalizedName) {
      return this.texts.detailHeaderAvatarFallback;
    }

    const segments = normalizedName
      .split(/\s+/)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? '');

    return segments.join('') || this.texts.detailHeaderAvatarFallback;
  }

  private resolveStatusTone(statusLabel: string): 'default' | 'positive' | 'warning' | 'neutral' {
    const normalizedStatus = statusLabel.trim().toLowerCase();

    if (normalizedStatus.includes('active') || normalizedStatus.includes('alta')) {
      return 'positive';
    }

    if (normalizedStatus.includes('pending') || normalizedStatus.includes('draft')) {
      return 'warning';
    }

    if (
      normalizedStatus.includes('inactive') ||
      normalizedStatus.includes('closed') ||
      normalizedStatus.includes('baja')
    ) {
      return 'neutral';
    }

    return 'default';
  }
}
