import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmployeeNumberingConfig {
  ruleSystemCode: string;
  prefix: string;
  numericPartLength: number;
  step: number;
  nextValue: number;
  nextNumberPreview: string;
}

export interface UpsertEmployeeNumberingConfigRequest {
  prefix: string;
  numericPartLength: number;
  step: number;
  nextValue: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeNumberingConfigClient {
  private readonly http = inject(HttpClient);

  get(ruleSystemCode: string): Observable<EmployeeNumberingConfig> {
    return this.http.get<EmployeeNumberingConfig>(
      `/api/rule-systems/${ruleSystemCode}/employee-numbering-config`
    );
  }

  upsert(
    ruleSystemCode: string,
    request: UpsertEmployeeNumberingConfigRequest
  ): Observable<EmployeeNumberingConfig> {
    return this.http.put<EmployeeNumberingConfig>(
      `/api/rule-systems/${ruleSystemCode}/employee-numbering-config`,
      request
    );
  }
}
