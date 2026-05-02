import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { UiTagComponent } from '../../../../shared/ui/tag/ui-tag.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { EmployeeDirectoryStore } from '../../data-access/employee-directory.store';
import { EmployeeRecentsService } from '../../data-access/employee-recents.service';
import { employeeTexts } from '../../employee.texts';
import { EmployeeListItemModel } from '../../models/employee-list-item.model';
import { buildEmployeeDetailRouteCommands } from '../../routing/employee-route-builder.util';
import { toEmployeeBusinessKey } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-shell-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    UiTagComponent,
    UiButtonComponent,
  ],
  templateUrl: './employee-shell-page.component.html',
  styleUrl: './employee-shell-page.component.scss',
})
export class EmployeeShellPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly directoryStore = inject(EmployeeDirectoryStore);
  private readonly recentsService = inject(EmployeeRecentsService);

  protected readonly texts = employeeTexts;
  protected readonly searchValue = signal('');
  protected readonly employees = this.directoryStore.filteredEmployees;
  protected readonly loading = this.directoryStore.loading;
  protected readonly error = this.directoryStore.error;

  protected readonly displayedEmployees = computed(() => {
    const q = this.searchValue().trim().toLowerCase();
    if (!q) return this.employees();
    return this.employees().filter(
      (e) =>
        e.displayName.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        e.ruleSystemCode.toLowerCase().includes(q) ||
        e.employeeTypeCode.toLowerCase().includes(q),
    );
  });

  protected updateSearch(value: string): void {
    this.searchValue.set(value);
    this.directoryStore.setQuery(value);
  }

  protected openEmployee(employee: EmployeeListItemModel): void {
    this.recentsService.add(employee);
    void this.router.navigate(
      buildEmployeeDetailRouteCommands(toEmployeeBusinessKey(employee), 'contact'),
    );
  }

  protected onHireClick(): void {
    void this.router.navigate(['hire'], { relativeTo: this.route });
  }

  protected resolveStatusLabel(statusLabel: string): string {
    const n = statusLabel.trim().toLowerCase();
    if (n.includes('active') || n.includes('alta')) return this.texts.employeeStatusActiveLabel;
    if (n.includes('pending') || n.includes('draft')) return this.texts.employeeStatusPendingLabel;
    return this.texts.employeeStatusInactiveLabel;
  }

  protected resolveStatusSeverity(statusLabel: string): 'success' | 'secondary' | 'warn' {
    const n = statusLabel.trim().toLowerCase();
    if (n.includes('active') || n.includes('alta')) return 'success';
    if (n.includes('pending') || n.includes('draft')) return 'warn';
    return 'secondary';
  }
}
