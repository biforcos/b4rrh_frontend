export interface RuleEntityModel {
  occurrenceKey: string;
  ruleSystemCode: string;
  ruleEntityTypeCode: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  startDate: string;
  endDate: string | null;
  canCorrect: boolean;
  canClose: boolean;
  canDelete: boolean;
}
