import { Routes } from '@angular/router';

import {
  buildEmployeeDetailRoutePath,
  buildEmployeeKeyRoutePath,
  buildEmployeeUnknownSectionRoutePath,
} from './routing/employee-route-builder.util';

export const employeeRoutes: Routes = [
  {
    path: 'hire',
    loadComponent: () =>
      import('./lifecycle/hire/pages/hire-employee-page.component').then(
        (m) => m.HireEmployeePageComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shell/pages/employee-shell-page.component').then((m) => m.EmployeeShellPageComponent),
    children: [
      {
        path: buildEmployeeDetailRoutePath('overview'),
        loadComponent: () =>
          import('./overview/pages/employee-overview-page.component').then(
            (m) => m.EmployeeOverviewPageComponent,
          ),
      },
      {
        path: buildEmployeeDetailRoutePath('contact'),
        loadComponent: () =>
          import('./contact/pages/employee-contact-page.component').then((m) => m.EmployeeContactPageComponent),
      },
      {
        path: buildEmployeeDetailRoutePath('presence'),
        loadComponent: () =>
          import('./presence/pages/employee-presence-page.component').then(
            (m) => m.EmployeePresencePageComponent,
          ),
      },
      {
        path: buildEmployeeDetailRoutePath('organization'),
        loadComponent: () =>
          import('./organization/pages/employee-organization-page.component').then(
            (m) => m.EmployeeOrganizationPageComponent,
          ),
      },
      {
        path: `${buildEmployeeKeyRoutePath()}/rehire`,
        loadComponent: () =>
          import('./lifecycle/rehire/pages/rehire-employee-page.component').then(
            (m) => m.RehireEmployeePageComponent,
          ),
      },
      {
        path: buildEmployeeKeyRoutePath(),
        pathMatch: 'full',
        redirectTo: buildEmployeeDetailRoutePath('contact'),
      },
      {
        path: buildEmployeeUnknownSectionRoutePath(),
        pathMatch: 'full',
        redirectTo: buildEmployeeDetailRoutePath('contact'),
      },
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./shell/pages/employee-empty-detail-page.component').then(
            (m) => m.EmployeeEmptyDetailPageComponent,
          ),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
