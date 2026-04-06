import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./core/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'inicio',
			},
			{
				path: 'inicio',
				loadComponent: () =>
					import('./core/layout/pages/app-home-page.component').then((m) => m.AppHomePageComponent),
			},
			{
				path: 'personas/empleados',
				loadChildren: () => import('./features/employee/employee.routes').then((m) => m.employeeRoutes),
			},
			{
				path: 'organizacion/empresas',
				loadChildren: () => import('./features/company/company.routes').then((m) => m.companyRoutes),
			},
			{
				path: 'organizacion/centros-trabajo',
				loadChildren: () => import('./features/work-center/work-center.routes').then((m) => m.workCenterRoutes),
			},
			{
				path: 'organizacion/centros-coste',
				loadComponent: () =>
					import('./core/layout/pages/section-placeholder-page.component').then(
						(m) => m.SectionPlaceholderPageComponent,
					),
				data: {
					title: 'Centros de coste',
					description:
						'Seccion base preparada para mantenimiento de centros de coste y su disponibilidad.',
				},
			},
			{
				path: 'organizacion/catalogos',
				loadChildren: () => import('./rulesystem/catalog/catalog.routes').then((m) => m.catalogRoutes),
			},
			{
				path: 'configuracion/rule-systems',
				loadChildren: () =>
					import('./rulesystem/rule-system/rule-system.routes').then((m) => m.ruleSystemRoutes),
			},
			{
				path: 'employees',
				pathMatch: 'full',
				redirectTo: 'personas/empleados',
			},
			{
				path: '**',
				redirectTo: 'inicio',
			},
		],
	},
	{
		path: '**',
		redirectTo: 'inicio',
	},
];
