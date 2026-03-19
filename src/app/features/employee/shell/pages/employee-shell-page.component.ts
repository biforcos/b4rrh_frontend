import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';

import { PanelComponent } from '../../../../shared/ui/panel/panel.component';
import { EmployeeDetailStore } from '../../data-access/employee-detail.store';
import { EmployeeDirectoryStore } from '../../data-access/employee-directory.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeDetailModel } from '../../models/employee-detail.model';
import { EmployeeListItemModel } from '../../models/employee-list-item.model';
import {
  buildEmployeeDetailRouteCommands,
  EmployeeRouteSection,
  employeeRouteSections,
} from '../../routing/employee-route-builder.util';
import {
  areEmployeeBusinessKeysEqual,
  readEmployeeBusinessKeyFromParamMap,
  toEmployeeBusinessKey,
} from '../../routing/employee-route-key.util';
import { EmployeeDetailHeaderComponent } from '../components/employee-detail-header.component';
import { EmployeeDetailNavComponent } from '../components/employee-detail-nav.component';
import { EmployeeDetailTimelineComponent } from '../components/employee-detail-timeline.component';
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
    EmployeeDetailTimelineComponent,
    EmployeeDetailNavComponent,
  ],
  templateUrl: './employee-shell-page.component.html',
  styleUrl: './employee-shell-page.component.scss',
})
export class EmployeeShellPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly directoryStore = inject(EmployeeDirectoryStore);
  private readonly detailStore = inject(EmployeeDetailStore);

  protected readonly texts = employeeTexts;
  protected readonly searchForm = new FormGroup({
    searchTerm: new FormControl('', { nonNullable: true }),
  });
  protected readonly filteredEmployees = this.directoryStore.filteredEmployees;
  protected readonly activeEmployeeKey = signal<EmployeeBusinessKey | null>(null);
  protected readonly activeDetailSection = signal<EmployeeRouteSection>('contact');
  protected readonly selectedEmployeeDetail = this.detailStore.selectedEmployeeDetail;
  protected readonly loadingDetail = this.detailStore.loadingDetail;
  protected readonly detailError = this.detailStore.detailError;
  protected readonly selectedEmployee = computed<EmployeeDetailModel | null>(() => {
    const activeEmployeeKey = this.activeEmployeeKey();
    if (!activeEmployeeKey) {
      return null;
    }

    const selectedEmployeeDetail = this.selectedEmployeeDetail();
    if (selectedEmployeeDetail && areEmployeeBusinessKeysEqual(selectedEmployeeDetail, activeEmployeeKey)) {
      return selectedEmployeeDetail;
    }

    const directoryEmployee = this.directoryStore.findEmployeeByBusinessKey(activeEmployeeKey);
    if (directoryEmployee) {
      return this.toFallbackDetailFromDirectory(directoryEmployee);
    }

    return this.toUnknownDetail(activeEmployeeKey);
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
        this.activeDetailSection.set(this.resolveActiveDetailSection());
        this.detailStore.loadEmployeeDetailByBusinessKey(activeEmployeeKey);
      });
  }

  protected openEmployeeFromSearch(): void {
    const firstEmployee = this.filteredEmployees()[0];
    if (!firstEmployee) {
      return;
    }

    void this.openEmployeeDetail(toEmployeeBusinessKey(firstEmployee), 'contact');
  }

  protected openEmployeeDetail(
    employeeKey: EmployeeBusinessKey,
    section: EmployeeRouteSection = 'contact',
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

  private resolveActiveDetailSection(): EmployeeRouteSection {
    let snapshot = this.route.snapshot;

    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    const routeSection = snapshot.url.at(-1)?.path ?? '';
    if (employeeRouteSections.includes(routeSection as EmployeeRouteSection)) {
      return routeSection as EmployeeRouteSection;
    }

    return 'contact';
  }

  private toFallbackDetailFromDirectory(source: EmployeeListItemModel): EmployeeDetailModel {
    return {
      id: -1,
      ruleSystemCode: source.ruleSystemCode,
      employeeTypeCode: source.employeeTypeCode,
      employeeNumber: source.employeeNumber,
      firstName: source.displayName,
      lastName1: '',
      lastName2: null,
      preferredName: source.displayName,
      displayName: source.displayName,
      statusLabel: source.statusLabel,
      workCenter: source.workCenter,
    };
  }

  private toUnknownDetail(key: EmployeeBusinessKey): EmployeeDetailModel {
    return {
      id: -1,
      ruleSystemCode: key.ruleSystemCode,
      employeeTypeCode: key.employeeTypeCode,
      employeeNumber: key.employeeNumber,
      firstName: this.texts.unknownEmployeeName,
      lastName1: '',
      lastName2: null,
      preferredName: this.texts.unknownEmployeeName,
      displayName: this.texts.unknownEmployeeName,
      statusLabel: this.texts.unknownEmployeeStatus,
      workCenter: this.texts.unknownEmployeeWorkCenter,
    };
  }
}
