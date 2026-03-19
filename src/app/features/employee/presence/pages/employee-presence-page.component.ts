import { ChangeDetectionStrategy, Component } from '@angular/core';

import { employeeTexts } from '../../employee.texts';

@Component({
  selector: 'app-employee-presence-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-presence-page.component.html',
  styleUrl: './employee-presence-page.component.scss',
})
export class EmployeePresencePageComponent {
  protected readonly texts = employeeTexts;
}
