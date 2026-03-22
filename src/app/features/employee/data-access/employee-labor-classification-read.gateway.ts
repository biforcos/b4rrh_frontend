import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EmployeeLaborClassificationReadClient } from '../../../core/api/clients/employee-labor-classification-read.client';
import {
  EmployeeLaborClassificationReadModel,
  mapEmployeeLaborClassificationApiToReadModel,
} from '../../../core/api/mappers/employee-labor-classification.mapper';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeLaborClassificationModel } from '../models/employee-labor-classification.model';
import {
  LaborClassificationCloseDraft,
  LaborClassificationCorrectDraft,
  LaborClassificationReplaceDraft,
  mapLaborClassificationCloseDraftToRequest,
  mapLaborClassificationCorrectDraftToRequest,
  mapLaborClassificationReplaceDraftToRequest,
} from './employee-labor-classification.mapper';

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

  replaceLaborClassificationFromDate(
    key: EmployeeBusinessKey,
    draft: LaborClassificationReplaceDraft,
  ): Observable<void> {
    return this.employeeLaborClassificationReadClient
      .replaceLaborClassificationFromDateByBusinessKey(key, mapLaborClassificationReplaceDraftToRequest(draft))
      .pipe(map(() => undefined));
  }

  correctLaborClassificationOccurrence(
    key: EmployeeBusinessKey,
    startDate: string,
    draft: LaborClassificationCorrectDraft,
  ): Observable<void> {
    return this.employeeLaborClassificationReadClient
      .updateLaborClassificationByBusinessKey(key, startDate, mapLaborClassificationCorrectDraftToRequest(draft))
      .pipe(map(() => undefined));
  }

  closeLaborClassificationOccurrence(
    key: EmployeeBusinessKey,
    startDate: string,
    draft: LaborClassificationCloseDraft,
  ): Observable<void> {
    return this.employeeLaborClassificationReadClient
      .closeLaborClassificationByBusinessKey(key, startDate, mapLaborClassificationCloseDraftToRequest(draft))
      .pipe(map(() => undefined));
  }

  sortByTimelineRecency(
    classifications: ReadonlyArray<EmployeeLaborClassificationModel>,
  ): ReadonlyArray<EmployeeLaborClassificationModel> {
    return [...classifications].sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }

      const startDateOrder = right.startDate.localeCompare(left.startDate);
      if (startDateOrder !== 0) {
        return startDateOrder;
      }

      const agreementCodeOrder = right.agreementCode.localeCompare(left.agreementCode);
      if (agreementCodeOrder !== 0) {
        return agreementCodeOrder;
      }

      return right.agreementCategoryCode.localeCompare(left.agreementCategoryCode);
    });
  }

  private toEmployeeLaborClassificationModel(
    source: EmployeeLaborClassificationReadModel,
  ): EmployeeLaborClassificationModel {
    return {
      agreementCode: source.agreementCode,
      agreementName: source.agreementName,
      agreementCategoryCode: source.agreementCategoryCode,
      agreementCategoryName: source.agreementCategoryName,
      startDate: source.startDate,
      endDate: source.endDate,
      isActive: source.isActive,
    };
  }
}