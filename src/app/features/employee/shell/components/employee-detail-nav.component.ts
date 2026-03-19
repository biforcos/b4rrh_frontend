import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import {
  buildEmployeeDetailRouteCommands,
  EmployeeRouteSection,
} from '../../routing/employee-route-builder.util';

const detailLinks = [
  { section: 'overview', label: employeeTexts.overviewNavLabel },
  { section: 'contact', label: employeeTexts.contactNavLabel },
  { section: 'presence', label: employeeTexts.presenceNavLabel },
] as const satisfies ReadonlyArray<{ section: EmployeeRouteSection; label: string }>;

@Component({
  selector: 'app-employee-detail-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './employee-detail-nav.component.html',
  styleUrl: './employee-detail-nav.component.scss',
})
export class EmployeeDetailNavComponent {
  readonly employeeKey = input.required<EmployeeBusinessKey>();

  protected readonly links = detailLinks;

  protected buildLinkCommands(section: EmployeeRouteSection): ReadonlyArray<string> {
    return buildEmployeeDetailRouteCommands(this.employeeKey(), section);
  }
}
