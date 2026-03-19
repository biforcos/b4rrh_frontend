import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeListItemModel } from '../../models/employee-list-item.model';
import { areEmployeeBusinessKeysEqual, toEmployeeBusinessKey } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-directory-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-directory-list.component.html',
  styleUrl: './employee-directory-list.component.scss',
})
export class EmployeeDirectoryListComponent {
  readonly employees = input<ReadonlyArray<EmployeeListItemModel>>([]);
  readonly selectedEmployeeKey = input<EmployeeBusinessKey | null>(null);
  readonly employeeSelected = output<EmployeeBusinessKey>();

  protected readonly texts = employeeTexts;

  protected selectEmployee(employee: EmployeeListItemModel): void {
    this.employeeSelected.emit(toEmployeeBusinessKey(employee));
  }

  protected isSelected(employee: EmployeeListItemModel): boolean {
    return areEmployeeBusinessKeysEqual(this.selectedEmployeeKey(), employee);
  }
}
