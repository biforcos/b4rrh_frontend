import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { BackendAvailabilityStore } from './backend-availability.store';

@Component({
  selector: 'app-backend-unavailable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backend-unavailable">
      <div class="backend-unavailable__card">
        <h1 class="backend-unavailable__title">Servicio no disponible</h1>
        <p class="backend-unavailable__message">No se pudo conectar con el backend</p>
        <button
          class="backend-unavailable__retry"
          [disabled]="store.loading()"
          (click)="store.retry()"
        >
          {{ store.loading() ? 'Comprobando...' : 'Reintentar' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .backend-unavailable {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f8f9fa;
    }

    .backend-unavailable__card {
      text-align: center;
      padding: 3rem 4rem;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .backend-unavailable__title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.75rem;
    }

    .backend-unavailable__message {
      font-size: 1rem;
      color: #64748b;
      margin: 0 0 2rem;
    }

    .backend-unavailable__retry {
      padding: 0.625rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #ffffff;
      background: #3b82f6;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover:not(:disabled) {
        background: #2563eb;
      }

      &:disabled {
        background: #93c5fd;
        cursor: not-allowed;
      }
    }
  `,
})
export class BackendUnavailableComponent {
  protected readonly store = inject(BackendAvailabilityStore);
}
