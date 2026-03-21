export interface RuleEntityModel {
  ruleSystemCode: string;
  ruleEntityTypeCode: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  startDate: string;
  endDate: string | null;
}
