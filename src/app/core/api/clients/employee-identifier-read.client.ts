import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import { IdentifierResponse } from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeeIdentifierApiModel {
  identifierTypeCode: string;
  identifierValue: string;
  issuingCountryCode: string | null;
  expirationDate: string | null;
  isPrimary: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeIdentifierReadClient {
  private readonly api = inject(DefaultService);

  readEmployeeIdentifiersByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
  ): Observable<ReadonlyArray<EmployeeIdentifierApiModel>> {
    const normalizedKey = this.normalizeKey(key);

    return this.api.listEmployeeIdentifiersByBusinessKey(normalizedKey).pipe(
      map((identifiers) => identifiers.map((identifier) => this.toEmployeeIdentifierApiModel(identifier))),
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

  private toEmployeeIdentifierApiModel(source: IdentifierResponse): EmployeeIdentifierApiModel {
    return {
      identifierTypeCode: source.identifierTypeCode,
      identifierValue: source.identifierValue,
      issuingCountryCode: source.issuingCountryCode ?? null,
      expirationDate: source.expirationDate ?? null,
      isPrimary: source.isPrimary,
    };
  }
}
