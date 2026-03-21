import { RuleSystemResponse } from '../../../core/api/generated/model/rule-system-response';

import { RuleSystemModel } from '../models/rule-system.model';

export function mapRuleSystemResponseToModel(source: RuleSystemResponse): RuleSystemModel {
  return {
    code: source.code,
    name: source.name,
    countryCode: source.countryCode,
    active: source.active,
  };
}
