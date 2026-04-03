import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { BackendAvailabilityGateway } from './backend-availability.gateway';

export type BackendAvailabilityStatus = 'unknown' | 'available' | 'unavailable';

@Injectable({
  providedIn: 'root',
})
export class BackendAvailabilityStore {
  private readonly gateway = inject(BackendAvailabilityGateway);

  private readonly statusState = signal<BackendAvailabilityStatus>('unknown');
  private readonly loadingState = signal(false);

  readonly status = this.statusState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  check(): void {
    if (this.loadingState()) return;

    this.loadingState.set(true);

    this.gateway
      .checkAvailability()
      .pipe(take(1))
      .subscribe({
        next: (available) => {
          this.loadingState.set(false);
          this.statusState.set(available ? 'available' : 'unavailable');
        },
        error: () => {
          this.loadingState.set(false);
          this.statusState.set('unavailable');
        },
      });
  }

  retry(): void {
    this.statusState.set('unknown');
    this.check();
  }
}
