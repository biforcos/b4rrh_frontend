import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import { LaborClassificationResponse } from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeeLaborClassificationApiModel {
  agreementCode: string;
  agreementCategoryCode: string;
  startDate: string;
  endDate: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeLaborClassificationReadClient {
  private readonly api = inject(DefaultService);

  readEmployeeLaborClassificationsByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
  ): Observable<ReadonlyArray<EmployeeLaborClassificationApiModel>> {
    const normalizedKey = this.normalizeKey(key);

    return this.api.listEmployeeLaborClassificationsByBusinessKey(normalizedKey).pipe(
      map((classifications) =>
        classifications.map((classification) =>
          this.toEmployeeLaborClassificationApiModel(classification),
        ),
      ),
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

  private toEmployeeLaborClassificationApiModel(
    source: LaborClassificationResponse,
  ): EmployeeLaborClassificationApiModel {
    return {
      agreementCode: source.agreementCode,
      agreementCategoryCode: source.agreementCategoryCode,
      startDate: source.startDate,
      endDate: source.endDate ?? null,
    };
  }
}