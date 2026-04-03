import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DefaultService } from '../../../core/api/generated/api/default.service';
import { HireEmployeeDraft, HireEmployeeResult } from '../models/employee-hiring.model';
import { mapDraftToHireRequest, mapResponseToResult } from './employee-hiring.mapper';

@Injectable({
  providedIn: 'root',
})
export class EmployeeHiringGateway {
  private readonly api = inject(DefaultService);

  hire(draft: HireEmployeeDraft): Observable<HireEmployeeResult> {
    return this.api
      .hireEmployee({
        hireEmployeeRequest: mapDraftToHireRequest(draft),
      })
      .pipe(map((response) => mapResponseToResult(response)));
  }
}
