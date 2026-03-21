import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import {
  EmployeeDirectoryItemResponse,
  EmployeeResponse,
  UpdateEmployeeRequest,
} from '../generated/model/models';

export interface EmployeeBusinessKeyApiQuery {
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
}

export interface EmployeeReadApiModel {
  id: number;
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
  firstName: string;
  lastName1: string;
  lastName2: string | null;
  preferredName: string | null;
  status: string;
}

export interface EmployeeDirectoryApiModel {
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
  displayName: string;
  status: string;
  workCenterCode: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeReadClient {
  private readonly api = inject(DefaultService);

  readDirectory(): Observable<ReadonlyArray<EmployeeDirectoryApiModel>> {
    return this.api
      .listEmployees()
      .pipe(map((employees) => employees.map((employee) => this.toEmployeeDirectoryApiModel(employee))));
  }

  readEmployeeByBusinessKey(key: EmployeeBusinessKeyApiQuery): Observable<EmployeeReadApiModel | null> {
    const normalizedKey = this.normalizeKey(key);

    return this.api.getEmployeeByBusinessKey(normalizedKey).pipe(
      map((employee) => this.toEmployeeReadApiModel(employee)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }

        return throwError(() => error);
      }),
    );
  }

  updateEmployeeByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    request: UpdateEmployeeRequest,
  ): Observable<EmployeeReadApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .updateEmployeeByBusinessKey({
        ...normalizedKey,
        updateEmployeeRequest: {
          firstName: request.firstName.trim(),
          lastName1: request.lastName1.trim(),
          lastName2: this.normalizeOptionalValue(request.lastName2),
          preferredName: this.normalizeOptionalValue(request.preferredName),
        },
      })
      .pipe(map((employee) => this.toEmployeeReadApiModel(employee)));
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

  private toEmployeeDirectoryApiModel(source: EmployeeDirectoryItemResponse): EmployeeDirectoryApiModel {
    return {
      ruleSystemCode: source.ruleSystemCode,
      employeeTypeCode: source.employeeTypeCode,
      employeeNumber: source.employeeNumber,
      displayName: source.displayName,
      status: source.status,
      workCenterCode: source.workCenterCode ?? null,
    };
  }

  private toEmployeeReadApiModel(source: EmployeeResponse): EmployeeReadApiModel {
    return {
      id: source.id,
      ruleSystemCode: source.ruleSystemCode,
      employeeTypeCode: source.employeeTypeCode,
      employeeNumber: source.employeeNumber,
      firstName: source.firstName,
      lastName1: source.lastName1,
      lastName2: source.lastName2 ?? null,
      preferredName: source.preferredName ?? null,
      status: source.status,
    };
  }
}