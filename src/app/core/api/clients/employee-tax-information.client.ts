import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { EmployeeTaxInformationModel } from '../../../features/employee/models/employee-tax-information.model';

export interface CreateTaxInformationRequest {
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

export interface CorrectTaxInformationRequest {
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
  private readonly http = inject(HttpClient);

  private basePath(ruleSystemCode: string, employeeTypeCode: string, employeeNumber: string): string {
    return `/api/employees/${ruleSystemCode}/${employeeTypeCode}/${employeeNumber}/tax-information`;
  }

  list(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
  ): Observable<EmployeeTaxInformationModel[]> {
    return this.http.get<EmployeeTaxInformationModel[]>(
      this.basePath(ruleSystemCode, employeeTypeCode, employeeNumber),
    );
  }

  get(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
    validFrom: string,
  ): Observable<EmployeeTaxInformationModel> {
    return this.http.get<EmployeeTaxInformationModel>(
      `${this.basePath(ruleSystemCode, employeeTypeCode, employeeNumber)}/${validFrom}`,
    );
  }

  create(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
    body: CreateTaxInformationRequest,
  ): Observable<EmployeeTaxInformationModel> {
    return this.http.post<EmployeeTaxInformationModel>(
      this.basePath(ruleSystemCode, employeeTypeCode, employeeNumber),
      body,
    );
  }

  correct(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
    validFrom: string,
    body: CorrectTaxInformationRequest,
  ): Observable<EmployeeTaxInformationModel> {
    return this.http.put<EmployeeTaxInformationModel>(
      `${this.basePath(ruleSystemCode, employeeTypeCode, employeeNumber)}/${validFrom}`,
      body,
    );
  }

  delete(
    ruleSystemCode: string,
    employeeTypeCode: string,
    employeeNumber: string,
    validFrom: string,
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.basePath(ruleSystemCode, employeeTypeCode, employeeNumber)}/${validFrom}`,
    );
  }
}
