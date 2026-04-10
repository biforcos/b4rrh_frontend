import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';

import { AuthStore } from '../../auth/auth.store';
import { appTexts } from '../../i18n/app-texts';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, PanelMenuModule, UiButtonComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly texts = appTexts;
  protected readonly auth = inject(AuthStore);

  private readonly router = inject(Router);

  protected readonly sideNavItems: MenuItem[] = [
    {
      label: this.texts.sectionGeneral,
      icon: 'pi pi-compass',
      expanded: true,
      items: [{ label: this.texts.sectionHome, icon: 'pi pi-home', routerLink: '/inicio' }],
    },
    {
      label: this.texts.sectionPeople,
      icon: 'pi pi-users',
      expanded: true,
      items: [{ label: this.texts.sectionEmployees, icon: 'pi pi-id-card', routerLink: '/personas/empleados' }],
    },
    {
      label: this.texts.sectionOrganization,
      icon: 'pi pi-sitemap',
      expanded: true,
      items: [
        { label: this.texts.sectionCompanies, icon: 'pi pi-building', routerLink: '/organizacion/empresas' },
        { label: this.texts.sectionWorkCenters, icon: 'pi pi-map-marker', routerLink: '/organizacion/centros-trabajo' },
        { label: this.texts.sectionCostCenters, icon: 'pi pi-wallet', routerLink: '/organizacion/centros-coste' },
        { label: this.texts.sectionCatalogs, icon: 'pi pi-book', routerLink: '/organizacion/catalogos' },
      ],
    },
    {
      label: this.texts.sectionSettings,
      icon: 'pi pi-sliders-h',
      expanded: true,
      items: [{ label: this.texts.sectionRuleSystems, icon: 'pi pi-cog', routerLink: '/configuracion/rule-systems' }],
    },
  ];

  protected async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
