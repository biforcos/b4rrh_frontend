import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import {
  EmployeeContractBlockComponent,
  EmployeeContractBlockItemModel,
  EmployeeContractBlockModel,
  EmployeeContractCurrentKind,
} from '../components/employee-contract-block.component';
import {
  EmployeeLaborClassificationBlockComponent,
  EmployeeLaborClassificationBlockItemModel,
  EmployeeLaborClassificationBlockModel,
  EmployeeLaborClassificationCurrentKind,
} from '../components/employee-labor-classification-block.component';
import {
  EmployeePresenceBlockComponent,
  EmployeePresenceBlockItemModel,
  EmployeePresenceBlockModel,
  EmployeePresenceCurrentKind,
} from '../components/employee-presence-block.component';
import { EmployeeLaborClassificationStore } from '../../data-access/employee-labor-classification.store';
import { EmployeeContractStore } from '../../data-access/employee-contract.store';
import { EmployeePresenceStore } from '../../data-access/employee-presence.store';
import { EmployeeContractModel } from '../../models/employee-contract.model';
import { EmployeeLaborClassificationModel } from '../../models/employee-labor-classification.model';
import { employeeTexts } from '../../employee.texts';
import { EmployeePresenceModel } from '../../models/employee-presence.model';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-presence-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmployeePresenceBlockComponent,
    EmployeeContractBlockComponent,
    EmployeeLaborClassificationBlockComponent,
  ],
  templateUrl: './employee-presence-page.component.html',
  styleUrl: './employee-presence-page.component.scss',
})
export class EmployeePresencePageComponent {
  private readonly employeeLaborClassificationStore = inject(EmployeeLaborClassificationStore);
  private readonly employeeContractStore = inject(EmployeeContractStore);
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
  protected readonly contracts = this.employeeContractStore.contracts;
  protected readonly loadingContracts = this.employeeContractStore.loading;
  protected readonly contractsError = this.employeeContractStore.error;
  protected readonly laborClassifications = this.employeeLaborClassificationStore.laborClassifications;
  protected readonly loadingLaborClassifications = this.employeeLaborClassificationStore.loading;
  protected readonly laborClassificationsError = this.employeeLaborClassificationStore.error;
  protected readonly laborAreaLoading = computed(
    () => this.loadingPresences() || this.loadingContracts() || this.loadingLaborClassifications(),
  );
  protected readonly presenceBlockModel = computed<EmployeePresenceBlockModel>(() =>
    this.toPresenceBlockModel(this.presences()),
  );
  protected readonly contractBlockModel = computed<EmployeeContractBlockModel>(() =>
    this.toContractBlockModel(this.contracts()),
  );
  protected readonly classificationBlockModel = computed<EmployeeLaborClassificationBlockModel>(() =>
    this.toLaborClassificationBlockModel(this.laborClassifications()),
  );

  constructor() {
    effect(() => {
      this.employeeLaborClassificationStore.loadLaborClassificationsByBusinessKey(
        this.activeEmployeeKey(),
      );
      this.employeeContractStore.loadContractsByBusinessKey(this.activeEmployeeKey());
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

  private toContractBlockModel(contracts: ReadonlyArray<EmployeeContractModel>): EmployeeContractBlockModel {
    if (contracts.length === 0) {
      return {
        currentContract: null,
        currentContractKind: null,
        contractHistory: [],
      };
    }

    const sortedContracts = [...contracts].sort((left, right) => this.compareContractRecency(left, right));
    const activeContracts = sortedContracts.filter((contract) => contract.isActive);

    let currentContract: EmployeeContractModel;
    let currentContractKind: EmployeeContractCurrentKind;

    // Domain rule for UI: prefer active (endDate missing); if none active, show most recent period.
    if (activeContracts.length === 1) {
      currentContract = activeContracts[0];
      currentContractKind = 'active';
    } else if (activeContracts.length > 1) {
      currentContract = activeContracts[0];
      currentContractKind = 'active-most-recent';
    } else {
      currentContract = sortedContracts[0];
      currentContractKind = 'latest-closed';
    }

    return {
      currentContract: this.toContractBlockItemModel(currentContract),
      currentContractKind,
      contractHistory: sortedContracts
        .filter((contract) => !this.isSameContract(contract, currentContract))
        .map((contract) => this.toContractBlockItemModel(contract)),
    };
  }

  private compareContractRecency(left: EmployeeContractModel, right: EmployeeContractModel): number {
    const startDateOrder = right.startDate.localeCompare(left.startDate);
    if (startDateOrder !== 0) {
      return startDateOrder;
    }

    const contractCodeOrder = right.contractCode.localeCompare(left.contractCode);
    if (contractCodeOrder !== 0) {
      return contractCodeOrder;
    }

    const leftSubtype = left.contractSubtypeCode ?? '';
    const rightSubtype = right.contractSubtypeCode ?? '';
    return rightSubtype.localeCompare(leftSubtype);
  }

  private isSameContract(left: EmployeeContractModel, right: EmployeeContractModel): boolean {
    return (
      left.contractCode === right.contractCode &&
      left.contractSubtypeCode === right.contractSubtypeCode &&
      left.startDate === right.startDate
    );
  }

  private toContractBlockItemModel(contract: EmployeeContractModel): EmployeeContractBlockItemModel {
    return {
      contractCode: contract.contractCode,
      contractSubtypeCode: contract.contractSubtypeCode,
      startDate: contract.startDate,
      endDate: contract.endDate,
      isActive: contract.isActive,
    };
  }

  private toLaborClassificationBlockModel(
    laborClassifications: ReadonlyArray<EmployeeLaborClassificationModel>,
  ): EmployeeLaborClassificationBlockModel {
    if (laborClassifications.length === 0) {
      return {
        currentClassification: null,
        currentClassificationKind: null,
        classificationHistory: [],
      };
    }

    const sortedClassifications = [...laborClassifications].sort((left, right) =>
      this.compareLaborClassificationRecency(left, right),
    );
    const activeClassifications = sortedClassifications.filter((classification) => classification.isActive);

    let currentClassification: EmployeeLaborClassificationModel;
    let currentClassificationKind: EmployeeLaborClassificationCurrentKind;

    // Domain rule for UI: prefer active (endDate missing); if several are active, keep the most recent.
    if (activeClassifications.length === 1) {
      currentClassification = activeClassifications[0];
      currentClassificationKind = 'active';
    } else if (activeClassifications.length > 1) {
      currentClassification = activeClassifications[0];
      currentClassificationKind = 'active-most-recent';
    } else {
      currentClassification = sortedClassifications[0];
      currentClassificationKind = 'latest-closed';
    }

    return {
      currentClassification: this.toLaborClassificationBlockItemModel(currentClassification),
      currentClassificationKind,
      classificationHistory: sortedClassifications
        .filter(
          (classification) => !this.isSameLaborClassification(classification, currentClassification),
        )
        .map((classification) => this.toLaborClassificationBlockItemModel(classification)),
    };
  }

  private compareLaborClassificationRecency(
    left: EmployeeLaborClassificationModel,
    right: EmployeeLaborClassificationModel,
  ): number {
    const startDateOrder = right.startDate.localeCompare(left.startDate);
    if (startDateOrder !== 0) {
      return startDateOrder;
    }

    const agreementCodeOrder = right.agreementCode.localeCompare(left.agreementCode);
    if (agreementCodeOrder !== 0) {
      return agreementCodeOrder;
    }

    return right.agreementCategoryCode.localeCompare(left.agreementCategoryCode);
  }

  private isSameLaborClassification(
    left: EmployeeLaborClassificationModel,
    right: EmployeeLaborClassificationModel,
  ): boolean {
    return (
      left.agreementCode === right.agreementCode &&
      left.agreementCategoryCode === right.agreementCategoryCode &&
      left.startDate === right.startDate
    );
  }

  private toLaborClassificationBlockItemModel(
    classification: EmployeeLaborClassificationModel,
  ): EmployeeLaborClassificationBlockItemModel {
    return {
      agreementCode: classification.agreementCode,
      agreementCategoryCode: classification.agreementCategoryCode,
      startDate: classification.startDate,
      endDate: classification.endDate,
      isActive: classification.isActive,
    };
  }
}
