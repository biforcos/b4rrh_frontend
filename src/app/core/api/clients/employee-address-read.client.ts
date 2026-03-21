import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import { AddressResponse, CloseAddressRequest, CreateAddressRequest } from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeeAddressApiModel {
  addressNumber: number;
  addressTypeCode: string;
  street: string;
  city: string;
  countryCode: string;
  postalCode: string | null;
  regionCode: string | null;
  startDate: string;
  endDate: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeAddressReadClient {
  private readonly api = inject(DefaultService);

  readEmployeeAddressesByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
  ): Observable<ReadonlyArray<EmployeeAddressApiModel>> {
    const normalizedKey = this.normalizeKey(key);

    return this.api.listEmployeeAddressesByBusinessKey(normalizedKey).pipe(
      map((addresses) => addresses.map((address) => this.toEmployeeAddressApiModel(address))),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of([]);
        }

        return throwError(() => error);
      }),
    );
  }

  createAddressByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    request: CreateAddressRequest,
  ): Observable<EmployeeAddressApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .createAddressByBusinessKey({
        ...normalizedKey,
        createAddressRequest: {
          addressTypeCode: request.addressTypeCode.trim().toUpperCase(),
          street: request.street.trim(),
          city: request.city.trim(),
          countryCode: request.countryCode.trim().toUpperCase(),
          postalCode: this.normalizeOptionalValue(request.postalCode),
          regionCode: this.normalizeOptionalValue(request.regionCode),
          startDate: request.startDate.trim(),
          endDate: this.normalizeOptionalValue(request.endDate),
        },
      })
      .pipe(map((address) => this.toEmployeeAddressApiModel(address)));
  }

  closeAddressByBusinessKey(
    key: EmployeeBusinessKeyApiQuery,
    addressNumber: number,
    request: CloseAddressRequest,
  ): Observable<EmployeeAddressApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .closeAddressByBusinessKey({
        ...normalizedKey,
        addressNumber,
        closeAddressRequest: {
          endDate: request.endDate.trim(),
        },
      })
      .pipe(map((address) => this.toEmployeeAddressApiModel(address)));
  }

  private normalizeKey(key: EmployeeBusinessKeyApiQuery): EmployeeBusinessKeyApiQuery {
    return {
      ruleSystemCode: key.ruleSystemCode.trim(),
      employeeTypeCode: key.employeeTypeCode.trim(),
      employeeNumber: key.employeeNumber.trim(),
    };
  }

  private normalizeOptionalValue(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private toEmployeeAddressApiModel(source: AddressResponse): EmployeeAddressApiModel {
    return {
      addressNumber: source.addressNumber,
      addressTypeCode: source.addressTypeCode,
      street: source.street,
      city: source.city,
      countryCode: source.countryCode,
      postalCode: source.postalCode ?? null,
      regionCode: source.regionCode ?? null,
      startDate: source.startDate,
      endDate: source.endDate ?? null,
    };
  }
}
