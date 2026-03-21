import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import { ContactResponse, CreateContactRequest, UpdateContactRequest } from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeeContactApiModel {
  contactTypeCode: string;
  contactValue: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeContactReadClient {
  private readonly api = inject(DefaultService);

  readEmployeeContactsByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
  ): Observable<ReadonlyArray<EmployeeContactApiModel>> {
    const normalizedKey = this.normalizeKey(key);

    return this.api.listEmployeeContactsByBusinessKey(normalizedKey).pipe(
      map((contacts) => contacts.map((contact) => this.toEmployeeContactApiModel(contact))),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of([]);
        }

        return throwError(() => error);
      }),
    );
  }

  createContactByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    request: CreateContactRequest,
  ): Observable<EmployeeContactApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .createContactByBusinessKey({
        ...normalizedKey,
        createContactRequest: {
          contactTypeCode: this.normalizeContactTypeCode(request.contactTypeCode),
          contactValue: request.contactValue.trim(),
        },
      })
      .pipe(map((contact) => this.toEmployeeContactApiModel(contact)));
  }

  updateContactByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    contactTypeCode: string,
    request: UpdateContactRequest,
  ): Observable<EmployeeContactApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .updateContactByBusinessKey({
        ...normalizedKey,
        contactTypeCode: this.normalizeContactTypeCode(contactTypeCode),
        updateContactRequest: {
          contactValue: request.contactValue.trim(),
        },
      })
      .pipe(map((contact) => this.toEmployeeContactApiModel(contact)));
  }

  deleteContactByBusinessKey(key: EmployeeBusinessKeyApiQuery, contactTypeCode: string): Observable<void> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .deleteContactByBusinessKey({
        ...normalizedKey,
        contactTypeCode: this.normalizeContactTypeCode(contactTypeCode),
      })
      .pipe(map(() => undefined));
  }

  private normalizeKey(key: EmployeeBusinessKeyApiQuery): EmployeeBusinessKeyApiQuery {
    return {
      ruleSystemCode: key.ruleSystemCode.trim(),
      employeeTypeCode: key.employeeTypeCode.trim(),
      employeeNumber: key.employeeNumber.trim(),
    };
  }

  private normalizeContactTypeCode(contactTypeCode: string): string {
    return contactTypeCode.trim();
  }

  private toEmployeeContactApiModel(source: ContactResponse): EmployeeContactApiModel {
    return {
      contactTypeCode: source.contactTypeCode,
      contactValue: source.contactValue,
    };
  }
}
