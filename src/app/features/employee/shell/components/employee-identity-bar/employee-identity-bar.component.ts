import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AvatarGradientComponent } from '../../../../../shared/ui/avatar-gradient/avatar-gradient.component';
import { StatusChipComponent, StatusChipVariant } from '../../../../../shared/ui/status-chip/status-chip.component';
import { EmployeeDetailModel } from '../../../models/employee-detail.model';

function statusVariant(statusLabel: string): StatusChipVariant {
  const n = statusLabel.trim().toLowerCase();
  if (n.includes('active') || n.includes('alta')) return 'active';
  if (n.includes('pending') || n.includes('draft')) return 'warning';
  return 'inactive';
}

function statusDisplayLabel(statusLabel: string): string {
  const v = statusVariant(statusLabel);
  if (v === 'active') return 'Activo';
  if (v === 'warning') return 'Pendiente';
  return 'Baja';
}

@Component({
  selector: 'app-employee-identity-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarGradientComponent, StatusChipComponent],
  template: `
    @if (employee(); as emp) {
      <div class="identity-bar">
        <app-avatar-gradient
          [initials]="initials()"
          [photoUrl]="emp.photoUrl"
          size="lg"
          class="identity-bar__avatar"
        />
        <div class="identity-bar__info">
          <div class="identity-bar__name">{{ emp.displayName }}</div>
          <div class="identity-bar__meta">{{ emp.workCenter }}</div>
        </div>
        <div class="identity-bar__chips">
          <app-status-chip [label]="statusLabel()" [variant]="chipVariant()" />
          <span class="identity-bar__matricula">{{ emp.ruleSystemCode }} · {{ emp.employeeNumber }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .identity-bar {
      background: var(--surface-panel);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-md);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .identity-bar__avatar {
      flex-shrink: 0;
      box-shadow: 0 0 0 3px var(--accent-border);
      border-radius: 50%;
    }
    .identity-bar__info {
      flex: 1;
      min-width: 0;
    }
    .identity-bar__name {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .identity-bar__meta {
      font-size: 12px;
      color: var(--text-tertiary);
      margin-top: 2px;
    }
    .identity-bar__chips {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .identity-bar__matricula {
      font-family: var(--font-mono, 'JetBrains Mono', monospace);
      font-size: 12px;
      font-weight: 600;
      color: var(--text-accent);
      background: var(--accent-muted);
      border: 1px solid var(--accent-border);
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.04em;
    }
  `],
})
export class EmployeeIdentityBarComponent {
  employee = input.required<EmployeeDetailModel | null>();

  protected readonly initials = computed(() => {
    const e = this.employee();
    if (!e) return '';
    return ((e.firstName[0] ?? '') + (e.lastName1[0] ?? '')).toUpperCase();
  });

  protected readonly chipVariant = computed((): StatusChipVariant => {
    const e = this.employee();
    return e ? statusVariant(e.statusLabel) : 'inactive';
  });

  protected readonly statusLabel = computed(() => {
    const e = this.employee();
    return e ? statusDisplayLabel(e.statusLabel) : '';
  });
}
