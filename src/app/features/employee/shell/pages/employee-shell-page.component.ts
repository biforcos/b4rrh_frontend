import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';

import { MasterDetailPageShellComponent } from '../../../../shared/ui/master-detail-page-shell/master-detail-page-shell.component';
import {
  MasterListPanelComponent,
  MasterListPanelEmptyState,
} from '../../../../shared/ui/master-list-panel/master-list-panel.component';
import { ListItemComponent } from '../../../../shared/ui/list-item/list-item.component';
import { UiTagComponent } from '../../../../shared/ui/tag/ui-tag.component';
import { GlobalMessageService } from '../../data-access/employee-global-message.store';
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
import {
  areEmployeeBusinessKeysEqual,
  readEmployeeBusinessKeyFromParamMap,
  toEmployeeBusinessKey,
} from '../../routing/employee-route-key.util';
import { EmployeeTerminatePanelComponent } from '../components/employee-terminate-panel.component';
import { EmployeePageHeaderComponent } from '../components/employee-page-header.component';
import { EmployeeDetailHeaderComponent } from '../components/employee-detail-header.component';
import { EmployeeJourneyTimelineComponent } from '../components/employee-journey-timeline.component';
import { EmployeeDetailNavComponent } from '../components/employee-detail-nav.component';
import { GlobalMessageRailComponent } from '../components/global-message-rail.component';
import { GlobalUiMessage } from '../../models/global-ui-message.model';

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
    GlobalMessageRailComponent,
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
  private readonly globalMessageService = inject(GlobalMessageService);
  private highlightedSectionResetHandle: number | null = null;
  private previousIdentitySuccess: 'updated' | null = null;

  protected readonly texts = employeeTexts;
  protected readonly searchValue = signal('');
  protected readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  protected readonly filteredEmployees = this.directoryStore.filteredEmployees;
  protected readonly displayedEmployees = computed(() => {
    const filter = this.statusFilter();
    const employees = this.filteredEmployees();
    if (filter === 'all') return employees;
    return employees.filter((e) => {
      const normalized = e.statusLabel.trim().toLowerCase();
      const isActive = normalized.includes('active') || normalized.includes('alta');
      return filter === 'active' ? isActive : !isActive;
    });
  });
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
  protected readonly globalMessages = this.globalMessageService.messages;
  protected readonly globalMessageSummary = this.globalMessageService.summary;
  protected readonly globalMessageExpanded = this.globalMessageService.expanded;
  protected readonly updatingIdentity = this.detailStore.mutating;
  protected readonly updateIdentityError = computed(
    () => this.detailStore.mutationError() === 'request-failed',
  );
  protected readonly updateIdentitySuccess = computed(
    () => this.detailStore.mutationSuccess() === 'updated',
  );
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
    if (
      selectedEmployeeDetail &&
      areEmployeeBusinessKeysEqual(selectedEmployeeDetail, activeEmployeeKey)
    ) {
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
  protected readonly headerWorkCenter = computed(() =>
    this.resolveHeaderWorkCenter(this.workCenters(), this.selectedEmployee()),
  );
  protected readonly headerHireDate = computed(() => {
    const presences = this.presences();
    if (presences.length === 0) {
      return this.texts.employeePageHeaderEmptyValue;
    }

    const earliestPresence = [...presences].sort((left, right) =>
      left.startDate.localeCompare(right.startDate),
    )[0];

    return earliestPresence?.startDate ?? this.texts.employeePageHeaderEmptyValue;
  });
  protected readonly headerEmail = computed(() =>
    this.findPreferredContactValue(this.contacts(), 'email'),
  );
  protected readonly headerPhone = computed(() =>
    this.findPreferredContactValue(this.contacts(), 'phone'),
  );

  constructor() {
    this.directoryStore.setQuery(this.searchValue());

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const previousEmployeeKey = this.activeEmployeeKey();
        const activeEmployeeKey = this.resolveActiveEmployeeKey();
        const shouldForceRefresh = this.shouldForceRefreshAfterRehire();
        if (!areEmployeeBusinessKeysEqual(previousEmployeeKey, activeEmployeeKey)) {
          this.globalMessageService.reset();
        }
        this.activeEmployeeKey.set(activeEmployeeKey);
        this.activeDetailSection.set(this.resolveActiveDetailSection());

        if (shouldForceRefresh) {
          this.directoryStore.refreshDirectory();
          this.detailStore.refreshEmployeeDetailByBusinessKey(activeEmployeeKey);
          this.presenceStore.refreshPresencesByBusinessKey(activeEmployeeKey);
          this.workCenterStore.refreshWorkCenters(activeEmployeeKey);
          this.journeyStore.refreshJourneyByBusinessKey(activeEmployeeKey);
        } else {
          this.detailStore.loadEmployeeDetailByBusinessKey(activeEmployeeKey);
          this.presenceStore.loadPresencesByBusinessKey(activeEmployeeKey);
          this.workCenterStore.loadWorkCenters(activeEmployeeKey);
          this.journeyStore.loadJourneyByBusinessKey(activeEmployeeKey);
        }

        this.contactStore.loadContactsByBusinessKey(activeEmployeeKey);

        if (shouldForceRefresh) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { refresh: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      });

    effect((onCleanup) => {
      const messages = this.buildShellMessages();
      untracked(() => {
        this.globalMessageService.setSourceMessages('employee-shell-page', messages);
      });
      onCleanup(() => {
        untracked(() => this.globalMessageService.clearSourceMessages('employee-shell-page'));
      });
    });

    effect(() => {
      const identitySuccess = this.detailStore.mutationSuccess();
      if (identitySuccess && identitySuccess !== this.previousIdentitySuccess) {
        untracked(() => {
          this.globalMessageService.success(this.texts.detailHeaderUpdateSuccessMessage, {
            id: 'employee-shell-identity-updated',
            sectionId: 'overview',
            sectionLabel: this.texts.detailPanelTitle,
          });
        });
      }
      this.previousIdentitySuccess = identitySuccess;
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

  protected expandGlobalMessages(): void {
    this.globalMessageService.expand();
  }

  protected closeGlobalMessages(): void {
    const summary = this.globalMessageSummary();
    if (summary.errorCount === 0 && summary.warningCount === 0) {
      this.globalMessageService.dismissTransientMessages();
      return;
    }

    this.globalMessageService.collapse();
  }

  protected toggleGlobalMessages(): void {
    this.globalMessageService.toggleExpanded();
  }

  protected navigateToMessageSection(message: GlobalUiMessage): void {
    const sectionId = message.sectionId?.trim();
    if (!sectionId) {
      return;
    }

    const activeEmployeeKey = this.activeEmployeeKey();
    if (!activeEmployeeKey) {
      return;
    }

    if (employeeRouteSections.includes(sectionId as EmployeeRouteSection)) {
      const routeSection = sectionId as EmployeeRouteSection;
      if (this.activeDetailSection() !== routeSection) {
        void this.openEmployeeDetail(activeEmployeeKey, routeSection).then((navigated) => {
          if (navigated) {
            this.scheduleSectionFocus(sectionId);
          }
        });
        return;
      }
    }

    this.focusSection(sectionId);
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

  protected setStatusFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(filter);
  }

  protected openEmployeeListItem(employee: EmployeeListItemModel): void {
    void this.openEmployeeDetail(toEmployeeBusinessKey(employee), 'contact');
  }

  protected employeeListKey(
    employee: Pick<EmployeeBusinessKey, 'ruleSystemCode' | 'employeeTypeCode' | 'employeeNumber'>,
  ): string {
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

  private resolveActivePresence(
    presences: ReadonlyArray<EmployeePresenceModel>,
  ): EmployeePresenceModel | null {
    if (presences.length === 0) {
      return null;
    }

    const activePresence = presences.find((presence) => presence.isActive);
    if (activePresence) {
      return activePresence;
    }

    return (
      [...presences].sort((left, right) => right.startDate.localeCompare(left.startDate))[0] ?? null
    );
  }

  private resolveHeaderWorkCenter(
    workCenters: ReadonlyArray<
      import('../../models/employee-work-center.model').EmployeeWorkCenterModel
    >,
    employee: import('../../models/employee-detail.model').EmployeeDetailModel | null,
  ): string {
    // Prefer an explicitly active work center assignment
    if (workCenters && workCenters.length > 0) {
      const active = workCenters.find((w) => w.isActive);
      if (active) {
        return (
          (active.workCenterName ?? active.workCenterCode ?? '').trim() ||
          this.texts.employeePageHeaderEmptyValue
        );
      }

      // Fallback to most recent by startDate
      const recent = [...workCenters].sort((l, r) => r.startDate.localeCompare(l.startDate))[0];
      if (recent) {
        return (
          (recent.workCenterName ?? recent.workCenterCode ?? '').trim() ||
          this.texts.employeePageHeaderEmptyValue
        );
      }
    }

    // Fall back to employee.workCenter (directory or detail mapping)
    if (employee && employee.workCenter) {
      return employee.workCenter;
    }

    return this.texts.employeePageHeaderEmptyValue;
  }

  private buildShellMessages(): ReadonlyArray<Omit<GlobalUiMessage, 'createdAt'>> {
    const messages: Array<Omit<GlobalUiMessage, 'createdAt'>> = [];

    if (this.detailError() === 'not-found') {
      messages.push({
        id: 'employee-detail-not-found',
        level: 'warning',
        text: this.texts.detailNotFoundMessage,
        sectionId: 'overview',
        sectionLabel: this.texts.detailPanelTitle,
        sticky: true,
      });
    }

    if (this.detailError() === 'request-failed') {
      messages.push({
        id: 'employee-detail-load-error',
        level: 'error',
        text: this.texts.detailLoadFailedMessage,
        sectionId: 'overview',
        sectionLabel: this.texts.detailPanelTitle,
        sticky: true,
      });
    }

    if (this.updateIdentityError()) {
      messages.push({
        id: 'employee-identity-update-error',
        level: 'error',
        text: this.texts.detailHeaderUpdateErrorMessage,
        sectionId: 'overview',
        sectionLabel: this.texts.detailPanelTitle,
        sticky: true,
      });
    }

    return messages;
  }

  private scheduleSectionFocus(sectionId: string): void {
    window.setTimeout(() => this.focusSection(sectionId), 120);
  }

  private focusSection(sectionId: string): void {
    const target = document.getElementById(this.buildSectionAnchorId(sectionId));
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('employee-shell__section-highlight');

    if (this.highlightedSectionResetHandle !== null) {
      window.clearTimeout(this.highlightedSectionResetHandle);
    }

    this.highlightedSectionResetHandle = window.setTimeout(() => {
      target.classList.remove('employee-shell__section-highlight');
      this.highlightedSectionResetHandle = null;
    }, 1800);
  }

  private buildSectionAnchorId(sectionId: string): string {
    return `employee-section-${sectionId}`;
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

  private shouldForceRefreshAfterRehire(): boolean {
    let snapshot = this.route.snapshot;

    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return snapshot.queryParamMap.get('refresh') === 'rehire';
  }
}
