import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { EmployeePayrollInputService } from '../../../core/api/generated/api/employee-payroll-input.service';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { toEmployeeBusinessKey } from '../routing/employee-route-key.util';

export interface PayrollInputItem {
  conceptCode: string;
  quantity: number;
}

export interface PayrollInputCreateDraft {
  conceptCode: string;
  period: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeePayrollInputGateway {
  private readonly api = inject(EmployeePayrollInputService);

  listInputs(
    key: EmployeeBusinessKey,
    period: number,
  ): Observable<ReadonlyArray<PayrollInputItem>> {
    const k = toEmployeeBusinessKey(key);
    return this.api
      .listEmployeePayrollInputsByBusinessKey({
        ruleSystemCode: k.ruleSystemCode,
        employeeTypeCode: k.employeeTypeCode,
        employeeNumber: k.employeeNumber,
        period,
      })
      .pipe(
        map((res) => res.inputs.map((i) => ({ conceptCode: i.conceptCode, quantity: i.quantity }))),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) return of([]);
          throw err;
        }),
      );
  }

  createInput(key: EmployeeBusinessKey, draft: PayrollInputCreateDraft): Observable<void> {
    const k = toEmployeeBusinessKey(key);
    return this.api
      .createEmployeePayrollInputByBusinessKey({
        ruleSystemCode: k.ruleSystemCode,
        employeeTypeCode: k.employeeTypeCode,
        employeeNumber: k.employeeNumber,
        createEmployeePayrollInputRequest: {
          conceptCode: draft.conceptCode,
          period: draft.period,
          quantity: draft.quantity,
        },
      })
      .pipe(map(() => undefined));
  }

  updateInput(
    key: EmployeeBusinessKey,
    conceptCode: string,
    period: number,
    quantity: number,
  ): Observable<void> {
    const k = toEmployeeBusinessKey(key);
    return this.api
      .updateEmployeePayrollInputByBusinessKey({
        ruleSystemCode: k.ruleSystemCode,
        employeeTypeCode: k.employeeTypeCode,
        employeeNumber: k.employeeNumber,
        conceptCode,
        period,
        updateEmployeePayrollInputRequest: { quantity },
      })
      .pipe(map(() => undefined));
  }

  deleteInput(key: EmployeeBusinessKey, conceptCode: string, period: number): Observable<void> {
    const k = toEmployeeBusinessKey(key);
    return this.api
      .deleteEmployeePayrollInputByBusinessKey({
        ruleSystemCode: k.ruleSystemCode,
        employeeTypeCode: k.employeeTypeCode,
        employeeNumber: k.employeeNumber,
        conceptCode,
        period,
      })
      .pipe(map(() => undefined));
  }
}
