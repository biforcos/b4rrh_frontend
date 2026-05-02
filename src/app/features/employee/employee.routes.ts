import { Routes } from '@angular/router';

import {
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
    pathMatch: 'full',
    loadComponent: () =>
      import('./shell/pages/employee-shell-page.component').then(
        (m) => m.EmployeeShellPageComponent,
      ),
  },
  {
    path: buildEmployeeKeyRoutePath(),
    loadComponent: () =>
      import('./shell/pages/employee-detail-page.component').then(
        (m) => m.EmployeeDetailPageComponent,
      ),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/pages/employee-overview-page.component').then(
            (m) => m.EmployeeOverviewPageComponent,
          ),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./contact/pages/employee-contact-page.component').then(
            (m) => m.EmployeeContactPageComponent,
          ),
      },
      {
        path: 'presence',
        loadComponent: () =>
          import('./presence/pages/employee-presence-page.component').then(
            (m) => m.EmployeePresencePageComponent,
          ),
      },
      {
        path: 'organization',
        loadComponent: () =>
          import('./organization/pages/employee-organization-page.component').then(
            (m) => m.EmployeeOrganizationPageComponent,
          ),
      },
      {
        path: 'payroll',
        loadComponent: () =>
          import('./payroll/pages/employee-payroll-page.component').then(
            (m) => m.EmployeePayrollPageComponent,
          ),
      },
      {
        path: 'rehire',
        loadComponent: () =>
          import('./lifecycle/rehire/pages/rehire-employee-page.component').then(
            (m) => m.RehireEmployeePageComponent,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'contact',
      },
      {
        path: ':section',
        pathMatch: 'full',
        redirectTo: 'contact',
      },
    ],
  },
  {
    path: buildEmployeeUnknownSectionRoutePath(),
    pathMatch: 'full',
    redirectTo: '',
  },
];
