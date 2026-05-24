# Employee Management Visual Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the light-mode, PrimeNG-generic employee UI with a dark-mode premium design (slate + indigo) using custom Angular components, transforming the hobby-project look into a modern HR SaaS product.

**Architecture:** CSS custom property dark theme layered over the existing `:root` vars; six new standalone Angular components (AvatarGradient, StatusChip, DataCard, DirectoryTable, SectionRail, IdentityBar); existing stores and signals untouched — only templates and SCSS change.

**Tech Stack:** Angular 21 (standalone, signals, `input()`/`output()`), SCSS CSS custom properties, PrimeNG 18+ dark mode via `darkModeSelector`, Vitest + Angular TestBed.

---

## File Map

**Create:**
- `src/app/shared/ui/avatar-gradient/avatar-gradient.component.ts/html/scss/spec.ts`
- `src/app/shared/ui/status-chip/status-chip.component.ts/html/scss/spec.ts`
- `src/app/shared/ui/data-card/data-card.component.ts/html/scss/spec.ts`
- `src/app/features/employee/shell/components/employee-directory-table/employee-directory-table.component.ts/html/scss/spec.ts`
- `src/app/features/employee/identity/employee-section-rail/employee-section-rail.component.ts/html/scss/spec.ts`
- `src/app/features/employee/shell/components/employee-identity-bar/employee-identity-bar.component.ts/html/scss/spec.ts`

**Modify:**
- `src/index.html` — add `data-theme="dark"` to `<html>`
- `src/styles.scss` — add JetBrains Mono font + `[data-theme="dark"]` token block
- `src/app/app.config.ts` — change `darkModeSelector: false` → `'[data-theme="dark"]'`
- `src/app/features/employee/shell/pages/employee-shell-page.component.html/scss` — replace `p-table` with new custom table
- `src/app/features/employee/shell/pages/employee-shell-page.component.ts` — add import for new table component
- `src/app/features/employee/shell/pages/employee-detail-page.component.html/scss` — replace identity panel with rail + identity bar
- `src/app/features/employee/shell/pages/employee-detail-page.component.ts` — swap imports
- `src/app/features/employee/overview/pages/employee-overview-page.component.html/scss` — replace snapshot cards + timeline

**Delete:**
- `src/app/features/employee/shell/pages/employee-page.component.ts/html/scss` — dummy component with English placeholder content; not referenced in any route

---

## Task 1: Dark mode foundation

**Files:**
- Modify: `src/index.html`
- Modify: `src/styles.scss`
- Modify: `src/app/app.config.ts`

- [ ] **Step 1: Add `data-theme="dark"` to the html element**

In `src/index.html`, change line 2:
```html
<html lang="en">
```
To:
```html
<html lang="en" data-theme="dark">
```

- [ ] **Step 2: Add JetBrains Mono and dark token block to `src/styles.scss`**

Change the first line (Google Fonts import) from:
```scss
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
```
To:
```scss
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;600;700&display=swap');
```

Then append the following **at the end** of `src/styles.scss`:
```scss
/* ──────────────────────────────────────────
   Dark mode tokens  (data-theme="dark")
   ────────────────────────────────────────── */
[data-theme="dark"] {
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;

  /* Surfaces */
  --surface-app:          #0b0f1a;
  --surface-panel:        #0f172a;
  --surface-card:         #111827;
  --surface-raised:       #1e293b;
  --surface-hover:        #141f2e;

  /* Borders */
  --border-default:       #1e293b;
  --border-strong:        #334155;
  --border-accent:        rgba(99, 102, 241, 0.35);

  /* Text */
  --text-primary:         #f8fafc;
  --text-secondary:       #94a3b8;
  --text-tertiary:        #64748b;
  --text-muted:           #475569;
  --text-accent:          #a5b4fc;

  /* Accent indigo */
  --accent-primary:       #6366f1;
  --accent-primary-hover: #4f46e5;
  --accent-light:         #818cf8;
  --accent-muted:         rgba(99, 102, 241, 0.12);
  --accent-border:        rgba(99, 102, 241, 0.3);

  /* Semantic */
  --success-bg:           rgba(16, 185, 129, 0.12);
  --success-border:       rgba(16, 185, 129, 0.25);
  --success-text:         #34d399;
  --warning-bg:           rgba(245, 158, 11, 0.12);
  --warning-text:         #fbbf24;
  --error-bg:             rgba(239, 68, 68, 0.12);
  --error-text:           #f87171;
  --neutral-bg:           rgba(100, 116, 139, 0.1);
  --neutral-text:         #64748b;

  /* Shadows */
  --shadow-card:          0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:            0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg:            0 8px 24px rgba(0,0,0,0.6);

  /* Radii (keep same as light) */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}

/* Dark body background */
[data-theme="dark"] body {
  background: var(--surface-app);
  color: var(--text-primary);
}
```

- [ ] **Step 3: Enable PrimeNG dark mode selector in `src/app/app.config.ts`**

Change `darkModeSelector: false` to `darkModeSelector: '[data-theme="dark"]'`:
```typescript
providePrimeNG({
  theme: {
    preset: b4rrhhPrimeNgThemePreset,
    options: {
      darkModeSelector: '[data-theme="dark"]',
    },
  },
}),
```

- [ ] **Step 4: Verify the app loads in dark mode**

```bash
cd b4rrhh_frontend
npm start
```
Open http://localhost:4200. The app background should be dark slate (`#0b0f1a`). PrimeNG inputs and dialogs should also switch to dark. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/index.html src/styles.scss src/app/app.config.ts
git commit -m "feat(theme): add dark mode tokens and enable PrimeNG dark mode selector"
```

---

## Task 2: AvatarGradientComponent

**Files:**
- Create: `src/app/shared/ui/avatar-gradient/avatar-gradient.component.ts`
- Create: `src/app/shared/ui/avatar-gradient/avatar-gradient.component.html`
- Create: `src/app/shared/ui/avatar-gradient/avatar-gradient.component.scss`
- Create: `src/app/shared/ui/avatar-gradient/avatar-gradient.component.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/app/shared/ui/avatar-gradient/avatar-gradient.component.spec.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AvatarGradientComponent } from './avatar-gradient.component';

describe('AvatarGradientComponent', () => {
  let fixture: ComponentFixture<AvatarGradientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarGradientComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AvatarGradientComponent);
  });

  it('renders initials', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.avatar__initials'));
    expect(el.nativeElement.textContent.trim()).toBe('JG');
  });

  it('applies a gradient background from initials', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.avatar'));
    expect(el.nativeElement.style.background).toContain('gradient');
  });

  it('shows photo img when photoUrl is provided', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.componentRef.setInput('photoUrl', 'https://example.com/photo.jpg');
    fixture.detectChanges();
    const img = fixture.debugElement.query(By.css('.avatar__photo'));
    expect(img).toBeTruthy();
    expect(img.nativeElement.getAttribute('src')).toBe('https://example.com/photo.jpg');
  });

  it('hides initials when photo is present', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.componentRef.setInput('photoUrl', 'https://example.com/photo.jpg');
    fixture.detectChanges();
    const initials = fixture.debugElement.query(By.css('.avatar__initials'));
    expect(initials).toBeNull();
  });

  it('applies sm size class', () => {
    fixture.componentRef.setInput('initials', 'JG');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.avatar--sm'));
    expect(el).toBeTruthy();
  });

  it('produces same gradient for same initials', () => {
    fixture.componentRef.setInput('initials', 'AB');
    fixture.detectChanges();
    const bg1 = (fixture.debugElement.query(By.css('.avatar')).nativeElement as HTMLElement).style.background;

    const fixture2 = TestBed.createComponent(AvatarGradientComponent);
    fixture2.componentRef.setInput('initials', 'AB');
    fixture2.detectChanges();
    const bg2 = (fixture2.debugElement.query(By.css('.avatar')).nativeElement as HTMLElement).style.background;

    expect(bg1).toBe(bg2);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- --reporter=verbose avatar-gradient
```
Expected: 6 failures (component does not exist yet).

- [ ] **Step 3: Create the component**

`src/app/shared/ui/avatar-gradient/avatar-gradient.component.ts`:
```typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const GRADIENTS: [string, string][] = [
  ['#6366f1', '#818cf8'],
  ['#ec4899', '#f43f5e'],
  ['#f59e0b', '#ef4444'],
  ['#10b981', '#0ea5e9'],
  ['#8b5cf6', '#6366f1'],
  ['#f43f5e', '#fb923c'],
  ['#0ea5e9', '#6366f1'],
  ['#a78bfa', '#c084fc'],
];

function gradientForInitials(initials: string): string {
  const sum = initials.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const [from, to] = GRADIENTS[sum % GRADIENTS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

@Component({
  selector: 'app-avatar-gradient',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar-gradient.component.html',
  styleUrl: './avatar-gradient.component.scss',
})
export class AvatarGradientComponent {
  initials = input.required<string>();
  photoUrl = input<string | null>(null);
  size = input<'sm' | 'md' | 'lg'>('md');

  protected readonly gradient = computed(() => gradientForInitials(this.initials()));
}
```

`src/app/shared/ui/avatar-gradient/avatar-gradient.component.html`:
```html
<div
  class="avatar"
  [class.avatar--sm]="size() === 'sm'"
  [class.avatar--md]="size() === 'md'"
  [class.avatar--lg]="size() === 'lg'"
  [style.background]="photoUrl() ? null : gradient()"
>
  @if (photoUrl()) {
    <img class="avatar__photo" [src]="photoUrl()" alt="" aria-hidden="true" />
  } @else {
    <span class="avatar__initials">{{ initials() }}</span>
  }
</div>
```

`src/app/shared/ui/avatar-gradient/avatar-gradient.component.scss`:
```scss
.avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  &--sm  { width: 28px; height: 28px; }
  &--md  { width: 36px; height: 36px; }
  &--lg  { width: 44px; height: 44px; }
}

.avatar__initials {
  color: #ffffff;
  font-weight: 700;
  line-height: 1;
  user-select: none;

  .avatar--sm  & { font-size: 10px; }
  .avatar--md  & { font-size: 12px; }
  .avatar--lg  & { font-size: 15px; }
}

.avatar__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- --reporter=verbose avatar-gradient
```
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/avatar-gradient/
git commit -m "feat(shared): add AvatarGradientComponent with deterministic gradient"
```

---

## Task 3: StatusChipComponent

**Files:**
- Create: `src/app/shared/ui/status-chip/status-chip.component.ts/html/scss/spec.ts`

- [ ] **Step 1: Write the failing tests**

`src/app/shared/ui/status-chip/status-chip.component.spec.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StatusChipComponent } from './status-chip.component';

describe('StatusChipComponent', () => {
  let fixture: ComponentFixture<StatusChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusChipComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StatusChipComponent);
  });

  it('renders the label text', () => {
    fixture.componentRef.setInput('label', 'Activo');
    fixture.componentRef.setInput('variant', 'active');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Activo');
  });

  it('applies active variant class', () => {
    fixture.componentRef.setInput('label', 'Activo');
    fixture.componentRef.setInput('variant', 'active');
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.css('.status-chip--active'));
    expect(chip).toBeTruthy();
  });

  it('applies inactive variant class', () => {
    fixture.componentRef.setInput('label', 'Baja');
    fixture.componentRef.setInput('variant', 'inactive');
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.css('.status-chip--inactive'));
    expect(chip).toBeTruthy();
  });

  it('shows dot element', () => {
    fixture.componentRef.setInput('label', 'Activo');
    fixture.componentRef.setInput('variant', 'active');
    fixture.detectChanges();
    const dot = fixture.debugElement.query(By.css('.status-chip__dot'));
    expect(dot).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- --reporter=verbose status-chip
```
Expected: 4 failures.

- [ ] **Step 3: Create the component**

`src/app/shared/ui/status-chip/status-chip.component.ts`:
```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusChipVariant = 'active' | 'inactive' | 'warning' | 'error';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-chip.component.html',
  styleUrl: './status-chip.component.scss',
})
export class StatusChipComponent {
  label = input.required<string>();
  variant = input.required<StatusChipVariant>();
}
```

`src/app/shared/ui/status-chip/status-chip.component.html`:
```html
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
```

`src/app/shared/ui/status-chip/status-chip.component.scss`:
```scss
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

  &--active {
    background: var(--success-bg);
    color: var(--success-text);
    border-color: var(--success-border);
    .status-chip__dot { background: var(--success-text); }
  }
  &--inactive {
    background: var(--neutral-bg);
    color: var(--neutral-text);
    border-color: rgba(100, 116, 139, 0.2);
    .status-chip__dot { background: var(--neutral-text); }
  }
  &--warning {
    background: var(--warning-bg);
    color: var(--warning-text);
    border-color: rgba(245, 158, 11, 0.2);
    .status-chip__dot { background: var(--warning-text); }
  }
  &--error {
    background: var(--error-bg);
    color: var(--error-text);
    border-color: rgba(239, 68, 68, 0.2);
    .status-chip__dot { background: var(--error-text); }
  }
}

.status-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- --reporter=verbose status-chip
```
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/status-chip/
git commit -m "feat(shared): add StatusChipComponent for dark mode employee status display"
```

---

## Task 4: DataCardComponent

**Files:**
- Create: `src/app/shared/ui/data-card/data-card.component.ts/html/scss/spec.ts`

- [ ] **Step 1: Write the failing tests**

`src/app/shared/ui/data-card/data-card.component.spec.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DataCardComponent } from './data-card.component';

describe('DataCardComponent', () => {
  let fixture: ComponentFixture<DataCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DataCardComponent);
  });

  it('renders label and value', () => {
    fixture.componentRef.setInput('label', 'Contrato');
    fixture.componentRef.setInput('value', 'Indefinido');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Contrato');
    expect(fixture.nativeElement.textContent).toContain('Indefinido');
  });

  it('renders sub when provided', () => {
    fixture.componentRef.setInput('label', 'Jornada');
    fixture.componentRef.setInput('value', 'Completa');
    fixture.componentRef.setInput('sub', '40h semanales');
    fixture.detectChanges();
    const sub = fixture.debugElement.query(By.css('.data-card__sub'));
    expect(sub.nativeElement.textContent.trim()).toBe('40h semanales');
  });

  it('does not render sub element when sub is null', () => {
    fixture.componentRef.setInput('label', 'Jornada');
    fixture.componentRef.setInput('value', 'Completa');
    fixture.detectChanges();
    const sub = fixture.debugElement.query(By.css('.data-card__sub'));
    expect(sub).toBeNull();
  });

  it('applies accent class when accent input is true', () => {
    fixture.componentRef.setInput('label', 'Nómina');
    fixture.componentRef.setInput('value', 'Abr 2026');
    fixture.componentRef.setInput('accent', true);
    fixture.detectChanges();
    const card = fixture.debugElement.query(By.css('.data-card--accent'));
    expect(card).toBeTruthy();
  });

  it('shows shimmer when loading is true', () => {
    fixture.componentRef.setInput('label', 'Contrato');
    fixture.componentRef.setInput('value', '');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const shimmer = fixture.debugElement.query(By.css('.data-card__shimmer'));
    expect(shimmer).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- --reporter=verbose data-card
```
Expected: 5 failures.

- [ ] **Step 3: Create the component**

`src/app/shared/ui/data-card/data-card.component.ts`:
```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-data-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-card.component.html',
  styleUrl: './data-card.component.scss',
})
export class DataCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  sub = input<string | null>(null);
  link = input<string | null>(null);
  accent = input<boolean>(false);
  loading = input<boolean>(false);
}
```

`src/app/shared/ui/data-card/data-card.component.html`:
```html
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
```

`src/app/shared/ui/data-card/data-card.component.scss`:
```scss
.data-card {
  background: var(--surface-card, #111827);
  border: 1px solid var(--border-default, #1e293b);
  border-radius: var(--radius-md, 10px);
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:hover {
    border-color: var(--border-strong, #334155);
    background: var(--surface-hover, #141f2e);
  }

  &--accent {
    border-color: var(--accent-border, rgba(99, 102, 241, 0.3));
    background: var(--accent-muted, rgba(99, 102, 241, 0.07));

    &:hover {
      border-color: rgba(99, 102, 241, 0.5);
    }

    .data-card__label { color: var(--accent-primary, #6366f1); }
    .data-card__value { color: var(--text-accent, #a5b4fc); }
  }
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
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- --reporter=verbose data-card
```
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/data-card/
git commit -m "feat(shared): add DataCardComponent with shimmer loading state"
```

---

## Task 5: EmployeeDirectoryTableComponent

**Files:**
- Create: `src/app/features/employee/shell/components/employee-directory-table/employee-directory-table.component.ts/html/scss/spec.ts`

- [ ] **Step 1: Write the failing tests**

`src/app/features/employee/shell/components/employee-directory-table/employee-directory-table.component.spec.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EmployeeDirectoryTableComponent } from './employee-directory-table.component';
import { EmployeeListItemModel } from '../../../models/employee-list-item.model';

const MOCK_ITEMS: EmployeeListItemModel[] = [
  { ruleSystemCode: 'ESP', employeeTypeCode: 'INTERNAL', employeeNumber: '001', displayName: 'García Ruiz, Juan', workCenter: 'Madrid', statusLabel: 'Alta' },
  { ruleSystemCode: 'ESP', employeeTypeCode: 'INTERNAL', employeeNumber: '002', displayName: 'Martínez López, Ana', workCenter: 'Madrid', statusLabel: 'Baja' },
];

describe('EmployeeDirectoryTableComponent', () => {
  let fixture: ComponentFixture<EmployeeDirectoryTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDirectoryTableComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EmployeeDirectoryTableComponent);
  });

  it('renders one row per item', () => {
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('.dir-table__row'));
    expect(rows).toHaveLength(2);
  });

  it('shows displayName in each row', () => {
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('García Ruiz, Juan');
  });

  it('shows matricula in mono format', () => {
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.detectChanges();
    const matriculas = fixture.debugElement.queryAll(By.css('.dir-table__matricula'));
    expect(matriculas[0].nativeElement.textContent).toContain('ESP');
    expect(matriculas[0].nativeElement.textContent).toContain('001');
  });

  it('emits employeeClicked when row is clicked', () => {
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.detectChanges();
    let emitted: EmployeeListItemModel | null = null;
    fixture.componentInstance.employeeClicked.subscribe((e) => (emitted = e));
    const row = fixture.debugElement.query(By.css('.dir-table__row'));
    row.triggerEventHandler('click', null);
    expect(emitted).toEqual(MOCK_ITEMS[0]);
  });

  it('shows empty state when items is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    const empty = fixture.debugElement.query(By.css('.dir-table__empty'));
    expect(empty).toBeTruthy();
  });

  it('shows loading skeleton rows when loading is true', () => {
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const skeletons = fixture.debugElement.queryAll(By.css('.dir-table__skeleton-row'));
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- --reporter=verbose employee-directory-table
```
Expected: 6 failures.

- [ ] **Step 3: Create the component**

`src/app/features/employee/shell/components/employee-directory-table/employee-directory-table.component.ts`:
```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AvatarGradientComponent } from '../../../../../shared/ui/avatar-gradient/avatar-gradient.component';
import { StatusChipComponent, StatusChipVariant } from '../../../../../shared/ui/status-chip/status-chip.component';
import { EmployeeListItemModel } from '../../../models/employee-list-item.model';

function initialsFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
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
  templateUrl: './employee-directory-table.component.html',
  styleUrl: './employee-directory-table.component.scss',
})
export class EmployeeDirectoryTableComponent {
  items = input.required<EmployeeListItemModel[]>();
  loading = input<boolean>(false);
  employeeClicked = output<EmployeeListItemModel>();

  protected readonly skeletonRows = Array.from({ length: 6 });

  protected getInitials = initialsFromDisplayName;
  protected getStatusVariant = statusVariant;
  protected getStatusLabel = statusDisplayLabel;
}
```

`src/app/features/employee/shell/components/employee-directory-table/employee-directory-table.component.html`:
```html
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
              <app-avatar-gradient
                [initials]="getInitials(employee.displayName)"
                size="md"
              />
            </td>
            <td class="dir-table__td">
              <div class="dir-table__name">{{ employee.displayName }}</div>
            </td>
            <td class="dir-table__td">
              <span class="dir-table__work-center">{{ employee.workCenter }}</span>
            </td>
            <td class="dir-table__td">
              <span class="dir-table__matricula">
                {{ employee.ruleSystemCode }} · {{ employee.employeeNumber }}
              </span>
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
```

`src/app/features/employee/shell/components/employee-directory-table/employee-directory-table.component.scss`:
```scss
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

/* Head */
.dir-table__head-row {
  border-bottom: 1px solid var(--border-default);
}

.dir-table__th {
  padding: 10px 16px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  white-space: nowrap;

  &--avatar { width: 52px; padding-right: 0; }
}

/* Rows */
.dir-table__row {
  border-bottom: 1px solid var(--surface-card, #111827);
  cursor: pointer;
  transition: background 0.1s;

  &:last-child { border-bottom: none; }

  &:hover { background: var(--surface-hover); }

  &--inactive {
    opacity: 0.55;
    &:hover { opacity: 0.75; }
  }
}

.dir-table__td {
  padding: 11px 16px;
  vertical-align: middle;

  &--avatar { width: 52px; padding-right: 0; }
  &--actions { width: 40px; text-align: right; }
}

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

.dir-table__arrow {
  font-size: 14px;
  color: var(--border-strong);
}

/* Empty */
.dir-table__empty {
  padding: 36px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

/* Skeleton loading */
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

  &--avatar { width: 36px; height: 36px; border-radius: 50%; }
  &--name   { width: 160px; height: 14px; }
  &--sm     { width: 80px; height: 12px; }
  &--chip   { width: 60px; height: 22px; border-radius: 20px; }
}

@keyframes dir-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- --reporter=verbose employee-directory-table
```
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/employee/shell/components/employee-directory-table/
git commit -m "feat(employee): add EmployeeDirectoryTableComponent replacing PrimeNG p-table"
```

---

## Task 6: Refactor employee directory page

**Files:**
- Modify: `src/app/features/employee/shell/pages/employee-shell-page.component.ts`
- Modify: `src/app/features/employee/shell/pages/employee-shell-page.component.html`
- Modify: `src/app/features/employee/shell/pages/employee-shell-page.component.scss`

- [ ] **Step 1: Add new component import to the TS class**

In `employee-shell-page.component.ts`, add the import:
```typescript
import { EmployeeDirectoryTableComponent } from '../components/employee-directory-table/employee-directory-table.component';
```

Replace the `imports` array to include the new component and remove PrimeNG table modules:
```typescript
imports: [
  UiButtonComponent,
  EmployeeDirectoryTableComponent,
],
```

Remove these imports from the file (no longer needed):
```typescript
// DELETE these lines:
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { UiTagComponent } from '../../../../shared/ui/tag/ui-tag.component';
```

Also add a `filterStatus` signal for tab chips:
```typescript
protected readonly filterStatus = signal<'all' | 'active' | 'inactive'>('all');

protected readonly filteredTableData = computed(() => {
  const all = this.tableData();
  const f = this.filterStatus();
  if (f === 'all') return all;
  if (f === 'active') return all.filter(
    (e) => e.statusLabel.toLowerCase().includes('active') || e.statusLabel.toLowerCase().includes('alta')
  );
  return all.filter(
    (e) => !e.statusLabel.toLowerCase().includes('active') && !e.statusLabel.toLowerCase().includes('alta')
  );
});
```

- [ ] **Step 2: Replace the template**

Replace the entire content of `employee-shell-page.component.html` with:
```html
<div class="employee-directory">

  <header class="employee-directory__header">
    <div>
      <h1 class="employee-directory__title">{{ texts.masterTitle }}</h1>
      <p class="employee-directory__subtitle">{{ filteredTableData().length }} personas</p>
    </div>
    <app-ui-button
      [label]="texts.hireEmployeeTitle"
      icon="pi pi-plus"
      (pressed)="onHireClick()"
    />
  </header>

  <div class="employee-directory__toolbar">
    <div class="employee-directory__search">
      <span class="employee-directory__search-icon">🔍</span>
      <input
        class="employee-directory__search-input"
        type="text"
        [attr.aria-label]="texts.searchLabel"
        [placeholder]="texts.searchPlaceholder"
        [value]="searchValue()"
        (input)="updateSearch($any($event.target).value)"
      />
    </div>

    <div class="employee-directory__filters">
      <button
        class="employee-directory__filter-chip"
        [class.employee-directory__filter-chip--active]="filterStatus() === 'all'"
        (click)="filterStatus.set('all')"
      >
        Todos
        <span class="employee-directory__filter-count">{{ tableData().length }}</span>
      </button>
      <button
        class="employee-directory__filter-chip"
        [class.employee-directory__filter-chip--active]="filterStatus() === 'active'"
        (click)="filterStatus.set('active')"
      >
        Activos
      </button>
      <button
        class="employee-directory__filter-chip"
        [class.employee-directory__filter-chip--active]="filterStatus() === 'inactive'"
        (click)="filterStatus.set('inactive')"
      >
        Bajas
      </button>
    </div>
  </div>

  @if (error()) {
    <p class="employee-directory__error">{{ texts.directoryLoadFailedMessage }}</p>
  }

  <app-employee-directory-table
    [items]="filteredTableData()"
    [loading]="loading()"
    (employeeClicked)="openEmployee($event)"
  />

</div>
```

- [ ] **Step 3: Replace the SCSS**

Replace the entire content of `employee-shell-page.component.scss` with:
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.employee-directory__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.employee-directory__subtitle {
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

/* Toolbar */
.employee-directory__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.employee-directory__search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 8px 12px;
  flex: 1;
  max-width: 340px;

  &:focus-within {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--accent-muted);
  }
}

.employee-directory__search-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.employee-directory__search-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  flex: 1;

  &::placeholder { color: var(--text-muted); }
}

/* Filter chips */
.employee-directory__filters {
  display: flex;
  gap: 6px;
}

.employee-directory__filter-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  color: var(--text-tertiary);
  font-family: inherit;
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: var(--surface-card);
    color: var(--text-secondary);
  }

  &--active {
    background: var(--accent-muted);
    border-color: var(--accent-border);
    color: var(--text-accent);
  }
}

.employee-directory__filter-count {
  background: var(--accent-primary);
  color: white;
  border-radius: 10px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  text-align: center;
}

.employee-directory__error {
  color: var(--error-text);
  font-size: 13px;
  padding: 8px 12px;
  background: var(--error-bg);
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 4: Run all tests and verify the page visually**

```bash
npm run test
```
Expected: all existing tests pass (the spec file for shell-page may need updating if it queries PrimeNG selectors; if so, update those selectors to `.dir-table__row`).

```bash
npm start
```
Navigate to `/personas/empleados` — verify dark table renders with filter chips.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/employee/shell/pages/employee-shell-page.component.ts
git add src/app/features/employee/shell/pages/employee-shell-page.component.html
git add src/app/features/employee/shell/pages/employee-shell-page.component.scss
git commit -m "feat(employee): replace PrimeNG table with dark-mode directory table"
```

---

## Task 7: EmployeeSectionRailComponent

**Files:**
- Create: `src/app/features/employee/identity/employee-section-rail/employee-section-rail.component.ts/html/scss/spec.ts`

- [ ] **Step 1: Write the failing tests**

`employee-section-rail.component.spec.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { EmployeeSectionRailComponent } from './employee-section-rail.component';

describe('EmployeeSectionRailComponent', () => {
  let fixture: ComponentFixture<EmployeeSectionRailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeSectionRailComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(EmployeeSectionRailComponent);
    fixture.componentRef.setInput('initials', 'JG');
    fixture.componentRef.setInput('routeBase', '/personas/empleados/ESP/INTERNAL/001');
  });

  it('renders a nav item for each section', () => {
    fixture.detectChanges();
    const items = fixture.debugElement.queryAll(By.css('.section-rail__item'));
    expect(items.length).toBe(5); // overview, contact, presence, organization, payroll
  });

  it('renders mini avatar with initials', () => {
    fixture.detectChanges();
    const avatar = fixture.debugElement.query(By.css('.section-rail__avatar'));
    expect(avatar.nativeElement.textContent.trim()).toBe('JG');
  });

  it('each nav item has a title attribute for tooltip', () => {
    fixture.detectChanges();
    const items = fixture.debugElement.queryAll(By.css('.section-rail__item'));
    items.forEach((item) => {
      expect(item.nativeElement.getAttribute('title')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- --reporter=verbose employee-section-rail
```
Expected: 3 failures.

- [ ] **Step 3: Create the component**

`src/app/features/employee/identity/employee-section-rail/employee-section-rail.component.ts`:
```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

const SECTION_NAV_ITEMS = [
  { section: 'overview',      icon: 'pi pi-th-large',    label: 'Resumen' },
  { section: 'contact',       icon: 'pi pi-phone',       label: 'Contacto' },
  { section: 'presence',      icon: 'pi pi-calendar',    label: 'Presencia' },
  { section: 'organization',  icon: 'pi pi-building',    label: 'Organización' },
  { section: 'payroll',       icon: 'pi pi-money-bill',  label: 'Nómina' },
] as const;

@Component({
  selector: 'app-employee-section-rail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './employee-section-rail.component.html',
  styleUrl: './employee-section-rail.component.scss',
})
export class EmployeeSectionRailComponent {
  /** Two-letter initials for the mini avatar (e.g. "JG") */
  initials = input.required<string>();
  /** Base route path for this employee, e.g. "/personas/empleados/ESP/INTERNAL/001" */
  routeBase = input.required<string>();

  protected readonly navItems = SECTION_NAV_ITEMS;
}
```

`src/app/features/employee/identity/employee-section-rail/employee-section-rail.component.html`:
```html
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
```

**Note:** Add `NgClass` to imports in the TS file:
```typescript
import { NgClass } from '@angular/common';
// ...
imports: [RouterLink, RouterLinkActive, NgClass],
```

`src/app/features/employee/identity/employee-section-rail/employee-section-rail.component.scss`:
```scss
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
  box-shadow: 0 0 0 2px var(--surface-app), 0 0 0 3px var(--accent-border);
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
  transition: background 0.12s, color 0.12s;
  position: relative;

  &:hover {
    background: var(--surface-raised);
    color: var(--text-secondary);
  }

  &--active {
    background: var(--accent-muted);
    color: var(--accent-light);

    &::before {
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
  }
}

.section-rail__icon {
  font-size: 15px;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- --reporter=verbose employee-section-rail
```
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/employee/identity/employee-section-rail/
git commit -m "feat(employee): add EmployeeSectionRailComponent for dark mode icon nav"
```

---

## Task 8: EmployeeIdentityBarComponent

**Files:**
- Create: `src/app/features/employee/shell/components/employee-identity-bar/employee-identity-bar.component.ts/html/scss/spec.ts`

- [ ] **Step 1: Write the failing tests**

`employee-identity-bar.component.spec.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EmployeeIdentityBarComponent } from './employee-identity-bar.component';
import { EmployeeDetailModel } from '../../../models/employee-detail.model';

const MOCK_EMPLOYEE: EmployeeDetailModel = {
  id: 1,
  ruleSystemCode: 'ESP',
  employeeTypeCode: 'INTERNAL',
  employeeNumber: '001',
  firstName: 'Juan',
  lastName1: 'García',
  lastName2: 'Ruiz',
  preferredName: null,
  displayName: 'García Ruiz, Juan',
  statusLabel: 'Alta',
  workCenter: 'Madrid',
  photoUrl: null,
};

describe('EmployeeIdentityBarComponent', () => {
  let fixture: ComponentFixture<EmployeeIdentityBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeIdentityBarComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EmployeeIdentityBarComponent);
  });

  it('shows employee displayName', () => {
    fixture.componentRef.setInput('employee', MOCK_EMPLOYEE);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('García Ruiz, Juan');
  });

  it('shows matricula chip with ruleSystemCode and employeeNumber', () => {
    fixture.componentRef.setInput('employee', MOCK_EMPLOYEE);
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.css('.identity-bar__matricula'));
    expect(chip.nativeElement.textContent).toContain('ESP');
    expect(chip.nativeElement.textContent).toContain('001');
  });

  it('renders nothing when employee is null', () => {
    fixture.componentRef.setInput('employee', null);
    fixture.detectChanges();
    const bar = fixture.debugElement.query(By.css('.identity-bar'));
    expect(bar).toBeNull();
  });

  it('renders avatar with initials derived from firstName and lastName1', () => {
    fixture.componentRef.setInput('employee', MOCK_EMPLOYEE);
    fixture.detectChanges();
    // AvatarGradientComponent renders .avatar__initials
    expect(fixture.nativeElement.textContent).toContain('JG');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- --reporter=verbose employee-identity-bar
```
Expected: 4 failures.

- [ ] **Step 3: Create the component**

`src/app/features/employee/shell/components/employee-identity-bar/employee-identity-bar.component.ts`:
```typescript
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
  templateUrl: './employee-identity-bar.component.html',
  styleUrl: './employee-identity-bar.component.scss',
})
export class EmployeeIdentityBarComponent {
  employee = input.required<EmployeeDetailModel | null>();

  protected readonly initials = computed(() => {
    const e = this.employee();
    if (!e) return '';
    return (e.firstName[0] + e.lastName1[0]).toUpperCase();
  });

  protected readonly statusVariant = computed(() => {
    const e = this.employee();
    return e ? statusVariant(e.statusLabel) : 'inactive';
  });

  protected readonly statusLabel = computed(() => {
    const e = this.employee();
    return e ? statusDisplayLabel(e.statusLabel) : '';
  });
}
```

`src/app/features/employee/shell/components/employee-identity-bar/employee-identity-bar.component.html`:
```html
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
      <app-status-chip [label]="statusLabel()" [variant]="statusVariant()" />
      <span class="identity-bar__matricula">{{ emp.ruleSystemCode }} · {{ emp.employeeNumber }}</span>
    </div>
  </div>
}
```

`src/app/features/employee/shell/components/employee-identity-bar/employee-identity-bar.component.scss`:
```scss
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- --reporter=verbose employee-identity-bar
```
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/employee/shell/components/employee-identity-bar/
git commit -m "feat(employee): add EmployeeIdentityBarComponent as sticky employee identity header"
```

---

## Task 9: Refactor employee detail page layout

**Files:**
- Modify: `src/app/features/employee/shell/pages/employee-detail-page.component.ts`
- Modify: `src/app/features/employee/shell/pages/employee-detail-page.component.html`
- Modify: `src/app/features/employee/shell/pages/employee-detail-page.component.scss`

- [ ] **Step 1: Update imports in `employee-detail-page.component.ts`**

Add new component imports and remove `EmployeeIdentityPanelComponent`:
```typescript
// ADD these imports:
import { EmployeeSectionRailComponent } from '../../identity/employee-section-rail/employee-section-rail.component';
import { EmployeeIdentityBarComponent } from '../components/employee-identity-bar/employee-identity-bar.component';
import { buildEmployeeDetailRouteCommands } from '../../routing/employee-route-builder.util';

// In the @Component imports array, REPLACE EmployeeIdentityPanelComponent with:
imports: [
  RouterLink,
  RouterOutlet,
  EmployeeSectionRailComponent,       // NEW — replaces EmployeeIdentityPanelComponent
  EmployeeIdentityBarComponent,        // NEW
  EmployeeJourneyTimelineComponent,
  EmployeeTerminatePanelComponent,
  GlobalMessageRailComponent,
  EmployeeDetailHeaderComponent,
],
```

Add a computed signal for the route base path (used by the section rail):
```typescript
protected readonly employeeRouteBase = computed(() => {
  const key = this.activeEmployeeKey();
  if (!key) return '';
  return buildEmployeeDetailRouteCommands(key, 'overview').slice(0, -1).join('/');
});
```

**Note:** `buildEmployeeDetailRouteCommands(key, 'overview')` returns `['/personas/empleados', ruleSystemCode, employeeTypeCode, employeeNumber, 'overview']`. Slicing off the last element gives the base path. The join produces `/personas/empleados/ESP/INTERNAL/001`.

- [ ] **Step 2: Replace the template**

Replace the entire content of `employee-detail-page.component.html`:
```html
<div class="employee-detail">

  <!-- Breadcrumb -->
  <nav class="employee-detail__breadcrumb" aria-label="Breadcrumb">
    <a class="employee-detail__breadcrumb-link" routerLink="/personas/empleados">{{ texts.masterTitle }}</a>
    <span class="employee-detail__breadcrumb-sep" aria-hidden="true">›</span>
    <span class="employee-detail__breadcrumb-current">{{ selectedEmployeeDetail()?.displayName ?? '...' }}</span>
  </nav>

  @if (activeEmployeeKey(); as key) {
    <div class="employee-detail__body">

      <!-- Section rail (left, 48px) -->
      @if (selectedEmployeeDetail(); as emp) {
        <app-employee-section-rail
          [initials]="(emp.firstName[0] + emp.lastName1[0]).toUpperCase()"
          [routeBase]="employeeRouteBase()"
        />
      }

      <!-- Content area -->
      <div class="employee-detail__content">

        <!-- Hidden identity editor drawer (kept for edit flow) -->
        @if (selectedEmployeeDetail(); as employee) {
          <app-employee-detail-header
            class="employee-detail__identity-editor"
            [employee]="employee"
            [editorOnly]="true"
            [openEditorRequestId]="openIdentityEditorRequestId()"
            [updating]="updatingIdentity()"
            [updateError]="updateIdentityError()"
            [updateSuccess]="updateIdentitySuccess()"
            (updateRequested)="submitIdentityUpdate($event)"
            (editInteractionStarted)="clearIdentityFeedback()"
          />
        }

        <!-- Identity bar (sticky) -->
        <app-employee-identity-bar
          [employee]="selectedEmployeeDetail()"
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

        <!-- Section content + timeline -->
        <div class="employee-detail__sections-timeline">
          <section class="employee-detail__section-area">
            @if (!isRehireWorkflow()) {
              @if (loadingDetail()) {
                <p class="employee-detail__loading">{{ texts.detailLoadingMessage }}</p>
              }
            }
            <router-outlet />
          </section>

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

- [ ] **Step 3: Replace the SCSS**

Replace the entire content of `employee-detail-page.component.scss`:
```scss
:host {
  display: block;
  min-height: 100dvh;
  background: var(--surface-app);
}

.employee-detail {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

/* Breadcrumb */
.employee-detail__breadcrumb {
  padding: 10px 20px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.employee-detail__breadcrumb-link {
  color: var(--accent-primary);
  text-decoration: none;
  &:hover { color: var(--accent-light); }
}

.employee-detail__breadcrumb-sep { color: var(--border-strong); }

/* Body: rail + content */
.employee-detail__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* Content column */
.employee-detail__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 10px 20px 0;
  gap: 12px;
}

/* Hidden identity editor */
.employee-detail__identity-editor {
  display: none;
}

/* Global messages */
.employee-detail__messages { flex-shrink: 0; }

/* Sections + timeline grid */
.employee-detail__sections-timeline {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
  overflow: hidden;
}

.employee-detail__section-area {
  overflow-y: auto;
  padding-bottom: 24px;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
}

.employee-detail__timeline-area {
  overflow-y: auto;
  padding-bottom: 24px;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
}

.employee-detail__loading {
  font-size: 13px;
  color: var(--text-muted);
  padding: 16px;
}

.employee-detail__section-highlight {
  animation: section-highlight 1.8s ease forwards;
}

@keyframes section-highlight {
  0%   { outline: 2px solid var(--accent-primary); outline-offset: 4px; }
  80%  { outline: 2px solid var(--accent-primary); outline-offset: 4px; }
  100% { outline: none; }
}
```

- [ ] **Step 4: Verify in browser**

```bash
npm start
```
Navigate to an employee detail page. Verify: 48px rail on left with icons, sticky identity bar at top, content fills the rest. Check that the breadcrumb, section nav, and router outlet all function correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/employee/shell/pages/employee-detail-page.component.ts
git add src/app/features/employee/shell/pages/employee-detail-page.component.html
git add src/app/features/employee/shell/pages/employee-detail-page.component.scss
git commit -m "feat(employee): replace identity panel with section rail + sticky identity bar"
```

---

## Task 10: Refactor employee overview page

**Files:**
- Modify: `src/app/features/employee/overview/pages/employee-overview-page.component.html`
- Modify: `src/app/features/employee/overview/pages/employee-overview-page.component.scss`
- Modify: `src/app/features/employee/overview/pages/employee-overview-page.component.ts`

- [ ] **Step 1: Add shared component imports to the TS class**

Open `employee-overview-page.component.ts`. In the `imports` array, add:
```typescript
import { DataCardComponent } from '../../../../../shared/ui/data-card/data-card.component';
// In @Component imports:
DataCardComponent,
```

- [ ] **Step 2: Replace the template**

Replace the entire `employee-overview-page.component.html`:
```html
<div class="overview">

  <!-- Action bar -->
  <div class="overview__actions">
    <button class="overview__btn-primary" (click)="onCalculatePayroll()">
      Calcular nómina
    </button>
    <button class="overview__btn-secondary" (click)="onActionsMenu($event)">
      Acciones ▾
    </button>
  </div>

  <div class="overview__layout">

    <!-- Main column -->
    <div class="overview__main">

      <!-- Summary cards -->
      <section class="overview__section">
        <h2 class="overview__section-title">Resumen</h2>
        <div class="overview__cards-grid">
          <app-data-card
            label="Contrato"
            [value]="contractCard().typeName ?? '—'"
            [sub]="contractCard().startDate"
            [loading]="contractCard().loading"
          />
          <app-data-card
            label="Jornada"
            [value]="workingTimeCard().percentage ?? '—'"
            [sub]="workingTimeCard().weeklyHours"
            [loading]="workingTimeCard().loading"
          />
          <app-data-card
            label="Categoría"
            [value]="classificationCard().categoryName ?? '—'"
            [sub]="classificationCard().agreementName"
            [loading]="classificationCard().loading"
          />
          <app-data-card
            label="Centro de trabajo"
            [value]="workCenterCard().name ?? '—'"
            [sub]="workCenterCard().code"
            [loading]="workCenterCard().loading"
          />
          <app-data-card
            label="Centro de coste"
            [value]="costCenterCard().name ?? '—'"
            [sub]="costCenterCard().code"
            [loading]="costCenterCard().loading"
          />
          <app-data-card
            label="Última nómina"
            [value]="taxCard().territory ?? '—'"
            [sub]="taxCard().familySituation"
            [loading]="taxCard().loading"
            [accent]="true"
          />
        </div>
      </section>

      <!-- Contact quick view -->
      <section class="overview__section">
        <h2 class="overview__section-title">
          Contacto
          <a class="overview__section-link" (click)="navigateTo('contact')">Ver todo →</a>
        </h2>
        <div class="overview__contact-card">
          <div class="overview__contact-count">
            {{ contactCard().count }} contacto{{ contactCard().count !== 1 ? 's' : '' }}
            @if (contactCard().addressCount > 0) {
              · {{ contactCard().addressCount }} dirección{{ contactCard().addressCount !== 1 ? 'es' : '' }}
            }
          </div>
        </div>
      </section>

    </div>

    <!-- Aside: stats + timeline -->
    <aside class="overview__aside">

      <!-- Seniority -->
      @if (hireDate(); as hire) {
        <div class="overview__stats-card">
          <h3 class="overview__stats-title">Antigüedad</h3>
          <div class="overview__stats-grid">
            <div class="overview__stat">
              <div class="overview__stat-value">{{ seniorityYears() }}</div>
              <div class="overview__stat-label">Años</div>
            </div>
            <div class="overview__stat">
              <div class="overview__stat-value">{{ seniorityMonths() }}</div>
              <div class="overview__stat-label">Meses</div>
            </div>
          </div>
        </div>
      }

      <!-- Journey timeline (vertical) -->
      <div class="overview__timeline-card">
        <h3 class="overview__timeline-title">Historial</h3>
        @if (loadingJourney()) {
          <div class="overview__timeline-loading">Cargando...</div>
        } @else {
          <div class="overview__timeline-events">
            @for (event of journeyEvents(); track event.date) {
              <div class="overview__timeline-event">
                <div class="overview__timeline-dot" [ngClass]="'overview__timeline-dot--' + event.type"></div>
                <div class="overview__timeline-body">
                  <div class="overview__timeline-label">{{ event.label }}</div>
                  <div class="overview__timeline-date">{{ event.date }}</div>
                </div>
              </div>
            }
          </div>
        }
      </div>

    </aside>

  </div>

</div>
```

- [ ] **Step 3: Add computed signals to the TS class**

Open `employee-overview-page.component.ts`. Add these computed signals:

```typescript
// Add these imports at the top:
import { NgClass } from '@angular/common';

// Add NgClass to the @Component imports array.

// Add these computed signals to the class body
// (after existing computed signals, before methods):

protected readonly seniorityYears = computed(() => {
  const hire = this.hireDate();
  if (!hire) return 0;
  const ms = Date.now() - new Date(hire).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
});

protected readonly seniorityMonths = computed(() => {
  const hire = this.hireDate();
  if (!hire) return 0;
  const ms = Date.now() - new Date(hire).getTime();
  return Math.floor((ms / (1000 * 60 * 60 * 24 * 30.44)) % 12);
});

protected readonly loadingJourney = computed(() => this.journeyStore.loading());

protected readonly journeyEvents = computed(() => {
  const j = this.journey();
  if (!j) return [];
  return j.events.slice(0, 5).map((e) => ({
    label: e.label,
    date: e.date,
    type: e.type ?? 'default',
  }));
});
```

**Note:** The `journey()` signal provides `journey.events[]` based on the `EmployeeJourneyModel`. Check the actual model shape in `employee-journey.store.ts` and adjust `e.label`, `e.date`, and `e.type` field names accordingly during implementation.

- [ ] **Step 4: Replace the SCSS**

Replace the entire `employee-overview-page.component.scss`:
```scss
.overview {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Action bar */
.overview__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.overview__btn-primary {
  background: var(--accent-primary);
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;

  &:hover { background: var(--accent-primary-hover); }
}

.overview__btn-secondary {
  background: var(--surface-raised);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;

  &:hover { background: var(--surface-card); }
}

/* Two-column layout */
.overview__layout {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
  align-items: start;
}

/* Main */
.overview__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Section */
.overview__section {}

.overview__section-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.overview__section-link {
  font-size: 11px;
  color: var(--accent-primary);
  font-weight: 500;
  cursor: pointer;
  text-transform: none;
  letter-spacing: 0;
  &:hover { color: var(--accent-light); }
}

/* Cards grid */
.overview__cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

/* Contact card */
.overview__contact-card {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.overview__contact-count {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Aside */
.overview__aside {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Stats card */
.overview__stats-card {
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.overview__stats-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 10px;
}

.overview__stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.overview__stat {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 10px 12px;
  text-align: center;
}

.overview__stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent-light);
}

.overview__stat-label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
}

/* Timeline card */
.overview__timeline-card {
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.overview__timeline-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 14px;
}

.overview__timeline-loading {
  font-size: 12px;
  color: var(--text-muted);
}

/* Vertical timeline events */
.overview__timeline-events {
  display: flex;
  flex-direction: column;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 4px;
    bottom: 4px;
    width: 1px;
    background: var(--border-default);
  }
}

.overview__timeline-event {
  display: flex;
  gap: 12px;
  padding-bottom: 14px;
  position: relative;
  z-index: 1;

  &:last-child { padding-bottom: 0; }
}

.overview__timeline-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid var(--surface-panel);

  &--hire,
  &--alta       { background: var(--success-text); }
  &--contrato,
  &--contract   { background: var(--accent-primary); }
  &--salario,
  &--salary     { background: var(--warning-text); }
  &--default    { background: var(--surface-raised); border-color: var(--border-strong); }
}

.overview__timeline-body { flex: 1; }

.overview__timeline-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.overview__timeline-date {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}
```

- [ ] **Step 5: Run all tests**

```bash
npm run test
```
Expected: all passing. If the `employee-overview-page.spec.ts` references old snapshot card selectors, update those selectors to the new ones (`.overview__cards-grid`, `app-data-card`).

- [ ] **Step 6: Verify in browser**

```bash
npm start
```
Navigate to `/personas/empleados/:key/overview`. Verify: 3×2 data cards with shimmer loading, antigüedad stats on the right, vertical timeline below. Check "Calcular nómina" button is present and functional.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/employee/overview/pages/employee-overview-page.component.ts
git add src/app/features/employee/overview/pages/employee-overview-page.component.html
git add src/app/features/employee/overview/pages/employee-overview-page.component.scss
git commit -m "feat(employee): rebuild overview page with dark data cards and vertical timeline"
```

---

## Task 11: Cleanup

**Files:**
- Delete: `src/app/features/employee/shell/pages/employee-page.component.ts/html/scss`
- Verify: `employee-identity-panel.component` is no longer imported

- [ ] **Step 1: Verify `employee-page.component` is not used in any route**

```bash
grep -r "employee-page.component" src/app/features/employee/
```
Expected: only its own files appear (not imported from `employee.routes.ts` or any other component). If it appears in routes, do NOT delete — skip this step and leave a comment.

- [ ] **Step 2: Delete the dummy component files**

```bash
Remove-Item "src/app/features/employee/shell/pages/employee-page.component.ts"
Remove-Item "src/app/features/employee/shell/pages/employee-page.component.html"
Remove-Item "src/app/features/employee/shell/pages/employee-page.component.scss"
```

- [ ] **Step 3: Verify `EmployeeIdentityPanelComponent` is no longer imported**

```bash
grep -r "EmployeeIdentityPanelComponent" src/app/features/employee/
```
Expected: only `employee-identity-panel.component.ts` itself (no imports from other files). If it still appears in `employee-detail-page.component.ts`, it was missed in Task 9 — remove it now.

- [ ] **Step 4: Run full test suite**

```bash
npm run test
```
Expected: all passing, no references to deleted component.

- [ ] **Step 5: Build to confirm no TypeScript errors**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore(employee): remove unused employee-page dummy component and clean up old identity panel imports"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Dark mode tokens — Task 1
- ✅ JetBrains Mono font — Task 1
- ✅ AvatarGradientComponent — Task 2
- ✅ StatusChipComponent — Task 3
- ✅ DataCardComponent — Task 4
- ✅ EmployeeDirectoryTableComponent (custom table replacing p-table) — Task 5
- ✅ Employee directory page refactor (chips, search dark) — Task 6
- ✅ EmployeeSectionRailComponent (48px icon rail) — Task 7
- ✅ EmployeeIdentityBarComponent (sticky bar) — Task 8
- ✅ Employee detail page layout (rail + identity bar) — Task 9
- ✅ Employee overview page (data cards + vertical timeline + seniority stats) — Task 10
- ✅ Cleanup dummy component — Task 11

**Placeholder scan:** No TBD/TODO markers. Task 10 Step 3 includes a note about verifying journey model shape — flagged explicitly, not left vague.

**Type consistency check:**
- `StatusChipVariant` defined in Task 3, imported in Tasks 5 and 8 ✅
- `EmployeeListItemModel` fields (`displayName`, `workCenter`, `statusLabel`, `ruleSystemCode`, `employeeNumber`) used consistently in Task 5 ✅
- `EmployeeDetailModel` fields (`firstName`, `lastName1`, `displayName`, `statusLabel`, `workCenter`, `photoUrl`, `ruleSystemCode`, `employeeNumber`) used consistently in Task 8 ✅
- `gradientForInitials` helper defined in Task 2, pattern replicated (not imported) in Tasks 5/8 to avoid cross-feature coupling ✅
- `statusVariant` / `statusDisplayLabel` helpers defined separately in Tasks 5 and 8 (same logic, duplicated intentionally — each component is self-contained) ✅
