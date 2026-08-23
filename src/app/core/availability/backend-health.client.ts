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
  // lo demas al poner el context-path en el backend. Opcional a proposito: en
  // los tests nadie provee BASE_PATH, y un cliente de salud no debe ser el
  // motivo de que no se pueda instanciar la aplicacion.
  private readonly basePath = inject(BASE_PATH, { optional: true }) ?? '';

  checkReadiness(): Observable<boolean> {
    return this.http.get<ReadinessResponse>(`${this.basePath}/actuator/health/readiness`).pipe(
      map((response) => response?.status === 'UP'),
      catchError(() => of(false)),
    );
  }
}
