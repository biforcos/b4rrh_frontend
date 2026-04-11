import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { UiTagComponent } from '../../../../shared/ui/tag/ui-tag.component';
import { EmployeeDetailStore } from '../../data-access/employee-detail.store';
import { EmployeePresenceStore } from '../../data-access/employee-presence.store';
import { EmployeeContractStore } from '../../data-access/employee-contract.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeePresenceModel } from '../../models/employee-presence.model';
import { EmployeeContractModel } from '../../models/employee-contract.model';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';
import { buildEmployeeDetailRouteCommands } from '../../routing/employee-route-builder.util';

@Component({
  selector: 'app-employee-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiTagComponent, DatePipe],
  templateUrl: './employee-overview-page.component.html',
  styleUrl: './employee-overview-page.component.scss',
})
export class EmployeeOverviewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly detailStore = inject(EmployeeDetailStore);
  private readonly presenceStore = inject(EmployeePresenceStore);
  private readonly contractStore = inject(EmployeeContractStore);

  protected readonly texts = employeeTexts;

  protected readonly activeEmployeeKey = toSignal(
    this.route.paramMap.pipe(map((params) => readEmployeeBusinessKeyFromParamMap(params))),
    { initialValue: readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap) },
  );

  protected readonly employee = this.detailStore.selectedEmployeeDetail;
  protected readonly loadingDetail = this.detailStore.loadingDetail;
  protected readonly presences = this.presenceStore.presences;
  protected readonly loadingPresences = this.presenceStore.loading;
  protected readonly contracts = this.contractStore.contracts;
  protected readonly loadingContracts = this.contractStore.loading;

  protected readonly loading = computed(
    () => this.loadingDetail() || this.loadingPresences() || this.loadingContracts(),
  );

  protected readonly status = computed(() => {
    const emp = this.employee();
    if (!emp) return null;
    const normalized = emp.statusLabel.trim().toLowerCase();
    return normalized.includes('active') || normalized.includes('alta')
      ? ('active' as const)
      : ('inactive' as const);
  });

  protected readonly statusLabel = computed(() => {
    const s = this.status();
    if (s === 'active') return this.texts.employeeStatusActiveLabel;
    if (s === 'inactive') return this.texts.employeeStatusInactiveLabel;
    return null;
  });

  protected readonly statusSeverity = computed(() =>
    this.status() === 'active' ? ('success' as const) : ('secondary' as const),
  );

  protected readonly activePresence = computed(() => this.resolveActivePresence(this.presences()));

  protected readonly company = computed(() => {
    const p = this.activePresence();
    if (!p) return null;
    return p.companyName?.trim() || p.companyCode.trim() || null;
  });

  protected readonly hireDate = computed(() => {
    const presences = this.presences();
    if (presences.length === 0) return null;
    return (
      [...presences].sort((a, b) => a.startDate.localeCompare(b.startDate))[0]?.startDate ?? null
    );
  });

  protected readonly activeContract = computed(() => this.resolveActiveContract(this.contracts()));

  constructor() {
    effect(() => {
      this.contractStore.loadContractsByBusinessKey(this.activeEmployeeKey());
    });
  }

  protected navigateTo(section: 'contact' | 'presence' | 'organization'): void {
    const key = this.activeEmployeeKey();
    if (!key) return;
    void this.router.navigate(buildEmployeeDetailRouteCommands(key, section));
  }

  private resolveActivePresence(
    presences: ReadonlyArray<EmployeePresenceModel>,
  ): EmployeePresenceModel | null {
    if (presences.length === 0) return null;
    const active = presences.find((p) => p.isActive);
    if (active) return active;
    return [...presences].sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;
  }

  private resolveActiveContract(
    contracts: ReadonlyArray<EmployeeContractModel>,
  ): EmployeeContractModel | null {
    if (contracts.length === 0) return null;
    const active = contracts.find((c) => c.isActive);
    if (active) return active;
    return [...contracts].sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;
  }
}
