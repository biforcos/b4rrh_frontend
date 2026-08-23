import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { BASE_PATH } from '../api/generated/variables';
import { DemoAuthResponse, DemoAuthSubjects } from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class DemoAuthGateway {
  private readonly http = inject(HttpClient);
  private readonly basePath = inject(BASE_PATH, { optional: true }) ?? '';

  /** Perfiles que ofrece la demo. Solo responde si el backend corre en modo demo. */
  listSubjects(): Observable<DemoAuthSubjects> {
    return this.http.get<DemoAuthSubjects>(`${this.basePath}/demo/auth/subjects`);
  }

  login(subject: string, password: string): Observable<DemoAuthResponse> {
    return this.http.post<DemoAuthResponse>(`${this.basePath}/demo/auth/login`, { subject, password });
  }
}
