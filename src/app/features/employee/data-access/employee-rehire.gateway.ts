import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { EmployeeLifecycleService } from '../../../core/api/generated/api/employee-lifecycle.service';
import { RehireEmployeeDraft, RehireEmployeeResult } from '../models/employee-rehire.model';
import { mapDraftToRehireRequest, mapResponseToResult } from './employee-rehire.mapper';
import { HIRE_EMPLOYEE_DEFAULTS } from '../models/hire-employee.defaults';

@Injectable({
  providedIn: 'root',
})
export class EmployeeRehireGateway {
  private readonly api = inject(EmployeeLifecycleService);

  rehire(draft: RehireEmployeeDraft): Observable<RehireEmployeeResult> {
    const payload = mapDraftToRehireRequest(draft);

    return this.api
      .rehireEmployee({
        ruleSystemCode: draft.ruleSystemCode,
        employeeTypeCode: draft.employeeTypeCode || HIRE_EMPLOYEE_DEFAULTS.employeeTypeCode,
        employeeNumber: draft.employeeNumber,
        rehireEmployeeRequest: payload,
      })
      .pipe(map((response) => mapResponseToResult(response)));
  }
}
