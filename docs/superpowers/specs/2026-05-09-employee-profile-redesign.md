# Employee Profile Redesign

**Date:** 2026-05-09  
**Status:** Approved for implementation  
**Phases:** 2 (panel identidad + resumen básico → timeline horizontal)

---

## Scope

Rediseño visual completo de la ficha del empleado en dos áreas:

1. **Panel de identidad lateral** (`employee-identity-panel`) — mejora de jerarquía visual, matrícula prominente, navegación con iconos y pill fill, comportamiento colapsable en Resumen.
2. **Página Resumen** (nueva ruta) — landing page del empleado con snapshot de verticals, action bar contextual y timeline horizontal del journey.

No se tocan los componentes de sección (Personales, Laborales, etc.) ni la lógica de negocio existente. Solo capa de presentación y routing.

---

## Fase 1 — Panel de identidad + Página Resumen básica

### 1.1 Identity Panel — cambios visuales

**Archivo:** `src/app/features/employee/identity/employee-identity-panel.component.{html,scss,ts}`

#### Nombre del empleado
- Tamaño: `17px`, `font-weight: 600`
- Clamp de 2 líneas: `-webkit-line-clamp: 2`, `word-break: break-word`
- Gestiona nombres muy largos sin romper el layout

#### Bloque matrícula (hero block)
- Fondo `var(--accent-primary)` (#4f46e5), border-radius 8px
- Label "MATRÍCULA" en uppercase 10px, color blanco al 60%
- Valor en `18px monospace font-weight 700` blanco
- Botón copiar: icono `⎘` sin texto, 28×28px, fondo `rgba(255,255,255,0.18)`, copia `employeeNumber` al portapapeles via `navigator.clipboard.writeText()`
- Debajo del bloque: fecha de alta discreta `11px color text-tertiary`

#### Navegación — Nav pill fill
Cada ítem: icono PrimeNG + label. Activo: fondo accent sólido, texto blanco.

| Label | Icono PrimeNG | Ruta relativa |
|-------|--------------|---------------|
| Resumen | `pi-home` | `./resumen` |
| Personales | `pi-user` | `./personales` |
| Laborales | `pi-briefcase` | `./laborales` |
| Organizativos | `pi-building` | `./organizativos` |
| Nómina | `pi-euro` | `./nomina` |

CSS activo: `background: var(--accent-primary); color: #fff; border-radius: 8px;` — sin borde izquierdo, pill fill completo.

#### Eliminaciones
- Quitar los campos `CONVENIO`, `TIPO` del panel (eran `ruleSystemCode` y `employeeTypeCode` en bruto, sin etiqueta correcta ni valor útil)
- El empleado ya se contextualiza por la business key en la URL

---

### 1.2 Identity Panel — comportamiento colapsable

El panel se colapsa automáticamente cuando la ruta activa es `./resumen` y se expande al navegar a cualquier otra sección.

#### Estado expandido (default, todas las secciones menos Resumen)
- Ancho: `260px`
- Contenido completo: avatar 80px, nombre, status, matrícula hero, fecha alta, nav con labels

#### Estado colapsado (cuando ruta = Resumen)
- Ancho: `96px`, transición CSS `width 0.45s cubic-bezier(0.4, 0, 0.2, 1)`
- Avatar: `72px`, `box-shadow: 0 0 0 3px var(--surface-accent)` (anillo sutil accent)
- Status dot: punto de 10px color según estado (verde activo, rojo baja) posicionado `bottom: 4px, right: 4px` sobre el avatar — único indicador de estado visible sin texto
- Nav: solo iconos centrados, `height: 38px`, sin labels. Tooltip nativo `title` con el nombre de la sección en hover.
- Bloque matrícula, nombre, status badge, fecha alta: `opacity: 0`, `max-height: 0`, `overflow: hidden` — transición fluida

#### Implementación Angular
```typescript
// identity-panel.component.ts
private readonly activeChildPath = toSignal(
  this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => this.route.firstChild?.snapshot?.routeConfig?.path ?? ''),
    startWith(this.route.firstChild?.snapshot?.routeConfig?.path ?? '')
  )
);
readonly isResumen = computed(() => this.activeChildPath() === 'resumen');
```
El host binding `[class.identity-panel--collapsed]` activa los estilos de rail.

Usar `route.firstChild` en lugar de `router.url.endsWith()` es más robusto ante query params futuros. El componente necesita inyectar tanto `Router` como `ActivatedRoute`.

---

### 1.3 Página Resumen — nueva ruta

**Ruta:** `./resumen` (hija de la shell del empleado, `exact: true`)  
**Componente:** `employee-overview-page.component.{html,scss,ts}` — ya existe y tiene contenido.

El componente actual tiene: skeleton shimmer de loading reutilizable, signals `loading()`, `hireDate()`, `activeContract()`, `loadingContracts()`, `statusLabel()`, `statusSeverity()`, `company()`, y el método `navigateTo(section)`. Todo esto se conserva y amplía — no es una reescritura desde cero.

#### Layout general
```
[Action bar]
[Snapshot cards — 7 en una fila]
[Timeline horizontal]
```

#### Action bar
Fila horizontal, `background: var(--surface-panel)`, `border-radius: 12px`, `padding: 10px 14px`.

**Botón primario — "Calcular nómina":**
- Gradiente `linear-gradient(135deg, var(--accent-primary), #7c3aed)`
- Icono `pi-calculator`
- Flujo interno: **pendiente de definir** — en Fase 1 navega a `./nomina`. En el futuro: drawer con estimación.

**Botón "Acciones ▾" — PrimeMenu o p-menu:**
- Dropdown con secciones agrupadas
- Contenido **contextual según estado del empleado**:

| Estado empleado | Sección "Ciclo de vida" muestra |
|-----------------|-------------------------------|
| Activo | "Iniciar cese" (rojo, `pi-stop-circle`) |
| Baja | "Recontratación" (`pi-replay`) |

Acciones fijas en sección "Laborales":
- Cambiar centro de trabajo → navega a `./laborales` (sección work-center)
- Nuevo contrato → navega a `./laborales` (sección contrato)
- Registrar revisión salarial → **pendiente de definir** (Fase 2 o posterior)

#### Snapshot cards
7 tarjetas en `display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px`.

Cada card: `cursor: pointer`, `router.navigate` al hacer click, hover con elevación + flecha `›` en esquina superior derecha.

Border-top de color por vertical:

| Card | Color | Datos | Navega a |
|------|-------|-------|----------|
| Contacto | `#06b6d4` (cyan) | N contactos · N direcciones | `./personales` |
| Contrato | `#059669` (green) | Tipo · Desde fecha | `./laborales` |
| Centro trabajo | `#4f46e5` (indigo) | Nombre · Rule system | `./laborales` |
| Centro coste | `#7c3aed` (purple) | Nombre · Código | `./organizativos` |
| Clasificación | `#d97706` (amber) | Grupo · Nivel · Desc | `./laborales` |
| Jornada | `#0ea5e9` (sky) | Tipo · Horas | `./laborales` |
| Nómina | `#16a34a` (green-700) | N pagas · IRPF est. | `./nomina` |

Datos mostrados: los mismos signals/stores que ya cargan cada sección. Si un dato no está cargado aún, mostrar skeleton de 1 línea.

#### Timeline horizontal — Fase 1 (stub)
En Fase 1 el timeline horizontal **no se implementa**. En su lugar, se renderiza el componente existente `employee-journey-timeline` dentro de un contenedor con `min-height: 160px`, con un tratamiento visual mejorado (más espacio, sin estar encajonado en el sidebar).

---

## Fase 2 — Timeline horizontal

### Estructura del componente
**Componente nuevo:** `employee-horizontal-timeline.component.{html,scss,ts}`  
Datos: mismos que `employee-journey-timeline` — signal `journey()` del store existente.

### Layout
- Contenedor con `overflow-x: auto`, scrollbar thin
- Ancho total del track: calculado dinámicamente para que HOY quede al **75%** del ancho visible inicial. Fórmula: `trackWidth = containerWidth / 0.75`, los últimos `25%` son el buffer futuro.
- La línea base es sólida `#e5e7eb` en la zona pasada; **punteada** en la zona futura (repeating-linear-gradient)
- Label "sin eventos futuros" en el extremo derecho si no hay eventos futuros planificados

### Nodos
Cada evento del journey se renderiza como un nodo con:
- Dot circular 36×36px, color y fondo por tipo (ver tabla de colores en 1.3 action bar)
- Stub vertical de 18px conectando el dot con la card
- Cards alternando arriba/abajo (`index % 2 === 0` → above, `odd` → below)
- Card: `border-left: 3px solid <color-tipo>`, fecha, título, subtítulo

Tipos de evento y colores:

| Tipo journey | Color | Icono dot |
|-------------|-------|-----------|
| HIRE / REHIRE | `#059669` | `✦` |
| TRANSFER / WORK_CENTER_CHANGE | `#4f46e5` | `⇄` |
| SALARY_REVIEW | `#d97706` | `€` |
| TERMINATION | `#dc2626` | `✕` |
| HOY (marker especial) | `#111827` | texto "HOY" |

### Marcadores de año
Un marcador año se inserta antes del primer evento de cada año. Píldora `background: #f3f4f6`, `border: 1px solid #d1d5db`, `font-size: 11px`.

### Nodo HOY
- Dot negro sólido con `box-shadow: 0 0 0 5px rgba(17,24,39,0.1)`
- Label con la fecha actual (inyectar `DatePipe` con `today = new Date()`) debajo
- Posicionado al 75% del track

### Comportamiento del bloque matrícula en Baja
Cuando `employee.status === 'BAJA'`, el fondo del hero block de matrícula cambia a `var(--text-tertiary)` (#6b7280) — gris neutro. Comunica el estado visualmente en todo el panel sin necesidad de leerlo.

---

## Componentes afectados

| Componente | Acción |
|-----------|--------|
| `employee-identity-panel` | Modificar HTML + SCSS + TS |
| `employee-overview-page` | Reescribir (página Resumen) |
| `employee-detail-page` | Añadir router trigger para colapso |
| `employee-horizontal-timeline` | Crear (Fase 2) |
| Routing (`employee-routing.module` o equivalente) | Añadir ruta `resumen` si no existe |

---

## Out of scope

- Cambios en backend o OpenAPI
- Rediseño de páginas de sección (Personales, Laborales, etc.)
- Flujo interno de "Calcular nómina" (deferred)
- Flujo completo de "Iniciar cese" desde el dropdown (ya existe el panel `employee-terminate-panel`, el dropdown lo abre)
- Responsive / mobile

---

## Decisiones de diseño

- **CONVENIO eliminado del panel**: mostraba `ruleSystemCode` crudo (e.g. "ESP") con etiqueta incorrecta. No aporta valor visible sin un catálogo de nombres. Si en el futuro se quiere mostrar, necesita el nombre legible del rule system.
- **Tipo de empleado eliminado del panel**: dato técnico interno, no relevante para el usuario de RRHH en la ficha diaria.
- **Nav pill fill vs left-accent**: se eligió pill fill (fondo sólido accent) por mayor identidad visual y claridad del ítem activo.
- **HOY al 75%**: la mayoría de empleados no tienen eventos futuros conocidos. Centrar HOY desperdiciaría la mitad de la pantalla. El buffer del 25% es suficiente para vencimientos de contrato temporal u otros eventos futuros.
