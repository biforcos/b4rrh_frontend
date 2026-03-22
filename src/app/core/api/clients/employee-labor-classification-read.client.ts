import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import {
  CloseLaborClassificationRequest,
  CreateLaborClassificationRequest,
  LaborClassificationResponse,
  ReplaceLaborClassificationFromDateRequest,
  UpdateLaborClassificationRequest,
} from '../generated/model/models';
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

  createLaborClassificationByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    request: CreateLaborClassificationRequest,
  ): Observable<EmployeeLaborClassificationApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .createLaborClassificationByBusinessKey({
        ...normalizedKey,
        createLaborClassificationRequest: {
          agreementCode: request.agreementCode.trim().toUpperCase(),
          agreementCategoryCode: request.agreementCategoryCode.trim().toUpperCase(),
          startDate: request.startDate.trim(),
          endDate: this.normalizeOptionalValue(request.endDate),
        },
      })
      .pipe(map((classification) => this.toEmployeeLaborClassificationApiModel(classification)));
  }

  updateLaborClassificationByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    startDate: string,
    request: UpdateLaborClassificationRequest,
  ): Observable<EmployeeLaborClassificationApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .updateLaborClassificationByBusinessKey({
        ...normalizedKey,
        startDate: startDate.trim(),
        updateLaborClassificationRequest: {
          agreementCode: request.agreementCode.trim().toUpperCase(),
          agreementCategoryCode: request.agreementCategoryCode.trim().toUpperCase(),
        },
      })
      .pipe(map((classification) => this.toEmployeeLaborClassificationApiModel(classification)));
  }

  closeLaborClassificationByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    startDate: string,
    request: CloseLaborClassificationRequest,
  ): Observable<EmployeeLaborClassificationApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .closeLaborClassificationByBusinessKey({
        ...normalizedKey,
        startDate: startDate.trim(),
        closeLaborClassificationRequest: {
          endDate: request.endDate.trim(),
        },
      })
      .pipe(map((classification) => this.toEmployeeLaborClassificationApiModel(classification)));
  }

  replaceLaborClassificationFromDateByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    request: ReplaceLaborClassificationFromDateRequest,
  ): Observable<EmployeeLaborClassificationApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .replaceLaborClassificationFromDateByBusinessKey({
        ...normalizedKey,
        replaceLaborClassificationFromDateRequest: {
          effectiveDate: request.effectiveDate.trim(),
          agreementCode: request.agreementCode.trim().toUpperCase(),
          agreementCategoryCode: request.agreementCategoryCode.trim().toUpperCase(),
        },
      })
      .pipe(map((classification) => this.toEmployeeLaborClassificationApiModel(classification)));
  }

  private normalizeKey(key: EmployeeBusinessKeyApiQuery): EmployeeBusinessKeyApiQuery {
    return {
      ruleSystemCode: key.ruleSystemCode.trim(),
      employeeTypeCode: key.employeeTypeCode.trim(),
      employeeNumber: key.employeeNumber.trim(),
    };
  }

  private normalizeOptionalValue(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
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