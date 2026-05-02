import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RuleEntityTypesService } from '../../../core/api/generated/api/rule-entity-types.service';
import { RuleEntityTypeResponse } from '../../../core/api/generated/model/rule-entity-type-response';

@Injectable({
  providedIn: 'root',
})
export class RuleEntityTypeClient {
  private readonly api = inject(RuleEntityTypesService);

  listRuleEntityTypes(): Observable<ReadonlyArray<RuleEntityTypeResponse>> {
    return this.api.listRuleEntityTypes();
  }
}
