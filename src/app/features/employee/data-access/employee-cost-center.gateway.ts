import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap, throwError } from 'rxjs';

import { DefaultService as PersonnelApiService } from '../../../core/api/generated/api/default.service';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import {
  EmployeeCostCenterHistoryModel,
  EmployeeCostCenterWindowModel,
} from '../models/employee-cost-center.model';
import {
  CostCenterDistributionCreateDraft,
  CostCenterDistributionReplaceDraft,
  mapCostCenterDistributionCloseDateToRequest,
  mapCostCenterDistributionCreateDraftToRequests,
  mapCostCenterDistributionReplaceDraftToRequests,
  mapCostCenterResponsesToHistoryModel,
  mapCostCenterResponsesToWindowModel,
} from './employee-cost-center.mapper';

@Injectable({
  providedIn: 'root',
})
export class EmployeeCostCenterGateway {
  private readonly personnelApiService = inject(PersonnelApiService);

  readCurrentDistribution(key: EmployeeBusinessKey): Observable<EmployeeCostCenterWindowModel | null> {
    return this.personnelApiService
      .listEmployeeCostCentersByBusinessKey({
        ruleSystemCode: key.ruleSystemCode,
        employeeTypeCode: key.employeeTypeCode,
        employeeNumber: key.employeeNumber,
      })
      .pipe(map((response) => mapCostCenterResponsesToHistoryModel(response).currentDistribution ?? null));
  }

  readDistributionHistory(key: EmployeeBusinessKey): Observable<EmployeeCostCenterHistoryModel> {
    return this.personnelApiService
      .listEmployeeCostCentersByBusinessKey({
        ruleSystemCode: key.ruleSystemCode,
        employeeTypeCode: key.employeeTypeCode,
        employeeNumber: key.employeeNumber,
      })
      .pipe(map((response) => mapCostCenterResponsesToHistoryModel(response)));
  }

  createDistribution(
    key: EmployeeBusinessKey,
    draft: CostCenterDistributionCreateDraft,
  ): Observable<EmployeeCostCenterWindowModel> {
    const requests = mapCostCenterDistributionCreateDraftToRequests(draft);
    if (!requests.length) {
      return throwError(() => new Error('Cost center distribution requires at least one item.'));
    }

    return forkJoin(
      requests.map((request) =>
        this.personnelApiService.createCostCenterByBusinessKey({
          ruleSystemCode: key.ruleSystemCode,
          employeeTypeCode: key.employeeTypeCode,
          employeeNumber: key.employeeNumber,
          createCostCenterRequest: request,
        }),
      ),
    ).pipe(map((responses) => mapCostCenterResponsesToWindowModel(responses, draft.startDate, null)));
  }

  replaceDistribution(
    key: EmployeeBusinessKey,
    draft: CostCenterDistributionReplaceDraft,
  ): Observable<EmployeeCostCenterWindowModel> {
    const requests = mapCostCenterDistributionReplaceDraftToRequests(draft);
    if (!requests.length) {
      return throwError(() => new Error('Cost center distribution requires at least one item.'));
    }

    return forkJoin(
      requests.map((request) =>
        this.personnelApiService.createCostCenterByBusinessKey({
          ruleSystemCode: key.ruleSystemCode,
          employeeTypeCode: key.employeeTypeCode,
          employeeNumber: key.employeeNumber,
          createCostCenterRequest: request,
        }),
      ),
    ).pipe(map((responses) => mapCostCenterResponsesToWindowModel(responses, draft.effectiveDate, null)));
  }

  closeDistribution(
    key: EmployeeBusinessKey,
    startDate: string,
    endDate: string,
  ): Observable<EmployeeCostCenterWindowModel> {
    return this.personnelApiService
      .listEmployeeCostCentersByBusinessKey({
        ruleSystemCode: key.ruleSystemCode,
        employeeTypeCode: key.employeeTypeCode,
        employeeNumber: key.employeeNumber,
      })
      .pipe(
        map((responses) =>
          responses.filter((response) => {
            const responseEndDate = response.endDate ?? null;
            return response.startDate === startDate && responseEndDate === null;
          }),
        ),
        switchMap((openWindowItems) => {
          if (!openWindowItems.length) {
            return throwError(() => new Error(`No active cost center window found for startDate ${startDate}.`));
          }

          return forkJoin(
            openWindowItems.map((item) =>
              this.personnelApiService.closeCostCenterByBusinessKey({
                ruleSystemCode: key.ruleSystemCode,
                employeeTypeCode: key.employeeTypeCode,
                employeeNumber: key.employeeNumber,
                costCenterCode: item.costCenterCode,
                startDate,
                closeCostCenterRequest: mapCostCenterDistributionCloseDateToRequest(endDate),
              }),
            ),
          );
        }),
        map((responses) => mapCostCenterResponsesToWindowModel(responses, startDate, endDate)),
      );
  }
}
