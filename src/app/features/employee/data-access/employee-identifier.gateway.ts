import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EmployeeIdentifierReadClient } from '../../../core/api/clients/employee-identifier-read.client';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeIdentifierModel } from '../models/employee-identifier.model';
import { toEmployeeBusinessKey } from '../routing/employee-route-key.util';
import { SlotDraft } from '../shared/ui/section/editable-slot-section.model';
import {
  mapSlotDraftToCreateIdentifierRequest,
  mapSlotDraftToUpdateIdentifierRequest,
} from './employee-identifier-edit.mapper';

@Injectable({
  providedIn: 'root',
})
export class EmployeeIdentifierGateway {
  private readonly identifierClient = inject(EmployeeIdentifierReadClient);

  createIdentifier(employeeKey: EmployeeBusinessKey, draft: SlotDraft<string>): Observable<void> {
    const normalizedKey = toEmployeeBusinessKey(employeeKey);

    return this.identifierClient
      .createIdentifierByBusinessKey(normalizedKey, mapSlotDraftToCreateIdentifierRequest(draft))
      .pipe(map(() => undefined));
  }

  updateIdentifier(
    employeeKey: EmployeeBusinessKey,
    identifierTypeCode: string,
    draft: SlotDraft<string>,
    source: EmployeeIdentifierModel,
  ): Observable<void> {
    const normalizedKey = toEmployeeBusinessKey(employeeKey);

    return this.identifierClient
      .updateIdentifierByBusinessKey(
        normalizedKey,
        identifierTypeCode.trim().toUpperCase(),
        mapSlotDraftToUpdateIdentifierRequest(draft, source),
      )
      .pipe(map(() => undefined));
  }

  deleteIdentifier(employeeKey: EmployeeBusinessKey, identifierTypeCode: string): Observable<void> {
    const normalizedKey = toEmployeeBusinessKey(employeeKey);

    return this.identifierClient
      .deleteIdentifierByBusinessKey(normalizedKey, identifierTypeCode.trim().toUpperCase())
      .pipe(map(() => undefined));
  }
}
