import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusChipVariant = 'active' | 'inactive' | 'warning' | 'error';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="status-chip"
      [class.status-chip--active]="variant() === 'active'"
      [class.status-chip--inactive]="variant() === 'inactive'"
      [class.status-chip--warning]="variant() === 'warning'"
      [class.status-chip--error]="variant() === 'error'"
    >
      <span class="status-chip__dot"></span>
      {{ label() }}
    </span>
  `,
  styles: [
    `
      .status-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        border: 1px solid transparent;
      }
      .status-chip--active {
        background: var(--success-bg);
        color: var(--success-text);
        border-color: var(--success-border);
      }
      .status-chip--active .status-chip__dot {
        background: var(--success-text);
      }
      .status-chip--inactive {
        background: var(--neutral-bg);
        color: var(--neutral-text);
        border-color: rgba(100, 116, 139, 0.2);
      }
      .status-chip--inactive .status-chip__dot {
        background: var(--neutral-text);
      }
      .status-chip--warning {
        background: var(--warning-bg);
        color: var(--warning-text);
        border-color: rgba(245, 158, 11, 0.2);
      }
      .status-chip--warning .status-chip__dot {
        background: var(--warning-text);
      }
      .status-chip--error {
        background: var(--error-bg);
        color: var(--error-text);
        border-color: rgba(239, 68, 68, 0.2);
      }
      .status-chip--error .status-chip__dot {
        background: var(--error-text);
      }
      .status-chip__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
      }
    `,
  ],
})
export class StatusChipComponent {
  label = input.required<string>();
  variant = input.required<StatusChipVariant>();
}
