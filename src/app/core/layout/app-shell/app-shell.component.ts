import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { appTexts } from '../../i18n/app-texts';

interface AppNavItem {
  label: string;
  route: string;
  exact?: boolean;
}

interface AppNavGroup {
  label: string;
  items: ReadonlyArray<AppNavItem>;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly texts = appTexts;
  protected readonly navGroups: ReadonlyArray<AppNavGroup> = [
    {
      label: this.texts.sectionHome,
      items: [{ label: this.texts.sectionHome, route: '/inicio', exact: true }],
    },
    {
      label: this.texts.sectionPeople,
      items: [{ label: this.texts.sectionEmployees, route: '/personas/empleados' }],
    },
    {
      label: this.texts.sectionOrganization,
      items: [
        { label: this.texts.sectionCompanies, route: '/organizacion/empresas' },
        { label: this.texts.sectionWorkCenters, route: '/organizacion/centros-trabajo' },
        { label: this.texts.sectionCostCenters, route: '/organizacion/centros-coste' },
        { label: this.texts.sectionCatalogs, route: '/organizacion/catalogos' },
      ],
    },
    {
      label: this.texts.sectionSettings,
      items: [{ label: this.texts.sectionRuleSystems, route: '/configuracion/rule-systems' }],
    },
  ];
}
