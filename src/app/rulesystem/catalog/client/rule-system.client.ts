import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DefaultService } from '../../../core/api/generated/api/default.service';
import { RuleSystemResponse } from '../../../core/api/generated/model/rule-system-response';

@Injectable({
  providedIn: 'root',
})
export class RuleSystemClient {
  private readonly api = inject(DefaultService);

  listRuleSystems(): Observable<ReadonlyArray<RuleSystemResponse>> {
    return this.api.listRuleSystems();
  }
}
