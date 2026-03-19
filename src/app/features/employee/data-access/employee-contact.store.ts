import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeContactModel } from '../models/employee-contact.model';
import { areEmployeeBusinessKeysEqual, toEmployeeBusinessKey } from '../routing/employee-route-key.util';
import { EmployeeContactReadGateway } from './employee-contact-read.gateway';

export type EmployeeContactErrorCode = 'request-failed';

@Injectable({
  providedIn: 'root',
})
export class EmployeeContactStore {
  private readonly employeeContactReadGateway = inject(EmployeeContactReadGateway);
  private readonly selectedEmployeeKeyState = signal<EmployeeBusinessKey | null>(null);
  private readonly contactsState = signal<ReadonlyArray<EmployeeContactModel>>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<EmployeeContactErrorCode | null>(null);
  private requestId = 0;

  readonly selectedEmployeeKey = this.selectedEmployeeKeyState.asReadonly();
  readonly contacts = this.contactsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  loadContactsByBusinessKey(key: EmployeeBusinessKey | null): void {
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
    this.contactsState.set([]);
    this.loadingState.set(true);
    this.errorState.set(null);

    const requestId = ++this.requestId;

    this.employeeContactReadGateway
      .readEmployeeContactsByBusinessKey(normalizedKey)
      .pipe(take(1))
      .subscribe({
        next: (contacts) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.contactsState.set(contacts);
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
    this.contactsState.set([]);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
