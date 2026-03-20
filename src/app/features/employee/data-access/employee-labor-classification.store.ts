import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeLaborClassificationModel } from '../models/employee-labor-classification.model';
import { areEmployeeBusinessKeysEqual, toEmployeeBusinessKey } from '../routing/employee-route-key.util';
import { EmployeeLaborClassificationReadGateway } from './employee-labor-classification-read.gateway';

export type EmployeeLaborClassificationErrorCode = 'request-failed';

@Injectable({
  providedIn: 'root',
})
export class EmployeeLaborClassificationStore {
  private readonly employeeLaborClassificationReadGateway = inject(EmployeeLaborClassificationReadGateway);
  private readonly selectedEmployeeKeyState = signal<EmployeeBusinessKey | null>(null);
  private readonly laborClassificationsState = signal<ReadonlyArray<EmployeeLaborClassificationModel>>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<EmployeeLaborClassificationErrorCode | null>(null);
  private requestId = 0;

  readonly selectedEmployeeKey = this.selectedEmployeeKeyState.asReadonly();
  readonly laborClassifications = this.laborClassificationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  loadLaborClassificationsByBusinessKey(key: EmployeeBusinessKey | null): void {
    if (!key) {
      this.resetState();
      return;
    }

    const normalizedKey = toEmployeeBusinessKey(key);
    const isSameKey = areEmployeeBusinessKeysEqual(this.selectedEmployeeKeyState(), normalizedKey);

    if (isSameKey && (this.loadingState() || this.errorState() === null)) {
      return;
    }

    this.selectedEmployeeKeyState.set(normalizedKey);
    this.laborClassificationsState.set([]);
    this.loadingState.set(true);
    this.errorState.set(null);

    const requestId = ++this.requestId;

    this.employeeLaborClassificationReadGateway
      .readEmployeeLaborClassificationsByBusinessKey(normalizedKey)
      .pipe(take(1))
      .subscribe({
        next: (laborClassifications) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.laborClassificationsState.set(laborClassifications);
          this.loadingState.set(false);
        },
        error: () => {
          if (requestId !== this.requestId) {
            return;
          }

          this.loadingState.set(false);
          this.errorState.set('request-failed');
        },
      });
  }

  private resetState(): void {
    this.requestId += 1;
    this.selectedEmployeeKeyState.set(null);
    this.laborClassificationsState.set([]);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}