import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendHealthClient } from './backend-health.client';

@Injectable({
  providedIn: 'root',
})
export class BackendAvailabilityGateway {
  private readonly client = inject(BackendHealthClient);

  checkAvailability(): Observable<boolean> {
    return this.client.checkReadiness();
  }
}
