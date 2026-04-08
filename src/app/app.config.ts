import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';

import { b4rrhhPrimeNgThemePreset } from './core/theme/b4rrhh-primeng-theme.preset';
import { BASE_PATH } from './core/api/generated/variables';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideHttpClient(),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: b4rrhhPrimeNgThemePreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    { provide: BASE_PATH, useValue: '' },
  ],
};
