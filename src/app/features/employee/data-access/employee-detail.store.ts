import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeDetailModel } from '../models/employee-detail.model';
import { areEmployeeBusinessKeysEqual, toEmployeeBusinessKey } from '../routing/employee-route-key.util';
import { EmployeeDetailReadGateway } from './employee-detail-read.gateway';

export type EmployeeDetailErrorCode = 'not-found' | 'request-failed';

@Injectable({
  providedIn: 'root',
})
export class EmployeeDetailStore {
  private readonly employeeDetailReadGateway = inject(EmployeeDetailReadGateway);
  private readonly selectedEmployeeKeyState = signal<EmployeeBusinessKey | null>(null);
  private readonly selectedEmployeeDetailState = signal<EmployeeDetailModel | null>(null);
  private readonly loadingDetailState = signal(false);
  private readonly detailErrorState = signal<EmployeeDetailErrorCode | null>(null);
  private requestId = 0;

  readonly selectedEmployeeKey = this.selectedEmployeeKeyState.asReadonly();
  readonly selectedEmployeeDetail = this.selectedEmployeeDetailState.asReadonly();
  readonly loadingDetail = this.loadingDetailState.asReadonly();
  readonly detailError = this.detailErrorState.asReadonly();

  loadEmployeeDetailByBusinessKey(key: EmployeeBusinessKey | null): void {
    if (!key) {
      this.resetDetailState();
      return;
    }

    const normalizedKey = toEmployeeBusinessKey(key);
    const isSameKey = areEmployeeBusinessKeysEqual(this.selectedEmployeeKeyState(), normalizedKey);

    if (
      isSameKey &&
      (this.loadingDetailState() || (this.selectedEmployeeDetailState() !== null && this.detailErrorState() === null))
    ) {
      return;
    }

    this.selectedEmployeeKeyState.set(normalizedKey);
    this.selectedEmployeeDetailState.set(null);
    this.loadingDetailState.set(true);
    this.detailErrorState.set(null);

    const requestId = ++this.requestId;

    this.employeeDetailReadGateway
      .readEmployeeDetailByBusinessKey(normalizedKey)
      .pipe(take(1))
      .subscribe({
        next: (employeeDetail) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.loadingDetailState.set(false);

          if (!employeeDetail) {
            this.detailErrorState.set('not-found');
            return;
          }

          this.selectedEmployeeDetailState.set(employeeDetail);
        },
        error: () => {
          if (requestId !== this.requestId) {
            return;
          }

          this.loadingDetailState.set(false);
          this.detailErrorState.set('request-failed');
        },
      });
  }

  private resetDetailState(): void {
    this.requestId += 1;
    this.selectedEmployeeKeyState.set(null);
    this.selectedEmployeeDetailState.set(null);
    this.loadingDetailState.set(false);
    this.detailErrorState.set(null);
  }
}
