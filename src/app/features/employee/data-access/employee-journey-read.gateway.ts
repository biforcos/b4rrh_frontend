import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EmployeeJourneyReadClient } from '../../../core/api/clients/employee-journey-read.client';
import {
  EmployeeJourneyReadModel,
  EmployeeJourneyReadTrackItemModel,
  EmployeeJourneyReadTrackModel,
  mapEmployeeJourneyApiToReadModel,
} from '../../../core/api/mappers/employee-journey.mapper';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import {
  EmployeeJourneyHeaderModel,
  EmployeeJourneyModel,
  EmployeeJourneyTrackItemModel,
  EmployeeJourneyTrackModel,
} from '../models/employee-journey.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeJourneyReadGateway {
  private readonly employeeJourneyReadClient = inject(EmployeeJourneyReadClient);

  readEmployeeJourneyByBusinessKey(key: EmployeeBusinessKey): Observable<EmployeeJourneyModel> {
    return this.employeeJourneyReadClient.readEmployeeJourneyByBusinessKey(key).pipe(
      map((journey) => {
        const readModel = mapEmployeeJourneyApiToReadModel(journey);

        if (!readModel) {
          return this.toEmptyJourneyModel(key);
        }

        return this.toEmployeeJourneyModel(readModel);
      }),
    );
  }

  private toEmployeeJourneyModel(source: EmployeeJourneyReadModel): EmployeeJourneyModel {
    return {
      employee: this.toEmployeeJourneyHeaderModel(source.employee),
      tracks: source.tracks.map((track) => this.toEmployeeJourneyTrackModel(track)),
    };
  }

  private toEmployeeJourneyHeaderModel(source: EmployeeJourneyReadModel['employee']): EmployeeJourneyHeaderModel {
    return {
      ruleSystemCode: source.ruleSystemCode,
      employeeTypeCode: source.employeeTypeCode,
      employeeNumber: source.employeeNumber,
      displayName: source.displayName,
    };
  }

  private toEmployeeJourneyTrackModel(source: EmployeeJourneyReadTrackModel): EmployeeJourneyTrackModel {
    return {
      code: source.code,
      label: source.label,
      items: source.items.map((item) => this.toEmployeeJourneyTrackItemModel(item)),
    };
  }

  private toEmployeeJourneyTrackItemModel(
    source: EmployeeJourneyReadTrackItemModel,
  ): EmployeeJourneyTrackItemModel {
    return {
      startDate: source.startDate,
      endDate: source.endDate,
      label: source.label,
      details: source.details,
      isCurrent: source.isCurrent,
    };
  }

  private toEmptyJourneyModel(key: EmployeeBusinessKey): EmployeeJourneyModel {
    return {
      employee: {
        ruleSystemCode: key.ruleSystemCode.trim(),
        employeeTypeCode: key.employeeTypeCode.trim(),
        employeeNumber: key.employeeNumber.trim(),
        displayName: null,
      },
      tracks: [],
    };
  }
}