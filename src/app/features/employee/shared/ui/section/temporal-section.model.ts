export interface TemporalRowViewModel<KeyType = number> {
  key: KeyType;
  title: string;
  subtitle?: string | null;
  detailText?: string | null;
  periodText?: string | null;
  statusLabel?: string | null;
  isCurrent?: boolean;
  closeable?: boolean;
}

export type TemporalDisplayMode =
  | 'view'
  | 'manage'
  | 'creating'
  | 'editingCurrent'
  | 'correcting'
  | 'confirmingClose';

export interface TemporalSectionTexts {
  manageAction: string;
  exitManageAction: string;
  addAction: string;
  editCurrentAction: string;
  correctAction: string;
  closeAction: string;
  cancelAction: string;
  saveCreateAction: string;
  saveEditCurrentAction: string;
  saveCorrectAction: string;
  confirmCloseMessage: string;
  confirmCloseAction: string;
  emptyMessage: string;
}
