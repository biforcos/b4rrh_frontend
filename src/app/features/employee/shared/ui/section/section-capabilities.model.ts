export interface SectionCapabilities {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canClose: boolean;
  canCorrect: boolean;
  canLaunchWorkflow: boolean;
}

// Example usage (not implemented):
// contacts: { canCreate: true, canEdit: true, canDelete: true, canClose: false, canCorrect: false, canLaunchWorkflow: false }
// addresses: { canCreate: true, canEdit: false, canDelete: false, canClose: true, canCorrect: false, canLaunchWorkflow: false }
