import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { AgreementCategoryProfileService } from '../../../core/api/generated/api/agreement-category-profile.service';
import { RuleEntitiesService } from '../../../core/api/generated/api/rule-entities.service';
import { RuleSystemsService } from '../../../core/api/generated/api/rule-systems.service';
import { UpsertAgreementCategoryProfileRequestTipoNominaEnum } from '../../../core/api/generated/model/upsert-agreement-category-profile-request';
import { EmployeeLaborClassificationCatalogClient } from '../../../core/api/clients/employee-labor-classification-catalog.client';
import { SimpleOption } from '../models/agreement-category-profile.model';

export interface AgreementCategoryProfileApiModel {
  grupoCotizacionCode: string;
  tipoNomina: string;
}

@Injectable({ providedIn: 'root' })
export class AgreementCategoryProfileCatalogClient {
  private readonly profileApi = inject(AgreementCategoryProfileService);
  private readonly ruleEntitiesApi = inject(RuleEntitiesService);
  private readonly ruleSystemsApi = inject(RuleSystemsService);
  private readonly laborCatalogClient = inject(EmployeeLaborClassificationCatalogClient);

  listRuleSystems(): Observable<ReadonlyArray<SimpleOption>> {
    return this.ruleSystemsApi
      .listRuleSystems()
      .pipe(map((items) => items.map((rs) => ({ code: rs.code, name: rs.name ?? null }))));
  }

  listAgreements(ruleSystemCode: string): Observable<ReadonlyArray<SimpleOption>> {
    return this.ruleEntitiesApi
      .listRuleEntities({ ruleSystemCode, ruleEntityTypeCode: 'AGREEMENT', active: true })
      .pipe(map((items) => items.map((e) => ({ code: e.code, name: e.name ?? null }))));
  }

  listAgreementCategories(
    ruleSystemCode: string,
    agreementCode: string,
  ): Observable<ReadonlyArray<SimpleOption>> {
    return this.laborCatalogClient
      .listAgreementCategories(ruleSystemCode, agreementCode)
      .pipe(map((items) => items.map((i) => ({ code: i.code, name: i.name }))));
  }

  listGrupoCotizacion(ruleSystemCode: string): Observable<ReadonlyArray<SimpleOption>> {
    return this.ruleEntitiesApi
      .listRuleEntities({ ruleSystemCode, ruleEntityTypeCode: 'GRUPO_COTIZACION', active: true })
      .pipe(map((items) => items.map((e) => ({ code: e.code, name: e.name ?? null }))));
  }

  getProfile(
    ruleSystemCode: string,
    categoryCode: string,
  ): Observable<AgreementCategoryProfileApiModel | null> {
    return this.profileApi.getAgreementCategoryProfile({ ruleSystemCode, categoryCode }).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) return of(null);
        throw err;
      }),
    );
  }

  saveProfile(
    ruleSystemCode: string,
    categoryCode: string,
    grupoCotizacionCode: string,
    tipoNomina: string,
  ): Observable<AgreementCategoryProfileApiModel> {
    return this.profileApi.upsertAgreementCategoryProfile({
      ruleSystemCode,
      categoryCode,
      upsertAgreementCategoryProfileRequest: {
        grupoCotizacionCode,
        tipoNomina: tipoNomina as UpsertAgreementCategoryProfileRequestTipoNominaEnum,
      },
    });
  }
}
