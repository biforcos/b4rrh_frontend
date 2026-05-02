import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';

import { AuthStore } from '../auth.store';
import { appTexts } from '../../i18n/app-texts';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-local-dev-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, InputTextModule, UiButtonComponent],
  template: `
    <section class="local-dev-login">
      <div class="local-dev-login__card">
        <header class="local-dev-login__header">
          <h1>{{ texts.authLoginTitle }}</h1>
          <p>{{ texts.authLoginDescription }}</p>
        </header>

        <form class="local-dev-login__form" [formGroup]="form" (ngSubmit)="submit()">
          <label class="local-dev-login__field">
            <span>{{ texts.authSubjectLabel }}</span>
            <input
              pInputText
              formControlName="subject"
              [attr.placeholder]="texts.authSubjectPlaceholder"
              [attr.aria-describedby]="'local-dev-subject-help'"
            />
          </label>

          <p id="local-dev-subject-help" class="local-dev-login__help">
            {{ texts.authSubjectHelpPrefix }}
            <strong>{{ exampleSubjects }}</strong>
          </p>

          @if (auth.error()) {
            <p class="local-dev-login__error" role="alert">{{ auth.error() }}</p>
          }

          <app-ui-button
            [label]="submitLabel()"
            type="submit"
            [fluid]="true"
            [disabled]="form.invalid || auth.loading()"
          />
        </form>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: grid;
      min-height: 100dvh;
      place-items: center;
      padding: 1.25rem;
      background: var(--surface-app);
    }

    .local-dev-login {
      width: min(100%, 400px);
    }

    .local-dev-login__card {
      display: grid;
      gap: 1rem;
      background: var(--surface-panel);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-panel);
      padding: 40px;
    }

    .local-dev-login__header,
    .local-dev-login__form {
      display: grid;
      gap: 0.75rem;
    }

    .local-dev-login__header h1 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .local-dev-login__header p,
    .local-dev-login__help {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.45;
      font-size: 0.88rem;
    }

    .local-dev-login__field {
      display: grid;
      gap: 4px;
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .local-dev-login__error {
      margin: 0;
      color: #dc2626;
      background: #fee2e2;
      border: 1px solid #fecdd3;
      border-radius: var(--radius-sm);
      padding: 0.7rem 0.8rem;
      font-size: 0.88rem;
    }
  `,
})
export class LocalDevLoginPageComponent {
  protected readonly texts = appTexts;
  protected readonly auth = inject(AuthStore);
  protected readonly exampleSubjects = 'bifor, hr.manager, hr.operator, auditor, readonly';

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitLabel = computed(() =>
    this.auth.loading() ? this.texts.authLoginSubmittingAction : this.texts.authLoginSubmitAction,
  );

  protected readonly form = this.fb.nonNullable.group({
    subject: ['', [Validators.required]],
  });

  constructor() {
    if (this.auth.getAccessToken()) {
      void this.navigateAfterLogin();
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const success = await this.auth.login(this.form.getRawValue().subject);
    if (success) {
      await this.navigateAfterLogin();
    }
  }

  private async navigateAfterLogin(): Promise<void> {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
    await this.router.navigateByUrl(redirectTo && redirectTo !== '/login' ? redirectTo : '/inicio');
  }
}