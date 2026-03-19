import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import {
  buildEmployeeDetailRouteCommands,
  EmployeeRouteSection,
} from '../../routing/employee-route-builder.util';

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
] as const satisfies ReadonlyArray<DetailAreaLink>;

const disabledDetailAreas = [
  { label: employeeTexts.organizationalAreaLabel },
  { label: employeeTexts.payrollAreaLabel },
] as const satisfies ReadonlyArray<DisabledDetailAreaLink>;

@Component({
  selector: 'app-employee-detail-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './employee-detail-nav.component.html',
  styleUrl: './employee-detail-nav.component.scss',
})
export class EmployeeDetailNavComponent {
  readonly employeeKey = input.required<EmployeeBusinessKey>();
  readonly activeSection = input<EmployeeRouteSection>('contact');

  protected readonly texts = employeeTexts;
  protected readonly routedAreas = routedDetailAreas;
  protected readonly disabledAreas = disabledDetailAreas;

  protected buildLinkCommands(section: EmployeeRouteSection): ReadonlyArray<string> {
    return buildEmployeeDetailRouteCommands(this.employeeKey(), section);
  }

  protected isAreaActive(section: EmployeeRouteSection): boolean {
    return this.activeSection() === section;
  }
}
