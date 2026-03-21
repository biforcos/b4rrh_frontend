import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ui/catalog-page.component').then((m) => m.CatalogPageComponent),
  },
];
