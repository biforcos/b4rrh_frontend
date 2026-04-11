import { Injectable, signal } from '@angular/core';

import { EmployeeListItemModel } from '../models/employee-list-item.model';
import { areEmployeeBusinessKeysEqual } from '../routing/employee-route-key.util';

const STORAGE_KEY = 'b4rrhh_recent_employees';
const MAX_RECENTS = 5;

@Injectable({ providedIn: 'root' })
export class EmployeeRecentsService {
  private readonly recentsState = signal<ReadonlyArray<EmployeeListItemModel>>(
    this.loadFromStorage(),
  );

  readonly recents = this.recentsState.asReadonly();

  add(employee: EmployeeListItemModel): void {
    const current = this.recentsState().filter((e) => !areEmployeeBusinessKeysEqual(e, employee));
    const updated = [employee, ...current].slice(0, MAX_RECENTS);
    this.recentsState.set(updated);
    this.saveToStorage(updated);
  }

  private loadFromStorage(): ReadonlyArray<EmployeeListItemModel> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: ReadonlyArray<EmployeeListItemModel>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — silently ignore
    }
  }
}
