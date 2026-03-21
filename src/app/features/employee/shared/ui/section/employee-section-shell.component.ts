import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { employeeTexts } from '../../../employee.texts';
import { SectionCapabilities } from './section-capabilities.model';
import { SectionUiState } from './section-ui-state.model';

const emptyCapabilities: SectionCapabilities = {
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canClose: false,
  canCorrect: false,
  canLaunchWorkflow: false,
};

@Component({
  selector: 'app-employee-section-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-section-shell.component.html',
  styleUrl: './employee-section-shell.component.scss',
})
export class EmployeeSectionShellComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly capabilities = input<SectionCapabilities>(emptyCapabilities);
  readonly state = input.required<SectionUiState>();

  readonly createClicked = output<void>();
  readonly editClicked = output<void>();
  readonly cancelClicked = output<void>();

  protected readonly texts = employeeTexts;
  protected readonly showCreateAction = computed(() => {
    const state = this.state();
    return this.capabilities().canCreate && state.mode === 'view' && !state.busy;
  });
  protected readonly showEditAction = computed(() => {
    const state = this.state();
    return this.capabilities().canEdit && state.mode === 'view' && !state.busy;
  });
  protected readonly showCancelAction = computed(() => {
    const state = this.state();
    return this.isEditableMode(state.mode) && !state.busy;
  });
  protected readonly showFooter = computed(() => {
    const state = this.state();
    return state.busy || Boolean(state.errorMessage) || Boolean(state.successMessage);
  });

  protected onCreateClicked(): void {
    this.createClicked.emit();
  }

  protected onEditClicked(): void {
    this.editClicked.emit();
  }

  protected onCancelClicked(): void {
    this.cancelClicked.emit();
  }

  private isEditableMode(mode: SectionUiState['mode']): boolean {
    return mode === 'editing' || mode === 'creating' || mode === 'confirming' || mode === 'error';
  }
}
