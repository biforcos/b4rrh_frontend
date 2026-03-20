import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeIdentifierModel } from '../models/employee-identifier.model';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { areEmployeeBusinessKeysEqual, toEmployeeBusinessKey } from '../routing/employee-route-key.util';
import { EmployeeIdentifierReadGateway } from './employee-identifier-read.gateway';

export type EmployeeIdentifierErrorCode = 'request-failed';

@Injectable({
  providedIn: 'root',
})
export class EmployeeIdentifierStore {
  private readonly employeeIdentifierReadGateway = inject(EmployeeIdentifierReadGateway);
  private readonly selectedEmployeeKeyState = signal<EmployeeBusinessKey | null>(null);
  private readonly identifiersState = signal<ReadonlyArray<EmployeeIdentifierModel>>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<EmployeeIdentifierErrorCode | null>(null);
  private requestId = 0;

  readonly selectedEmployeeKey = this.selectedEmployeeKeyState.asReadonly();
  readonly identifiers = this.identifiersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  loadIdentifiersByBusinessKey(key: EmployeeBusinessKey | null): void {
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
    this.identifiersState.set([]);
    this.loadingState.set(true);
    this.errorState.set(null);

    const requestId = ++this.requestId;

    this.employeeIdentifierReadGateway
      .readEmployeeIdentifiersByBusinessKey(normalizedKey)
      .pipe(take(1))
      .subscribe({
        next: (identifiers) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.identifiersState.set(identifiers);
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
    this.identifiersState.set([]);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
