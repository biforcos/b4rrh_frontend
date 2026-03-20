import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import { ContractResponse } from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeeContractApiModel {
  contractCode: string;
  contractSubtypeCode: string;
  startDate: string;
  endDate: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeContractReadClient {
  private readonly api = inject(DefaultService);

  readEmployeeContractsByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
  ): Observable<ReadonlyArray<EmployeeContractApiModel>> {
    const normalizedKey = this.normalizeKey(key);

    return this.api.listEmployeeContractsByBusinessKey(normalizedKey).pipe(
      map((contracts) => contracts.map((contract) => this.toEmployeeContractApiModel(contract))),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of([]);
        }

        return throwError(() => error);
      }),
    );
  }

  private normalizeKey(key: EmployeeBusinessKeyApiQuery): EmployeeBusinessKeyApiQuery {
    return {
      ruleSystemCode: key.ruleSystemCode.trim(),
      employeeTypeCode: key.employeeTypeCode.trim(),
      employeeNumber: key.employeeNumber.trim(),
    };
  }

  private toEmployeeContractApiModel(source: ContractResponse): EmployeeContractApiModel {
    return {
      contractCode: source.contractCode,
      contractSubtypeCode: source.contractSubtypeCode,
      startDate: source.startDate,
      endDate: source.endDate ?? null,
    };
  }
}
