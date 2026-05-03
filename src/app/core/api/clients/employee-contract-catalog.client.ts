import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CatalogsService } from '../generated/api/catalogs.service';
import { RuleEntitiesService } from '../generated/api/rule-entities.service';
import { ContractSubtypeCatalogItemResponse, RuleEntityResponse } from '../generated/model/models';

export interface ContractCatalogApiItem {
  code: string;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeContractCatalogClient {
  private readonly ruleEntitiesApi = inject(RuleEntitiesService);
  private readonly catalogsApi = inject(CatalogsService);

  listContractTypes(
    ruleSystemCode: string,
    referenceDate?: string | null,
  ): Observable<ReadonlyArray<ContractCatalogApiItem>> {
    return this.ruleEntitiesApi
      .listRuleEntities({
        ruleSystemCode: ruleSystemCode.trim(),
        ruleEntityTypeCode: 'CONTRACT',
        active: true,
        referenceDate: this.normalizeOptionalDate(referenceDate),
      })
      .pipe(map((items) => items.map((item) => this.mapRuleEntity(item))));
  }

  listContractSubtypes(
    ruleSystemCode: string,
    contractTypeCode: string,
    referenceDate?: string | null,
  ): Observable<ReadonlyArray<ContractCatalogApiItem>> {
    return this.catalogsApi
      .listContractCatalogSubtypes({
        ruleSystemCode: ruleSystemCode.trim(),
        contractTypeCode: contractTypeCode.trim().toUpperCase(),
        referenceDate: this.normalizeOptionalDate(referenceDate),
      })
      .pipe(map((items) => items.map((item) => this.mapSubtype(item))));
  }

  private mapRuleEntity(source: RuleEntityResponse): ContractCatalogApiItem {
    return {
      code: source.code,
      name: source.name ?? null,
      startDate: source.startDate ?? null,
      endDate: source.endDate ?? null,
    };
  }

  private mapSubtype(source: ContractSubtypeCatalogItemResponse): ContractCatalogApiItem {
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
