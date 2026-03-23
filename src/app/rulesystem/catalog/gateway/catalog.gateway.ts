import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { RuleEntityClient } from '../client/rule-entity.client';
import { RuleEntityTypeClient } from '../client/rule-entity-type.client';
import { RuleSystemClient } from '../client/rule-system.client';
import { mapRuleEntityResponseToModel } from '../mapper/rule-entity.mapper';
import { mapRuleEntityTypeResponseToModel } from '../mapper/rule-entity-type.mapper';
import { CloseRuleEntityRequestModel } from '../models/close-rule-entity.request';
import { CreateRuleEntityRequestModel } from '../models/create-rule-entity.request';
import { CorrectRuleEntityRequestModel } from '../models/correct-rule-entity.request';
import { mapRuleSystemResponseToModel } from '../mapper/rule-system.mapper';
import { RuleEntityModel } from '../models/rule-entity.model';
import { RuleEntityTypeModel } from '../models/rule-entity-type.model';
import { RuleSystemModel } from '../models/rule-system.model';
import { RuleEntityOccurrenceBusinessKey } from '../client/rule-entity.client';

@Injectable({
  providedIn: 'root',
})
export class CatalogGateway {
  private readonly ruleSystemClient = inject(RuleSystemClient);
  private readonly ruleEntityTypeClient = inject(RuleEntityTypeClient);
  private readonly ruleEntityClient = inject(RuleEntityClient);

  loadRuleSystems(): Observable<ReadonlyArray<RuleSystemModel>> {
    return this.ruleSystemClient
      .listRuleSystems()
      .pipe(map((items) => items.map((item) => mapRuleSystemResponseToModel(item))));
  }

  loadRuleEntityTypes(): Observable<ReadonlyArray<RuleEntityTypeModel>> {
    return this.ruleEntityTypeClient
      .listRuleEntityTypes()
      .pipe(map((items) => items.map((item) => mapRuleEntityTypeResponseToModel(item))));
  }

  loadRuleEntities(
    ruleSystemCode: string,
    ruleEntityTypeCode: string,
  ): Observable<ReadonlyArray<RuleEntityModel>> {
    return this.ruleEntityClient
      .listRuleEntities({ ruleSystemCode, ruleEntityTypeCode })
      .pipe(map((items) => items.map((item) => mapRuleEntityResponseToModel(item))));
  }

  createRuleEntity(request: CreateRuleEntityRequestModel): Observable<RuleEntityModel> {
    return this.ruleEntityClient
      .createRuleEntity(request)
      .pipe(map((created) => mapRuleEntityResponseToModel(created)));
  }

  correctRuleEntityByBusinessKey(
    businessKey: RuleEntityOccurrenceBusinessKey,
    request: CorrectRuleEntityRequestModel,
  ): Observable<RuleEntityModel> {
    return this.ruleEntityClient
      .correctRuleEntityByBusinessKey(businessKey, request)
      .pipe(map((updated) => mapRuleEntityResponseToModel(updated)));
  }

  closeRuleEntityByBusinessKey(
    businessKey: RuleEntityOccurrenceBusinessKey,
    request: CloseRuleEntityRequestModel,
  ): Observable<RuleEntityModel> {
    return this.ruleEntityClient
      .closeRuleEntityByBusinessKey(businessKey, request)
      .pipe(map((updated) => mapRuleEntityResponseToModel(updated)));
  }

  deleteRuleEntityByBusinessKey(businessKey: RuleEntityOccurrenceBusinessKey): Observable<void> {
    return this.ruleEntityClient.deleteRuleEntityByBusinessKey(businessKey);
  }
}
