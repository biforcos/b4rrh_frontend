import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DefaultService } from '../../../core/api/generated/api/default.service';
import { RehireEmployeeDraft, RehireEmployeeResult } from '../models/employee-rehire.model';
import { mapDraftToRehireRequest, mapResponseToResult, ExtendedRehireEmployeeRequest } from './employee-rehire.mapper';
import { HIRE_EMPLOYEE_DEFAULTS } from '../models/hire-employee.defaults';

@Injectable({
  providedIn: 'root',
})
export class EmployeeRehireGateway {
  private readonly api = inject(DefaultService);

  rehire(draft: RehireEmployeeDraft): Observable<RehireEmployeeResult> {
    const payload: ExtendedRehireEmployeeRequest = mapDraftToRehireRequest(draft);

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
