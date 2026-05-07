import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  CorrectTaxInformationRequest,
  CreateTaxInformationRequest,
  EmployeeTaxInformationClient,
} from '../../../core/api/clients/employee-tax-information.client';
import { mapTaxInformationFromApi } from '../../../core/api/mappers/employee-tax-information.mapper';
import { EmployeeTaxInformationModel } from '../models/employee-tax-information.model';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { toEmployeeBusinessKey } from '../routing/employee-route-key.util';

@Injectable({ providedIn: 'root' })
export class EmployeeTaxInformationGateway {
  private readonly client = inject(EmployeeTaxInformationClient);

  list(key: EmployeeBusinessKey): Observable<ReadonlyArray<EmployeeTaxInformationModel>> {
    const { ruleSystemCode, employeeTypeCode, employeeNumber } = toEmployeeBusinessKey(key);
    return this.client
      .list(ruleSystemCode, employeeTypeCode, employeeNumber)
      .pipe(map((items) => items.map(mapTaxInformationFromApi)));
  }

  create(key: EmployeeBusinessKey, req: CreateTaxInformationRequest): Observable<EmployeeTaxInformationModel> {
    const { ruleSystemCode, employeeTypeCode, employeeNumber } = toEmployeeBusinessKey(key);
    return this.client
      .create(ruleSystemCode, employeeTypeCode, employeeNumber, req)
      .pipe(map(mapTaxInformationFromApi));
  }

  correct(
    key: EmployeeBusinessKey,
    validFrom: string,
    req: CorrectTaxInformationRequest,
  ): Observable<EmployeeTaxInformationModel> {
    const { ruleSystemCode, employeeTypeCode, employeeNumber } = toEmployeeBusinessKey(key);
    return this.client
      .correct(ruleSystemCode, employeeTypeCode, employeeNumber, validFrom, req)
      .pipe(map(mapTaxInformationFromApi));
  }

  delete(key: EmployeeBusinessKey, validFrom: string): Observable<void> {
    const { ruleSystemCode, employeeTypeCode, employeeNumber } = toEmployeeBusinessKey(key);
    return this.client.delete(ruleSystemCode, employeeTypeCode, employeeNumber, validFrom);
  }
}
