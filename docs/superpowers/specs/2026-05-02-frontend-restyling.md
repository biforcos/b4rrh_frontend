# Frontend Restyling — Design Spec

## Goal

Replace the current consumer-feel PrimeNG Aura theme with a professional Enterprise Clean design system across the entire `b4rrhh_frontend` Angular app. The result should look like credible business software: Workday/BambooHR density, clean white cards on a grey background, indigo accent, light sidebar with labels.

## Execution Strategy

Foundation-first: fix the design system (tokens + PrimeNG preset + AppShell) before touching individual sections. The preset change alone improves buttons, inputs, tabs, badges and dialogs app-wide. Structural changes (AppShell, employee detail layout) follow. Section polish last.

---

## 1. Design System

### CSS Tokens (`src/styles.scss`)

Replace the existing custom property set with:

```scss
:root {
  // Surfaces
  --surface-app:        #f1f5f9;   // page background
  --surface-panel:      #ffffff;   // cards, sidebar
  --surface-hover:      #f8fafc;   // row hover, subtle bg
  --surface-accent:     #eef2ff;   // active item background

  // Accent (Indigo)
  --accent-primary:     #4f46e5;
  --accent-primary-hover: #4338ca;
  --accent-border:      #c7d2fe;
  --accent-muted:       #eef2ff;

  // Text
  --text-primary:       #0f172a;
  --text-secondary:     #475569;
  --text-tertiary:      #94a3b8;
  --text-accent:        #4f46e5;

  // Borders
  --border-default:     #e2e8f0;
  --border-strong:      #cbd5e1;

  // Radii
  --radius-sm:          6px;
  --radius-md:          8px;
  --radius-lg:          12px;

  // Shadows
  --shadow-card:        0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-panel:       0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -1px rgba(0,0,0,.04);
}
```

### PrimeNG Preset (`src/app/core/theme/b4rrhh-primeng-theme.preset.ts`)

Update the Aura-based custom preset:

- **Primary color scale**: replace teal family with indigo (`#4f46e5` as 500, standard Tailwind indigo scale 50–950)
- **Button**: `border-radius: 8px`, padding `8px 16px`, primary = indigo filled, outlined = indigo border + transparent bg
- **InputText / Select / MultiSelect**: border `var(--border-default)`, focus ring `0 0 0 2px var(--accent-muted)`, height `36px`, radius `6px`
- **DataTable**: header background `#f8fafc`, header text `var(--text-tertiary)` uppercase 11px, row height `40px`, row hover `var(--surface-hover)`, border color `var(--border-default)`
- **Tag**: success = `#dcfce7 / #16a34a`, warning = `#fef9c3 / #ca8a04`, danger = `#fee2e2 / #dc2626`, info = `var(--surface-accent) / var(--accent-primary)`
- **Dialog**: header `border-bottom: 1px solid var(--border-default)`, no colored header background, close button `var(--text-tertiary)`
- **Tabs**: active tab underline = `var(--accent-primary)`, no filled tab backgrounds
- **Toast/Message**: left border `4px solid` in status color, background white, subtle shadow

### Typography

Keep Plus Jakarta Sans. Update scale usage:
- Page titles: `16px / font-semibold / text-primary`
- Section titles: `13px / font-semibold / text-secondary uppercase tracking-wide`
- Field labels: `11px / font-medium / text-tertiary uppercase tracking-widest`
- Field values: `14px / font-normal / text-primary`
- Table headers: `11px / font-medium / text-tertiary uppercase tracking-wide`
- Table cells: `13px / font-normal / text-primary`

---

## 2. AppShell and Sidebar

### File: `src/app/core/layout/app-shell/`

**Sidebar** (`app-shell.component.html` + `.scss`):
- Width: `220px`, fixed, `background: #ffffff`, `border-right: 1px solid var(--border-default)`
- Top: logo/brand area, `padding: 20px 16px 16px`
- Replace `PanelMenuModule` with a plain `<nav>` using `routerLink` + `routerLinkActive` — removes collapse animations and JS overhead
- Navigation items grouped by section with a group label:
  ```
  PERSONAS          ← 10px uppercase text-tertiary, padding 12px 16px 4px
    · Empleados
  ORGANIZACIÓN
    · Empresas
    · Centros de trabajo
    · Catálogos
  NÓMINA
    · Recibos
    · Operaciones
  CONFIGURACIÓN
    · Rule Systems
  ```
- Each nav item: `height: 36px`, `padding: 0 12px`, `border-radius: 6px`, `display: flex; align-items: center; gap: 10px`, PrimeIcon + label text `13px`
- Hover: `background: var(--surface-hover)`
- Active (`routerLinkActive="active"`): `background: var(--surface-accent)`, `color: var(--accent-primary)`, `border-left: 2px solid var(--accent-primary)`, icon color `var(--accent-primary)`
- Footer (bottom of sidebar): avatar with user initials (indigo bg), user name, logout icon button — separated by `border-top: 1px solid var(--border-default)`

**Main content area:**
- `background: var(--surface-app)` (`#f1f5f9`)
- No global top bar — each page owns its header
- `overflow-y: auto` with `height: 100vh`

---

## 3. Employee Feature

### 3a. Employee Directory (`/personas/empleados`)

**Remove** the master-detail layout (list always visible alongside detail). The directory becomes a standalone page.

**`employee-shell-page`** becomes:
- Full-width page with `padding: 24px`
- Page header: title "Empleados" + "Contratar empleado" button (primary, indigo) top-right
- Search input below header
- PrimeNG DataTable with columns: Nombre (link to detail), Clave (mono text), Tipo, Convenio, Estado (Tag), Fecha alta
- Row click navigates to `/personas/empleados/:ruleSystem/:type/:number`

**Remove**: `employee-directory-list` component (replaced by DataTable in page), `employee-empty-detail-page` (no longer needed), `employee-page-header` (inline in page)

### 3b. Employee Detail (`/personas/empleados/:ruleSystem/:type/:number`)

New two-column layout replacing the current master-detail shell.

**Layout:**
```
┌─ breadcrumb ──────────────────────────────────────────┐
│  Empleados > Juan García López                         │
├─ identity panel (260px) ─┬─ section content (flex-1) ─┤
│  Avatar + name + badge   │  padding: 24px             │
│  Key/value data          │  Section card(s)            │
│  ─────────               │                             │
│  Section nav             │                             │
│  · Resumen               │                             │
│  · Contacto              │                             │
│  · Presencia             │                             │
│  · Organización          │                             │
│  · Nómina                │                             │
└──────────────────────────┴─────────────────────────────┘
```

**Identity panel** (`employee-identity-panel` — new component):
- `width: 260px`, `flex-shrink: 0`, `background: #ffffff`, `border-right: 1px solid var(--border-default)`, `padding: 20px 16px`, `height: 100%`
- Avatar: 56px circle, indigo background `#4f46e5`, white initials, `font-size: 20px`
- Name: `16px font-semibold text-primary`, below avatar
- Status badge: PrimeNG Tag (success=Activo, danger=Inactivo)
- Key data block: label/value pairs — Convenio, Tipo, Número, Fecha alta. Labels `11px text-tertiary uppercase`, values `13px text-primary`
- Divider
- Section nav: same style as AppShell nav items — active with indigo left border and `surface-accent` background

**Section content area:**
- Background `var(--surface-app)`, padding `24px`
- Each subsection is a **section card**: `background: #ffffff`, `border-radius: 8px`, `border: 1px solid var(--border-default)`, `box-shadow: var(--shadow-card)`, `padding: 16px 20px`
- Section card header: title `13px font-semibold text-secondary uppercase tracking-wide` + action buttons top-right
- Fields in a 2 or 3-column CSS grid: label `11px text-tertiary uppercase` + value `14px text-primary`
- Period tables (contract, labor classification, work center) use the restyled DataTable

**Reuse**: `employee-section-shell` component is updated in-place (no rename, to avoid import churn) — same wrapper, updated styles and tokens. Used across employee and organization sections.

**Keep intact** (logic unchanged, only styles updated via design system):
- All section form logic and services
- Period table/modal patterns
- Cost center distribution editor
- Journey timeline panel
- Payroll input section

### 3c. Hire/Rehire pages

- Multi-step form pages — keep structure, apply new tokens + PrimeNG preset automatically
- Stepper component styled with indigo active step

---

## 4. Organization Sections

### Companies, Work Centers, Catalogs, Rule Systems

Structure unchanged. Visual updates only:
- Detail panels adopt the same `section-card` pattern as employee sections
- Master-detail sidebar (if any) uses the same identity-panel style
- DataTables updated via preset
- All buttons/inputs/tags inherit new preset

No structural refactoring needed — the design system cascade handles it.

---

## 5. Payroll Sections

### Recibos (`/nomina/recibos`)

- Payslip viewer: apply new DataTable to the list, section-card to the payslip detail
- Status tags updated (new Tag preset)

### Operaciones (`/nomina/operaciones`)

- Recent page — minimal changes needed
- Action buttons get new indigo style
- Progress/status displays use new Tag colors

---

## 6. Login Page

- Full-screen background: `var(--surface-app)` (`#f1f5f9`)
- Centered card: `width: 400px`, `background: #ffffff`, `border-radius: 12px`, `box-shadow: var(--shadow-panel)`, `padding: 40px`
- Logo/app name at top
- InputText fields with new preset
- Primary button full-width, indigo
- No decorative elements, no gradient backgrounds

---

## 7. Shared UI Components to Update

| Component | Change |
|---|---|
| `employee-section-shell` | Update in-place — padding/border/shadow to new tokens, no rename |
| `period-table` | Uses new DataTable preset automatically; update header action button styles |
| `period-modal` | Uses new Dialog preset automatically; update button styles |
| `global-message-rail` | Left border `4px solid` in status color, white background, `var(--shadow-card)` |
| `employee-detail-nav` | Remove (replaced by identity panel nav) |
| `employee-detail-header` | Remove (absorbed into identity panel) |
| `master-detail-page-shell` | Remove (replaced by identity panel layout) |

---

## 8. Files Affected

### Modified
- `src/styles.scss` — full token replacement
- `src/app/core/theme/b4rrhh-primeng-theme.preset.ts` — full preset update
- `src/app/core/layout/app-shell/app-shell.component.html` — sidebar nav rewrite
- `src/app/core/layout/app-shell/app-shell.component.scss` — sidebar styles
- `src/app/features/employee/shell/pages/employee-shell-page.component.*` — layout restructure
- `src/app/features/employee/shared/ui/section/employee-section-shell.component.*` — tokens update

### Created
- `src/app/features/employee/identity/employee-identity-panel.component.ts/html/scss` — new identity panel

### Removed
- `src/app/features/employee/shell/pages/employee-empty-detail-page.component.*` — no longer needed
- `src/app/features/employee/shell/components/employee-detail-header.component.*` — absorbed into identity panel
- `src/app/features/employee/shell/components/employee-detail-nav.component.*` — absorbed into identity panel

---

## Out of Scope

- Backend changes — none required
- New features — this is restyling only
- b4rrhh_designer — keeps its dark theme (different tool, different audience)
- b4rrhh_workforce_loader — CLI, no UI
- Accessibility audit — not part of this iteration
- Animations/transitions — keep existing or remove, not adding new ones
- Mobile/responsive — keep existing behavior
