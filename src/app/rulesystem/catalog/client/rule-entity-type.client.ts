import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DefaultService } from '../../../core/api/generated/api/default.service';
import { RuleEntityTypeResponse } from '../../../core/api/generated/model/rule-entity-type-response';

@Injectable({
  providedIn: 'root',
})
export class RuleEntityTypeClient {
  private readonly api = inject(DefaultService);

  listRuleEntityTypes(): Observable<ReadonlyArray<RuleEntityTypeResponse>> {
    return this.api.listRuleEntityTypes();
  }
}
