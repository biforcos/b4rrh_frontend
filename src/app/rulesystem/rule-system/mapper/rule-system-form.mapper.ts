import { CreateRuleSystemRequest } from '../models/create-rule-system.request';
import { RuleSystemFormModel } from '../models/rule-system-form.model';
import { RuleSystem } from '../models/rule-system.model';
import { UpdateRuleSystemRequest } from '../models/update-rule-system.request';

export function mapRuleSystemToFormModel(source: RuleSystem): RuleSystemFormModel {
  return {
    code: source.code,
    name: source.name,
    countryCode: source.countryCode,
    active: source.active,
  };
}

export function mapFormModelToCreateRuleSystemRequest(
  source: RuleSystemFormModel,
): CreateRuleSystemRequest {
  return {
    code: source.code.trim(),
    name: source.name.trim(),
    countryCode: source.countryCode.trim().toUpperCase(),
  };
}

export function mapFormModelToUpdateRuleSystemRequest(
  source: RuleSystemFormModel,
): UpdateRuleSystemRequest {
  return {
    name: source.name.trim(),
    countryCode: source.countryCode.trim().toUpperCase(),
    active: source.active,
  };
}
