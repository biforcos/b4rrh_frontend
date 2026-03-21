import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../../employee.texts';
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

  protected readonly texts = employeeTexts;
  protected readonly showFooter = computed(() => {
    const state = this.state();
    return state.busy || Boolean(state.errorMessage) || Boolean(state.successMessage);
  });
}
