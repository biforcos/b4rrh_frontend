import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EmployeePresenceReadClient } from '../../../core/api/clients/employee-presence-read.client';
import {
  EmployeePresenceReadModel,
  mapEmployeePresenceApiToReadModel,
} from '../../../core/api/mappers/employee-presence.mapper';
import { EmployeePresenceModel } from '../models/employee-presence.model';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeePresenceReadGateway {
  private readonly employeePresenceReadClient = inject(EmployeePresenceReadClient);

  readEmployeePresencesByBusinessKey(
    key: EmployeeBusinessKey,
  ): Observable<ReadonlyArray<EmployeePresenceModel>> {
    return this.employeePresenceReadClient.readEmployeePresencesByBusinessKey(key).pipe(
      map((presences) =>
        presences
          .map((presence) => mapEmployeePresenceApiToReadModel(presence))
          .filter((presence): presence is EmployeePresenceReadModel => presence !== null)
          .map((presence) => this.toEmployeePresenceModel(presence)),
      ),
    );
  }

  private toEmployeePresenceModel(source: EmployeePresenceReadModel): EmployeePresenceModel {
    return {
      presenceNumber: source.presenceNumber,
      companyCode: source.companyCode,
      entryReasonCode: source.entryReasonCode,
      exitReasonCode: source.exitReasonCode,
      startDate: source.startDate,
      endDate: source.endDate,
      isActive: source.isActive,
    };
  }
}
