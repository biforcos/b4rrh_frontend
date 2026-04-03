import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

interface ReadinessResponse {
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class BackendHealthClient {
  private readonly http = inject(HttpClient);

  checkReadiness(): Observable<boolean> {
    return this.http.get<ReadinessResponse>('/actuator/health/readiness').pipe(
      map((response) => response?.status === 'UP'),
      catchError(() => of(false)),
    );
  }
}
