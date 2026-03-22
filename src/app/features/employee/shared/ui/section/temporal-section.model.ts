export interface TemporalRowViewModel<KeyType = number> {
  key: KeyType;
  title: string;
  titleSecondary?: string | null;
  subtitle?: string | null;
  detailText?: string | null;
  detailSecondary?: string | null;
  periodText?: string | null;
  statusLabel?: string | null;
  isCurrent?: boolean;
  canCorrect?: boolean;
  canClose?: boolean;
  canDelete?: boolean;
  closeable?: boolean;
  deletable?: boolean;
  deleteDisabledReason?: string | null;
}

export type TemporalDisplayMode =
  | 'view'
  | 'manage'
  | 'creating'
  | 'editingCurrent'
  | 'correcting'
  | 'confirmingClose'
  | 'confirmingDelete';

export interface TemporalSectionTexts {
  manageAction: string;
  exitManageAction: string;
  addAction: string;
  editCurrentAction: string;
  correctAction: string;
  closeAction: string;
  deleteAction: string;
  cancelAction: string;
  saveCreateAction: string;
  saveEditCurrentAction: string;
  saveCorrectAction: string;
  confirmCloseMessage: string;
  confirmCloseAction: string;
  confirmDeleteMessage: string;
  confirmDeleteAction: string;
  emptyMessage: string;
}
