export type CompanyUiMode = 'idle' | 'viewing' | 'creating' | 'editing' | 'submitting' | 'error';

export interface CompanyBusinessKey {
  ruleSystemCode: string;
  companyCode: string;
}

export interface CompanyUiCapabilities {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canClose: boolean;
  canCorrect: boolean;
  canLaunchWorkflow: boolean;
}

export const COMPANY_UI_CAPABILITIES: CompanyUiCapabilities = {
  canCreate: true,
  canEdit: true,
  canDelete: false,
  canClose: false,
  canCorrect: false,
  canLaunchWorkflow: false,
};
