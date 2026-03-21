import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DefaultService } from '../../../core/api/generated/api/default.service';
import { CreateRuleEntityRequest } from '../../../core/api/generated/model/create-rule-entity-request';
import { RuleEntityResponse } from '../../../core/api/generated/model/rule-entity-response';

export interface RuleEntityListFilters {
  ruleSystemCode: string;
  ruleEntityTypeCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class RuleEntityClient {
  private readonly api = inject(DefaultService);

  listRuleEntities(filters: RuleEntityListFilters): Observable<ReadonlyArray<RuleEntityResponse>> {
    return this.api.listRuleEntities({
      ruleSystemCode: filters.ruleSystemCode.trim(),
      ruleEntityTypeCode: filters.ruleEntityTypeCode.trim(),
    });
  }

  createRuleEntity(payload: CreateRuleEntityRequest): Observable<RuleEntityResponse> {
    return this.api.createRuleEntity({ createRuleEntityRequest: payload });
  }
}
