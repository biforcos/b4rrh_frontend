import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { EmployeeReadClient } from '../../../core/api/clients/employee-read.client';
import {
  mapEmployeeDirectoryApiToDirectoryModel,
  EmployeeDirectoryReadModel,
} from '../../../core/api/mappers/employee-directory.mapper';
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