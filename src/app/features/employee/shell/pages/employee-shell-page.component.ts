import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { EmployeeDirectoryTableComponent } from '../components/employee-directory-table/employee-directory-table.component';
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
  imports: [UiButtonComponent, EmployeeDirectoryTableComponent],
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
  protected readonly filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  protected readonly loading = this.directoryStore.loading;
  protected readonly error = this.directoryStore.error;

  protected readonly tableData = computed(() => [...this.directoryStore.filteredEmployees()]);

  protected readonly filteredTableData = computed(() => {
    const all = this.tableData();
    const f = this.filterStatus();
    if (f === 'all') return all;
    if (f === 'active')
      return all.filter(
        (e) =>
          e.statusLabel.toLowerCase().includes('active') ||
          e.statusLabel.toLowerCase().includes('alta'),
      );
    return all.filter(
      (e) =>
        !e.statusLabel.toLowerCase().includes('active') &&
        !e.statusLabel.toLowerCase().includes('alta'),
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
}
