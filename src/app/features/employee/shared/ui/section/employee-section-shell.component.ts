import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SectionUiState } from './section-ui-state.model';

@Component({
  selector: 'app-employee-section-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-section-shell.component.html',
  styleUrl: './employee-section-shell.component.scss',
})
export class EmployeeSectionShellComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly state = input.required<SectionUiState>();

  protected readonly hasSubtitle = computed(() => {
    const subtitle = this.subtitle()?.trim() ?? '';
    return subtitle.length > 0;
  });
  protected readonly showBusy = computed(() => this.state().busy);
  protected readonly showError = computed(() => {
    const errorMessage = this.state().errorMessage?.trim() ?? '';
    return errorMessage.length > 0;
  });
  protected readonly showSuccess = computed(() => {
    const successMessage = this.state().successMessage?.trim() ?? '';
    return successMessage.length > 0;
  });
  protected readonly hasFooterState = computed(
    () => this.showBusy() || this.showError() || this.showSuccess(),
  );
}
