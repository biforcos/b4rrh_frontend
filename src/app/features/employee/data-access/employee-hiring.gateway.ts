import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { EmployeeLifecycleService } from '../../../core/api/generated/api/employee-lifecycle.service';
import { HireEmployeeDraft, HireEmployeeResult } from '../models/employee-hiring.model';
import { mapDraftToHireRequest, mapResponseToResult } from './employee-hiring.mapper';

@Injectable({
  providedIn: 'root',
})
export class EmployeeHiringGateway {
  private readonly api = inject(EmployeeLifecycleService);

  hire(draft: HireEmployeeDraft): Observable<HireEmployeeResult> {
    return this.api
      .hireEmployee({
        hireEmployeeRequest: mapDraftToHireRequest(draft),
      })
      .pipe(map((response) => mapResponseToResult(response)));
  }
}
