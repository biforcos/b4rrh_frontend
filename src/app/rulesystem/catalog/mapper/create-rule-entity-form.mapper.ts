import { CreateRuleEntityRequestModel } from '../models/create-rule-entity.request';
import { CreateRuleEntityFormModel } from '../models/create-rule-entity-form.model';

export function mapCreateRuleEntityFormToRequest(
  form: CreateRuleEntityFormModel,
  ruleSystemCode: string,
  ruleEntityTypeCode: string,
): CreateRuleEntityRequestModel {
  const normalizedDescription = form.description.trim();
  const normalizedEndDate = form.endDate.trim();

  return {
    ruleSystemCode: ruleSystemCode.trim(),
    ruleEntityTypeCode: ruleEntityTypeCode.trim(),
    code: form.code.trim(),
    name: form.name.trim(),
    description: normalizedDescription.length > 0 ? normalizedDescription : null,
    startDate: form.startDate,
    endDate: normalizedEndDate.length > 0 ? normalizedEndDate : null,
  };
}
