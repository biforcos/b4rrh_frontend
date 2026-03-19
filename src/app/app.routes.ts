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
				redirectTo: 'employees',
			},
			{
				path: 'employees',
				loadChildren: () => import('./features/employee/employee.routes').then((m) => m.employeeRoutes),
			},
		],
	},
	{
		path: '**',
		redirectTo: 'employees',
	},
];
