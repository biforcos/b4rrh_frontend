import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import {
  AgreementCategoryCatalogItemResponse,
  RuleEntityResponse,
} from '../generated/model/models';

export interface LaborClassificationCatalogApiItem {
  code: string;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeLaborClassificationCatalogClient {
  private readonly api = inject(DefaultService);

  listAgreements(
    ruleSystemCode: string,
    referenceDate?: string | null,
  ): Observable<ReadonlyArray<LaborClassificationCatalogApiItem>> {
    return this.api
      .listRuleEntities({
        ruleSystemCode: ruleSystemCode.trim(),
        ruleEntityTypeCode: 'AGREEMENT',
        active: true,
        referenceDate: this.normalizeOptionalDate(referenceDate),
      })
      .pipe(map((items) => items.map((item) => this.mapRuleEntity(item))));
  }

  listAgreementCategories(
    ruleSystemCode: string,
    agreementCode: string,
    referenceDate?: string | null,
  ): Observable<ReadonlyArray<LaborClassificationCatalogApiItem>> {
    return this.api
      .listLaborClassificationAgreementCategories({
        ruleSystemCode: ruleSystemCode.trim(),
        agreementCode: agreementCode.trim().toUpperCase(),
        referenceDate: this.normalizeOptionalDate(referenceDate),
      })
      .pipe(map((items) => items.map((item) => this.mapAgreementCategory(item))));
  }

  private mapRuleEntity(source: RuleEntityResponse): LaborClassificationCatalogApiItem {
    return {
      code: source.code,
      name: source.name ?? null,
      startDate: source.startDate ?? null,
      endDate: source.endDate ?? null,
    };
  }

  private mapAgreementCategory(source: AgreementCategoryCatalogItemResponse): LaborClassificationCatalogApiItem {
    return {
      code: source.code,
      name: source.name ?? null,
      startDate: source.startDate ?? null,
      endDate: source.endDate ?? null,
    };
  }

  private normalizeOptionalDate(value: string | null | undefined): string | undefined {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }
}
