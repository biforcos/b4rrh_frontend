import { Routes } from '@angular/router';

export const operacionesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ui/operaciones-page.component').then((m) => m.OperacionesPageComponent),
  },
];
