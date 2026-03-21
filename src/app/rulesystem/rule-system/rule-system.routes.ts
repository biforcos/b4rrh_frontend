import { Routes } from '@angular/router';

export const ruleSystemRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ui/rule-system-list-page.component').then((m) => m.RuleSystemListPageComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./ui/rule-system-detail-page.component').then((m) => m.RuleSystemDetailPageComponent),
    data: { mode: 'create' },
  },
  {
    path: ':code',
    loadComponent: () =>
      import('./ui/rule-system-detail-page.component').then((m) => m.RuleSystemDetailPageComponent),
    data: { mode: 'edit' },
  },
];
