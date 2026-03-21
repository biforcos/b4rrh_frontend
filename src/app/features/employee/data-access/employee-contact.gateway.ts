import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EmployeeContactReadClient } from '../../../core/api/clients/employee-contact-read.client';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { toEmployeeBusinessKey } from '../routing/employee-route-key.util';
import { SlotDraft } from '../shared/ui/section/editable-slot-section.model';
import {
  mapSlotDraftToCreateContactRequest,
  mapSlotDraftToUpdateContactRequest,
} from './employee-contact-edit.mapper';

@Injectable({
  providedIn: 'root',
})
export class EmployeeContactGateway {
  private readonly contactClient = inject(EmployeeContactReadClient);

  createContact(employeeKey: EmployeeBusinessKey, draft: SlotDraft<string>): Observable<void> {
    const normalizedKey = toEmployeeBusinessKey(employeeKey);

    return this.contactClient
      .createContactByBusinessKey(normalizedKey, mapSlotDraftToCreateContactRequest(draft))
      .pipe(map(() => undefined));
  }

  updateContact(
    employeeKey: EmployeeBusinessKey,
    contactTypeCode: string,
    draft: SlotDraft<string>,
  ): Observable<void> {
    const normalizedKey = toEmployeeBusinessKey(employeeKey);

    return this.contactClient
      .updateContactByBusinessKey(
        normalizedKey,
        contactTypeCode.trim(),
        mapSlotDraftToUpdateContactRequest(draft),
      )
      .pipe(map(() => undefined));
  }

  deleteContact(employeeKey: EmployeeBusinessKey, contactTypeCode: string): Observable<void> {
    const normalizedKey = toEmployeeBusinessKey(employeeKey);

    return this.contactClient.deleteContactByBusinessKey(normalizedKey, contactTypeCode.trim());
  }
}
