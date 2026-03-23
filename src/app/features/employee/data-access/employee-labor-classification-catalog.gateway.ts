import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  EmployeeLaborClassificationCatalogClient,
  LaborClassificationCatalogApiItem,
} from '../../../core/api/clients/employee-labor-classification-catalog.client';
import { EmployeeLaborClassificationCatalogItemModel } from '../models/employee-labor-classification-catalog-item.model';
import { getCatalogDisplay } from '../shared/utils/catalog-display.util';

@Injectable({
  providedIn: 'root',
})
export class EmployeeLaborClassificationCatalogGateway {
  private readonly client = inject(EmployeeLaborClassificationCatalogClient);

  loadAgreements(
    ruleSystemCode: string,
    referenceDate?: string | null,
  ): Observable<ReadonlyArray<EmployeeLaborClassificationCatalogItemModel>> {
    return this.client
      .listAgreements(ruleSystemCode, referenceDate)
      .pipe(map((items) => items.map((item) => this.toCatalogItemModel(item))));
  }

  loadAgreementCategories(
    ruleSystemCode: string,
    agreementCode: string,
    referenceDate?: string | null,
  ): Observable<ReadonlyArray<EmployeeLaborClassificationCatalogItemModel>> {
    return this.client
      .listAgreementCategories(ruleSystemCode, agreementCode, referenceDate)
      .pipe(map((items) => items.map((item) => this.toCatalogItemModel(item))));
  }

  private toCatalogItemModel(
    source: LaborClassificationCatalogApiItem,
  ): EmployeeLaborClassificationCatalogItemModel {
    return {
      code: source.code,
      name: source.name,
      label: this.buildLabel(source.code, source.name),
      startDate: source.startDate,
      endDate: source.endDate,
    };
  }

  private buildLabel(code: string, name: string | null): string {
    const display = getCatalogDisplay(name, code);
    return display.code ? `${display.label} · ${display.code}` : display.label;
  }
}
