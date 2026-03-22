import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { EmployeeSectionShellComponent } from './employee-section-shell.component';
import { SectionUiState } from './section-ui-state.model';
import { TemporalDisplayMode, TemporalRowViewModel, TemporalSectionTexts } from './temporal-section.model';

const emptyTexts: TemporalSectionTexts = {
  manageAction: 'Manage',
  exitManageAction: 'Done',
  addAction: 'Add',
  editCurrentAction: 'Edit current',
  closeAction: 'Close',
  cancelAction: 'Cancel',
  saveCreateAction: 'Save',
  saveEditCurrentAction: 'Save',
  confirmCloseMessage: 'Confirm close',
  confirmCloseAction: 'Confirm',
  emptyMessage: 'No rows',
};

@Component({
  selector: 'app-temporal-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeSectionShellComponent],
  templateUrl: './temporal-section.component.html',
  styleUrl: './temporal-section.component.scss',
})
export class TemporalSectionComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly state = input.required<SectionUiState>();
  readonly displayMode = input<TemporalDisplayMode>('view');
  readonly rows = input<ReadonlyArray<TemporalRowViewModel<number>>>([]);
  readonly texts = input<TemporalSectionTexts>(emptyTexts);
  readonly confirmingCloseKey = input<number | null>(null);
  readonly editingCurrentKey = input<number | null>(null);
  readonly canCreate = input(false);
  readonly canEditCurrent = input(false);
  readonly canClose = input(false);
  readonly createSubmitEnabled = input(false);
  readonly editSubmitEnabled = input(false);

  readonly manageStarted = output<void>();
  readonly manageExited = output<void>();
  readonly createStarted = output<void>();
  readonly editCurrentStarted = output<number>();
  readonly closeRequested = output<number>();
  readonly closeConfirmed = output<number>();
  readonly cancelled = output<void>();
  readonly createSubmitted = output<void>();
  readonly editCurrentSubmitted = output<number>();

  protected readonly isViewMode = computed(() => this.displayMode() === 'view');
  protected readonly isManageMode = computed(() => this.displayMode() === 'manage');
  protected readonly isCreating = computed(() => this.displayMode() === 'creating');
  protected readonly isEditingCurrent = computed(
    () => this.displayMode() === 'editingCurrent' && this.editingCurrentKey() !== null,
  );
  protected readonly isConfirmingClose = computed(
    () => this.displayMode() === 'confirmingClose' && this.confirmingCloseKey() !== null,
  );
  protected readonly hasRows = computed(() => this.rows().length > 0);
  protected readonly showEmpty = computed(() => !this.hasRows() && !this.isCreating());
  protected readonly canManage = computed(() => this.canCreate() || this.canEditCurrent() || this.canClose());
  protected readonly showManageAction = computed(
    () => this.isViewMode() && this.canManage() && !this.state().busy,
  );
  protected readonly showAddAction = computed(
    () => this.canCreate() && this.isManageMode() && !this.state().busy,
  );
  protected readonly showExitManageAction = computed(
    () => this.isManageMode() && !this.state().busy,
  );
  protected readonly showRowCloseAction = computed(
    () => this.canClose() && this.isManageMode() && !this.state().busy,
  );
  protected readonly showRowEditCurrentAction = computed(
    () => this.canEditCurrent() && this.isManageMode() && !this.state().busy,
  );

  protected trackRowByKey(_index: number, row: TemporalRowViewModel<number>): number {
    return row.key;
  }

  protected isRowCloseConfirming(row: TemporalRowViewModel<number>): boolean {
    return this.isConfirmingClose() && this.confirmingCloseKey() === row.key;
  }

  protected isRowEditingCurrent(row: TemporalRowViewModel<number>): boolean {
    return this.isEditingCurrent() && this.editingCurrentKey() === row.key;
  }

  protected onManageStarted(): void {
    this.manageStarted.emit();
  }

  protected onManageExited(): void {
    this.manageExited.emit();
  }

  protected onCreateStarted(): void {
    this.createStarted.emit();
  }

  protected onEditCurrentStarted(rowKey: number): void {
    this.editCurrentStarted.emit(rowKey);
  }

  protected onCloseRequested(rowKey: number): void {
    this.closeRequested.emit(rowKey);
  }

  protected onCloseConfirmed(rowKey: number): void {
    this.closeConfirmed.emit(rowKey);
  }

  protected onCancelled(): void {
    this.cancelled.emit();
  }

  protected onCreateSubmitted(): void {
    if (!this.createSubmitEnabled() || this.state().busy) {
      return;
    }

    this.createSubmitted.emit();
  }

  protected onEditCurrentSubmitted(rowKey: number): void {
    if (!this.editSubmitEnabled() || this.state().busy) {
      return;
    }

    this.editCurrentSubmitted.emit(rowKey);
  }
}
