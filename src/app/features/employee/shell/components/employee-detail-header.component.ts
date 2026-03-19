import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';
import { EmployeeListItemModel } from '../../models/employee-list-item.model';

@Component({
  selector: 'app-employee-detail-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-detail-header.component.html',
  styleUrl: './employee-detail-header.component.scss',
})
export class EmployeeDetailHeaderComponent {
  readonly employee = input.required<EmployeeListItemModel>();

  protected readonly texts = employeeTexts;
}
