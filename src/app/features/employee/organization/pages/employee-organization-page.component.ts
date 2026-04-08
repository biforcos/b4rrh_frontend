import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { EmployeeWorkCenterStore } from '../../data-access/employee-work-center.store';
import { EmployeeCostCenterStore } from '../../data-access/employee-cost-center.store';
import { GlobalMessageService } from '../../data-access/employee-global-message.store';
import { employeeTexts } from '../../employee.texts';
import { GlobalUiMessage } from '../../models/global-ui-message.model';
import { readEmployeeBusinessKeyFromParamMap } from '../../routing/employee-route-key.util';
import { EmployeeWorkCenterSectionComponent } from '../../presence/components/employee-work-center-section.component';
import { EmployeeCostCenterSectionComponent } from '../components/employee-cost-center-section.component';

@Component({
  selector: 'app-employee-organization-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeWorkCenterSectionComponent, EmployeeCostCenterSectionComponent],
  templateUrl: './employee-organization-page.component.html',
  styleUrl: './employee-organization-page.component.scss',
})
export class EmployeeOrganizationPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeWorkCenterStore = inject(EmployeeWorkCenterStore);
  private readonly employeeCostCenterStore = inject(EmployeeCostCenterStore);
  private readonly globalMessageService = inject(GlobalMessageService);
  private previousWorkCenterSuccess: 'created' | 'corrected' | 'closed' | 'deleted' | null = null;
  private previousCostCenterSuccess: 'created' | 'replaced' | 'closed' | null = null;

  protected readonly texts = employeeTexts;
  protected readonly activeEmployeeKey = toSignal(
    this.route.paramMap.pipe(map((params) => readEmployeeBusinessKeyFromParamMap(params))),
    {
      initialValue: readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap),
    },
  );
  protected readonly loadingWorkCenters = this.employeeWorkCenterStore.loading;
  protected readonly loadingCostCenters = this.employeeCostCenterStore.loading;
  protected readonly workCentersError = this.employeeWorkCenterStore.error;
  protected readonly costCentersError = this.employeeCostCenterStore.error;
  protected readonly organizationAreaLoading = computed(() => this.loadingWorkCenters() || this.loadingCostCenters());

  constructor() {
    effect((onCleanup) => {
      const messages = this.buildGlobalMessages();
      untracked(() => {
        this.globalMessageService.setSourceMessages('employee-organization-page', messages);
      });
      onCleanup(() => {
        untracked(() => this.globalMessageService.clearSourceMessages('employee-organization-page'));
      });
    });

    effect(() => {
      this.publishSuccessFeedback();
    });
  }

  private buildGlobalMessages(): ReadonlyArray<Omit<GlobalUiMessage, 'createdAt'>> {
    const messages: Array<Omit<GlobalUiMessage, 'createdAt'>> = [];

    const workCenterError = this.mapWorkCenterErrorMessage(this.workCentersError());
    if (workCenterError) {
      messages.push({
        id: 'organization-work-center-error',
        level: 'error',
        text: workCenterError,
        sectionId: 'organization',
        sectionLabel: this.texts.organizationalAreaLabel,
        sticky: true,
      });
    }

    const costCenterError = this.mapCostCenterErrorMessage(this.costCentersError());
    if (costCenterError) {
      messages.push({
        id: 'organization-cost-center-error',
        level: 'error',
        text: costCenterError,
        sectionId: 'organization',
        sectionLabel: this.texts.organizationalAreaLabel,
        sticky: true,
      });
    }

    return messages;
  }

  private publishSuccessFeedback(): void {
    const workCenterSuccess = this.employeeWorkCenterStore.success();
    if (workCenterSuccess && workCenterSuccess !== this.previousWorkCenterSuccess) {
      this.publishTransientSuccess(
        `work-center-${workCenterSuccess}`,
        this.mapWorkCenterSuccessMessage(workCenterSuccess),
      );
    }
    this.previousWorkCenterSuccess = workCenterSuccess;

    const costCenterSuccess = this.employeeCostCenterStore.success();
    if (costCenterSuccess && costCenterSuccess !== this.previousCostCenterSuccess) {
      this.publishTransientSuccess(
        `cost-center-${costCenterSuccess}`,
        this.mapCostCenterSuccessMessage(costCenterSuccess),
      );
    }
    this.previousCostCenterSuccess = costCenterSuccess;
  }

  private publishTransientSuccess(idSuffix: string, text: string): void {
    untracked(() => {
      this.globalMessageService.success(text, {
        id: `employee-organization-page-success-${idSuffix}`,
        sectionId: 'organization',
        sectionLabel: this.texts.organizationalAreaLabel,
      });
    });
  }

  private mapWorkCenterSuccessMessage(success: 'created' | 'corrected' | 'closed' | 'deleted'): string {
    if (success === 'created') {
      return this.texts.workCenterSectionCreateSuccessMessage;
    }
    if (success === 'corrected') {
      return this.texts.workCenterSectionCorrectSuccessMessage;
    }
    if (success === 'closed') {
      return this.texts.workCenterSectionCloseSuccessMessage;
    }
    return this.texts.workCenterSectionDeleteSuccessMessage;
  }

  private mapCostCenterSuccessMessage(success: 'created' | 'replaced' | 'closed'): string {
    if (success === 'created') {
      return this.texts.costCenterSectionCreateSuccessMessage;
    }
    if (success === 'replaced') {
      return this.texts.costCenterSectionReplaceSuccessMessage;
    }
    return this.texts.costCenterSectionCloseSuccessMessage;
  }

  private mapWorkCenterErrorMessage(errorCode: string | null): string | null {
    switch (errorCode) {
      case 'WORK_CENTER_OVERLAP':
        return this.texts.workCenterSectionOverlapMessage;
      case 'WORK_CENTER_OUTSIDE_PRESENCE':
        return this.texts.workCenterSectionOutsidePresenceMessage;
      case 'WORK_CENTER_CATALOG_NOT_FOUND':
        return this.texts.workCenterSectionCatalogNotFoundMessage;
      case 'WORK_CENTER_NOT_FOUND':
        return this.texts.workCenterSectionNotFoundMessage;
      case 'WORK_CENTER_ALREADY_CLOSED':
        return this.texts.workCenterSectionAlreadyClosedMessage;
      case 'WORK_CENTER_INVALID_PERIOD':
        return this.texts.workCenterSectionFunctionalInvalidPeriodMessage;
      case 'WORK_CENTER_DELETE_FORBIDDEN_AT_PRESENCE_START':
        return this.texts.workCenterSectionDeleteForbiddenAtPresenceStartMessage;
      case 'request-failed':
        return this.texts.workCenterSectionRequestFailedMessage;
      default:
        return null;
    }
  }

  private mapCostCenterErrorMessage(errorCode: string | null): string | null {
    if (!errorCode) {
      return null;
    }

    if (errorCode === 'COST_CENTER_INVALID_WINDOW') {
      return this.texts.costCenterSectionInvalidTotalMessage;
    }

    return this.texts.costCenterSectionRequestFailedMessage;
  }
}
