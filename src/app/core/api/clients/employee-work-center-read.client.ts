import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import {
  CloseWorkCenterRequest,
  CreateWorkCenterRequest as CanonicalCreateWorkCenterRequest,
  EmployeeCreateWorkCenterRequest,
  EmployeeUpdateWorkCenterRequest,
  UpdateWorkCenterRequest as CanonicalUpdateWorkCenterRequest,
  WorkCenterResponse,
} from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeeWorkCenterApiModel {
  workCenterAssignmentNumber: number;
  workCenterCode: string;
  workCenterName: string | null;
  startDate: string;
  endDate: string | null;
  canDelete?: boolean;
  startsAtPresenceStart?: boolean;
  deleteForbiddenReason?: string | null;
}

interface WorkCenterResponseWithDeleteCapabilities extends WorkCenterResponse {
  workCenterName?: string | null;
  canDelete?: boolean;
  startsAtPresenceStart?: boolean;
  deleteForbiddenReason?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeWorkCenterReadClient {
  private readonly api = inject(DefaultService);

  readEmployeeWorkCentersByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
  ): Observable<ReadonlyArray<EmployeeWorkCenterApiModel>> {
    const normalizedKey = this.normalizeKey(key);

    return this.api.listEmployeeWorkCentersByBusinessKey(normalizedKey).pipe(
      map((workCenters) => workCenters.map((workCenter) => this.toEmployeeWorkCenterApiModel(workCenter))),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of([]);
        }

        return throwError(() => error);
      }),
    );
  }

  readEmployeeWorkCenterByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    workCenterAssignmentNumber: number,
  ): Observable<EmployeeWorkCenterApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .getWorkCenterByBusinessKey({
        ...normalizedKey,
        workCenterAssignmentNumber,
      })
      .pipe(map((workCenter) => this.toEmployeeWorkCenterApiModel(workCenter)));
  }

  createWorkCenterByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    request: EmployeeCreateWorkCenterRequest,
  ): Observable<EmployeeWorkCenterApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .createWorkCenterByBusinessKey({
        ...normalizedKey,
        createWorkCenterRequest: {
          workCenterCode: request.workCenterCode.trim().toUpperCase(),
          startDate: request.startDate.trim(),
          endDate: this.normalizeOptionalValue(request.endDate),
        } as unknown as CanonicalCreateWorkCenterRequest,
      })
      .pipe(map((workCenter) => this.toEmployeeWorkCenterApiModel(workCenter)));
  }

  closeWorkCenterByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    workCenterAssignmentNumber: number,
    request: CloseWorkCenterRequest,
  ): Observable<EmployeeWorkCenterApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .closeWorkCenterByBusinessKey({
        ...normalizedKey,
        workCenterAssignmentNumber,
        closeWorkCenterRequest: {
          endDate: request.endDate.trim(),
        },
      })
      .pipe(map((workCenter) => this.toEmployeeWorkCenterApiModel(workCenter)));
  }

  updateWorkCenterByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    workCenterAssignmentNumber: number,
    request: EmployeeUpdateWorkCenterRequest,
  ): Observable<EmployeeWorkCenterApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .updateWorkCenterByBusinessKey({
        ...normalizedKey,
        workCenterAssignmentNumber,
        updateWorkCenterRequest: {
          workCenterCode: request.workCenterCode.trim().toUpperCase(),
          startDate: request.startDate.trim(),
          endDate: this.normalizeOptionalValue(request.endDate),
        } as unknown as CanonicalUpdateWorkCenterRequest,
      })
      .pipe(map((workCenter) => this.toEmployeeWorkCenterApiModel(workCenter)));
  }

  deleteWorkCenterByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    workCenterAssignmentNumber: number,
  ): Observable<void> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .deleteWorkCenterByBusinessKey({
        ...normalizedKey,
        workCenterAssignmentNumber,
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

  private normalizeOptionalValue(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private toEmployeeWorkCenterApiModel(source: WorkCenterResponse): EmployeeWorkCenterApiModel {
    const sourceWithDeleteCapabilities = source as WorkCenterResponseWithDeleteCapabilities & {
      workCenterAssignmentNumber: number;
      workCenterCode: string;
      startDate: string;
      endDate?: string | null;
    };

    return {
      workCenterAssignmentNumber: sourceWithDeleteCapabilities.workCenterAssignmentNumber,
      workCenterCode: source.workCenterCode,
      workCenterName: this.normalizeOptionalValue(sourceWithDeleteCapabilities.workCenterName),
      startDate: source.startDate,
      endDate: source.endDate ?? null,
      canDelete: sourceWithDeleteCapabilities.canDelete,
      startsAtPresenceStart: sourceWithDeleteCapabilities.startsAtPresenceStart,
      deleteForbiddenReason: sourceWithDeleteCapabilities.deleteForbiddenReason ?? null,
    };
  }
}
