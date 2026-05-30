import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

const SECTION_NAV_ITEMS = [
  { section: 'overview', icon: 'pi pi-th-large', label: 'Resumen' },
  { section: 'contact', icon: 'pi pi-phone', label: 'Contacto' },
  { section: 'presence', icon: 'pi pi-calendar', label: 'Presencia' },
  { section: 'organization', icon: 'pi pi-building', label: 'Organización' },
  { section: 'payroll', icon: 'pi pi-money-bill', label: 'Nómina' },
] as const;

@Component({
  selector: 'app-employee-section-rail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, NgClass],
  template: `
    <nav class="section-rail" aria-label="Secciones del empleado">
      <div class="section-rail__avatar" aria-hidden="true">{{ initials() }}</div>
      <div class="section-rail__divider" role="separator"></div>

      @for (item of navItems; track item.section) {
        <a
          class="section-rail__item"
          [routerLink]="routeBase() + '/' + item.section"
          routerLinkActive="section-rail__item--active"
          [title]="item.label"
          [attr.aria-label]="item.label"
        >
          <i class="section-rail__icon" [ngClass]="item.icon"></i>
        </a>
      }
    </nav>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 48px;
        flex-shrink: 0;
        background: var(--surface-app);
        border-right: 1px solid var(--border-default);
        padding: 16px 0;
        gap: 2px;
      }
      .section-rail__avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--accent-primary);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        box-shadow:
          0 0 0 2px var(--surface-app),
          0 0 0 3px var(--accent-border);
        flex-shrink: 0;
      }
      .section-rail__divider {
        width: 26px;
        height: 1px;
        background: var(--border-default);
        margin: 4px 0 6px;
      }
      .section-rail__item {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        text-decoration: none;
        transition:
          background 0.12s,
          color 0.12s;
        position: relative;
      }
      .section-rail__item:hover {
        background: var(--surface-raised);
        color: var(--text-secondary);
      }
      .section-rail__item--active {
        background: var(--accent-muted);
        color: var(--accent-light);
      }
      .section-rail__item--active::before {
        content: '';
        position: absolute;
        left: -1px;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 18px;
        background: var(--accent-primary);
        border-radius: 0 2px 2px 0;
      }
      .section-rail__icon {
        font-size: 15px;
      }
    `,
  ],
})
export class EmployeeSectionRailComponent {
  /** Two-letter initials shown in the mini avatar, e.g. "JG" */
  initials = input.required<string>();
  /** Base route for this employee, e.g. "/personas/empleados/ESP/INTERNAL/001" */
  routeBase = input.required<string>();

  protected readonly navItems = SECTION_NAV_ITEMS;
}
