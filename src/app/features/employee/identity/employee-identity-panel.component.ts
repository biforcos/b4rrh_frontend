import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { employeeTexts } from '../employee.texts';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeDetailModel } from '../models/employee-detail.model';
import {
  buildEmployeeDetailRouteCommands,
  EmployeeRouteSection,
} from '../routing/employee-route-builder.util';
import { EmployeePhotoUploadDialogComponent } from '../photo/employee-photo-upload-dialog.component';
import { EmployeePhotoService } from '../data-access/employee-photo.service';
import { EmployeeDetailStore } from '../data-access/employee-detail.store';

interface IdentityNavItem {
  section: EmployeeRouteSection;
  label: string;
  routeCommands: ReadonlyArray<string>;
  icon?: string;
}

@Component({
  selector: 'app-employee-identity-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    TagModule,
    ButtonModule,
    EmployeePhotoUploadDialogComponent,
  ],
  templateUrl: './employee-identity-panel.component.html',
  styleUrl: './employee-identity-panel.component.scss',
})
export class EmployeeIdentityPanelComponent {
  readonly employeeKey = input.required<EmployeeBusinessKey>();
  readonly employee = input<EmployeeDetailModel | null>(null);
  readonly hireDate = input<string | null>(null);
  readonly status = input<'ACTIVE' | 'TERMINATED'>('TERMINATED');
  readonly isAdmin = input(false);

  protected readonly texts = employeeTexts;
  protected readonly uploadDialogVisible = signal(false);

  private readonly photoService = inject(EmployeePhotoService);
  private readonly detailStore = inject(EmployeeDetailStore);

  protected readonly initials = computed(() => {
    const name = this.employee()?.displayName ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase() || '?';
  });

  protected readonly photoUrl = computed(() => this.employee()?.photoUrl ?? null);

  protected readonly navItems = computed<ReadonlyArray<IdentityNavItem>>(() => {
    const key = this.employeeKey();
    return [
      {
        section: 'overview',
        label: this.texts.overviewNavLabel,
        routeCommands: buildEmployeeDetailRouteCommands(key, 'overview'),
      },
      {
        section: 'contact',
        label: this.texts.personalAreaLabel,
        routeCommands: buildEmployeeDetailRouteCommands(key, 'contact'),
      },
      {
        section: 'presence',
        label: this.texts.laborAreaLabel,
        routeCommands: buildEmployeeDetailRouteCommands(key, 'presence'),
      },
      {
        section: 'organization',
        label: this.texts.organizationalAreaLabel,
        routeCommands: buildEmployeeDetailRouteCommands(key, 'organization'),
      },
      {
        section: 'payroll',
        label: this.texts.payrollAreaLabel,
        routeCommands: buildEmployeeDetailRouteCommands(key, 'payroll'),
      },
    ] as const;
  });

  protected readonly statusSeverity = computed(() =>
    this.status() === 'ACTIVE' ? 'success' : 'danger',
  );

  protected readonly statusLabel = computed(() =>
    this.status() === 'ACTIVE'
      ? this.texts.employeeStatusActiveLabel
      : this.texts.employeeStatusInactiveLabel,
  );

  protected openUploadDialog(): void {
    if (!this.isAdmin()) return;
    this.uploadDialogVisible.set(true);
  }

  protected onPhotoConfirmed(): void {
    this.detailStore.refreshEmployeeDetailByBusinessKey(this.employeeKey());
  }

  protected copyMatricula(): void {}

  protected deletePhoto(): void {
    this.photoService.deletePhoto(this.employeeKey()).subscribe({
      next: () => this.detailStore.refreshEmployeeDetailByBusinessKey(this.employeeKey()),
    });
  }
}
