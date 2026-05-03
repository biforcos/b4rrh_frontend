import { Routes } from '@angular/router';

export const agreementCategoryProfileRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ui/agreement-category-profile-page.component').then(
        (m) => m.AgreementCategoryProfilePageComponent,
      ),
  },
];
