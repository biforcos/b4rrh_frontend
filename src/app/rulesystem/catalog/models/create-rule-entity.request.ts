export interface CreateRuleEntityRequestModel {
  ruleSystemCode: string;
  ruleEntityTypeCode: string;
  code: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
}
