import { computed, Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeListItemModel } from '../models/employee-list-item.model';
import { areEmployeeBusinessKeysEqual } from '../routing/employee-route-key.util';
import { employeeDirectorySeed } from './employee-directory.seed';
import { EmployeeDirectoryReadGateway } from './employee-directory-read.gateway';

@Injectable({
  providedIn: 'root',
})
export class EmployeeDirectoryStore {
  private readonly employeeDirectoryReadGateway = inject(EmployeeDirectoryReadGateway);
  private readonly employeesState = signal<ReadonlyArray<EmployeeListItemModel>>([]);

  readonly query = signal('');
  readonly employees = this.employeesState.asReadonly();

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

  hydrateEmployeeByBusinessKey(key: EmployeeBusinessKey | null): void {
    if (!key || this.findEmployeeByBusinessKey(key)) {
      return;
    }

    this.employeeDirectoryReadGateway
      .readEmployeeByBusinessKey(key)
      .pipe(take(1))
      .subscribe({
        next: (employee) => {
          if (!employee) {
            return;
          }

          this.employeesState.update((employees) => this.upsertEmployee(employees, employee));
        },
        error: () => {
          // Keep controlled UI state; local fallback already handles unknown employee context.
        },
      });
  }

  findEmployeeByBusinessKey(key: EmployeeBusinessKey | null): EmployeeListItemModel | null {
    if (!key) {
      return null;
    }

    return this.employeesState().find((employee) => areEmployeeBusinessKeysEqual(employee, key)) ?? null;
  }

  private loadDirectory(): void {
    this.employeeDirectoryReadGateway
      .readDirectory()
      .pipe(take(1))
      .subscribe({
        next: (employees) => {
          this.employeesState.set(employees);
        },
        error: () => {
          this.employeesState.set(employeeDirectorySeed);
        },
      });
  }

  private upsertEmployee(
    employees: ReadonlyArray<EmployeeListItemModel>,
    candidate: EmployeeListItemModel,
  ): ReadonlyArray<EmployeeListItemModel> {
    const existingIndex = employees.findIndex((employee) =>
      areEmployeeBusinessKeysEqual(employee, candidate),
    );

    if (existingIndex < 0) {
      return [...employees, candidate];
    }

    return employees.map((employee, index) => (index === existingIndex ? candidate : employee));
  }
}
