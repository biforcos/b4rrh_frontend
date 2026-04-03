import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { DefaultService as PersonnelApiService } from '../../../core/api/generated/api/default.service';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import {
  EmployeeCostCenterHistoryModel,
  EmployeeCostCenterWindowModel,
} from '../models/employee-cost-center.model';
import {
  CostCenterDistributionCreateDraft,
  CostCenterDistributionReplaceDraft,
  mapCostCenterCurrentDistributionResponseToModel,
  mapCostCenterDistributionCloseDateToRequest,
  mapCostCenterDistributionCreateDraftToRequest,
  mapCostCenterDistributionHistoryResponseToModel,
  mapCostCenterDistributionReplaceDraftToRequest,
  mapCostCenterDistributionWindowResponseToModel,
} from './employee-cost-center.mapper';

@Injectable({
  providedIn: 'root',
})
export class EmployeeCostCenterGateway {
  private readonly personnelApiService = inject(PersonnelApiService);

  readCurrentDistribution(key: EmployeeBusinessKey): Observable<EmployeeCostCenterWindowModel | null> {
    return this.personnelApiService
      .getCurrentCostCenterDistribution({
        ruleSystemCode: key.ruleSystemCode,
        employeeTypeCode: key.employeeTypeCode,
        employeeNumber: key.employeeNumber,
      })
      .pipe(map((response) => mapCostCenterCurrentDistributionResponseToModel(response)));
  }

  readDistributionHistory(key: EmployeeBusinessKey): Observable<EmployeeCostCenterHistoryModel> {
    return this.personnelApiService
      .listCostCenterDistributionHistory({
        ruleSystemCode: key.ruleSystemCode,
        employeeTypeCode: key.employeeTypeCode,
        employeeNumber: key.employeeNumber,
      })
      .pipe(map((response) => mapCostCenterDistributionHistoryResponseToModel(response)));
  }

  createDistribution(
    key: EmployeeBusinessKey,
    draft: CostCenterDistributionCreateDraft,
  ): Observable<EmployeeCostCenterWindowModel> {
    return this.personnelApiService
      .createCostCenterDistribution({
        ruleSystemCode: key.ruleSystemCode,
        employeeTypeCode: key.employeeTypeCode,
        employeeNumber: key.employeeNumber,
        createCostCenterDistributionRequest: mapCostCenterDistributionCreateDraftToRequest(draft),
      })
      .pipe(map((response) => mapCostCenterDistributionWindowResponseToModel(response)));
  }

  replaceDistribution(
    key: EmployeeBusinessKey,
    draft: CostCenterDistributionReplaceDraft,
  ): Observable<EmployeeCostCenterWindowModel> {
    return this.personnelApiService
      .replaceCostCenterDistributionFromDate({
        ruleSystemCode: key.ruleSystemCode,
        employeeTypeCode: key.employeeTypeCode,
        employeeNumber: key.employeeNumber,
        replaceCostCenterDistributionFromDateRequest: mapCostCenterDistributionReplaceDraftToRequest(draft),
      })
      .pipe(map((response) => mapCostCenterDistributionWindowResponseToModel(response)));
  }

  closeDistribution(
    key: EmployeeBusinessKey,
    startDate: string,
    endDate: string,
  ): Observable<EmployeeCostCenterWindowModel> {
    return this.personnelApiService
      .closeCostCenterDistribution({
        ruleSystemCode: key.ruleSystemCode,
        employeeTypeCode: key.employeeTypeCode,
        employeeNumber: key.employeeNumber,
        startDate: startDate,
        closeCostCenterDistributionRequest: mapCostCenterDistributionCloseDateToRequest(endDate),
      })
      .pipe(map((response) => mapCostCenterDistributionWindowResponseToModel(response)));
  }
}
