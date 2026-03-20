import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeContractModel } from '../models/employee-contract.model';
import { areEmployeeBusinessKeysEqual, toEmployeeBusinessKey } from '../routing/employee-route-key.util';
import { EmployeeContractReadGateway } from './employee-contract-read.gateway';

export type EmployeeContractErrorCode = 'request-failed';

@Injectable({
  providedIn: 'root',
})
export class EmployeeContractStore {
  private readonly employeeContractReadGateway = inject(EmployeeContractReadGateway);
  private readonly selectedEmployeeKeyState = signal<EmployeeBusinessKey | null>(null);
  private readonly contractsState = signal<ReadonlyArray<EmployeeContractModel>>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<EmployeeContractErrorCode | null>(null);
  private requestId = 0;

  readonly selectedEmployeeKey = this.selectedEmployeeKeyState.asReadonly();
  readonly contracts = this.contractsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  loadContractsByBusinessKey(key: EmployeeBusinessKey | null): void {
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
    this.contractsState.set([]);
    this.loadingState.set(true);
    this.errorState.set(null);

    const requestId = ++this.requestId;

    this.employeeContractReadGateway
      .readEmployeeContractsByBusinessKey(normalizedKey)
      .pipe(take(1))
      .subscribe({
        next: (contracts) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.contractsState.set(contracts);
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
    this.contractsState.set([]);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
