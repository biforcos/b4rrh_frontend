import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import {
  EmployeePresenceBlockComponent,
  EmployeePresenceBlockItemModel,
  EmployeePresenceBlockModel,
  EmployeePresenceCurrentKind,
} from '../components/employee-presence-block.component';
import { EmployeePresenceStore } from '../../data-access/employee-presence.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeePresenceModel } from '../../models/employee-presence.model';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-presence-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeePresenceBlockComponent],
  templateUrl: './employee-presence-page.component.html',
  styleUrl: './employee-presence-page.component.scss',
})
export class EmployeePresencePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeePresenceStore = inject(EmployeePresenceStore);

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
  protected readonly presenceBlockModel = computed<EmployeePresenceBlockModel>(() =>
    this.toPresenceBlockModel(this.presences()),
  );

  constructor() {
    effect(() => {
      this.employeePresenceStore.loadPresencesByBusinessKey(this.activeEmployeeKey());
    });
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
      entryReasonCode: presence.entryReasonCode,
      exitReasonCode: presence.exitReasonCode,
      startDate: presence.startDate,
      endDate: presence.endDate,
      isActive: presence.isActive,
    };
  }
}
