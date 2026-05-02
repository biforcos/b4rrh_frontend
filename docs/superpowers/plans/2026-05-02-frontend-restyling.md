# Frontend Restyling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the teal-themed, master-detail Angular app with a professional Enterprise Clean design — indigo `#4f46e5` accent, white cards on grey background, light static sidebar, two-column employee detail with an identity panel.

**Architecture:** Foundation-first — CSS tokens + PrimeNG preset cascade app-wide automatically. Then AppShell sidebar rewrite. Then employee feature structural split: directory DataTable page and new identity-panel detail page. Deprecated nav/header components are removed last.

**Tech Stack:** Angular 21, PrimeNG 21, `@primeuix/themes` Aura preset, SCSS, TypeScript

> **No unit tests exist** in this project. Verification is `npm run build` (TypeScript + template compilation) after each task. Visual verification via `npm start`.

---

### Task 1: CSS Design Tokens

**Files:**
- Modify: `src/styles.scss`

- [ ] **Step 1: Replace the CSS token block and global selectors**

Open `src/styles.scss` and replace its full contents with:

```scss
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

:root {
  --font-body: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
  --font-heading: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;

  /* Surfaces */
  --surface-app:        #f1f5f9;
  --surface-panel:      #ffffff;
  --surface-hover:      #f8fafc;
  --surface-accent:     #eef2ff;

  /* Accent (Indigo) */
  --accent-primary:       #4f46e5;
  --accent-primary-hover: #4338ca;
  --accent-border:        #c7d2fe;
  --accent-muted:         #eef2ff;

  /* Text */
  --text-primary:     #0f172a;
  --text-secondary:   #475569;
  --text-tertiary:    #94a3b8;
  --text-accent:      #4f46e5;

  /* Borders */
  --border-default:   #e2e8f0;
  --border-strong:    #cbd5e1;

  /* Radii */
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;

  /* Shadows */
  --shadow-card:  0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-panel: 0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -1px rgba(0,0,0,.04);

  /* Legacy aliases kept for backward compatibility with existing components */
  --text-muted:        var(--text-secondary);
  --text-soft:         var(--text-tertiary);
  --accent-strong:     var(--accent-primary);
  --accent-soft:       #818cf8;
  --border-subtle:     var(--border-default);
  --surface-muted:     var(--surface-hover);
  --surface-block:     var(--surface-hover);
  --surface-block-alt: var(--surface-hover);
  --shadow-soft:       var(--shadow-card);
  --focus-ring:        0 0 0 3px rgba(79, 70, 229, 0.25);
  --elevation-1:       var(--shadow-card);
  --elevation-2:       var(--shadow-panel);
  --elevation-3:       0 2px 8px rgba(15,23,42,.08), 0 12px 32px rgba(15,23,42,.08);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-app);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  letter-spacing: -0.005em;
}

p {
  margin: 0;
}

button, input, textarea, select {
  font: inherit;
}

:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

::selection {
  background: rgba(79, 70, 229, 0.15);
  color: #1e1b4b;
}

.p-button {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.p-component {
  font-family: var(--font-body);
}

.p-inputtext,
.p-select,
.p-tab {
  font-family: var(--font-body);
}

.p-tag {
  font-family: var(--font-body);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.p-tag.p-tag-contrast {
  background: rgba(15, 23, 42, 0.08) !important;
  border: 1px solid rgba(15, 23, 42, 0.18) !important;
  color: #1e293b !important;
}

.p-tag.p-tag-secondary {
  background: var(--accent-muted) !important;
  border: 1px solid var(--accent-border) !important;
  color: var(--accent-primary) !important;
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd b4rrhh_frontend && npm run build
```

Expected: no compilation errors. TypeScript and template compiler both succeed.

- [ ] **Step 3: Commit**

```bash
git add src/styles.scss
git commit -m "feat(design): replace CSS tokens with indigo Enterprise Clean palette"
```

---

### Task 2: PrimeNG Preset — Indigo Primary

**Files:**
- Modify: `src/app/core/theme/b4rrhh-primeng-theme.preset.ts`

- [ ] **Step 1: Replace the preset with indigo primary scale**

Replace the full contents of `src/app/core/theme/b4rrhh-primeng-theme.preset.ts` with:

```typescript
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const b4rrhhPrimeNgThemePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    colorScheme: {
      light: {
        primary: {
          color:        '{primary.600}',
          inverseColor: '#ffffff',
          hoverColor:   '{primary.700}',
          activeColor:  '{primary.800}',
        },
        highlight: {
          background:      '{primary.50}',
          focusBackground: '{primary.100}',
          color:           '{primary.900}',
          focusColor:      '{primary.950}',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
    },
  },
});
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: no errors. The primary color scale change cascades automatically into all PrimeNG components (buttons, inputs, tabs, tags, dialogs, etc.).

- [ ] **Step 3: Commit**

```bash
git add src/app/core/theme/b4rrhh-primeng-theme.preset.ts
git commit -m "feat(design): switch PrimeNG preset primary palette from teal to indigo"
```

---

### Task 3: AppShell Sidebar — Light Static Nav

The dark `#111827` PanelMenu sidebar becomes a white `220px` static `<nav>` with section group labels and `routerLinkActive` highlighting in indigo. The auth/user area moves to a footer at the bottom.

**Files:**
- Modify: `src/app/core/layout/app-shell/app-shell.component.ts`
- Modify: `src/app/core/layout/app-shell/app-shell.component.html`
- Modify: `src/app/core/layout/app-shell/app-shell.component.scss`

- [ ] **Step 1: Update app-shell.component.ts — remove PanelMenuModule, add RouterLinkActive**

Replace the full contents of `src/app/core/layout/app-shell/app-shell.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthStore } from '../../auth/auth.store';
import { appTexts } from '../../i18n/app-texts';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly texts = appTexts;
  protected readonly auth = inject(AuthStore);

  private readonly router = inject(Router);

  protected readonly userInitials = computed(() => {
    const subject = this.auth.subject() ?? '';
    return subject.slice(0, 2).toUpperCase() || '?';
  });

  protected async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
```

- [ ] **Step 2: Update app-shell.component.html — replace PanelMenu with static nav**

Replace the full contents of `src/app/core/layout/app-shell/app-shell.component.html` with:

```html
<div class="app-shell">
  <aside class="app-shell__sidebar" [attr.aria-label]="texts.navigationAriaLabel">
    <a class="app-shell__brand" [routerLink]="['/inicio']" [attr.aria-label]="texts.brandHomeAriaLabel">
      <span class="app-shell__brand-mark">B4</span>
      <span class="app-shell__brand-name"><strong>{{ texts.brandName }}</strong></span>
    </a>

    <nav class="app-shell__nav">

      <span class="app-shell__nav-group-label">PERSONAS</span>
      <a class="app-shell__nav-item" routerLink="/personas/empleados" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
        <i class="pi pi-id-card app-shell__nav-icon"></i>
        <span>{{ texts.sectionEmployees }}</span>
      </a>

      <span class="app-shell__nav-group-label">ORGANIZACIÓN</span>
      <a class="app-shell__nav-item" routerLink="/organizacion/empresas" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
        <i class="pi pi-building app-shell__nav-icon"></i>
        <span>{{ texts.sectionCompanies }}</span>
      </a>
      <a class="app-shell__nav-item" routerLink="/organizacion/centros-trabajo" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
        <i class="pi pi-map-marker app-shell__nav-icon"></i>
        <span>{{ texts.sectionWorkCenters }}</span>
      </a>
      <a class="app-shell__nav-item" routerLink="/organizacion/centros-coste" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
        <i class="pi pi-wallet app-shell__nav-icon"></i>
        <span>{{ texts.sectionCostCenters }}</span>
      </a>
      <a class="app-shell__nav-item" routerLink="/organizacion/catalogos" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
        <i class="pi pi-book app-shell__nav-icon"></i>
        <span>{{ texts.sectionCatalogs }}</span>
      </a>

      <span class="app-shell__nav-group-label">NÓMINA</span>
      <a class="app-shell__nav-item" routerLink="/nomina/recibos" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
        <i class="pi pi-receipt app-shell__nav-icon"></i>
        <span>{{ texts.sectionRecibos }}</span>
      </a>
      <a class="app-shell__nav-item" routerLink="/nomina/operaciones" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
        <i class="pi pi-bolt app-shell__nav-icon"></i>
        <span>{{ texts.sectionOperaciones }}</span>
      </a>

      <span class="app-shell__nav-group-label">CONFIGURACIÓN</span>
      <a class="app-shell__nav-item" routerLink="/configuracion/rule-systems" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
        <i class="pi pi-cog app-shell__nav-icon"></i>
        <span>{{ texts.sectionRuleSystems }}</span>
      </a>

    </nav>

    <footer class="app-shell__footer">
      <div class="app-shell__user">
        <span class="app-shell__user-avatar">{{ userInitials() }}</span>
        <span class="app-shell__user-name">{{ auth.subject() ?? '—' }}</span>
      </div>
      <button class="app-shell__logout-btn" type="button" (click)="logout()" [attr.title]="texts.authLogoutAction" [attr.aria-label]="texts.authLogoutAction">
        <i class="pi pi-sign-out"></i>
      </button>
    </footer>
  </aside>

  <main class="app-shell__main" aria-live="polite">
    <router-outlet />
  </main>
</div>
```

- [ ] **Step 3: Update app-shell.component.scss — light sidebar styles**

Replace the full contents of `src/app/core/layout/app-shell/app-shell.component.scss` with:

```scss
:host {
  display: block;
  min-height: 100dvh;
}

.app-shell {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 100dvh;
}

/* ─── SIDEBAR ─── */
.app-shell__sidebar {
  display: flex;
  flex-direction: column;
  background: var(--surface-panel);
  border-right: 1px solid var(--border-default);
  height: 100dvh;
  position: sticky;
  top: 0;
  overflow-y: auto;
}

/* Brand */
.app-shell__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}

.app-shell__brand-mark {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 800;
  color: #ffffff;
  background: var(--accent-primary);
  flex-shrink: 0;
}

.app-shell__brand-name strong {
  color: var(--text-primary);
  font-size: 0.88rem;
  font-weight: 700;
}

/* Nav */
.app-shell__nav {
  display: flex;
  flex-direction: column;
  padding: 8px 8px 0;
  flex: 1;
}

.app-shell__nav-group-label {
  display: block;
  padding: 12px 8px 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  text-transform: uppercase;
  user-select: none;
}

.app-shell__nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: background-color 120ms ease, color 120ms ease;
  position: relative;
  margin-bottom: 1px;
}

.app-shell__nav-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.app-shell__nav-item.active {
  background: var(--surface-accent);
  color: var(--accent-primary);
  font-weight: 600;
  border-left: 2px solid var(--accent-primary);
  padding-left: 8px; /* compensate for 2px border */
}

.app-shell__nav-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
  color: inherit;
  flex-shrink: 0;
}

/* Footer */
.app-shell__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-default);
  flex-shrink: 0;
}

.app-shell__user {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.app-shell__user-avatar {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 800;
}

.app-shell__user-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.app-shell__logout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;
  flex-shrink: 0;
  font-size: 13px;
}

.app-shell__logout-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

/* ─── MAIN ─── */
.app-shell__main {
  background: var(--surface-app);
  min-height: 100dvh;
  overflow-y: auto;
}

@media (max-width: 820px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-shell__sidebar {
    height: auto;
    position: static;
    border-right: 0;
    border-bottom: 1px solid var(--border-default);
  }

  .app-shell__main {
    min-height: auto;
  }
}
```

- [ ] **Step 4: Verify the build compiles**

```bash
npm run build
```

Expected: no errors. `MenuItem` type and `PanelMenuModule` are no longer referenced.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/layout/app-shell/
git commit -m "feat(shell): replace dark PanelMenu sidebar with light static nav"
```

---

### Task 4: Employee Identity Panel (New Component)

The identity panel shows the employee avatar, name, status badge, key data fields, and the section navigation. It replaces `EmployeeDetailNavComponent` in the detail layout.

**Files:**
- Create: `src/app/features/employee/identity/employee-identity-panel.component.ts`
- Create: `src/app/features/employee/identity/employee-identity-panel.component.html`
- Create: `src/app/features/employee/identity/employee-identity-panel.component.scss`

- [ ] **Step 1: Create employee-identity-panel.component.ts**

Create file `src/app/features/employee/identity/employee-identity-panel.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TagModule } from 'primeng/tag';

import { employeeTexts } from '../employee.texts';
import { EmployeeBusinessKey } from '../models/employee-business-key.model';
import { EmployeeDetailModel } from '../models/employee-detail.model';
import {
  buildEmployeeDetailRouteCommands,
  EmployeeRouteSection,
} from '../routing/employee-route-builder.util';

interface IdentityNavItem {
  section: EmployeeRouteSection;
  label: string;
  routeCommands: ReadonlyArray<string>;
}

@Component({
  selector: 'app-employee-identity-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TagModule],
  templateUrl: './employee-identity-panel.component.html',
  styleUrl: './employee-identity-panel.component.scss',
})
export class EmployeeIdentityPanelComponent {
  readonly employeeKey = input.required<EmployeeBusinessKey>();
  readonly employee = input<EmployeeDetailModel | null>(null);
  readonly activeSection = input<EmployeeRouteSection>('contact');
  readonly hireDate = input<string | null>(null);
  readonly status = input<'ACTIVE' | 'TERMINATED'>('TERMINATED');

  protected readonly texts = employeeTexts;

  protected readonly initials = computed(() => {
    const name = this.employee()?.displayName ?? '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || '?';
  });

  protected readonly navItems = computed<ReadonlyArray<IdentityNavItem>>(() => {
    const key = this.employeeKey();
    return [
      { section: 'overview', label: this.texts.detailPanelTitle, routeCommands: buildEmployeeDetailRouteCommands(key, 'overview') },
      { section: 'contact', label: this.texts.personalAreaLabel, routeCommands: buildEmployeeDetailRouteCommands(key, 'contact') },
      { section: 'presence', label: this.texts.laborAreaLabel, routeCommands: buildEmployeeDetailRouteCommands(key, 'presence') },
      { section: 'organization', label: this.texts.organizationalAreaLabel, routeCommands: buildEmployeeDetailRouteCommands(key, 'organization') },
      { section: 'payroll', label: this.texts.payrollAreaLabel, routeCommands: buildEmployeeDetailRouteCommands(key, 'payroll') },
    ] as const;
  });

  protected readonly statusSeverity = computed(() =>
    this.status() === 'ACTIVE' ? 'success' : 'danger',
  );

  protected readonly statusLabel = computed(() =>
    this.status() === 'ACTIVE'
      ? this.texts.employeeStatusActiveLabel
      : this.texts.employeeStatusInactiveLabel,
  );
}
```

- [ ] **Step 2: Create employee-identity-panel.component.html**

Create file `src/app/features/employee/identity/employee-identity-panel.component.html`:

```html
<div class="identity-panel">
  <!-- Avatar + name + status -->
  <div class="identity-panel__hero">
    <div class="identity-panel__avatar" [attr.aria-hidden]="true">{{ initials() }}</div>
    <div class="identity-panel__name-row">
      <span class="identity-panel__name">{{ employee()?.displayName ?? '—' }}</span>
      <p-tag
        class="identity-panel__status"
        [value]="statusLabel()"
        [severity]="statusSeverity()"
      />
    </div>
  </div>

  <!-- Key data fields -->
  <dl class="identity-panel__fields">
    <div class="identity-panel__field">
      <dt class="identity-panel__field-label">{{ texts.employeeConvenioLabel }}</dt>
      <dd class="identity-panel__field-value">{{ employeeKey().ruleSystemCode }}</dd>
    </div>
    <div class="identity-panel__field">
      <dt class="identity-panel__field-label">{{ texts.employeeTypeLabel }}</dt>
      <dd class="identity-panel__field-value">{{ employeeKey().employeeTypeCode }}</dd>
    </div>
    <div class="identity-panel__field">
      <dt class="identity-panel__field-label">{{ texts.employeeNumberLabel }}</dt>
      <dd class="identity-panel__field-value identity-panel__field-value--mono">{{ employeeKey().employeeNumber }}</dd>
    </div>
    @if (hireDate()) {
      <div class="identity-panel__field">
        <dt class="identity-panel__field-label">{{ texts.employeeFechaAltaLabel }}</dt>
        <dd class="identity-panel__field-value">{{ hireDate() }}</dd>
      </div>
    }
  </dl>

  <div class="identity-panel__divider"></div>

  <!-- Section navigation -->
  <nav class="identity-panel__nav" [attr.aria-label]="texts.detailNavAriaLabel">
    @for (item of navItems(); track item.section) {
      <a
        class="identity-panel__nav-item"
        [routerLink]="item.routeCommands"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
      >{{ item.label }}</a>
    }
  </nav>
</div>
```

- [ ] **Step 3: Create employee-identity-panel.component.scss**

Create file `src/app/features/employee/identity/employee-identity-panel.component.scss`:

```scss
:host {
  display: block;
  width: 260px;
  flex-shrink: 0;
  height: 100%;
}

.identity-panel {
  display: flex;
  flex-direction: column;
  background: var(--surface-panel);
  border-right: 1px solid var(--border-default);
  padding: 20px 16px;
  height: 100%;
  overflow-y: auto;
}

/* Avatar */
.identity-panel__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-bottom: 12px;
}

/* Name + status */
.identity-panel__hero {
  margin-bottom: 16px;
}

.identity-panel__name-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.identity-panel__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  word-break: break-word;
}

.identity-panel__status {
  align-self: flex-start;
}

/* Key data */
.identity-panel__fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 0 16px;
  padding: 0;
}

.identity-panel__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.identity-panel__field-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

.identity-panel__field-value {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-primary);
  margin: 0;
}

.identity-panel__field-value--mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

/* Divider */
.identity-panel__divider {
  height: 1px;
  background: var(--border-default);
  margin: 0 0 12px;
}

/* Section nav */
.identity-panel__nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.identity-panel__nav-item {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: background-color 120ms ease, color 120ms ease;
  position: relative;
}

.identity-panel__nav-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.identity-panel__nav-item.active {
  background: var(--surface-accent);
  color: var(--accent-primary);
  font-weight: 600;
  border-left: 2px solid var(--accent-primary);
  padding-left: 8px;
}
```

- [ ] **Step 4: Add missing i18n keys to employee.texts.ts**

Check `src/app/features/employee/employee.texts.ts`. Add missing text keys if not already present (open the file and add only what's missing):

```typescript
// Add these if missing:
employeeConvenioLabel: 'Convenio',
employeeTypeLabel: 'Tipo',
employeeNumberLabel: 'Número',
employeeFechaAltaLabel: 'Fecha alta',
detailNavAriaLabel: 'Secciones del empleado',
```

- [ ] **Step 5: Verify the build compiles**

```bash
npm run build
```

Expected: new component compiles cleanly. If TypeScript complains about missing text keys, complete Step 4.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/employee/identity/ src/app/features/employee/employee.texts.ts
git commit -m "feat(employee): add EmployeeIdentityPanel component with section nav"
```

---

### Task 5: Employee Detail Page (New Wrapper Component)

The detail page hosts the identity panel on the left and the section router-outlet on the right. It takes over the store-loading and routing logic from the current shell page for the detail context.

**Files:**
- Create: `src/app/features/employee/shell/pages/employee-detail-page.component.ts`
- Create: `src/app/features/employee/shell/pages/employee-detail-page.component.html`
- Create: `src/app/features/employee/shell/pages/employee-detail-page.component.scss`

- [ ] **Step 1: Create employee-detail-page.component.ts**

Create `src/app/features/employee/shell/pages/employee-detail-page.component.ts`:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';

import { EmployeeIdentityPanelComponent } from '../../identity/employee-identity-panel.component';
import { EmployeeJourneyTimelineComponent } from '../components/employee-journey-timeline.component';
import { EmployeeTerminatePanelComponent } from '../components/employee-terminate-panel.component';
import { GlobalMessageRailComponent } from '../components/global-message-rail.component';
import { EmployeeDetailStore } from '../../data-access/employee-detail.store';
import { EmployeePresenceStore } from '../../data-access/employee-presence.store';
import { EmployeeJourneyStore } from '../../data-access/employee-journey.store';
import { EmployeeContractStore } from '../../data-access/employee-contract.store';
import { EmployeeWorkCenterStore } from '../../data-access/employee-work-center.store';
import { EmployeeContactStore } from '../../data-access/employee-contact.store';
import { GlobalMessageService } from '../../data-access/employee-global-message.store';
import { EmployeePdfService } from '../services/employee-pdf.service';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeContactModel } from '../../models/employee-contact.model';
import { EmployeeCoreIdentityDraft } from '../../models/employee-core-identity-draft.model';
import { EmployeeDetailModel } from '../../models/employee-detail.model';
import { EmployeePresenceModel } from '../../models/employee-presence.model';
import {
  buildEmployeeDetailRouteCommands,
  EmployeeRouteSection,
  employeeRouteSections,
} from '../../routing/employee-route-builder.util';
import {
  areEmployeeBusinessKeysEqual,
  readEmployeeBusinessKeyFromParamMap,
} from '../../routing/employee-route-key.util';
import { GlobalUiMessage } from '../../models/global-ui-message.model';
import { EmployeeDetailHeaderComponent } from '../components/employee-detail-header.component';

@Component({
  selector: 'app-employee-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterOutlet,
    EmployeeIdentityPanelComponent,
    EmployeeJourneyTimelineComponent,
    EmployeeTerminatePanelComponent,
    GlobalMessageRailComponent,
    EmployeeDetailHeaderComponent,
  ],
  templateUrl: './employee-detail-page.component.html',
  styleUrl: './employee-detail-page.component.scss',
})
export class EmployeeDetailPageComponent {
  protected readonly isRehireWorkflow = computed(() => {
    let snapshot = this.route.snapshot;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    return snapshot.url.some((seg: any) => seg.path === 'rehire');
  });

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly detailStore = inject(EmployeeDetailStore);
  private readonly contactStore = inject(EmployeeContactStore);
  private readonly presenceStore = inject(EmployeePresenceStore);
  private readonly workCenterStore = inject(EmployeeWorkCenterStore);
  private readonly journeyStore = inject(EmployeeJourneyStore);
  private readonly contractStore = inject(EmployeeContractStore);
  private readonly pdfService = inject(EmployeePdfService);
  private readonly globalMessageService = inject(GlobalMessageService);
  private highlightedSectionResetHandle: number | null = null;
  private previousIdentitySuccess: 'updated' | null = null;

  protected readonly texts = employeeTexts;
  protected readonly activeEmployeeKey = signal<EmployeeBusinessKey | null>(null);
  protected readonly activeDetailSection = signal<EmployeeRouteSection>('contact');
  protected readonly selectedEmployeeDetail = this.detailStore.selectedEmployeeDetail;
  protected readonly loadingDetail = this.detailStore.loadingDetail;
  protected readonly detailError = this.detailStore.detailError;
  protected readonly journey = this.journeyStore.journey;
  protected readonly loadingJourney = this.journeyStore.loading;
  protected readonly journeyError = this.journeyStore.error;
  protected readonly contacts = this.contactStore.contacts;
  protected readonly presences = this.presenceStore.presences;
  protected readonly workCenters = this.workCenterStore.workCenters;
  protected readonly globalMessages = this.globalMessageService.messages;
  protected readonly globalMessageSummary = this.globalMessageService.summary;
  protected readonly globalMessageExpanded = this.globalMessageService.expanded;
  protected readonly updatingIdentity = this.detailStore.mutating;
  protected readonly updateIdentityError = computed(
    () => this.detailStore.mutationError() === 'request-failed',
  );
  protected readonly updateIdentitySuccess = computed(
    () => this.detailStore.mutationSuccess() === 'updated',
  );
  protected readonly openIdentityEditorRequestId = signal(0);
  protected readonly terminatePanelOpen = signal(false);

  protected readonly selectedEmployee = computed<EmployeeDetailModel | null>(() => {
    const activeEmployeeKey = this.activeEmployeeKey();
    if (!activeEmployeeKey) return null;
    const detail = this.selectedEmployeeDetail();
    if (detail && areEmployeeBusinessKeysEqual(detail, activeEmployeeKey)) return detail;
    return null;
  });

  protected readonly headerStatus = computed<'ACTIVE' | 'TERMINATED'>(() => {
    const employee = this.selectedEmployee();
    if (!employee) return 'TERMINATED';
    const n = employee.statusLabel.trim().toLowerCase();
    return n.includes('active') || n.includes('alta') ? 'ACTIVE' : 'TERMINATED';
  });

  protected readonly activePresence = computed(() =>
    this.resolveActivePresence(this.presences()),
  );

  protected readonly headerHireDate = computed(() => {
    const presences = this.presences();
    if (presences.length === 0) return null;
    const earliest = [...presences].sort((l, r) => l.startDate.localeCompare(r.startDate))[0];
    return earliest?.startDate ?? null;
  });

  protected readonly headerEmail = computed(() =>
    this.findPreferredContactValue(this.contacts(), 'email'),
  );

  protected readonly headerPhone = computed(() =>
    this.findPreferredContactValue(this.contacts(), 'phone'),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const previousKey = this.activeEmployeeKey();
        const activeKey = this.resolveActiveEmployeeKey();
        const shouldForceRefresh = this.shouldForceRefreshAfterRehire();
        if (!areEmployeeBusinessKeysEqual(previousKey, activeKey)) {
          this.globalMessageService.reset();
        }
        this.activeEmployeeKey.set(activeKey);
        this.activeDetailSection.set(this.resolveActiveDetailSection());

        if (shouldForceRefresh) {
          this.detailStore.refreshEmployeeDetailByBusinessKey(activeKey);
          this.presenceStore.refreshPresencesByBusinessKey(activeKey);
          this.workCenterStore.refreshWorkCenters(activeKey);
          this.journeyStore.refreshJourneyByBusinessKey(activeKey);
          this.contractStore.loadContractsByBusinessKey(activeKey);
        } else {
          this.detailStore.loadEmployeeDetailByBusinessKey(activeKey);
          this.presenceStore.loadPresencesByBusinessKey(activeKey);
          this.workCenterStore.loadWorkCenters(activeKey);
          this.journeyStore.loadJourneyByBusinessKey(activeKey);
          this.contractStore.loadContractsByBusinessKey(activeKey);
        }
        this.contactStore.loadContactsByBusinessKey(activeKey);

        if (shouldForceRefresh) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { refresh: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      });

    effect((onCleanup) => {
      const messages = this.buildShellMessages();
      untracked(() => this.globalMessageService.setSourceMessages('employee-detail-page', messages));
      onCleanup(() => untracked(() => this.globalMessageService.clearSourceMessages('employee-detail-page')));
    });

    effect(() => {
      const identitySuccess = this.detailStore.mutationSuccess();
      if (identitySuccess && identitySuccess !== this.previousIdentitySuccess) {
        untracked(() => {
          this.globalMessageService.success(this.texts.detailHeaderUpdateSuccessMessage, {
            id: 'employee-detail-identity-updated',
            sectionId: 'overview',
            sectionLabel: this.texts.detailPanelTitle,
          });
        });
      }
      this.previousIdentitySuccess = identitySuccess;
    });
  }

  protected openIdentityEditorFromHeader(): void {
    this.detailStore.clearMutationFeedback();
    this.openIdentityEditorRequestId.update((v) => v + 1);
  }

  protected openTerminatePanel(): void {
    this.terminatePanelOpen.set(true);
  }

  protected closeTerminatePanel(): void {
    this.terminatePanelOpen.set(false);
  }

  protected toggleGlobalMessages(): void {
    this.globalMessageService.toggleExpanded();
  }

  protected closeGlobalMessages(): void {
    const summary = this.globalMessageSummary();
    if (summary.errorCount === 0 && summary.warningCount === 0) {
      this.globalMessageService.dismissTransientMessages();
      return;
    }
    this.globalMessageService.collapse();
  }

  protected navigateToMessageSection(message: GlobalUiMessage): void {
    const sectionId = message.sectionId?.trim();
    if (!sectionId) return;
    const activeKey = this.activeEmployeeKey();
    if (!activeKey) return;
    if (employeeRouteSections.includes(sectionId as EmployeeRouteSection)) {
      const routeSection = sectionId as EmployeeRouteSection;
      if (this.activeDetailSection() !== routeSection) {
        void this.router.navigate(buildEmployeeDetailRouteCommands(activeKey, routeSection)).then((navigated) => {
          if (navigated) window.setTimeout(() => this.focusSection(sectionId), 120);
        });
        return;
      }
    }
    this.focusSection(sectionId);
  }

  protected submitIdentityUpdate(draft: EmployeeCoreIdentityDraft): void {
    const key = this.activeEmployeeKey();
    if (!key) return;
    this.detailStore.updateEmployeeCoreIdentity(key, draft);
  }

  protected clearIdentityFeedback(): void {
    this.detailStore.clearMutationFeedback();
  }

  protected onRehireRequested(): void {
    const key = this.activeEmployeeKey();
    if (!key) return;
    void this.router.navigate([
      '/personas/empleados',
      key.ruleSystemCode,
      key.employeeTypeCode,
      key.employeeNumber,
      'rehire',
    ]);
  }

  protected onPrintRequested(): void {
    const employee = this.selectedEmployee();
    if (!employee) return;
    const contracts = this.contractStore.contracts();
    const activeContract =
      contracts.find((c) => c.isActive) ??
      [...contracts].sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ??
      null;
    const empty = this.texts.employeePageHeaderEmptyValue;
    const nullIfEmpty = (v: string | null | undefined) =>
      !v || v === empty || !v.trim() ? null : v;
    this.pdfService.print({
      fullName: employee.displayName,
      employeeNumber: employee.employeeNumber,
      employeeTypeCode: employee.employeeTypeCode,
      ruleSystemCode: employee.ruleSystemCode,
      statusLabel: this.headerStatus() === 'ACTIVE'
        ? this.texts.employeeStatusActiveLabel
        : this.texts.employeeStatusInactiveLabel,
      isActive: this.headerStatus() === 'ACTIVE',
      company: nullIfEmpty(this.resolveHeaderCompany()),
      workCenter: nullIfEmpty(this.resolveHeaderWorkCenter()),
      hireDate: nullIfEmpty(this.headerHireDate()),
      contractTypeName: activeContract?.contractTypeName ?? null,
      contractSubtypeName: activeContract?.contractSubtypeName ?? null,
      contractCode: activeContract?.contractCode ?? null,
      contractStartDate: activeContract?.startDate ?? null,
      contractEndDate: activeContract?.endDate ?? null,
      contractIsActive: activeContract?.isActive ?? false,
      email: nullIfEmpty(this.headerEmail()),
      phone: nullIfEmpty(this.headerPhone()),
    });
  }

  private resolveActiveEmployeeKey(): EmployeeBusinessKey | null {
    let snapshot = this.route.snapshot;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    return readEmployeeBusinessKeyFromParamMap(snapshot.paramMap);
  }

  private resolveActiveDetailSection(): EmployeeRouteSection {
    let snapshot = this.route.snapshot;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    const routeSection = snapshot.url.at(-1)?.path ?? '';
    if (employeeRouteSections.includes(routeSection as EmployeeRouteSection)) {
      return routeSection as EmployeeRouteSection;
    }
    return 'contact';
  }

  private resolveActivePresence(
    presences: ReadonlyArray<EmployeePresenceModel>,
  ): EmployeePresenceModel | null {
    if (presences.length === 0) return null;
    return (
      presences.find((p) => p.isActive) ??
      [...presences].sort((l, r) => r.startDate.localeCompare(l.startDate))[0] ??
      null
    );
  }

  private resolveHeaderCompany(): string {
    const presence = this.activePresence();
    if (!presence) return this.texts.employeePageHeaderEmptyValue;
    return (
      [presence.companyName ?? '', presence.companyCode]
        .map((v) => v.trim())
        .find((v) => v.length > 0) ?? this.texts.employeePageHeaderEmptyValue
    );
  }

  private resolveHeaderWorkCenter(): string {
    const wcs = this.workCenters();
    if (wcs && wcs.length > 0) {
      const active = wcs.find((w) => w.isActive);
      if (active) return (active.workCenterName ?? active.workCenterCode ?? '').trim() || this.texts.employeePageHeaderEmptyValue;
      const recent = [...wcs].sort((l, r) => r.startDate.localeCompare(l.startDate))[0];
      if (recent) return (recent.workCenterName ?? recent.workCenterCode ?? '').trim() || this.texts.employeePageHeaderEmptyValue;
    }
    return this.selectedEmployee()?.workCenter ?? this.texts.employeePageHeaderEmptyValue;
  }

  private findPreferredContactValue(
    contacts: ReadonlyArray<EmployeeContactModel>,
    type: EmployeeContactModel['type'],
  ): string {
    const match = contacts.find((c) => c.type === type);
    const value = match?.value?.trim() ?? '';
    return value.length > 0 ? value : this.texts.employeePageHeaderEmptyValue;
  }

  private buildShellMessages(): ReadonlyArray<Omit<GlobalUiMessage, 'createdAt'>> {
    const messages: Array<Omit<GlobalUiMessage, 'createdAt'>> = [];
    if (this.detailError() === 'not-found') {
      messages.push({ id: 'employee-detail-not-found', level: 'warning', text: this.texts.detailNotFoundMessage, sectionId: 'overview', sectionLabel: this.texts.detailPanelTitle, sticky: true });
    }
    if (this.detailError() === 'request-failed') {
      messages.push({ id: 'employee-detail-load-error', level: 'error', text: this.texts.detailLoadFailedMessage, sectionId: 'overview', sectionLabel: this.texts.detailPanelTitle, sticky: true });
    }
    if (this.updateIdentityError()) {
      messages.push({ id: 'employee-identity-update-error', level: 'error', text: this.texts.detailHeaderUpdateErrorMessage, sectionId: 'overview', sectionLabel: this.texts.detailPanelTitle, sticky: true });
    }
    return messages;
  }

  private shouldForceRefreshAfterRehire(): boolean {
    let snapshot = this.route.snapshot;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    return snapshot.queryParamMap.get('refresh') === 'rehire';
  }

  private focusSection(sectionId: string): void {
    const target = document.getElementById(`employee-section-${sectionId}`);
    if (!(target instanceof HTMLElement)) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('employee-detail__section-highlight');
    if (this.highlightedSectionResetHandle !== null) window.clearTimeout(this.highlightedSectionResetHandle);
    this.highlightedSectionResetHandle = window.setTimeout(() => {
      target.classList.remove('employee-detail__section-highlight');
      this.highlightedSectionResetHandle = null;
    }, 1800);
  }
}
```

- [ ] **Step 2: Create employee-detail-page.component.html**

Create `src/app/features/employee/shell/pages/employee-detail-page.component.html`:

```html
<div class="employee-detail">

  <!-- Breadcrumb -->
  <nav class="employee-detail__breadcrumb" aria-label="Breadcrumb">
    <a class="employee-detail__breadcrumb-link" routerLink="/personas/empleados">{{ texts.masterTitle }}</a>
    <span class="employee-detail__breadcrumb-sep" aria-hidden="true">›</span>
    <span class="employee-detail__breadcrumb-current">{{ selectedEmployee()?.displayName ?? '...' }}</span>
  </nav>

  @if (activeEmployeeKey(); as key) {
    <div class="employee-detail__body">

      <!-- Identity panel (left column) -->
      <app-employee-identity-panel
        [employeeKey]="key"
        [employee]="selectedEmployee()"
        [activeSection]="activeDetailSection()"
        [hireDate]="headerHireDate()"
        [status]="headerStatus()"
      />

      <!-- Content area (right column) -->
      <div class="employee-detail__content">

        <!-- Hidden identity editor drawer -->
        <app-employee-detail-header
          class="employee-detail__identity-editor"
          [employee]="selectedEmployee()"
          [editorOnly]="true"
          [openEditorRequestId]="openIdentityEditorRequestId()"
          [updating]="updatingIdentity()"
          [updateError]="updateIdentityError()"
          [updateSuccess]="updateIdentitySuccess()"
          (updateRequested)="submitIdentityUpdate($event)"
          (editInteractionStarted)="clearIdentityFeedback()"
        />

        <!-- Global messages -->
        <div class="employee-detail__messages" aria-live="polite">
          <app-global-message-rail
            [messages]="globalMessages()"
            [summary]="globalMessageSummary()"
            [expanded]="globalMessageExpanded()"
            (toggleRequested)="toggleGlobalMessages()"
            (closeRequested)="closeGlobalMessages()"
            (sectionRequested)="navigateToMessageSection($event)"
          />
        </div>

        <!-- Sections + timeline grid -->
        <div class="employee-detail__sections-timeline">

          <!-- Section router outlet -->
          <section class="employee-detail__section-area">
            @if (!isRehireWorkflow()) {
              @if (loadingDetail()) {
                <p class="employee-detail__loading">{{ texts.detailLoadingMessage }}</p>
              }
            }
            <router-outlet />
          </section>

          <!-- Journey timeline (kept intact) -->
          @if (!isRehireWorkflow()) {
            <aside class="employee-detail__timeline-area" id="employee-section-journey" aria-label="Historial del empleado">
              @if (!terminatePanelOpen()) {
                <app-employee-journey-timeline
                  [journey]="journey()"
                  [loading]="loadingJourney()"
                  [error]="journeyError()"
                  [presences]="presences()"
                />
              } @else {
                <app-employee-terminate-panel
                  [employeeKey]="key"
                  (closed)="closeTerminatePanel()"
                />
              }
            </aside>
          }

        </div>
      </div>
    </div>
  }

</div>
```

- [ ] **Step 3: Create employee-detail-page.component.scss**

Create `src/app/features/employee/shell/pages/employee-detail-page.component.scss`:

```scss
:host {
  display: block;
  height: 100%;
}

.employee-detail {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

/* Breadcrumb */
.employee-detail__breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: var(--surface-panel);
  border-bottom: 1px solid var(--border-default);
  font-size: 13px;
  flex-shrink: 0;
}

.employee-detail__breadcrumb-link {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 500;
}

.employee-detail__breadcrumb-link:hover {
  text-decoration: underline;
}

.employee-detail__breadcrumb-sep {
  color: var(--text-tertiary);
}

.employee-detail__breadcrumb-current {
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Two-column body */
.employee-detail__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* Content (right column) */
.employee-detail__content {
  flex: 1;
  min-width: 0;
  background: var(--surface-app);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.employee-detail__identity-editor {
  display: contents;
}

.employee-detail__messages {
  display: contents;
  pointer-events: none;
}

/* Sections + timeline side-by-side */
.employee-detail__sections-timeline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(22rem, 24rem);
  gap: 16px;
  align-items: start;
}

.employee-detail__section-area {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.employee-detail__timeline-area {
  background: var(--surface-panel);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-card);
  padding: 16px;
  align-self: start;
  position: sticky;
  top: 16px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
}

.employee-detail__loading {
  font-size: 13px;
  color: var(--text-tertiary);
}

:global(.employee-detail__section-highlight) {
  animation: detail-section-highlight 1.8s ease-out;
}

@keyframes detail-section-highlight {
  0%   { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
  25%  { box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15); }
  100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
}

@media (max-width: 1280px) {
  .employee-detail__sections-timeline {
    grid-template-columns: minmax(0, 1fr) minmax(20rem, 22rem);
  }
}

@media (max-width: 960px) {
  .employee-detail__sections-timeline {
    grid-template-columns: 1fr;
  }

  .employee-detail__timeline-area {
    position: static;
    max-height: none;
  }
}

@media (max-width: 768px) {
  .employee-detail__body {
    flex-direction: column;
  }

  .employee-detail__content {
    padding: 16px;
  }
}
```

- [ ] **Step 4: Verify the build compiles**

```bash
npm run build
```

Expected: the new component compiles. The `EmployeeDetailHeaderComponent` is still referenced (it will be kept since it provides the inline identity editor drawer).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/employee/shell/pages/employee-detail-page.component.*
git commit -m "feat(employee): add EmployeeDetailPage with identity panel layout"
```

---

### Task 6: Employee Shell Page → Directory DataTable

The current master-detail shell page is transformed into a simple standalone directory page with a PrimeNG DataTable, search input, and hire button. All the detail/identity logic moves to `EmployeeDetailPageComponent` (Task 5).

**Files:**
- Modify: `src/app/features/employee/shell/pages/employee-shell-page.component.ts`
- Modify: `src/app/features/employee/shell/pages/employee-shell-page.component.html`
- Modify: `src/app/features/employee/shell/pages/employee-shell-page.component.scss`

- [ ] **Step 1: Replace employee-shell-page.component.ts**

Replace the full contents of `src/app/features/employee/shell/pages/employee-shell-page.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { UiTagComponent } from '../../../../shared/ui/tag/ui-tag.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { EmployeeDirectoryStore } from '../../data-access/employee-directory.store';
import { EmployeeRecentsService } from '../../data-access/employee-recents.service';
import { employeeTexts } from '../../employee.texts';
import { EmployeeListItemModel } from '../../models/employee-list-item.model';
import { buildEmployeeDetailRouteCommands } from '../../routing/employee-route-builder.util';
import { toEmployeeBusinessKey } from '../../routing/employee-route-key.util';

@Component({
  selector: 'app-employee-shell-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    UiTagComponent,
    UiButtonComponent,
  ],
  templateUrl: './employee-shell-page.component.html',
  styleUrl: './employee-shell-page.component.scss',
})
export class EmployeeShellPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly directoryStore = inject(EmployeeDirectoryStore);
  private readonly recentsService = inject(EmployeeRecentsService);

  protected readonly texts = employeeTexts;
  protected readonly searchValue = signal('');
  protected readonly employees = this.directoryStore.filteredEmployees;
  protected readonly loading = this.directoryStore.loading;
  protected readonly error = this.directoryStore.error;

  protected readonly displayedEmployees = computed(() => {
    const q = this.searchValue().trim().toLowerCase();
    if (!q) return this.employees();
    return this.employees().filter(
      (e) =>
        e.displayName.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        e.ruleSystemCode.toLowerCase().includes(q) ||
        e.employeeTypeCode.toLowerCase().includes(q),
    );
  });

  protected updateSearch(value: string): void {
    this.searchValue.set(value);
    this.directoryStore.setQuery(value);
  }

  protected openEmployee(employee: EmployeeListItemModel): void {
    this.recentsService.add(employee);
    void this.router.navigate(
      buildEmployeeDetailRouteCommands(toEmployeeBusinessKey(employee), 'contact'),
    );
  }

  protected onHireClick(): void {
    void this.router.navigate(['hire'], { relativeTo: this.route });
  }

  protected resolveStatusLabel(statusLabel: string): string {
    const n = statusLabel.trim().toLowerCase();
    if (n.includes('active') || n.includes('alta')) return this.texts.employeeStatusActiveLabel;
    if (n.includes('pending') || n.includes('draft')) return this.texts.employeeStatusPendingLabel;
    return this.texts.employeeStatusInactiveLabel;
  }

  protected resolveStatusSeverity(statusLabel: string): 'success' | 'secondary' | 'warn' {
    const n = statusLabel.trim().toLowerCase();
    if (n.includes('active') || n.includes('alta')) return 'success';
    if (n.includes('pending') || n.includes('draft')) return 'warn';
    return 'secondary';
  }
}
```

- [ ] **Step 2: Replace employee-shell-page.component.html**

Replace the full contents of `src/app/features/employee/shell/pages/employee-shell-page.component.html` with:

```html
<div class="employee-directory">

  <!-- Page header -->
  <header class="employee-directory__header">
    <h1 class="employee-directory__title">{{ texts.masterTitle }}</h1>
    <app-ui-button
      [label]="texts.hireEmployeeTitle"
      icon="pi pi-plus"
      (pressed)="onHireClick()"
    />
  </header>

  <!-- Search -->
  <div class="employee-directory__search-row">
    <p-iconfield class="employee-directory__search-field">
      <p-inputicon styleClass="pi pi-search" />
      <input
        pInputText
        class="employee-directory__search-input"
        type="text"
        [placeholder]="texts.searchPlaceholder"
        [value]="searchValue()"
        (input)="updateSearch($any($event.target).value)"
      />
    </p-iconfield>
    <span class="employee-directory__count">{{ displayedEmployees().length }} empleados</span>
  </div>

  <!-- DataTable -->
  <div class="employee-directory__table-wrapper">
    @if (error()) {
      <p class="employee-directory__error">{{ texts.directoryLoadFailedMessage }}</p>
    }

    <p-table
      [value]="displayedEmployees()"
      [loading]="loading()"
      [rows]="50"
      [paginator]="displayedEmployees().length > 50"
      styleClass="employee-directory__table"
    >
      <ng-template pTemplate="header">
        <tr>
          <th class="employee-directory__th">{{ texts.employeeNameColumnLabel }}</th>
          <th class="employee-directory__th">{{ texts.employeeClaveColumnLabel }}</th>
          <th class="employee-directory__th">{{ texts.employeeTypeColumnLabel }}</th>
          <th class="employee-directory__th">{{ texts.employeeConvenioColumnLabel }}</th>
          <th class="employee-directory__th">{{ texts.employeeStatusColumnLabel }}</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-employee>
        <tr class="employee-directory__row" (click)="openEmployee(employee)" role="button" tabindex="0" (keydown.enter)="openEmployee(employee)">
          <td class="employee-directory__td employee-directory__td--name">{{ employee.displayName }}</td>
          <td class="employee-directory__td employee-directory__td--mono">{{ employee.employeeNumber }}</td>
          <td class="employee-directory__td">{{ employee.employeeTypeCode }}</td>
          <td class="employee-directory__td">{{ employee.ruleSystemCode }}</td>
          <td class="employee-directory__td">
            <app-ui-tag
              [value]="resolveStatusLabel(employee.statusLabel)"
              [severity]="resolveStatusSeverity(employee.statusLabel)"
            />
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="5" class="employee-directory__empty">
            {{ searchValue() ? texts.noResultEmployeesTitle : texts.emptyDirectoryTitle }}
          </td>
        </tr>
      </ng-template>
    </p-table>
  </div>

</div>
```

- [ ] **Step 3: Replace employee-shell-page.component.scss**

Replace the full contents of `src/app/features/employee/shell/pages/employee-shell-page.component.scss` with:

```scss
:host {
  display: block;
  padding: 24px;
  min-height: 100dvh;
}

.employee-directory {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1200px;
}

/* Header */
.employee-directory__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.employee-directory__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Search row */
.employee-directory__search-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.employee-directory__search-field {
  flex: 1;
  max-width: 360px;
}

.employee-directory__search-input {
  width: 100%;
}

.employee-directory__count {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

/* Table wrapper */
.employee-directory__table-wrapper {
  background: var(--surface-panel);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* Override PrimeNG table inside wrapper */
.employee-directory__table {
  width: 100%;
}

.employee-directory__th {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
  color: var(--text-tertiary) !important;
  background: #f8fafc !important;
  border-bottom: 1px solid var(--border-default) !important;
  padding: 10px 14px !important;
  white-space: nowrap;
}

.employee-directory__td {
  font-size: 13px;
  color: var(--text-primary);
  padding: 0 14px;
  height: 40px;
  vertical-align: middle;
}

.employee-directory__td--name {
  font-weight: 500;
}

.employee-directory__td--mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: var(--text-secondary);
}

.employee-directory__row {
  cursor: pointer;
  transition: background-color 100ms ease;
}

.employee-directory__row:hover {
  background: var(--surface-hover) !important;
}

.employee-directory__empty {
  text-align: center;
  padding: 32px 16px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.employee-directory__error {
  padding: 12px 16px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 13px;
  border-bottom: 1px solid var(--border-default);
  margin: 0;
}
```

- [ ] **Step 4: Add missing i18n column-header keys to employee.texts.ts**

Open `src/app/features/employee/employee.texts.ts` and add the column label keys if not present:

```typescript
// Add if missing:
employeeNameColumnLabel: 'Nombre',
employeeClaveColumnLabel: 'Clave',
employeeTypeColumnLabel: 'Tipo',
employeeConvenioColumnLabel: 'Convenio',
employeeStatusColumnLabel: 'Estado',
employeeConvenioLabel: 'Convenio',    // already added in Task 4 — skip if present
employeeTypeLabel: 'Tipo',            // already added in Task 4 — skip if present
employeeNumberLabel: 'Número',        // already added in Task 4 — skip if present
employeeFechaAltaLabel: 'Fecha alta', // already added in Task 4 — skip if present
detailNavAriaLabel: 'Secciones del empleado', // already added in Task 4 — skip if present
```

- [ ] **Step 5: Verify the build compiles**

```bash
npm run build
```

Expected: `EmployeeShellPageComponent` compiles as a simpler component. The old imports (`MasterDetailPageShellComponent`, `MasterListPanelComponent`, etc.) are no longer referenced.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/employee/shell/pages/employee-shell-page.component.* src/app/features/employee/employee.texts.ts
git commit -m "feat(employee): transform shell page into DataTable directory"
```

---

### Task 7: Employee Routes Restructure

The new route structure separates the directory (`''`) from the detail (`':rs/:type/:num'`). Section child routes live under the detail page.

**Files:**
- Modify: `src/app/features/employee/employee.routes.ts`

- [ ] **Step 1: Replace employee.routes.ts**

Replace the full contents of `src/app/features/employee/employee.routes.ts` with:

```typescript
import { Routes } from '@angular/router';

import {
  buildEmployeeDetailRoutePath,
  buildEmployeeKeyRoutePath,
  buildEmployeeUnknownSectionRoutePath,
} from './routing/employee-route-builder.util';

export const employeeRoutes: Routes = [
  {
    path: 'hire',
    loadComponent: () =>
      import('./lifecycle/hire/pages/hire-employee-page.component').then(
        (m) => m.HireEmployeePageComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./shell/pages/employee-shell-page.component').then(
        (m) => m.EmployeeShellPageComponent,
      ),
  },
  {
    path: buildEmployeeKeyRoutePath(),
    loadComponent: () =>
      import('./shell/pages/employee-detail-page.component').then(
        (m) => m.EmployeeDetailPageComponent,
      ),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/pages/employee-overview-page.component').then(
            (m) => m.EmployeeOverviewPageComponent,
          ),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./contact/pages/employee-contact-page.component').then(
            (m) => m.EmployeeContactPageComponent,
          ),
      },
      {
        path: 'presence',
        loadComponent: () =>
          import('./presence/pages/employee-presence-page.component').then(
            (m) => m.EmployeePresencePageComponent,
          ),
      },
      {
        path: 'organization',
        loadComponent: () =>
          import('./organization/pages/employee-organization-page.component').then(
            (m) => m.EmployeeOrganizationPageComponent,
          ),
      },
      {
        path: 'payroll',
        loadComponent: () =>
          import('./payroll/pages/employee-payroll-page.component').then(
            (m) => m.EmployeePayrollPageComponent,
          ),
      },
      {
        path: 'rehire',
        loadComponent: () =>
          import('./lifecycle/rehire/pages/rehire-employee-page.component').then(
            (m) => m.RehireEmployeePageComponent,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'contact',
      },
      {
        path: ':section',
        pathMatch: 'full',
        redirectTo: 'contact',
      },
    ],
  },
  {
    path: buildEmployeeUnknownSectionRoutePath(),
    pathMatch: 'full',
    redirectTo: '',
  },
];
```

> **Note:** The `buildEmployeeDetailRoutePath(section)` helper produces `:rs/:type/:num/section`. In the new routing the section routes are children of the detail page at `:rs/:type/:num`, so `buildEmployeeDetailRouteCommands(key, 'contact')` still produces the same absolute URL — no changes needed to callers.

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: routes compile, no missing import errors. The `buildEmployeeKeyRoutePath()` and `buildEmployeeUnknownSectionRoutePath()` utilities produce correct route strings.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/employee/employee.routes.ts
git commit -m "feat(employee): restructure routes — directory at root, detail at :key"
```

---

### Task 8: Delete Deprecated Components

Remove the three components absorbed by the new layout. Verify no remaining imports before deleting.

**Files:**
- Delete: `src/app/features/employee/shell/pages/employee-empty-detail-page.component.*`
- Delete: `src/app/features/employee/shell/components/employee-detail-nav.component.*`
- Delete: `src/app/features/employee/shell/components/employee-detail-header.component.*`

> ⚠ **Keep `employee-detail-header.component.*`** for now — it is still imported by `EmployeeDetailPageComponent` (Task 5) as the inline editor drawer. Only delete `employee-empty-detail-page` and `employee-detail-nav`.

- [ ] **Step 1: Confirm nothing still imports employee-detail-nav**

```bash
grep -r "employee-detail-nav" src/ --include="*.ts"
```

Expected: 0 results (the new shell page doesn't import it; the old routes no longer reference `EmployeeEmptyDetailPageComponent`).

- [ ] **Step 2: Confirm nothing still imports employee-empty-detail-page**

```bash
grep -r "employee-empty-detail-page\|EmployeeEmptyDetailPage" src/ --include="*.ts"
```

Expected: 0 results (only `employee.routes.ts` referenced it, and that file was rewritten in Task 7).

- [ ] **Step 3: Delete employee-empty-detail-page files**

```bash
rm src/app/features/employee/shell/pages/employee-empty-detail-page.component.ts
rm src/app/features/employee/shell/pages/employee-empty-detail-page.component.html
rm src/app/features/employee/shell/pages/employee-empty-detail-page.component.scss
```

- [ ] **Step 4: Delete employee-detail-nav files**

```bash
rm src/app/features/employee/shell/components/employee-detail-nav.component.ts
rm src/app/features/employee/shell/components/employee-detail-nav.component.html
rm src/app/features/employee/shell/components/employee-detail-nav.component.scss
```

- [ ] **Step 5: Verify the build compiles**

```bash
npm run build
```

Expected: build succeeds. Deleted files are no longer referenced.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(employee): delete deprecated empty-detail-page and detail-nav components"
```

---

### Task 9: Employee Section Shell Style Polish

Update the `employee-section-shell` SCSS so section cards use the new design tokens — white background, subtle border, `shadow-card`, and `radius-md`.

**Files:**
- Modify: `src/app/features/employee/shared/ui/section/employee-section-shell.component.scss`

- [ ] **Step 1: Update employee-section-shell.component.scss**

Replace the full contents of `src/app/features/employee/shared/ui/section/employee-section-shell.component.scss` with:

```scss
:host {
  display: block;
}

.employee-section-shell__header-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.employee-section-shell__footer {
  padding-top: 8px;
  border-top: 1px solid var(--border-default);
  margin-top: 8px;
}

.employee-section-shell__status {
  font-size: 12px;
  color: var(--text-tertiary);
}

.employee-section-shell__status--busy {
  color: var(--accent-primary);
}
```

- [ ] **Step 2: Check the SectionCardComponent styles**

The `SectionCardComponent` at `src/app/shared/ui/section-card/section-card.component.scss` controls the card border, shadow, padding and header. Check it and update if it still uses teal tokens:

```bash
grep -n "0e7490\|22d3ee\|0891b2\|teal\|cyan" src/app/shared/ui/section-card/section-card.component.scss
```

If any teal/cyan values appear, replace them with the indigo equivalents:
- `#0e7490` → `var(--accent-primary)`
- `#22d3ee` → `var(--accent-primary)`
- `rgba(14, 116, 144` → `rgba(79, 70, 229`

- [ ] **Step 3: Verify the build compiles**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/features/employee/shared/ui/section/ src/app/shared/ui/section-card/
git commit -m "feat(design): update section shell and card to Enterprise Clean tokens"
```

---

### Task 10: Login Page Restyling

Update the login page to Enterprise Clean: `#f1f5f9` background, white centered card, no gradients.

**Files:**
- Modify: `src/app/core/auth/pages/local-dev-login-page.component.ts` (styles section)

- [ ] **Step 1: Update the inline styles in local-dev-login-page.component.ts**

In `src/app/core/auth/pages/local-dev-login-page.component.ts`, replace only the `styles` string with:

```typescript
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
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/core/auth/pages/local-dev-login-page.component.ts
git commit -m "feat(login): restyle login page to Enterprise Clean"
```

---

## Self-Review

### Spec coverage check

| Spec section | Tasks covering it |
|---|---|
| 1. CSS tokens | Task 1 |
| 1. PrimeNG preset — indigo | Task 2 |
| 1. Typography (labels, values, headers) | Cascade from Tasks 1+2; section shells use tokens |
| 2. AppShell white sidebar with groups | Task 3 |
| 2. Footer avatar + logout | Task 3 |
| 3a. Employee directory — DataTable | Task 6 |
| 3a. Employee directory — remove master-detail | Tasks 6+7 |
| 3b. Employee detail — identity panel | Tasks 4+5 |
| 3b. Employee detail — section nav in panel | Task 4 |
| 3b. Employee detail — breadcrumb | Task 5 |
| 3b. Employee detail — section cards | Task 9 (section-shell tokens) |
| 3b. Keep journey timeline, forms, section logic | Task 5 (detail page) |
| 3c. Hire/Rehire — cascade | Cascade from Tasks 1+2 |
| 4. Organization sections — cascade | Cascade from Tasks 1+2 |
| 5. Payroll sections — cascade | Cascade from Tasks 1+2 |
| 6. Login page | Task 10 |
| 7. Remove employee-detail-nav | Task 8 |
| 7. Remove employee-empty-detail-page | Task 8 |
| 7. Update employee-section-shell in-place | Task 9 |

### Gaps / notes

- `employee-detail-header.component.*` is NOT deleted — it provides the inline identity editor drawer (slide-in form for name edits). The spec says to remove it "as header", but `EmployeeDetailPageComponent` (Task 5) still uses it as `[editorOnly]="true"`, preserving the edit functionality. Rename/removal can be a follow-up once that pattern is refactored.
- `MasterDetailPageShellComponent` is left in place — other features (organization) may still use it.
- Column "Fecha alta" in the directory DataTable is not yet in `EmployeeListItemModel`. The column is omitted from the DataTable in Task 6 until the backend directory endpoint returns it.
- Organization/payroll sections pick up the new visual automatically via preset + token cascade (Tasks 1+2). No structural changes needed there.
