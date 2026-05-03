import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { AgreementCategoryProfileCatalogClient } from '../client/agreement-category-profile.client';
import {
  AgreementCategoryProfileDraft,
  AgreementCategoryWithProfileModel,
  SimpleOption,
} from '../models/agreement-category-profile.model';

@Injectable({ providedIn: 'root' })
export class AgreementCategoryProfileGateway {
  private readonly client = inject(AgreementCategoryProfileCatalogClient);

  loadRuleSystems(): Observable<ReadonlyArray<SimpleOption>> {
    return this.client.listRuleSystems();
  }

  loadAgreements(ruleSystemCode: string): Observable<ReadonlyArray<SimpleOption>> {
    return this.client.listAgreements(ruleSystemCode);
  }

  loadGrupoCotizacion(ruleSystemCode: string): Observable<ReadonlyArray<SimpleOption>> {
    return this.client.listGrupoCotizacion(ruleSystemCode);
  }

  loadCategoriesWithProfiles(
    ruleSystemCode: string,
    agreementCode: string,
  ): Observable<ReadonlyArray<AgreementCategoryWithProfileModel>> {
    return this.client.listAgreementCategories(ruleSystemCode, agreementCode).pipe(
      switchMap((categories) => {
        if (categories.length === 0) return of([]);
        return forkJoin(
          categories.map((cat) =>
            this.client.getProfile(ruleSystemCode, cat.code).pipe(
              map((profile) => ({
                categoryCode: cat.code,
                categoryName: cat.name,
                grupoCotizacionCode: profile?.grupoCotizacionCode ?? null,
                tipoNomina: (profile?.tipoNomina ?? null) as 'MENSUAL' | 'DIARIO' | null,
              })),
            ),
          ),
        );
      }),
    );
  }

  saveProfile(
    ruleSystemCode: string,
    categoryCode: string,
    draft: AgreementCategoryProfileDraft,
  ): Observable<{ grupoCotizacionCode: string; tipoNomina: 'MENSUAL' | 'DIARIO' }> {
    return this.client
      .saveProfile(ruleSystemCode, categoryCode, draft.grupoCotizacionCode, draft.tipoNomina)
      .pipe(
        map((profile) => ({
          grupoCotizacionCode: profile.grupoCotizacionCode,
          tipoNomina: profile.tipoNomina as 'MENSUAL' | 'DIARIO',
        })),
      );
  }
}
