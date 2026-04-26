import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  PayrollResponse,
  PayrollResponseStatusEnum,
} from '../../../../core/api/generated/model/payroll-response';
import { RecibosClient } from '../client/recibos.client';
import {
  mapPayrollSummaryResponseToModel,
  mapPayrollConceptResponseToModel,
  mapCompanyProfileResponseToModel,
  mapEmployeeProfileResponseToModel,
  mapAgreementProfileResponseToModel,
} from '../mapper/recibos.mapper';
import { PayrollBusinessKey } from '../models/payroll-business-key.model';
import { PayrollConceptModel } from '../models/payroll-concept.model';
import {
  PayrollSummaryModel,
  PayrollCompanyProfileModel,
  PayrollEmployeeProfileModel,
  PayrollAgreementProfileModel,
} from '../models/payroll-summary.model';
import { RecibosFilters } from '../models/recibos-filters.model';

export interface PayrollDetailModel {
  concepts: ReadonlyArray<PayrollConceptModel>;
  companyProfile: PayrollCompanyProfileModel | null;
  employeeProfile: PayrollEmployeeProfileModel | null;
  agreementProfile: PayrollAgreementProfileModel | null;
  presenceStartDate: string | null;
  presenceEndDate: string | null;
  workCenterCode: string | null;
  workCenterName: string | null;
}

@Injectable({ providedIn: 'root' })
export class RecibosGateway {
  private readonly client = inject(RecibosClient);

  search(filters: RecibosFilters): Observable<ReadonlyArray<PayrollSummaryModel>> {
    return this.client
      .search(filters)
      .pipe(map((items) => items.map(mapPayrollSummaryResponseToModel)));
  }

  getDetail(key: PayrollBusinessKey): Observable<PayrollDetailModel> {
    return this.client.getByBusinessKey(key).pipe(
      map((response) => ({
        concepts: (response.concepts ?? [])
          .map(mapPayrollConceptResponseToModel)
          .sort((a, b) => a.displayOrder - b.displayOrder),
        companyProfile: mapCompanyProfileResponseToModel(response.companyProfile),
        employeeProfile: mapEmployeeProfileResponseToModel(response.employeeProfile),
        agreementProfile: mapAgreementProfileResponseToModel(response.agreementProfile),
        presenceStartDate: response.presenceStartDate ?? null,
        presenceEndDate: response.presenceEndDate ?? null,
        workCenterCode: response.workCenterCode ?? null,
        workCenterName: response.workCenterName ?? null,
      })),
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

const PAYROLL_RESPONSE_STATUS_MAP: Record<
  PayrollResponseStatusEnum,
  PayrollSummaryModel['status']
> = {
  [PayrollResponseStatusEnum.NotValid]: 'NOT_VALID',
  [PayrollResponseStatusEnum.Calculated]: 'CALCULATED',
  [PayrollResponseStatusEnum.ExplicitValidated]: 'EXPLICIT_VALIDATED',
  [PayrollResponseStatusEnum.Definitive]: 'DEFINITIVE',
};

function payrollResponseToSummary(r: PayrollResponse): PayrollSummaryModel {
  return {
    ruleSystemCode: r.ruleSystemCode,
    employeeTypeCode: r.employeeTypeCode,
    employeeNumber: r.employeeNumber,
    payrollPeriodCode: r.payrollPeriodCode,
    payrollTypeCode: r.payrollTypeCode,
    presenceNumber: r.presenceNumber,
    status: PAYROLL_RESPONSE_STATUS_MAP[r.status],
    calculatedAt: r.calculatedAt,
  };
}
