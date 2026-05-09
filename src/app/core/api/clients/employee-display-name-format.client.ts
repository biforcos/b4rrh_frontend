import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmployeeDisplayNameFormatModel {
  ruleSystemCode: string;
  formatCode: string;
  formatLabel: string;
  example: string;
}

export interface UpsertDisplayNameFormatRequest {
  formatCode: string;
}

export const DISPLAY_NAME_FORMAT_CODES = [
  { code: 'FULL_TITLE_CASE',      label: 'Nombre completo (mayúsculas iniciales)', example: 'Juan Antonio Biforcos Amor' },
  { code: 'FULL_UPPER',           label: 'Nombre completo en mayúsculas',           example: 'JUAN ANTONIO BIFORCOS AMOR' },
  { code: 'SURNAME_FIRST_UPPER',  label: 'Apellidos, Nombre (mayúsculas)',           example: 'BIFORCOS AMOR, JUAN ANTONIO' },
  { code: 'SHORT_TITLE',          label: 'Nombre y primer apellido',                 example: 'Juan Antonio Biforcos' },
  { code: 'SHORT_UPPER',          label: 'Nombre y primer apellido (mayúsculas)',    example: 'JUAN ANTONIO BIFORCOS' },
  { code: 'SURNAME_ABBREV_UPPER', label: 'Apellidos, iniciales del nombre',          example: 'BIFORCOS AMOR, J.A.' },
] as const;

@Injectable({ providedIn: 'root' })
export class EmployeeDisplayNameFormatClient {
  private readonly http = inject(HttpClient);

  get(ruleSystemCode: string): Observable<EmployeeDisplayNameFormatModel> {
    return this.http.get<EmployeeDisplayNameFormatModel>(
      `/api/rule-systems/${ruleSystemCode}/employee-display-name-format`
    );
  }

  upsert(ruleSystemCode: string, request: UpsertDisplayNameFormatRequest): Observable<EmployeeDisplayNameFormatModel> {
    return this.http.put<EmployeeDisplayNameFormatModel>(
      `/api/rule-systems/${ruleSystemCode}/employee-display-name-format`,
      request
    );
  }
}
