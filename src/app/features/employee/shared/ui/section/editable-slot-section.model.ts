export interface SlotRowViewModel<KeyType = string> {
  key: KeyType;
  keyLabel: string;
  value: string;
  valueLabel?: string | null;
  secondaryText?: string | null;
  badges?: ReadonlyArray<string>;
  isReadonly?: boolean;
}

export interface SlotDraft<KeyType = string> {
  key: KeyType | null;
  value: string;
}

export interface SlotKeyOption<KeyType = string> {
  value: KeyType;
  label: string;
}

export interface SlotEditSubmission<KeyType = string> {
  key: KeyType;
  value: string;
}

export type SlotDisplayMode = 'view' | 'manage' | 'creating' | 'editing' | 'confirmingDelete';

export interface SlotSectionTexts {
  manageAction: string;
  exitManageAction: string;
  addAction: string;
  editAction: string;
  deleteAction: string;
  cancelAction: string;
  saveCreateAction: string;
  saveEditAction: string;
  confirmDeleteMessage: string;
  confirmDeleteAction: string;
  emptyMessage: string;
  keyFieldLabel: string;
  valueFieldLabel: string;
}
