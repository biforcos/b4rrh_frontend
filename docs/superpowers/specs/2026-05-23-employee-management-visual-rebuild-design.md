# B4RRHH — Employee Management Visual Rebuild

**Fecha:** 2026-05-23  
**Alcance:** `b4rrhh_frontend` — feature `employee`  
**Tipo:** Rebuild visual completo (full replacement)

---

## 1. Contexto y motivación

La UI actual de gestión de personal (`/personas/empleados`) tiene aspecto de proyecto de andar por casa:

- El directorio es una `p-table` PrimeNG genérica mostrando códigos técnicos crudos (`INTERNAL`, `ESP`)
- El tema es light mode con tokens propios (`employee-ui-tokens.ts`) y el preset PrimeNG Aura que marcan demasiado el look del componente
- El panel de identidad lateral existe y tiene algo de trabajo, pero el conjunto no comunica producto profesional
- Las tarjetas de resumen del overview son funcionales pero visualmente planas

**Objetivo:** Convertir la feature `employee` en una UI que parezca un HR SaaS moderno de producto (estilo Personio/Rippling), usando dark mode premium como diferenciador.

---

## 2. Decisiones de diseño

| Dimensión | Decisión |
|-----------|----------|
| Dirección visual | Modern HR SaaS — cards, chips, gradientes, énfasis en personas |
| Modo de color | Dark mode premium: fondo slate `#0b0f1a` + acento índigo `#6366f1` |
| Directorio | Tabla potente custom (no PrimeNG p-table): avatar, apellidos primero, puesto humanizado, matrícula mono |
| Ficha: navegación | Rail iconos 48px (colapsado permanente) con indicador activo + tooltip |
| Ficha: identidad | Barra identidad sticky (no panel lateral 260px): avatar 44px con glow, nombre, puesto, chips |
| Extensión del cambio | Rebuild completo — todas las superficies visuales de la feature `employee` |
| PrimeNG restante | Solo se mantiene para inputs de formulario, date pickers, dialogs complejos y overlays |

---

## 3. Sistema de diseño (design tokens dark)

### 3.1 Superficies

```scss
// _dark-tokens.scss  (nuevo fichero en src/styles/)
:root[data-theme="dark"] {
  // Fondo app
  --surface-base:         #060910;
  --surface-app:          #0b0f1a;
  --surface-panel:        #0f172a;
  --surface-card:         #111827;
  --surface-raised:       #1e293b;

  // Bordes
  --border-default:       #1e293b;
  --border-strong:        #334155;
  --border-accent:        rgba(99, 102, 241, 0.35);

  // Texto
  --text-primary:         #f8fafc;
  --text-secondary:       #94a3b8;
  --text-tertiary:        #64748b;
  --text-muted:           #475569;

  // Acento índigo
  --accent-primary:       #6366f1;
  --accent-primary-hover: #4f46e5;
  --accent-light:         #818cf8;
  --accent-bg:            rgba(99, 102, 241, 0.12);
  --accent-bg-strong:     rgba(99, 102, 241, 0.2);
  --accent-border:        rgba(99, 102, 241, 0.3);
  --accent-text:          #a5b4fc;

  // Semántica
  --success-bg:           rgba(16, 185, 129, 0.12);
  --success-border:       rgba(16, 185, 129, 0.25);
  --success-text:         #34d399;
  --success-dot:          #10b981;

  --warning-bg:           rgba(245, 158, 11, 0.12);
  --warning-text:         #fbbf24;

  --error-bg:             rgba(239, 68, 68, 0.12);
  --error-text:           #f87171;

  --neutral-bg:           rgba(100, 116, 139, 0.1);
  --neutral-text:         #64748b;

  // Sombras
  --shadow-sm:            0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:            0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg:            0 8px 24px rgba(0,0,0,0.6);
}
```

### 3.2 Tipografía

- **UI general:** `Inter`, system-ui — ya disponible vía Google Fonts o self-hosted
- **Códigos y matrículas:** `JetBrains Mono` — a añadir como webfont
- Escala: `--text-xs: 10px` / `--text-sm: 12px` / `--text-md: 13px` / `--text-base: 14px` / `--text-lg: 16px` / `--text-xl: 18px` / `--text-2xl: 22px`

### 3.3 Avatares por gradiente

Los avatares usan gradientes deterministas por iniciales. El componente `AvatarGradientComponent` recibe `initials: string` y devuelve un gradiente de una paleta fija de 8 pares de colores. Los usuarios sin foto ven sus iniciales sobre gradiente. Con foto, se usa la imagen.

---

## 4. Arquitectura de componentes

### 4.1 Nuevos componentes a crear

```
src/app/shared/ui/
  avatar-gradient/
    avatar-gradient.component.ts      ← avatar con gradiente + foto
    avatar-gradient.component.html
    avatar-gradient.component.scss
  status-chip/
    status-chip.component.ts          ← chip de estado reutilizable
    status-chip.component.html
    status-chip.component.scss
  data-card/
    data-card.component.ts            ← tarjeta label/value/sub/arrow
    data-card.component.html
    data-card.component.scss

src/app/features/employee/
  shell/components/
    employee-directory-table/
      employee-directory-table.component.ts    ← reemplaza p-table
      employee-directory-table.component.html
      employee-directory-table.component.scss
    employee-identity-bar/
      employee-identity-bar.component.ts       ← barra sticky identidad
      employee-identity-bar.component.html
      employee-identity-bar.component.scss
  identity/
    employee-section-rail/
      employee-section-rail.component.ts       ← rail 48px icono + tooltip
      employee-section-rail.component.html
      employee-section-rail.component.scss
```

### 4.2 Componentes existentes a refactorizar

| Fichero | Cambio |
|---------|--------|
| `shell/pages/employee-shell-page.component.html/scss` | Reemplazar `p-table` con `employee-directory-table`. Añadir toolbar dark con chips de filtro. |
| `shell/pages/employee-detail-page.component.html/scss` | Sustituir `app-employee-identity-panel` por rail + identity bar. Nuevo layout de dos-columna. |
| `identity/employee-identity-panel.component.*` | Reemplazado por `employee-section-rail` + `employee-identity-bar`. El fichero panel se mantiene temporalmente para no romper rutas. |
| `overview/pages/employee-overview-page.component.html/scss` | Reemplazar tarjetas existentes con `data-card` del shared. Eliminar action bar legacy. |
| `overview/components/employee-horizontal-timeline.*` | Reemplazar con timeline vertical en panel lateral derecho. |
| `b4rrhh-primeng-theme.preset.ts` | Añadir dark scheme con las variables del apartado 3.1. |
| `employee-ui-tokens.ts` | Deprecar tokens light. Mapear a las CSS custom properties dark. |

---

## 5. Layout de pantallas

### 5.1 Directorio (`/personas/empleados`)

```
┌─────────────────────────────────────────────────────┐
│ [App Nav 52px] │ [Page content]                     │
│                │  Header: "Empleados" + btn "Alta"   │
│   B4  logo     │  Toolbar: search + chips + sort     │
│   👥 active    │  Table: avatar│nombre│puesto│       │
│   💰           │         matrícula│estado│alta│⋯    │
│   📊           │  Footer: count + paginación         │
│   ⚙️            │                                     │
└─────────────────────────────────────────────────────┘
```

**Columnas de la tabla:**

| Columna | Dato mostrado | Notas |
|---------|--------------|-------|
| — | `AvatarGradientComponent` 34px | gradiente por iniciales o foto |
| Nombre | `apellido1 apellido2, nombre` | subtext: departamento |
| Puesto | texto libre humanizado | desde `activePresence.job` o placeholder |
| Matrícula | `ruleSystemCode · employeeNumber` | `font-family: mono`, chip índigo |
| Estado | `StatusChipComponent` | activo/baja/pendiente |
| Alta | `startDate` formateado `mmm yyyy` | |
| — | iconos editar + menú | visible solo en hover |

**Filtros:** chips toggleables Todos / Activos / Bajas. El chip activo tiene fondo `--accent-bg-strong`.

**Ordenación:** por columna, indicador `↑↓` en header activo con color `--accent-light`.

**Filas inactivas (baja):** `opacity: 0.55`, avatar gris neutral, matrícula con color `--neutral-text`.

### 5.2 Ficha del empleado (`/personas/empleados/:key/overview`)

```
┌──────────────────────────────────────────────────────────────┐
│ App Nav│Section Rail│ Main content                           │
│  52px  │    48px    │                                        │
│        │            │ Breadcrumb: Empleados › García R.      │
│        │  [avatar]  │ ┌──────────────────────────────────┐   │
│        │  ─────     │ │ Identity bar (sticky)            │   │
│        │  ▦ active  │ │ [avatar44] Nombre · puesto · dep │   │
│        │  📞        │ │           [Activo] [ESP·001]     │   │
│        │  📍        │ │           [Calcular nómina][▾]   │   │
│        │  📄        │ └──────────────────────────────────┘   │
│        │  🏢        │                                        │
│        │  ⚖️         │ Content + Timeline aside (220px)       │
│        │  🕐        │ ┌────────────────┐ ┌──────────────┐   │
│        │  💰        │ │ Data cards 3×2 │ │ Antigüedad   │   │
│        │  📑        │ │                │ │ Historial    │   │
│        │  🔄        │ │ Contacto quick │ │ vertical     │   │
│        │            │ └────────────────┘ └──────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Barra de identidad:** `position: sticky; top: 0; z-index: 10` — se queda fija al hacer scroll del contenido. Contiene: avatar 44px con ring de glow índigo, nombre completo, puesto + departamento + fecha de alta, chip de estado, chip matrícula mono, botones de acción.

**Rail de secciones:** 48px ancho, solo iconos. Ítem activo: fondo `--accent-bg`, indicador borde izquierdo 3px `--accent-primary`. Tooltip al hover (via CSS `attr(title)` o `p-tooltip`).

**Data cards:** grid 3 columnas en el overview. Cada card: label UPPERCASE pequeño, value grande, subtext gris. La card de nómina usa `--accent-bg` y acento índigo.

**Timeline aside:** panel derecho 220px. Sección "Antigüedad" (grid 2×1 con años/meses). Sección "Historial": timeline vertical con nodo coloreado por tipo de evento (alta=verde, cambio contrato=índigo, revisión salarial=amber, futuro=gris).

---

## 6. Integración con estado existente

El estado existente **no cambia**. Solo cambia la capa de presentación:

- `EmployeeDirectoryStore` → sigue siendo la fuente para la tabla custom
- `EmployeeDetailStore`, `EmployeePresenceStore`, `EmployeeContractStore`, etc. → siguen siendo fuentes para identity bar y data cards
- Señales existentes (`activeEmployeeKey`, `selectedEmployee`, `headerHireDate`, `headerStatus`) en `employee-detail-page.component.ts` → se pasan a los nuevos componentes con el mismo binding
- El router outlet para las secciones no cambia — solo cambia el contenedor que lo rodea

---

## 7. Gestión del tema dark

### Estrategia de aplicación

1. Añadir `data-theme="dark"` al `<html>` en `index.html` (dark-only por ahora; no hay toggle de tema en este MVP)
2. El nuevo fichero `_dark-tokens.scss` define todas las CSS custom properties bajo `[data-theme="dark"]`
3. El preset PrimeNG (`b4rrhh-primeng-theme.preset.ts`) recibe un `darkColorScheme` paralelo al `lightColorScheme` existente
4. Los componentes de la feature `employee` usan únicamente `var(--*)` en sus SCSS, nunca colores hardcodeados
5. Los componentes shared (`AvatarGradientComponent`, `StatusChipComponent`, `DataCardComponent`) también usan solo `var(--*)`

### PrimeNG en dark

El preset Aura soporta `darkModeSelector`. Se configura con `darkModeSelector: '[data-theme="dark"]'` en `providePrimeNG(...)`. Los componentes PrimeNG que se mantienen (inputs, date pickers, dialogs) heredan el dark scheme automáticamente.

---

## 8. Componentes a eliminar / deprecar

| Componente | Estado | Sustituto |
|-----------|--------|-----------|
| `employee-identity-panel.component` | Deprecated — mantener temporalmente | `employee-section-rail` + `employee-identity-bar` |
| `employee-detail-header.component` | Deprecated | `employee-identity-bar` |
| `employee-horizontal-timeline.component` | Deprecated | Timeline vertical en aside |
| `employee-page.component` | Eliminar — era dummy con contenido inglés | — |
| `global-message-rail.component` | Mantener — es funcional | Restyling dark |

---

## 9. Orden de implementación (sprints sugeridos)

### Sprint 1 — Cimientos dark
1. Crear `_dark-tokens.scss` con todos los tokens
2. Aplicar `data-theme="dark"` en `index.html`
3. Actualizar preset PrimeNG con dark scheme
4. Añadir fuentes Inter y JetBrains Mono
5. Crear `AvatarGradientComponent` (shared/ui)
6. Crear `StatusChipComponent` (shared/ui)
7. Crear `DataCardComponent` (shared/ui)

### Sprint 2 — Directorio
8. Crear `EmployeeDirectoryTableComponent` (custom table, sin PrimeNG)
9. Refactorizar `employee-shell-page.component` para usar el nuevo componente
10. Actualizar toolbar (búsqueda dark + chips de filtro)

### Sprint 3 — Ficha del empleado
11. Crear `EmployeeSectionRailComponent` (rail 48px)
12. Crear `EmployeeIdentityBarComponent` (barra sticky)
13. Refactorizar `employee-detail-page.component` para nuevo layout
14. Refactorizar `employee-overview-page.component` (data cards + timeline vertical)

### Sprint 4 — Limpieza
15. Restyling dark de `global-message-rail`
16. Eliminar `employee-page.component` (dummy)
17. Deprecar `employee-identity-panel` y `employee-detail-header`
18. Actualizar `employee-ui-tokens.ts` para apuntar a las nuevas CSS vars

---

## 10. Testing

- Los componentes **shared** (`AvatarGradientComponent`, `StatusChipComponent`, `DataCardComponent`) tienen unit tests propios con inputs/outputs
- `EmployeeDirectoryTableComponent` tiene test de render con datos mock (mismo modelo que usaba p-table)
- Los tests existentes de stores y gateways **no se tocan** — el estado no cambia
- Los tests de `employee-shell-page.component.spec.ts` y `employee-overview-page.component.spec.ts` se actualizan para reflejar los nuevos selectores CSS/componentes
- No se añaden E2E en este sprint — los flujos funcionales no cambian

---

## 11. Ficheros clave de referencia

| Fichero | Rol |
|---------|-----|
| `src/app/core/theme/b4rrhh-primeng-theme.preset.ts` | Preset PrimeNG — añadir dark scheme |
| `src/app/features/employee/shared/ui/theme/employee-ui-tokens.ts` | Tokens legacy — deprecar progresivamente |
| `src/styles/_dark-tokens.scss` | **NUEVO** — fuente única de tokens dark |
| `src/app/features/employee/employee.routes.ts` | Routing — no cambia |
| `src/app/features/employee/shell/pages/employee-shell-page.component.ts` | Directory page — refactorizar template |
| `src/app/features/employee/shell/pages/employee-detail-page.component.ts` | Detail page — refactorizar layout |
| `src/app/features/employee/overview/pages/employee-overview-page.component.ts` | Overview — refactorizar cards |
| `src/app/features/employee/data-access/employee-directory.store.ts` | Store directorio — no cambia |
