import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { BASE_PATH } from '../api/generated/variables';

interface ReadinessResponse {
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class BackendHealthClient {
  private readonly http = inject(HttpClient);
  // Misma raiz que el resto de la API: el actuator se movio a /api con todo
  // lo demas al poner el context-path en el backend.
  private readonly basePath = inject(BASE_PATH);

  checkReadiness(): Observable<boolean> {
    return this.http.get<ReadinessResponse>(`${this.basePath}/actuator/health/readiness`).pipe(
      map((response) => response?.status === 'UP'),
      catchError(() => of(false)),
    );
  }
}
