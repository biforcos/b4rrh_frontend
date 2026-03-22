import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import {
  CloseContractRequest,
  ContractResponse,
  CreateContractRequest,
  ReplaceContractFromDateRequest,
  UpdateContractRequest,
} from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeeContractApiModel {
  contractCode: string;
  contractTypeName?: string | null;
  contractSubtypeCode: string;
  contractSubtypeName?: string | null;
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

  createContractByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    request: CreateContractRequest,
  ): Observable<EmployeeContractApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .createContractByBusinessKey({
        ...normalizedKey,
        createContractRequest: {
          contractCode: request.contractCode.trim().toUpperCase(),
          contractSubtypeCode: request.contractSubtypeCode.trim().toUpperCase(),
          startDate: request.startDate.trim(),
          endDate: this.normalizeOptionalValue(request.endDate),
        },
      })
      .pipe(map((contract) => this.toEmployeeContractApiModel(contract)));
  }

  replaceContractFromDateByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    request: ReplaceContractFromDateRequest,
  ): Observable<EmployeeContractApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .replaceContractFromDateByBusinessKey({
        ...normalizedKey,
        replaceContractFromDateRequest: {
          effectiveDate: request.effectiveDate.trim(),
          contractCode: request.contractCode.trim().toUpperCase(),
          contractSubtypeCode: request.contractSubtypeCode.trim().toUpperCase(),
        },
      })
      .pipe(map((contract) => this.toEmployeeContractApiModel(contract)));
  }

  updateContractByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    startDate: string,
    request: UpdateContractRequest,
  ): Observable<EmployeeContractApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .updateContractByBusinessKey({
        ...normalizedKey,
        startDate: startDate.trim(),
        updateContractRequest: {
          contractCode: request.contractCode.trim().toUpperCase(),
          contractSubtypeCode: request.contractSubtypeCode.trim().toUpperCase(),
        },
      })
      .pipe(map((contract) => this.toEmployeeContractApiModel(contract)));
  }

  closeContractByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    startDate: string,
    request: CloseContractRequest,
  ): Observable<EmployeeContractApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .closeContractByBusinessKey({
        ...normalizedKey,
        startDate: startDate.trim(),
        closeContractRequest: {
          endDate: request.endDate.trim(),
        },
      })
      .pipe(map((contract) => this.toEmployeeContractApiModel(contract)));
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

  private toEmployeeContractApiModel(source: ContractResponse): EmployeeContractApiModel {
    return {
      contractCode: source.contractCode,
      contractTypeName: source.contractTypeName ?? null,
      contractSubtypeCode: source.contractSubtypeCode,
      contractSubtypeName: source.contractSubtypeName ?? null,
      startDate: source.startDate,
      endDate: source.endDate ?? null,
    };
  }
}
