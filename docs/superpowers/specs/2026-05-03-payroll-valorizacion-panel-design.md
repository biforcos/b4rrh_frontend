# Spec: Panel de Valorización de Nómina

**Date:** 2026-05-03
**Status:** Approved
**Feature:** Vista de detalle de todos los conceptos que intervienen en el cálculo de una nómina

---

## Contexto

La pantalla de recibos (`/nomina/recibos`) muestra el folio oficial de nómina, que solo incluye conceptos de naturaleza `EARNING` y `DEDUCTION`. Sin embargo, el motor de cálculo produce muchos más conceptos internos (bases de cotización, topes, porcentajes estimados, etc.) que actualmente no son visibles para el usuario.

El endpoint `GET /payrolls/{...}` ya devuelve **todos** los conceptos con su naturaleza (`conceptNatureCode`). No se requiere ningún cambio en backend.

---

## Objetivo

Añadir un panel lateral deslizante ("drawer") accesible desde el action bar del recibo que muestre la valorización completa de la nómina: todos los conceptos del cálculo, con su importe, cantidad, tarifa y naturaleza, filtrables por texto.

---

## Naturalezas de concepto

| `conceptNatureCode` | Descripción | Color |
|---|---|---|
| `EARNING` | Devengo (aparece en recibo) | Verde `#a6e3a1` |
| `DEDUCTION` | Deducción (aparece en recibo) | Rojo `#f38ba8` |
| `BASE` | Base de cotización / IRPF | Azul `#89b4fa` |
| `TECHNICAL` | Intermediario del motor de cálculo | Lila `#cba6f7` |
| `INFORMATIONAL` | Valor informativo | Naranja `#fab387` |
| `TOTAL_EARNING` / `TOTAL_DEDUCTION` / `NET_PAY` | Totales y líquido | Gris `#6c7086` |

---

## Diseño de interacción

1. El usuario selecciona una nómina en la lista → se carga el detalle habitual (folio).
2. En el action bar aparece el botón **"⊞ Valorización"** junto a los botones existentes (Validar / Invalidar / Recalcular).
3. Al hacer clic → se abre el drawer desde la derecha. Un overlay semitransparente atenúa el folio.
4. El drawer se cierra con:
   - El botón **✕** en la cabecera del panel.
   - Un clic en el overlay semitransparente.
5. Al cambiar de nómina seleccionada, el drawer se cierra automáticamente (via `effect()` que observa `store.selectedKey()`).

---

## Componentes

### Cambios en `RecibosDetailComponent`

- Añadir `drawerOpen = signal(false)`.
- Añadir `effect()` que setea `drawerOpen` a `false` cuando `store.selectedKey()` cambia.
- Añadir botón "⊞ Valorización" en `action-bar-buttons` (solo visible cuando hay nómina seleccionada y conceptos cargados).
- Renderizar `<app-recibos-valorizacion-panel>` con overlay cuando `drawerOpen()` es `true`.

### Nuevo `RecibosValorizacionPanelComponent`

**Archivo:** `src/app/features/nomina/recibos/ui/recibos-valorizacion-panel.component.ts`

**Inputs:**
- `concepts: ReadonlyArray<PayrollConceptModel>` — todos los conceptos de la nómina seleccionada
- `loading: boolean` — si los conceptos aún están cargándose
- `payrollKey: string` — etiqueta `"{employeeNumber} · Período {payrollPeriodCode}"` para el subtítulo

**Outputs:**
- `close: EventEmitter<void>` — emitido al cerrar (botón ✕ o click en overlay)

**Estado interno:**
- `searchTerm = signal('')` — término de búsqueda
- `filteredConcepts = computed(...)` — filtra `concepts` por `conceptCode.toLowerCase().includes(term)` OR `conceptLabel.toLowerCase().includes(term)`

**Estructura del panel:**

```
┌─────────────────────────────────────┐
│ Valorización          [✕]           │  ← cabecera (sticky)
│ {employeeNumber} · Período {period} │
├─────────────────────────────────────┤
│ 🔍 [Buscar por código o concepto…]  │  ← buscador (sticky)
├─────────────────────────────────────┤
│ ■ Devengo ■ Deducción ■ Base        │  ← leyenda (sticky)
│ ■ Técnico ■ Informativo ■ Totales   │
├─────────────────────────────────────┤
│ ▌ CLAVE  CONCEPTO    CANT  TAR  IMP │  ← tabla (scrollable)
│ █ 101    Salario B.   —    —   1200 │
│ █ 770    Ret. IRPF    —  12,5% -168 │
│ █ B_CC   Base CC      —    —   1350 │
│ █ P_TOPE Tope mín.   28  45,02 1260 │
│ …                                   │
└─────────────────────────────────────┘
```

**Columnas de la tabla:**
| Columna | Campo | Notas |
|---|---|---|
| (franja color) | `conceptNatureCode` | 3px izquierda, color por naturaleza |
| Clave | `conceptCode` | Monospace |
| Concepto | `conceptLabel` | — |
| Cant. | `quantity` | Derecha; `—` si null |
| Tarifa | `rate` | Derecha; `—` si null |
| Importe | `amount` | Derecha; color por naturaleza; `—` si null |

**Ordenación:** `displayOrder` ascendente (igual que el folio). No hay reordenación manual.

---

## Estilos

- CSS inline en el componente (patrón del módulo de recibos).
- Paleta dark Catppuccin Mocha (`#1e1e2e`, `#313244`, `#cdd6f4`, etc.), consistente con el resto del módulo.
- El drawer tiene `position: fixed`, `top: 0`, `right: 0`, `bottom: 0`, `width: 460px`, `z-index: 100`.
- El overlay tiene `position: fixed`, `inset: 0`, `background: rgba(0,0,0,0.4)`, `z-index: 99`.
- Animación de entrada: `transform: translateX(100%)` → `translateX(0)` con `transition: transform 280ms ease`.
- Cabecera, buscador y leyenda son sticky dentro del panel (no hacen scroll).

---

## Lo que NO está en scope

- Ningún cambio en backend ni en el store.
- No hay paginación (el número de conceptos por nómina es manejable).
- No hay exportación a CSV/PDF.
- No hay navegación desde el panel al designer de conceptos.
