import { RuleEntityResponse } from '../../../core/api/generated/model/rule-entity-response';

import { RuleEntityModel } from '../models/rule-entity.model';

export function mapRuleEntityResponseToModel(source: RuleEntityResponse): RuleEntityModel {
  return {
    occurrenceKey: `${source.code}|${source.startDate}`,
    ruleSystemCode: source.ruleSystemCode,
    ruleEntityTypeCode: source.ruleEntityTypeCode,
    code: source.code,
    name: source.name,
    description: source.description ?? null,
    active: source.active,
    startDate: source.startDate,
    endDate: source.endDate ?? null,
    canCorrect: true,
    canClose: source.active,
    canDelete: true,
  };
}
