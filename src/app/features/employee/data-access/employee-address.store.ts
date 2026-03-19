import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeAddressModel } from '../models/employee-address.model';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { areEmployeeBusinessKeysEqual, toEmployeeBusinessKey } from '../routing/employee-route-key.util';
import { EmployeeAddressReadGateway } from './employee-address-read.gateway';

export type EmployeeAddressErrorCode = 'request-failed';

@Injectable({
  providedIn: 'root',
})
export class EmployeeAddressStore {
  private readonly employeeAddressReadGateway = inject(EmployeeAddressReadGateway);
  private readonly selectedEmployeeKeyState = signal<EmployeeBusinessKey | null>(null);
  private readonly addressesState = signal<ReadonlyArray<EmployeeAddressModel>>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<EmployeeAddressErrorCode | null>(null);
  private requestId = 0;

  readonly selectedEmployeeKey = this.selectedEmployeeKeyState.asReadonly();
  readonly addresses = this.addressesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  loadAddressesByBusinessKey(key: EmployeeBusinessKey | null): void {
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
    this.addressesState.set([]);
    this.loadingState.set(true);
    this.errorState.set(null);

    const requestId = ++this.requestId;

    this.employeeAddressReadGateway
      .readEmployeeAddressesByBusinessKey(normalizedKey)
      .pipe(take(1))
      .subscribe({
        next: (addresses) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.addressesState.set(addresses);
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
    this.addressesState.set([]);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
