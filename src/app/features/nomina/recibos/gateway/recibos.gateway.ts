import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { PayrollResponse } from '../../../../core/api/generated/model/payroll-response';
import { RecibosClient } from '../client/recibos.client';
import {
  mapPayrollSummaryResponseToModel,
  mapPayrollConceptResponseToModel,
} from '../mapper/recibos.mapper';
import { PayrollBusinessKey } from '../models/payroll-business-key.model';
import { PayrollConceptModel } from '../models/payroll-concept.model';
import { PayrollSummaryModel } from '../models/payroll-summary.model';
import { RecibosFilters } from '../models/recibos-filters.model';

@Injectable({ providedIn: 'root' })
export class RecibosGateway {
  private readonly client = inject(RecibosClient);

  search(filters: RecibosFilters): Observable<ReadonlyArray<PayrollSummaryModel>> {
    return this.client
      .search(filters)
      .pipe(map((items) => items.map(mapPayrollSummaryResponseToModel)));
  }

  getConcepts(key: PayrollBusinessKey): Observable<ReadonlyArray<PayrollConceptModel>> {
    return this.client.getByBusinessKey(key).pipe(
      map((response) =>
        (response.concepts ?? [])
          .map(mapPayrollConceptResponseToModel)
          .sort((a, b) => a.displayOrder - b.displayOrder),
      ),
    );
  }

  invalidate(key: PayrollBusinessKey): Observable<PayrollSummaryModel> {
    return this.client.invalidate(key).pipe(map(payrollResponseToSummary));
  }

  validate(key: PayrollBusinessKey): Observable<PayrollSummaryModel> {
    return this.client.validate(key).pipe(map(payrollResponseToSummary));
  }

  recalculate(key: PayrollBusinessKey): Observable<PayrollSummaryModel> {
    return this.client.recalculate(key).pipe(map(payrollResponseToSummary));
  }
}

function payrollResponseToSummary(r: PayrollResponse): PayrollSummaryModel {
  return {
    ruleSystemCode: r.ruleSystemCode,
    employeeTypeCode: r.employeeTypeCode,
    employeeNumber: r.employeeNumber,
    payrollPeriodCode: r.payrollPeriodCode,
    payrollTypeCode: r.payrollTypeCode,
    presenceNumber: r.presenceNumber,
    status: r.status as PayrollSummaryModel['status'],
    calculatedAt: r.calculatedAt,
  };
}
