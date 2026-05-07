import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EmployeeTaxInformationService } from '../generated/api/employee-tax-information.service';
import {
  CreateEmployeeTaxInformationRequest,
  CorrectEmployeeTaxInformationRequest,
  EmployeeTaxInformationResponse,
} from '../generated/model/models';

export type { CreateEmployeeTaxInformationRequest, CorrectEmployeeTaxInformationRequest };

export interface EmployeeTaxInformationApiModel {
  validFrom: string;
  familySituation: string;
  descendantsCount: number;
  ascendantsCount: number;
  disabilityDegree: string;
  pensionCompensatoria: boolean;
  geographicMobility: boolean;
  habitualResidenceLoan: boolean;
  taxTerritory: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeTaxInformationClient {
  private readonly api = inject(EmployeeTaxInformationService);

  list(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
  ): Observable<EmployeeTaxInformationApiModel[]> {
    return this.api
      .employeesRuleSystemCodeEmployeeTypeCodeEmployeeNumberTaxInformationGet({
        ruleSystemCode,
        employeeTypeCode,
        employeeNumber,
      })
      .pipe(map((items) => items.map((item) => this.toApiModel(item))));
  }

  get(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
    validFrom: string,
  ): Observable<EmployeeTaxInformationApiModel> {
    return this.api
      .employeesRuleSystemCodeEmployeeTypeCodeEmployeeNumberTaxInformationValidFromGet({
        ruleSystemCode,
        employeeTypeCode,
        employeeNumber,
        validFrom,
      })
      .pipe(map((item) => this.toApiModel(item)));
  }

  create(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
    body: CreateEmployeeTaxInformationRequest,
  ): Observable<EmployeeTaxInformationApiModel> {
    return this.api
      .employeesRuleSystemCodeEmployeeTypeCodeEmployeeNumberTaxInformationPost({
        ruleSystemCode,
        employeeTypeCode,
        employeeNumber,
        createEmployeeTaxInformationRequest: body,
      })
      .pipe(map((item) => this.toApiModel(item)));
  }

  correct(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
    validFrom: string,
    body: CorrectEmployeeTaxInformationRequest,
  ): Observable<EmployeeTaxInformationApiModel> {
    return this.api
      .employeesRuleSystemCodeEmployeeTypeCodeEmployeeNumberTaxInformationValidFromPut({
        ruleSystemCode,
        employeeTypeCode,
        employeeNumber,
        validFrom,
        correctEmployeeTaxInformationRequest: body,
      })
      .pipe(map((item) => this.toApiModel(item)));
  }

  delete(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
    validFrom: string,
  ): Observable<void> {
    return this.api
      .employeesRuleSystemCodeEmployeeTypeCodeEmployeeNumberTaxInformationValidFromDelete({
        ruleSystemCode,
        employeeTypeCode,
        employeeNumber,
        validFrom,
      })
      .pipe(map(() => undefined));
  }

  private toApiModel(source: EmployeeTaxInformationResponse): EmployeeTaxInformationApiModel {
    return {
      validFrom: source.validFrom ?? '',
      familySituation: source.familySituation ?? '',
      descendantsCount: source.descendantsCount ?? 0,
      ascendantsCount: source.ascendantsCount ?? 0,
      disabilityDegree: source.disabilityDegree ?? '',
      pensionCompensatoria: source.pensionCompensatoria ?? false,
      geographicMobility: source.geographicMobility ?? false,
      habitualResidenceLoan: source.habitualResidenceLoan ?? false,
      taxTerritory: source.taxTerritory ?? '',
    };
  }
}
