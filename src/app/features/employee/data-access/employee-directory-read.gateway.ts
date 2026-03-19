import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { EmployeeReadClient } from '../../../core/api/clients/employee-read.client';
import {
  mapEmployeeDirectoryApiToDirectoryModel,
  mapEmployeeReadApiToDirectoryModel,
  EmployeeDirectoryReadModel,
} from '../../../core/api/mappers/employee-directory.mapper';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeListItemModel } from '../models/employee-list-item.model';
import { employeeDirectorySeed } from './employee-directory.seed';

@Injectable({
  providedIn: 'root',
})
export class EmployeeDirectoryReadGateway {
  private readonly employeeReadClient = inject(EmployeeReadClient);

  readDirectory(): Observable<ReadonlyArray<EmployeeListItemModel>> {
    return this.employeeReadClient.readDirectory().pipe(
      map((employees) =>
        employees.map((employee) =>
          this.toEmployeeListItemModel(mapEmployeeDirectoryApiToDirectoryModel(employee)),
        ),
      ),
      catchError(() => of(employeeDirectorySeed)),
    );
  }

  // Contract-backed read using GET /employees/{ruleSystemCode}/{employeeTypeCode}/{employeeNumber}.
  readEmployeeByBusinessKey(key: EmployeeBusinessKey): Observable<EmployeeListItemModel | null> {
    return this.employeeReadClient.readEmployeeByBusinessKey(key).pipe(
      map((employee) => {
        if (!employee) {
          return null;
        }

        return this.toEmployeeListItemModel(mapEmployeeReadApiToDirectoryModel(employee));
      }),
    );
  }

  private toEmployeeListItemModel(source: EmployeeDirectoryReadModel): EmployeeListItemModel {
    return {
      ruleSystemCode: source.ruleSystemCode,
      employeeTypeCode: source.employeeTypeCode,
      employeeNumber: source.employeeNumber,
      displayName: source.displayName,
      workCenter: source.workCenter,
      statusLabel: source.statusLabel,
    };
  }
}