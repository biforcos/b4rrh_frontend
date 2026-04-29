import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeRouteSection } from '../../routing/employee-route-builder.util';
import { buildEmployeeDetailRouteCommands } from '../../routing/employee-route-builder.util';
import {
  UiTabsNavComponent,
  UiTabsNavItem,
} from '../../../../shared/ui/tabs-nav/ui-tabs-nav.component';

interface DetailAreaLink {
  section: EmployeeRouteSection;
  label: string;
}

const routedDetailAreas = [
  {
    section: 'contact',
    label: employeeTexts.personalAreaLabel,
  },
  {
    section: 'presence',
    label: employeeTexts.laborAreaLabel,
  },
  {
    section: 'organization',
    label: employeeTexts.organizationalAreaLabel,
  },
  {
    section: 'payroll',
    label: employeeTexts.payrollAreaLabel,
  },
] as const satisfies ReadonlyArray<DetailAreaLink>;

@Component({
  selector: 'app-employee-detail-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiTabsNavComponent],
  templateUrl: './employee-detail-nav.component.html',
  styleUrl: './employee-detail-nav.component.scss',
})
export class EmployeeDetailNavComponent {
  readonly employeeKey = input.required<EmployeeBusinessKey>();
  readonly activeSection = input<EmployeeRouteSection>('contact');

  protected readonly texts = employeeTexts;
  protected readonly navItems = computed<ReadonlyArray<UiTabsNavItem>>(() => {
    const employeeKey = this.employeeKey();
    return routedDetailAreas.map((area) => ({
      value: area.section,
      label: area.label,
      routeCommands: buildEmployeeDetailRouteCommands(employeeKey, area.section),
    }));
  });
}
