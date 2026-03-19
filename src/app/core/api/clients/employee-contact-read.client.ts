import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import { ContactResponse } from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeeContactApiModel {
  contactTypeCode: string;
  contactValue: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeContactReadClient {
  private readonly api = inject(DefaultService);

  readEmployeeContactsByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
  ): Observable<ReadonlyArray<EmployeeContactApiModel>> {
    const normalizedKey = this.normalizeKey(key);

    return this.api.listEmployeeContactsByBusinessKey(normalizedKey).pipe(
      map((contacts) => contacts.map((contact) => this.toEmployeeContactApiModel(contact))),
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

  private toEmployeeContactApiModel(source: ContactResponse): EmployeeContactApiModel {
    return {
      contactTypeCode: source.contactTypeCode,
      contactValue: source.contactValue,
    };
  }
}
