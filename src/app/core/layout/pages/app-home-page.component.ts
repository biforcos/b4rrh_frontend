import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { appTexts } from '../../i18n/app-texts';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="home-page">
      <header class="home-page__header">
        <h2>{{ texts.homeTitle }}</h2>
        <p>{{ texts.homeDescription }}</p>
      </header>

      <div class="home-page__actions">
        <a routerLink="/personas/empleados">{{ texts.homeEmployeesShortcut }}</a>
      </div>
    </section>
  `,
  styles: `
    .home-page {
      border: 1px solid var(--border-subtle);
      background: #ffffff;
      border-radius: 0.8rem;
      box-shadow: var(--shadow-panel);
      padding: 1rem 1rem 1.1rem;
      display: grid;
      gap: 0.9rem;
      max-width: 52rem;
    }

    .home-page__header {
      display: grid;
      gap: 0.3rem;
    }

    .home-page h2 {
      margin: 0;
      font-size: 1.1rem;
      color: #14263a;
    }

    .home-page p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .home-page__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .home-page__actions a {
      text-decoration: none;
      color: #12324e;
      border: 1px solid #b9cee1;
      background: #eaf2fb;
      border-radius: 0.5rem;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 0.42rem 0.7rem;
    }
  `,
})
export class AppHomePageComponent {
  protected readonly texts = appTexts;
}
