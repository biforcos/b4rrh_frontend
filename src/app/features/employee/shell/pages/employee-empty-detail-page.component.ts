import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { employeeTexts } from '../../employee.texts';

@Component({
  selector: 'app-employee-empty-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  templateUrl: './employee-empty-detail-page.component.html',
  styleUrl: './employee-empty-detail-page.component.scss',
})
export class EmployeeEmptyDetailPageComponent {
  protected readonly texts = employeeTexts;
}
