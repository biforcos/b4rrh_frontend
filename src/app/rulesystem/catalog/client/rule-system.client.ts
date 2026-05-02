import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RuleSystemsService } from '../../../core/api/generated/api/rule-systems.service';
import { RuleSystemResponse } from '../../../core/api/generated/model/rule-system-response';

@Injectable({
  providedIn: 'root',
})
export class RuleSystemClient {
  private readonly api = inject(RuleSystemsService);

  listRuleSystems(): Observable<ReadonlyArray<RuleSystemResponse>> {
    return this.api.listRuleSystems();
  }
}
