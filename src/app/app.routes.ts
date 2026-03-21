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
				loadComponent: () =>
					import('./core/layout/pages/section-placeholder-page.component').then(
						(m) => m.SectionPlaceholderPageComponent,
					),
				data: {
					title: 'Empresas',
					description:
						'Seccion base preparada para integrar mantenimiento y consulta de empresas.',
				},
			},
			{
				path: 'organizacion/centros-trabajo',
				loadComponent: () =>
					import('./core/layout/pages/section-placeholder-page.component').then(
						(m) => m.SectionPlaceholderPageComponent,
					),
				data: {
					title: 'Centros de trabajo',
					description:
						'Seccion base preparada para gestionar centros de trabajo por estructura organizativa.',
				},
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
				loadComponent: () =>
					import('./core/layout/pages/section-placeholder-page.component').then(
						(m) => m.SectionPlaceholderPageComponent,
					),
				data: {
					title: 'Catalogos',
					description:
						'Seccion base para futuros catalogos funcionales de la aplicacion.',
				},
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
