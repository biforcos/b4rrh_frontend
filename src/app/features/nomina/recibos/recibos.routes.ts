import { Routes } from '@angular/router';

export const recibosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ui/recibos-page.component').then((m) => m.RecibosPageComponent),
  },
];
