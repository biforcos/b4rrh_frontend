import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EmployeeLaborClassificationReadClient } from '../../../core/api/clients/employee-labor-classification-read.client';
import {
  EmployeeLaborClassificationReadModel,
  mapEmployeeLaborClassificationApiToReadModel,
} from '../../../core/api/mappers/employee-labor-classification.mapper';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeLaborClassificationModel } from '../models/employee-labor-classification.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeLaborClassificationReadGateway {
  private readonly employeeLaborClassificationReadClient = inject(EmployeeLaborClassificationReadClient);

  readEmployeeLaborClassificationsByBusinessKey(
    key: EmployeeBusinessKey,
  ): Observable<ReadonlyArray<EmployeeLaborClassificationModel>> {
    return this.employeeLaborClassificationReadClient.readEmployeeLaborClassificationsByBusinessKey(key).pipe(
      map((classifications) =>
        classifications
          .map((classification) => mapEmployeeLaborClassificationApiToReadModel(classification))
          .filter(
            (classification): classification is EmployeeLaborClassificationReadModel =>
              classification !== null,
          )
          .map((classification) => this.toEmployeeLaborClassificationModel(classification)),
      ),
    );
  }

  private toEmployeeLaborClassificationModel(
    source: EmployeeLaborClassificationReadModel,
  ): EmployeeLaborClassificationModel {
    return {
      agreementCode: source.agreementCode,
      agreementCategoryCode: source.agreementCategoryCode,
      startDate: source.startDate,
      endDate: source.endDate,
      isActive: source.isActive,
    };
  }
}