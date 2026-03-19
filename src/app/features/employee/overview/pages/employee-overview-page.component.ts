import { ChangeDetectionStrategy, Component } from '@angular/core';

import { employeeTexts } from '../../employee.texts';

@Component({
  selector: 'app-employee-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-overview-page.component.html',
  styleUrl: './employee-overview-page.component.scss',
})
export class EmployeeOverviewPageComponent {
  protected readonly texts = employeeTexts;
}
