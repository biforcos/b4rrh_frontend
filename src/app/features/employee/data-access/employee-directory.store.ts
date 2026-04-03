import { computed, Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeListItemModel } from '../models/employee-list-item.model';
import { areEmployeeBusinessKeysEqual } from '../routing/employee-route-key.util';
import { EmployeeDirectoryReadGateway } from './employee-directory-read.gateway';

export type EmployeeDirectoryErrorCode = 'request-failed';

@Injectable({
  providedIn: 'root',
})
export class EmployeeDirectoryStore {
  private readonly employeeDirectoryReadGateway = inject(EmployeeDirectoryReadGateway);
  private readonly employeesState = signal<ReadonlyArray<EmployeeListItemModel>>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<EmployeeDirectoryErrorCode | null>(null);

  readonly query = signal('');
  readonly employees = this.employeesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  constructor() {
    this.loadDirectory();
  }

  readonly filteredEmployees = computed(() => {
    const normalizedQuery = this.query().trim().toLowerCase();
    const employees = this.employeesState();

    if (!normalizedQuery) {
      return employees;
    }

    return employees.filter((employee) =>
      [
        employee.ruleSystemCode,
        employee.employeeTypeCode,
        employee.employeeNumber,
        employee.displayName,
        employee.workCenter,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  });

  setQuery(value: string): void {
    this.query.set(value);
  }

  findEmployeeByBusinessKey(key: EmployeeBusinessKey | null): EmployeeListItemModel | null {
    if (!key) {
      return null;
    }

    return this.employeesState().find((employee) => areEmployeeBusinessKeysEqual(employee, key)) ?? null;
  }

  private loadDirectory(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.employeeDirectoryReadGateway
      .readDirectory()
      .pipe(take(1))
      .subscribe({
        next: (employees) => {
          this.employeesState.set(employees);
          this.loadingState.set(false);
        },
        error: () => {
          this.loadingState.set(false);
          this.errorState.set('request-failed');
        },
      });
  }
}
