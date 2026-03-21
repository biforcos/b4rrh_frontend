import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeContactModel } from '../models/employee-contact.model';
import { SlotDraft } from '../shared/ui/section/editable-slot-section.model';
import { EmployeeContactGateway } from './employee-contact.gateway';
import { areEmployeeBusinessKeysEqual, toEmployeeBusinessKey } from '../routing/employee-route-key.util';
import { EmployeeContactReadGateway } from './employee-contact-read.gateway';

export type EmployeeContactErrorCode = 'request-failed';

@Injectable({
  providedIn: 'root',
})
export class EmployeeContactStore {
  private readonly employeeContactReadGateway = inject(EmployeeContactReadGateway);
  private readonly employeeContactGateway = inject(EmployeeContactGateway);
  private readonly selectedEmployeeKeyState = signal<EmployeeBusinessKey | null>(null);
  private readonly contactsState = signal<ReadonlyArray<EmployeeContactModel>>([]);
  private readonly loadingState = signal(false);
  private readonly mutatingState = signal(false);
  private readonly errorState = signal<EmployeeContactErrorCode | null>(null);
  private readonly successState = signal<'created' | 'updated' | 'deleted' | null>(null);
  private requestId = 0;

  readonly selectedEmployeeKey = this.selectedEmployeeKeyState.asReadonly();
  readonly contacts = this.contactsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly mutating = this.mutatingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  loadContacts(key: EmployeeBusinessKey | null): void {
    this.loadContactsByBusinessKey(key);
  }

  loadContactsByBusinessKey(key: EmployeeBusinessKey | null): void {
    this.loadContactsByBusinessKeyInternal(key, false);
  }

  createContact(employeeKey: EmployeeBusinessKey, draft: SlotDraft<string>): void {
    if (this.mutatingState()) {
      return;
    }

    const normalizedEmployeeKey = toEmployeeBusinessKey(employeeKey);

    this.mutatingState.set(true);
    this.errorState.set(null);
    this.successState.set(null);

    this.employeeContactGateway
      .createContact(normalizedEmployeeKey, draft)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.mutatingState.set(false);
          this.successState.set('created');
          this.loadContactsByBusinessKeyInternal(normalizedEmployeeKey, true);
        },
        error: () => {
          this.mutatingState.set(false);
          this.errorState.set('request-failed');
        },
      });
  }

  updateContact(employeeKey: EmployeeBusinessKey, contactTypeCode: string, draft: SlotDraft<string>): void {
    if (this.mutatingState()) {
      return;
    }

    const normalizedEmployeeKey = toEmployeeBusinessKey(employeeKey);

    this.mutatingState.set(true);
    this.errorState.set(null);
    this.successState.set(null);

    this.employeeContactGateway
      .updateContact(normalizedEmployeeKey, contactTypeCode, draft)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.mutatingState.set(false);
          this.successState.set('updated');
          this.loadContactsByBusinessKeyInternal(normalizedEmployeeKey, true);
        },
        error: () => {
          this.mutatingState.set(false);
          this.errorState.set('request-failed');
        },
      });
  }

  deleteContact(employeeKey: EmployeeBusinessKey, contactTypeCode: string): void {
    if (this.mutatingState()) {
      return;
    }

    const normalizedEmployeeKey = toEmployeeBusinessKey(employeeKey);

    this.mutatingState.set(true);
    this.errorState.set(null);
    this.successState.set(null);

    this.employeeContactGateway
      .deleteContact(normalizedEmployeeKey, contactTypeCode)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.mutatingState.set(false);
          this.successState.set('deleted');
          this.loadContactsByBusinessKeyInternal(normalizedEmployeeKey, true);
        },
        error: () => {
          this.mutatingState.set(false);
          this.errorState.set('request-failed');
        },
      });
  }

  private loadContactsByBusinessKeyInternal(key: EmployeeBusinessKey | null, forceReload: boolean): void {
    if (!key) {
      this.resetState();
      return;
    }

    const normalizedKey = toEmployeeBusinessKey(key);
    const isSameKey = areEmployeeBusinessKeysEqual(this.selectedEmployeeKeyState(), normalizedKey);

    if (!forceReload && isSameKey && (this.loadingState() || this.errorState() === null)) {
      return;
    }

    const hasKeyChanged = !isSameKey;

    this.selectedEmployeeKeyState.set(normalizedKey);
    if (hasKeyChanged) {
      this.contactsState.set([]);
    }
    this.loadingState.set(true);
    this.errorState.set(null);
    if (hasKeyChanged || !forceReload) {
      this.successState.set(null);
    }

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
    this.mutatingState.set(false);
    this.errorState.set(null);
    this.successState.set(null);
  }
}
