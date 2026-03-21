import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import {
  CreateIdentifierRequest,
  IdentifierResponse,
  UpdateIdentifierRequest,
} from '../generated/model/models';
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

  createIdentifierByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    request: CreateIdentifierRequest,
  ): Observable<EmployeeIdentifierApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .createIdentifierByBusinessKey({
        ...normalizedKey,
        createIdentifierRequest: {
          identifierTypeCode: this.normalizeIdentifierTypeCode(request.identifierTypeCode),
          identifierValue: request.identifierValue.trim(),
          issuingCountryCode: this.normalizeOptionalValue(request.issuingCountryCode),
          expirationDate: this.normalizeOptionalValue(request.expirationDate),
          isPrimary: request.isPrimary ?? null,
        },
      })
      .pipe(map((identifier) => this.toEmployeeIdentifierApiModel(identifier)));
  }

  updateIdentifierByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    identifierTypeCode: string,
    request: UpdateIdentifierRequest,
  ): Observable<EmployeeIdentifierApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .updateIdentifierByBusinessKey({
        ...normalizedKey,
        identifierTypeCode: this.normalizeIdentifierTypeCode(identifierTypeCode),
        updateIdentifierRequest: {
          identifierValue: request.identifierValue.trim(),
          issuingCountryCode: this.normalizeOptionalValue(request.issuingCountryCode),
          expirationDate: this.normalizeOptionalValue(request.expirationDate),
          isPrimary: request.isPrimary ?? null,
        },
      })
      .pipe(map((identifier) => this.toEmployeeIdentifierApiModel(identifier)));
  }

  deleteIdentifierByBusinessKey(key: EmployeeBusinessKeyApiQuery, identifierTypeCode: string): Observable<void> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .deleteIdentifierByBusinessKey({
        ...normalizedKey,
        identifierTypeCode: this.normalizeIdentifierTypeCode(identifierTypeCode),
      })
      .pipe(map(() => undefined));
  }

  private normalizeKey(key: EmployeeBusinessKeyApiQuery): EmployeeBusinessKeyApiQuery {
    return {
      ruleSystemCode: key.ruleSystemCode.trim(),
      employeeTypeCode: key.employeeTypeCode.trim(),
      employeeNumber: key.employeeNumber.trim(),
    };
  }

  private normalizeIdentifierTypeCode(identifierTypeCode: string): string {
    return identifierTypeCode.trim().toUpperCase();
  }

  private normalizeOptionalValue(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
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
