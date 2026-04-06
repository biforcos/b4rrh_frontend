
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';

import { MasterDetailPageShellComponent } from '../../../../shared/ui/master-detail-page-shell/master-detail-page-shell.component';
import { MasterListPanelComponent, MasterListPanelEmptyState } from '../../../../shared/ui/master-list-panel/master-list-panel.component';
import { ListItemComponent } from '../../../../shared/ui/list-item/list-item.component';
import { UiTagComponent } from '../../../../shared/ui/tag/ui-tag.component';
import { EmployeeDetailStore } from '../../data-access/employee-detail.store';
import { EmployeeDirectoryStore } from '../../data-access/employee-directory.store';
import { EmployeeJourneyStore } from '../../data-access/employee-journey.store';
import { EmployeeContactStore } from '../../data-access/employee-contact.store';
import { EmployeePresenceStore } from '../../data-access/employee-presence.store';
import { EmployeeWorkCenterStore } from '../../data-access/employee-work-center.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeContactModel } from '../../models/employee-contact.model';
import { EmployeeCoreIdentityDraft } from '../../models/employee-core-identity-draft.model';
import { EmployeeDetailModel } from '../../models/employee-detail.model';
import { EmployeeListItemModel } from '../../models/employee-list-item.model';
import { EmployeePresenceModel } from '../../models/employee-presence.model';
import {
  buildEmployeeDetailRouteCommands,
  EmployeeRouteSection,
  employeeRouteSections,
} from '../../routing/employee-route-builder.util';
import { areEmployeeBusinessKeysEqual, readEmployeeBusinessKeyFromParamMap, toEmployeeBusinessKey } from '../../routing/employee-route-key.util';
import { EmployeeTerminatePanelComponent } from '../components/employee-terminate-panel.component';
import { EmployeePageHeaderComponent } from '../components/employee-page-header.component';
import { EmployeeDetailHeaderComponent } from '../components/employee-detail-header.component';
import { EmployeeJourneyTimelineComponent } from '../components/employee-journey-timeline.component';
import { EmployeeDetailNavComponent } from '../components/employee-detail-nav.component';

@Component({
  selector: 'app-employee-shell-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    MasterDetailPageShellComponent,
    MasterListPanelComponent,
    ListItemComponent,
    UiTagComponent,
    EmployeePageHeaderComponent,
    EmployeeDetailHeaderComponent,
    EmployeeJourneyTimelineComponent,
    EmployeeDetailNavComponent,
    EmployeeTerminatePanelComponent,
  ],
  templateUrl: './employee-shell-page.component.html',
  styleUrl: './employee-shell-page.component.scss',
})
export class EmployeeShellPageComponent {
  protected readonly isRehireWorkflow = computed(() => {
    let snapshot = this.route.snapshot;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    return snapshot.url.some((seg: any) => seg.path === 'rehire');
  });
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly directoryStore = inject(EmployeeDirectoryStore);
  private readonly detailStore = inject(EmployeeDetailStore);
  private readonly contactStore = inject(EmployeeContactStore);
  private readonly presenceStore = inject(EmployeePresenceStore);
  private readonly workCenterStore = inject(EmployeeWorkCenterStore);
  private readonly journeyStore = inject(EmployeeJourneyStore);

  protected readonly texts = employeeTexts;
  protected readonly searchValue = signal('');
  protected readonly filteredEmployees = this.directoryStore.filteredEmployees;
  protected readonly loadingDirectory = this.directoryStore.loading;
  protected readonly directoryError = this.directoryStore.error;
  protected readonly activeEmployeeKey = signal<EmployeeBusinessKey | null>(null);
  protected readonly activeDetailSection = signal<EmployeeRouteSection>('contact');
  protected readonly selectedEmployeeDetail = this.detailStore.selectedEmployeeDetail;
  protected readonly loadingDetail = this.detailStore.loadingDetail;
  protected readonly detailError = this.detailStore.detailError;
  protected readonly journey = this.journeyStore.journey;
  protected readonly loadingJourney = this.journeyStore.loading;
  protected readonly journeyError = this.journeyStore.error;
  protected readonly contacts = this.contactStore.contacts;
  protected readonly presences = this.presenceStore.presences;
  protected readonly workCenters = this.workCenterStore.workCenters;
  protected readonly updatingIdentity = this.detailStore.mutating;
  protected readonly updateIdentityError = computed(() => this.detailStore.mutationError() === 'request-failed');
  protected readonly updateIdentitySuccess = computed(() => this.detailStore.mutationSuccess() === 'updated');
  protected readonly openIdentityEditorRequestId = signal(0);
  protected readonly terminatePanelOpen = signal(false);
  protected readonly activeEmployeeListKey = computed(() => {
    const activeEmployeeKey = this.activeEmployeeKey();
    if (!activeEmployeeKey) {
      return null;
    }

    return this.employeeListKey(activeEmployeeKey);
  });
  protected readonly employeeListEmptyState = computed<MasterListPanelEmptyState>(() => {
    if (this.searchValue().trim()) {
      return {
        title: this.texts.noResultEmployeesTitle,
        description: this.texts.noResultEmployeesDescription,
      };
    }

    return {
      title: this.texts.emptyDirectoryTitle,
      description: this.texts.emptyDirectoryDescription,
    };
  });
  protected readonly selectedEmployee = computed<EmployeeDetailModel | null>(() => {
    const activeEmployeeKey = this.activeEmployeeKey();
    if (!activeEmployeeKey) {
      return null;
    }

    const selectedEmployeeDetail = this.selectedEmployeeDetail();
    if (selectedEmployeeDetail && areEmployeeBusinessKeysEqual(selectedEmployeeDetail, activeEmployeeKey)) {
      return selectedEmployeeDetail;
    }

    return null;
  });
  protected readonly headerStatus = computed<'ACTIVE' | 'TERMINATED'>(() => {
    const employee = this.selectedEmployee();
    if (!employee) {
      return 'TERMINATED';
    }

    const normalizedStatus = employee.statusLabel.trim().toLowerCase();
    if (normalizedStatus.includes('active') || normalizedStatus.includes('alta')) {
      return 'ACTIVE';
    }

    return 'TERMINATED';
  });
  protected readonly activePresence = computed(() => this.resolveActivePresence(this.presences()));
  protected readonly headerCompany = computed(() => {
    const presence = this.activePresence();
    if (!presence) {
      return this.texts.employeePageHeaderEmptyValue;
    }

    const candidate = [presence.companyName ?? '', presence.companyCode]
      .map((value) => value.trim())
      .find((value) => value.length > 0);

    return candidate ?? this.texts.employeePageHeaderEmptyValue;
  });
  protected readonly headerWorkCenter = computed(() => this.resolveHeaderWorkCenter(this.workCenters(), this.selectedEmployee()));
  protected readonly headerHireDate = computed(() => {
    const presences = this.presences();
    if (presences.length === 0) {
      return this.texts.employeePageHeaderEmptyValue;
    }

    const earliestPresence = [...presences].sort((left, right) => left.startDate.localeCompare(right.startDate))[0];

    return earliestPresence?.startDate ?? this.texts.employeePageHeaderEmptyValue;
  });
  protected readonly headerEmail = computed(() => this.findPreferredContactValue(this.contacts(), 'email'));
  protected readonly headerPhone = computed(() => this.findPreferredContactValue(this.contacts(), 'phone'));

  constructor() {
    this.directoryStore.setQuery(this.searchValue());

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
        this.contactStore.loadContactsByBusinessKey(activeEmployeeKey);
        this.presenceStore.loadPresencesByBusinessKey(activeEmployeeKey);
        this.workCenterStore.loadWorkCenters(activeEmployeeKey);
        this.journeyStore.loadJourneyByBusinessKey(activeEmployeeKey);
      });
  }

  protected openIdentityEditorFromHeader(): void {
    this.detailStore.clearMutationFeedback();
    this.openIdentityEditorRequestId.update((value) => value + 1);
  }

  protected openTerminatePanel(): void {
    this.terminatePanelOpen.set(true);
  }

  protected closeTerminatePanel(): void {
    this.terminatePanelOpen.set(false);
  }

  protected submitIdentityUpdate(draft: EmployeeCoreIdentityDraft): void {
    const employeeKey = this.activeEmployeeKey();
    if (!employeeKey) {
      return;
    }

    this.detailStore.updateEmployeeCoreIdentity(employeeKey, draft);
  }

  protected clearIdentityFeedback(): void {
    this.detailStore.clearMutationFeedback();
  }

  protected onHireClick(): void {
    void this.router.navigate(['hire'], { relativeTo: this.route });
  }

  protected updateSearchValue(value: string): void {
    this.searchValue.set(value);
    this.directoryStore.setQuery(value);
  }

  protected openEmployeeListItem(employee: EmployeeListItemModel): void {
    void this.openEmployeeDetail(toEmployeeBusinessKey(employee), 'contact');
  }

  protected employeeListKey(employee: Pick<EmployeeBusinessKey, 'ruleSystemCode' | 'employeeTypeCode' | 'employeeNumber'>): string {
    return `${employee.ruleSystemCode}::${employee.employeeTypeCode}::${employee.employeeNumber}`;
  }

  protected resolveEmployeeStatusLabel(statusLabel: string): string {
    const normalizedStatus = statusLabel.trim().toLowerCase();
    if (normalizedStatus.includes('active') || normalizedStatus.includes('alta')) {
      return this.texts.employeeStatusActiveLabel;
    }

    if (normalizedStatus.includes('pending') || normalizedStatus.includes('draft')) {
      return this.texts.employeeStatusPendingLabel;
    }

    return this.texts.employeeStatusInactiveLabel;
  }

  protected resolveEmployeeStatusSeverity(statusLabel: string): 'success' | 'secondary' | 'warn' {
    const normalizedStatus = statusLabel.trim().toLowerCase();
    if (normalizedStatus.includes('active') || normalizedStatus.includes('alta')) {
      return 'success';
    }

    if (normalizedStatus.includes('pending') || normalizedStatus.includes('draft')) {
      return 'warn';
    }

    return 'secondary';
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

  private resolveActivePresence(presences: ReadonlyArray<EmployeePresenceModel>): EmployeePresenceModel | null {
    if (presences.length === 0) {
      return null;
    }

    const activePresence = presences.find((presence) => presence.isActive);
    if (activePresence) {
      return activePresence;
    }

    return [...presences].sort((left, right) => right.startDate.localeCompare(left.startDate))[0] ?? null;
  }

  private resolveHeaderWorkCenter(
    workCenters: ReadonlyArray<import('../../models/employee-work-center.model').EmployeeWorkCenterModel>,
    employee: import('../../models/employee-detail.model').EmployeeDetailModel | null,
  ): string {
    // Prefer an explicitly active work center assignment
    if (workCenters && workCenters.length > 0) {
      const active = workCenters.find((w) => w.isActive);
      if (active) {
        return (active.workCenterName ?? active.workCenterCode ?? '').trim() || this.texts.employeePageHeaderEmptyValue;
      }

      // Fallback to most recent by startDate
      const recent = [...workCenters].sort((l, r) => r.startDate.localeCompare(l.startDate))[0];
      if (recent) {
        return (recent.workCenterName ?? recent.workCenterCode ?? '').trim() || this.texts.employeePageHeaderEmptyValue;
      }
    }

    // Fall back to employee.workCenter (directory or detail mapping)
    if (employee && employee.workCenter) {
      return employee.workCenter;
    }

    return this.texts.employeePageHeaderEmptyValue;
  }

  private findPreferredContactValue(
    contacts: ReadonlyArray<EmployeeContactModel>,
    type: EmployeeContactModel['type'],
  ): string {
    const directMatch = contacts.find((contact) => contact.type === type);
    const value = directMatch?.value?.trim() ?? '';

    return value.length > 0 ? value : this.texts.employeePageHeaderEmptyValue;
  }

  protected onRehireRequested(): void {
    const key = this.activeEmployeeKey();
    if (!key) return;
    void this.router.navigate([
      '/personas/empleados',
      key.ruleSystemCode,
      key.employeeTypeCode,
      key.employeeNumber,
      'rehire',
    ]);
  }
}
