import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeContractSectionComponent } from '../components/employee-contract-section.component';
import {
  EmployeePresenceBlockComponent,
  EmployeePresenceBlockItemModel,
  EmployeePresenceBlockModel,
  EmployeePresenceCurrentKind,
} from '../components/employee-presence-block.component';
import { EmployeeLaborClassificationSectionComponent } from '../components/employee-labor-classification-section.component';
import { EmployeeWorkingTimeSectionComponent } from '../components/employee-working-time-section.component';
import { EmployeePresenceStore } from '../../data-access/employee-presence.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeePresenceModel } from '../../models/employee-presence.model';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-presence-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmployeePresenceBlockComponent,
    EmployeeContractSectionComponent,
    EmployeeWorkingTimeSectionComponent,
    EmployeeLaborClassificationSectionComponent,
  ],
  templateUrl: './employee-presence-page.component.html',
  styleUrl: './employee-presence-page.component.scss',
})
export class EmployeePresencePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeePresenceStore = inject(EmployeePresenceStore);
  private readonly fieldCatalogService = inject(EmployeeFieldCatalogService);

  private readonly companyCatalogLabelsByCodeState = signal<Readonly<Record<string, string>>>({});
  private readonly entryReasonCatalogLabelsByCodeState = signal<Readonly<Record<string, string>>>({});
  private readonly exitReasonCatalogLabelsByCodeState = signal<Readonly<Record<string, string>>>({});
  private readonly companyCatalogLoadingState = signal(false);
  private readonly entryReasonCatalogLoadingState = signal(false);
  private readonly exitReasonCatalogLoadingState = signal(false);

  private presenceCatalogRequestId = 0;

  protected readonly texts = employeeTexts;
  protected readonly activeEmployeeKey = toSignal(
    this.route.paramMap.pipe(map((params) => readEmployeeBusinessKeyFromParamMap(params))),
    {
      initialValue: readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap),
    },
  );
  protected readonly presences = this.employeePresenceStore.presences;
  protected readonly loadingPresences = this.employeePresenceStore.loading;
  protected readonly presencesError = this.employeePresenceStore.error;
  protected readonly laborAreaLoading = computed(() => this.loadingPresences());
  protected readonly companyCatalogLabelsByCode = this.companyCatalogLabelsByCodeState;
  protected readonly entryReasonCatalogLabelsByCode = this.entryReasonCatalogLabelsByCodeState;
  protected readonly exitReasonCatalogLabelsByCode = this.exitReasonCatalogLabelsByCodeState;
  protected readonly presenceCatalogLoading = computed(
    () =>
      this.companyCatalogLoadingState()
      || this.entryReasonCatalogLoadingState()
      || this.exitReasonCatalogLoadingState(),
  );
  protected readonly presenceBlockModel = computed<EmployeePresenceBlockModel>(() =>
    this.toPresenceBlockModel(this.presences()),
  );

  constructor() {
    effect(() => {
      const activeEmployeeKey = this.activeEmployeeKey();
      this.employeePresenceStore.loadPresencesByBusinessKey(activeEmployeeKey);
      this.loadPresenceCatalogOptions(activeEmployeeKey?.ruleSystemCode ?? null);
    });
  }

  private loadPresenceCatalogOptions(ruleSystemCode: string | null): void {
    const normalizedRuleSystemCode = ruleSystemCode?.trim() ?? '';

    if (!normalizedRuleSystemCode) {
      this.presenceCatalogRequestId += 1;
      this.companyCatalogLoadingState.set(false);
      this.entryReasonCatalogLoadingState.set(false);
      this.exitReasonCatalogLoadingState.set(false);
      this.companyCatalogLabelsByCodeState.set({});
      this.entryReasonCatalogLabelsByCodeState.set({});
      this.exitReasonCatalogLabelsByCodeState.set({});
      return;
    }

    const requestId = ++this.presenceCatalogRequestId;

    this.loadSinglePresenceCatalog(
      requestId,
      () => this.companyCatalogLoadingState.set(true),
      () => this.companyCatalogLoadingState.set(false),
      (value) => this.companyCatalogLabelsByCodeState.set(value),
      this.fieldCatalogService.loadPresenceCompanyOptions(normalizedRuleSystemCode),
    );

    this.loadSinglePresenceCatalog(
      requestId,
      () => this.entryReasonCatalogLoadingState.set(true),
      () => this.entryReasonCatalogLoadingState.set(false),
      (value) => this.entryReasonCatalogLabelsByCodeState.set(value),
      this.fieldCatalogService.loadPresenceEntryReasonOptions(normalizedRuleSystemCode),
    );

    this.loadSinglePresenceCatalog(
      requestId,
      () => this.exitReasonCatalogLoadingState.set(true),
      () => this.exitReasonCatalogLoadingState.set(false),
      (value) => this.exitReasonCatalogLabelsByCodeState.set(value),
      this.fieldCatalogService.loadPresenceExitReasonOptions(normalizedRuleSystemCode),
    );
  }

  private loadSinglePresenceCatalog(
    requestId: number,
    startLoading: () => void,
    stopLoading: () => void,
    setTarget: (value: Readonly<Record<string, string>>) => void,
    options$: Observable<ReadonlyArray<{ value: string; label: string }>>,
  ): void {
    startLoading();

    options$.pipe(take(1)).subscribe({
      next: (options) => {
        if (requestId !== this.presenceCatalogRequestId) {
          return;
        }

        setTarget(this.toLabelMapByCode(options));
        stopLoading();
      },
      error: () => {
        if (requestId !== this.presenceCatalogRequestId) {
          return;
        }

        stopLoading();
      },
    });
  }

  private toLabelMapByCode(
    options: ReadonlyArray<{ value: string; label: string }>,
  ): Readonly<Record<string, string>> {
    return options.reduce<Record<string, string>>((accumulator, option) => {
      accumulator[option.value] = option.label;
      return accumulator;
    }, {});
  }

  private toPresenceBlockModel(presences: ReadonlyArray<EmployeePresenceModel>): EmployeePresenceBlockModel {
    if (presences.length === 0) {
      return {
        currentPresence: null,
        currentPresenceKind: null,
        presenceHistory: [],
      };
    }

    const sortedPresences = [...presences].sort((left, right) => this.comparePresenceRecency(left, right));
    const activePresences = sortedPresences.filter((presence) => presence.isActive);

    let currentPresence: EmployeePresenceModel;
    let currentPresenceKind: EmployeePresenceCurrentKind;

    if (activePresences.length === 1) {
      currentPresence = activePresences[0];
      currentPresenceKind = 'active';
    } else if (activePresences.length > 1) {
      currentPresence = activePresences[0];
      currentPresenceKind = 'active-most-recent';
    } else {
      currentPresence = sortedPresences[0];
      currentPresenceKind = 'latest-closed';
    }

    return {
      currentPresence: this.toPresenceBlockItemModel(currentPresence),
      currentPresenceKind,
      presenceHistory: sortedPresences
        .filter((presence) => !this.isSamePresence(presence, currentPresence))
        .map((presence) => this.toPresenceBlockItemModel(presence)),
    };
  }

  private comparePresenceRecency(left: EmployeePresenceModel, right: EmployeePresenceModel): number {
    const startDateOrder = right.startDate.localeCompare(left.startDate);
    if (startDateOrder !== 0) {
      return startDateOrder;
    }

    return right.presenceNumber - left.presenceNumber;
  }

  private isSamePresence(left: EmployeePresenceModel, right: EmployeePresenceModel): boolean {
    return left.presenceNumber === right.presenceNumber && left.startDate === right.startDate;
  }

  private toPresenceBlockItemModel(presence: EmployeePresenceModel): EmployeePresenceBlockItemModel {
    return {
      presenceNumber: presence.presenceNumber,
      companyCode: presence.companyCode,
      companyName: presence.companyName ?? null,
      entryReasonCode: presence.entryReasonCode,
      entryReasonName: presence.entryReasonName ?? null,
      exitReasonCode: presence.exitReasonCode,
      exitReasonName: presence.exitReasonName ?? null,
      startDate: presence.startDate,
      endDate: presence.endDate,
      isActive: presence.isActive,
    };
  }
}
