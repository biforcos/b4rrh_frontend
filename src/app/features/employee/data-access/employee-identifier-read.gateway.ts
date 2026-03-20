import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EmployeeIdentifierReadClient } from '../../../core/api/clients/employee-identifier-read.client';
import {
  EmployeeIdentifierReadModel,
  mapEmployeeIdentifierApiToReadModel,
} from '../../../core/api/mappers/employee-identifier.mapper';
import { EmployeeIdentifierModel } from '../models/employee-identifier.model';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeIdentifierReadGateway {
  private readonly employeeIdentifierReadClient = inject(EmployeeIdentifierReadClient);

  readEmployeeIdentifiersByBusinessKey(
    key: EmployeeBusinessKey,
  ): Observable<ReadonlyArray<EmployeeIdentifierModel>> {
    return this.employeeIdentifierReadClient.readEmployeeIdentifiersByBusinessKey(key).pipe(
      map((identifiers) =>
        identifiers
          .map((identifier) => mapEmployeeIdentifierApiToReadModel(identifier))
          .filter((identifier): identifier is EmployeeIdentifierReadModel => identifier !== null)
          .map((identifier) => this.toEmployeeIdentifierModel(identifier)),
      ),
    );
  }

  private toEmployeeIdentifierModel(source: EmployeeIdentifierReadModel): EmployeeIdentifierModel {
    return {
      typeCode: source.typeCode,
      value: source.value,
      issuingCountryCode: source.issuingCountryCode,
      expirationDate: source.expirationDate,
      isPrimary: source.isPrimary,
    };
  }
}
