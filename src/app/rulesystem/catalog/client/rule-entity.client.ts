import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RuleEntitiesService } from '../../../core/api/generated/api/rule-entities.service';
import { CloseRuleEntityRequest } from '../../../core/api/generated/model/close-rule-entity-request';
import { CorrectRuleEntityRequest } from '../../../core/api/generated/model/correct-rule-entity-request';
import { CreateRuleEntityRequest } from '../../../core/api/generated/model/create-rule-entity-request';
import { RuleEntityResponse } from '../../../core/api/generated/model/rule-entity-response';

export interface RuleEntityListFilters {
  ruleSystemCode: string;
  ruleEntityTypeCode: string;
}

export interface RuleEntityOccurrenceBusinessKey {
  ruleSystemCode: string;
  ruleEntityTypeCode: string;
  code: string;
  startDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class RuleEntityClient {
  private readonly api = inject(RuleEntitiesService);

  listRuleEntities(filters: RuleEntityListFilters): Observable<ReadonlyArray<RuleEntityResponse>> {
    return this.api.listRuleEntities({
      ruleSystemCode: filters.ruleSystemCode.trim(),
      ruleEntityTypeCode: filters.ruleEntityTypeCode.trim(),
    });
  }

  createRuleEntity(payload: CreateRuleEntityRequest): Observable<RuleEntityResponse> {
    return this.api.createRuleEntity({ createRuleEntityRequest: payload });
  }

  correctRuleEntityByBusinessKey(
    businessKey: RuleEntityOccurrenceBusinessKey,
    payload: CorrectRuleEntityRequest,
  ): Observable<RuleEntityResponse> {
    return this.api.correctRuleEntityByBusinessKey({
      ruleSystemCode: businessKey.ruleSystemCode.trim(),
      ruleEntityTypeCode: businessKey.ruleEntityTypeCode.trim(),
      code: businessKey.code.trim(),
      startDate: businessKey.startDate,
      correctRuleEntityRequest: payload,
    });
  }

  closeRuleEntityByBusinessKey(
    businessKey: RuleEntityOccurrenceBusinessKey,
    payload: CloseRuleEntityRequest,
  ): Observable<RuleEntityResponse> {
    return this.api.closeRuleEntityByBusinessKey({
      ruleSystemCode: businessKey.ruleSystemCode.trim(),
      ruleEntityTypeCode: businessKey.ruleEntityTypeCode.trim(),
      code: businessKey.code.trim(),
      startDate: businessKey.startDate,
      closeRuleEntityRequest: payload,
    });
  }

  deleteRuleEntityByBusinessKey(businessKey: RuleEntityOccurrenceBusinessKey): Observable<void> {
    return this.api.deleteRuleEntityByBusinessKey({
      ruleSystemCode: businessKey.ruleSystemCode.trim(),
      ruleEntityTypeCode: businessKey.ruleEntityTypeCode.trim(),
      code: businessKey.code.trim(),
      startDate: businessKey.startDate,
    });
  }
}
