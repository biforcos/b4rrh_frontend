import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import {
  EmployeeRouteSection,
} from '../../routing/employee-route-builder.util';
import { buildEmployeeDetailRouteCommands } from '../../routing/employee-route-builder.util';
import { UiTabsNavComponent, UiTabsNavItem } from '../../../../shared/ui/tabs-nav/ui-tabs-nav.component';

interface DetailAreaLink {
  section: EmployeeRouteSection;
  label: string;
}

interface DisabledDetailAreaLink {
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
] as const satisfies ReadonlyArray<DetailAreaLink>;

const disabledDetailAreas = [
  { label: employeeTexts.payrollAreaLabel },
] as const satisfies ReadonlyArray<DisabledDetailAreaLink>;

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
  protected readonly routedAreas = routedDetailAreas;
  protected readonly disabledAreas = disabledDetailAreas;
  protected readonly navItems = computed<ReadonlyArray<UiTabsNavItem>>(() => {
    const employeeKey = this.employeeKey();

    const routedItems = this.routedAreas.map((area) => ({
      value: area.section,
      label: area.label,
      routeCommands: buildEmployeeDetailRouteCommands(employeeKey, area.section),
    }));

    const disabledItems = this.disabledAreas.map((area, index) => ({
      value: `disabled-${index}`,
      label: area.label,
      disabled: true,
    }));

    return [...routedItems, ...disabledItems];
  });
}
