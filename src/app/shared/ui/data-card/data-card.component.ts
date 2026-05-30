import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-data-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="data-card" [class.data-card--accent]="accent()">
      <div class="data-card__label">{{ label() }}</div>
      @if (loading()) {
        <div class="data-card__shimmer"></div>
      } @else {
        <div class="data-card__value">{{ value() }}</div>
        @if (sub()) {
          <div class="data-card__sub">{{ sub() }}</div>
        }
        @if (link()) {
          <div class="data-card__link">{{ link() }} →</div>
        }
      }
    </div>
  `,
  styles: [
    `
      .data-card {
        background: var(--surface-card, #111827);
        border: 1px solid var(--border-default, #1e293b);
        border-radius: var(--radius-md, 8px);
        padding: 14px 16px;
        cursor: pointer;
        transition:
          border-color 0.15s,
          background 0.15s;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .data-card:hover {
        border-color: var(--border-strong, #334155);
        background: var(--surface-hover, #141f2e);
      }
      .data-card--accent {
        border-color: var(--accent-border, rgba(99, 102, 241, 0.3));
        background: var(--accent-muted, rgba(99, 102, 241, 0.07));
      }
      .data-card--accent:hover {
        border-color: rgba(99, 102, 241, 0.5);
      }
      .data-card--accent .data-card__label {
        color: var(--accent-primary, #6366f1);
      }
      .data-card--accent .data-card__value {
        color: var(--text-accent, #a5b4fc);
      }
      .data-card__label {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted, #475569);
      }
      .data-card__value {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary, #f1f5f9);
        line-height: 1.3;
      }
      .data-card__sub {
        font-size: 11px;
        color: var(--text-tertiary, #64748b);
        margin-top: 1px;
      }
      .data-card__link {
        font-size: 11px;
        color: var(--accent-primary, #6366f1);
        margin-top: 4px;
      }
      .data-card__shimmer {
        height: 18px;
        border-radius: 4px;
        background: linear-gradient(
          90deg,
          var(--surface-raised, #1e293b) 25%,
          var(--border-strong, #334155) 50%,
          var(--surface-raised, #1e293b) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.4s ease-in-out infinite;
        margin-top: 4px;
      }
      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `,
  ],
})
export class DataCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  sub = input<string | null>(null);
  link = input<string | null>(null);
  accent = input<boolean>(false);
  loading = input<boolean>(false);
}
