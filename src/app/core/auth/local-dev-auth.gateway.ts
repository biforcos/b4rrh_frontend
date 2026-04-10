import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DevAuthRequest, DevAuthResponse } from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class LocalDevAuthGateway {
  private readonly http = inject(HttpClient);

  issueToken(request: DevAuthRequest): Observable<DevAuthResponse> {
    return this.http.post<DevAuthResponse>('/dev/auth/token', request);
  }
}