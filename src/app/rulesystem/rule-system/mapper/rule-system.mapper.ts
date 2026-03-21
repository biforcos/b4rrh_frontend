import { RuleSystemResponse } from '../../../core/api/generated/model/rule-system-response';

import { RuleSystem } from '../models/rule-system.model';

export function mapRuleSystemResponseToModel(source: RuleSystemResponse): RuleSystem {
  return {
    code: source.code,
    name: source.name,
    countryCode: source.countryCode,
    active: source.active,
  };
}

export function mapRuleSystemResponseListToModel(
  source: ReadonlyArray<RuleSystemResponse>,
): ReadonlyArray<RuleSystem> {
  return source.map((item) => mapRuleSystemResponseToModel(item));
}
