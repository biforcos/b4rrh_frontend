import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AvatarGradientComponent } from '../../../../../shared/ui/avatar-gradient/avatar-gradient.component';
import { StatusChipComponent, StatusChipVariant } from '../../../../../shared/ui/status-chip/status-chip.component';
import { EmployeeListItemModel } from '../../../models/employee-list-item.model';

function initialsFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

function statusVariant(statusLabel: string): StatusChipVariant {
  const n = statusLabel.trim().toLowerCase();
  if (n.includes('active') || n.includes('alta')) return 'active';
  if (n.includes('pending') || n.includes('draft')) return 'warning';
  return 'inactive';
}

function statusDisplayLabel(statusLabel: string): string {
  const variant = statusVariant(statusLabel);
  if (variant === 'active') return 'Activo';
  if (variant === 'warning') return 'Pendiente';
  return 'Baja';
}

@Component({
  selector: 'app-employee-directory-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarGradientComponent, StatusChipComponent],
  template: `
    <div class="dir-table-wrap">
      <table class="dir-table" role="grid">
        <thead>
          <tr class="dir-table__head-row">
            <th class="dir-table__th dir-table__th--avatar" scope="col"></th>
            <th class="dir-table__th" scope="col">Nombre</th>
            <th class="dir-table__th" scope="col">Centro</th>
            <th class="dir-table__th" scope="col">Matrícula</th>
            <th class="dir-table__th" scope="col">Estado</th>
            <th class="dir-table__th" scope="col"></th>
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            @for (row of skeletonRows; track $index) {
              <tr class="dir-table__skeleton-row">
                <td class="dir-table__td"><div class="dir-table__skeleton dir-table__skeleton--avatar"></div></td>
                <td class="dir-table__td"><div class="dir-table__skeleton dir-table__skeleton--name"></div></td>
                <td class="dir-table__td"><div class="dir-table__skeleton dir-table__skeleton--sm"></div></td>
                <td class="dir-table__td"><div class="dir-table__skeleton dir-table__skeleton--sm"></div></td>
                <td class="dir-table__td"><div class="dir-table__skeleton dir-table__skeleton--chip"></div></td>
                <td class="dir-table__td"></td>
              </tr>
            }
          } @else if (items().length === 0) {
            <tr>
              <td colspan="6" class="dir-table__empty">Sin resultados</td>
            </tr>
          } @else {
            @for (employee of items(); track employee.employeeNumber) {
              <tr
                class="dir-table__row"
                [class.dir-table__row--inactive]="getStatusVariant(employee.statusLabel) === 'inactive'"
                role="button"
                tabindex="0"
                (click)="employeeClicked.emit(employee)"
                (keydown.enter)="employeeClicked.emit(employee)"
              >
                <td class="dir-table__td dir-table__td--avatar">
                  <app-avatar-gradient [initials]="getInitials(employee.displayName)" size="md" />
                </td>
                <td class="dir-table__td">
                  <div class="dir-table__name">{{ employee.displayName }}</div>
                </td>
                <td class="dir-table__td">
                  <span class="dir-table__work-center">{{ employee.workCenter }}</span>
                </td>
                <td class="dir-table__td">
                  <span class="dir-table__matricula">{{ employee.ruleSystemCode }} · {{ employee.employeeNumber }}</span>
                </td>
                <td class="dir-table__td">
                  <app-status-chip
                    [label]="getStatusLabel(employee.statusLabel)"
                    [variant]="getStatusVariant(employee.statusLabel)"
                  />
                </td>
                <td class="dir-table__td dir-table__td--actions">
                  <span class="dir-table__arrow" aria-hidden="true">›</span>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .dir-table-wrap {
      background: var(--surface-panel);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .dir-table {
      width: 100%;
      border-collapse: collapse;
    }
    .dir-table__head-row { border-bottom: 1px solid var(--border-default); }
    .dir-table__th {
      padding: 10px 16px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .dir-table__th--avatar { width: 52px; padding-right: 0; }
    .dir-table__row {
      border-bottom: 1px solid var(--surface-card, #111827);
      cursor: pointer;
      transition: background 0.1s;
    }
    .dir-table__row:last-child { border-bottom: none; }
    .dir-table__row:hover { background: var(--surface-hover); }
    .dir-table__row--inactive { opacity: 0.55; }
    .dir-table__row--inactive:hover { opacity: 0.75; }
    .dir-table__td {
      padding: 11px 16px;
      vertical-align: middle;
    }
    .dir-table__td--avatar { width: 52px; padding-right: 0; }
    .dir-table__td--actions { width: 40px; text-align: right; }
    .dir-table__name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .dir-table__work-center {
      font-size: 12px;
      color: var(--text-tertiary);
    }
    .dir-table__matricula {
      font-family: var(--font-mono, 'JetBrains Mono', monospace);
      font-size: 12px;
      color: var(--accent-primary);
      background: var(--accent-muted);
      border: 1px solid var(--accent-border);
      padding: 2px 8px;
      border-radius: 5px;
      letter-spacing: 0.04em;
    }
    .dir-table__arrow { font-size: 14px; color: var(--border-strong); }
    .dir-table__empty {
      padding: 36px 16px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
    }
    .dir-table__skeleton-row {
      border-bottom: 1px solid var(--surface-card);
      pointer-events: none;
    }
    .dir-table__skeleton {
      border-radius: 4px;
      background: linear-gradient(
        90deg,
        var(--surface-raised) 25%,
        var(--border-strong) 50%,
        var(--surface-raised) 75%
      );
      background-size: 200% 100%;
      animation: dir-shimmer 1.4s ease-in-out infinite;
    }
    .dir-table__skeleton--avatar { width: 36px; height: 36px; border-radius: 50%; }
    .dir-table__skeleton--name   { width: 160px; height: 14px; }
    .dir-table__skeleton--sm     { width: 80px; height: 12px; }
    .dir-table__skeleton--chip   { width: 60px; height: 22px; border-radius: 20px; }
    @keyframes dir-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class EmployeeDirectoryTableComponent {
  items = input.required<EmployeeListItemModel[]>();
  loading = input<boolean>(false);
  employeeClicked = output<EmployeeListItemModel>();

  protected readonly skeletonRows = Array.from({ length: 6 });

  protected readonly getInitials = initialsFromDisplayName;
  protected readonly getStatusVariant = statusVariant;
  protected readonly getStatusLabel = statusDisplayLabel;
}
