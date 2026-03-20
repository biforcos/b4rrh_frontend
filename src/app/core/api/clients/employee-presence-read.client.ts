import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import { PresenceResponse } from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeePresenceApiModel {
  presenceNumber: number;
  companyCode: string;
  entryReasonCode: string;
  exitReasonCode: string | null;
  startDate: string;
  endDate: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeePresenceReadClient {
  private readonly api = inject(DefaultService);

  readEmployeePresencesByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
  ): Observable<ReadonlyArray<EmployeePresenceApiModel>> {
    const normalizedKey = this.normalizeKey(key);

    return this.api.listEmployeePresencesByBusinessKey(normalizedKey).pipe(
      map((presences) => presences.map((presence) => this.toEmployeePresenceApiModel(presence))),
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

  private toEmployeePresenceApiModel(source: PresenceResponse): EmployeePresenceApiModel {
    return {
      presenceNumber: source.presenceNumber,
      companyCode: source.companyCode,
      entryReasonCode: source.entryReasonCode,
      exitReasonCode: source.exitReasonCode ?? null,
      startDate: source.startDate,
      endDate: source.endDate ?? null,
    };
  }
}
