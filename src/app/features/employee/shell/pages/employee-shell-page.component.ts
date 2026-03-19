import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';

import { PanelComponent } from '../../../../shared/ui/panel/panel.component';
import { EmployeeDirectoryStore } from '../../data-access/employee-directory.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeListItemModel } from '../../models/employee-list-item.model';
import {
  buildEmployeeDetailRouteCommands,
  EmployeeRouteSection,
} from '../../routing/employee-route-builder.util';
import {
  readEmployeeBusinessKeyFromParamMap,
  toEmployeeBusinessKey,
} from '../../routing/employee-route-key.util';
import { EmployeeDetailHeaderComponent } from '../components/employee-detail-header.component';
import { EmployeeDetailNavComponent } from '../components/employee-detail-nav.component';
import { EmployeeDirectoryListComponent } from '../components/employee-directory-list.component';

@Component({
  selector: 'app-employee-shell-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterOutlet,
    PanelComponent,
    EmployeeDirectoryListComponent,
    EmployeeDetailHeaderComponent,
    EmployeeDetailNavComponent,
  ],
  templateUrl: './employee-shell-page.component.html',
  styleUrl: './employee-shell-page.component.scss',
})
export class EmployeeShellPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly directoryStore = inject(EmployeeDirectoryStore);

  protected readonly texts = employeeTexts;
  protected readonly searchForm = new FormGroup({
    searchTerm: new FormControl('', { nonNullable: true }),
  });
  protected readonly filteredEmployees = this.directoryStore.filteredEmployees;
  protected readonly activeEmployeeKey = signal<EmployeeBusinessKey | null>(null);
  protected readonly selectedEmployee = computed<EmployeeListItemModel | null>(() => {
    const activeEmployeeKey = this.activeEmployeeKey();
    if (!activeEmployeeKey) {
      return null;
    }

    return (
      this.directoryStore.findEmployeeByBusinessKey(activeEmployeeKey) ?? {
        ...activeEmployeeKey,
        displayName: this.texts.unknownEmployeeName,
        workCenter: this.texts.unknownEmployeeWorkCenter,
        statusLabel: this.texts.unknownEmployeeStatus,
      }
    );
  });

  constructor() {
    this.searchForm.controls.searchTerm.valueChanges
      .pipe(startWith(this.searchForm.controls.searchTerm.value), takeUntilDestroyed())
      .subscribe((value) => {
        this.directoryStore.setQuery(value);
      });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const activeEmployeeKey = this.resolveActiveEmployeeKey();
        this.activeEmployeeKey.set(activeEmployeeKey);
        this.directoryStore.hydrateEmployeeByBusinessKey(activeEmployeeKey);
      });
  }

  protected openEmployeeFromSearch(): void {
    const firstEmployee = this.filteredEmployees()[0];
    if (!firstEmployee) {
      return;
    }

    void this.openEmployeeDetail(toEmployeeBusinessKey(firstEmployee), 'overview');
  }

  protected openEmployeeDetail(
    employeeKey: EmployeeBusinessKey,
    section: EmployeeRouteSection = 'overview',
  ): Promise<boolean> {
    return this.router.navigate(buildEmployeeDetailRouteCommands(employeeKey, section));
  }

  private resolveActiveEmployeeKey(): EmployeeBusinessKey | null {
    let snapshot = this.route.snapshot;

    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return readEmployeeBusinessKeyFromParamMap(snapshot.paramMap);
  }
}
