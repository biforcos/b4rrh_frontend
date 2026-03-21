import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { EmployeeSectionShellComponent } from './employee-section-shell.component';
import { SectionUiState } from './section-ui-state.model';
import { TemporalDisplayMode, TemporalRowViewModel, TemporalSectionTexts } from './temporal-section.model';

const emptyTexts: TemporalSectionTexts = {
  manageAction: 'Manage',
  exitManageAction: 'Done',
  addAction: 'Add',
  closeAction: 'Close',
  cancelAction: 'Cancel',
  saveCreateAction: 'Save',
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
  readonly canCreate = input(false);
  readonly canClose = input(false);
  readonly createSubmitEnabled = input(false);

  readonly manageStarted = output<void>();
  readonly manageExited = output<void>();
  readonly createStarted = output<void>();
  readonly closeRequested = output<number>();
  readonly closeConfirmed = output<number>();
  readonly cancelled = output<void>();
  readonly createSubmitted = output<void>();

  protected readonly isViewMode = computed(() => this.displayMode() === 'view');
  protected readonly isManageMode = computed(() => this.displayMode() === 'manage');
  protected readonly isCreating = computed(() => this.displayMode() === 'creating');
  protected readonly isConfirmingClose = computed(
    () => this.displayMode() === 'confirmingClose' && this.confirmingCloseKey() !== null,
  );
  protected readonly hasRows = computed(() => this.rows().length > 0);
  protected readonly showEmpty = computed(() => !this.hasRows() && !this.isCreating());
  protected readonly canManage = computed(() => this.canCreate() || this.canClose());
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

  protected trackRowByKey(_index: number, row: TemporalRowViewModel<number>): number {
    return row.key;
  }

  protected isRowCloseConfirming(row: TemporalRowViewModel<number>): boolean {
    return this.isConfirmingClose() && this.confirmingCloseKey() === row.key;
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
}
