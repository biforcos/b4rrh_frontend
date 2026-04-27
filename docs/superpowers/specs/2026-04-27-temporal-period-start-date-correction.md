# Corrección de Fecha de Inicio en Períodos Temporales

## Goal

Permitir que el usuario corrija la fecha de inicio de un período temporal existente (contrato, clasificación laboral, jornada) cuando cometió un error de entrada de datos. Cuando se corrige, el backend ajusta automáticamente la fecha de cierre del período predecesor para mantener la continuidad de la línea de tiempo sin huecos.

## Verticals en scope

| Vertical | Backend | Frontend | Estado actual |
|---|---|---|---|
| Centro de trabajo | — | — | ✅ Ya implementado |
| Contrato | Añadir `startDate` a `UpdateContractRequest` | Añadir campo en modal edición | ❌ Falta |
| Clasificación laboral | Añadir `startDate` a `UpdateLaborClassificationRequest` | Añadir campo en modal edición | ❌ Falta |
| Jornada | Nuevo endpoint PUT completo | Añadir modo edición al modal | ❌ No existe |

---

## Comportamiento de cascade

Cuando el usuario corrige la fecha de inicio de un período de `oldStart` a `newStart`:

1. El período actual cambia su `startDate` de `oldStart` a `newStart`.
2. Si existe un período predecesor cuya `endDate == oldStart - 1 día`, el backend actualiza automáticamente ese `endDate` a `newStart - 1 día`.
3. Si no hay predecesor (es el primer período), no hay cascade.

El backend valida que `newStart` no solape con otros períodos del empleado y que esté contenido dentro de un período de presencia activo.

---

## Backend — OpenAPI y Spring Boot

### 1. Contrato: extender `UpdateContractRequest`

**Archivo:** `openapi/personnel-administration-api.yaml`

Añadir campo opcional `startDate` al schema `UpdateContractRequest`:

```yaml
UpdateContractRequest:
  type: object
  additionalProperties: false
  required:
    - contractCode
    - contractSubtypeCode
  properties:
    startDate:
      type: string
      format: date
      nullable: true
      description: >-
        Corrected start date (yyyy-MM-dd). When provided, the predecessor occurrence's
        endDate is automatically adjusted to newStartDate - 1 day to preserve continuity.
        Must not overlap with any other contract occurrence for this employee.
    contractCode:
      type: string
      minLength: 3
      maxLength: 3
    contractSubtypeCode:
      type: string
      minLength: 3
      maxLength: 3
```

**Endpoint afectado:** `PUT /employees/{ruleSystemCode}/{employeeTypeCode}/{employeeNumber}/contracts/{startDate}`

El path `{startDate}` sigue siendo la clave del período a corregir. El `startDate` del body es la nueva fecha (puede ser igual a la del path si solo se corrige el contenido).

**Lógica del use case `UpdateContractService`:**
- Si `request.startDate` es nulo o igual al path `startDate`: solo corregir `contractCode` / `contractSubtypeCode` (comportamiento actual).
- Si `request.startDate` difiere del path `startDate`:
  1. Mover el período: cambiar `startDate` en la entidad.
  2. Buscar predecesor: el período de contrato del mismo empleado cuyo `endDate == pathStartDate - 1 día`.
  3. Si existe: actualizar `endDate` del predecesor a `request.startDate - 1 día`.
  4. Validar: no solapamiento con otros períodos, contenido dentro de presencia.

**Respuesta `409`** añadir caso: `Start date correction conflicts with existing contract periods (overlap or outside presence).`

### 2. Clasificación laboral: extender `UpdateLaborClassificationRequest`

Mismo patrón exacto que contrato. Añadir campo opcional `startDate` a `UpdateLaborClassificationRequest`.

**Endpoint:** `PUT /employees/{...}/labor-classifications/{startDate}`

Lógica idéntica al use case de contrato.

### 3. Jornada: nuevo endpoint de corrección

Actualmente solo existen `POST` (crear) y `POST .../close`. No hay `PUT`.

**Nuevo endpoint:**
```
PUT /employees/{ruleSystemCode}/{employeeTypeCode}/{employeeNumber}/working-times/{workingTimeNumber}
```

**Nuevo schema `UpdateWorkingTimeRequest`:**
```yaml
UpdateWorkingTimeRequest:
  type: object
  additionalProperties: false
  required:
    - startDate
    - workingTimePercentage
  properties:
    startDate:
      type: string
      format: date
      description: >-
        Corrected start date (yyyy-MM-dd). When different from current startDate,
        the predecessor occurrence's endDate is automatically adjusted.
    workingTimePercentage:
      type: number
      format: double
      minimum: 0
      exclusiveMinimum: true
      maximum: 100
```

Nótese que la jornada se identifica por `workingTimeNumber` (número surrogate), igual que centro de trabajo. La fecha de inicio no es la clave del path — se puede corregir directamente en el body.

**Lógica del use case `UpdateWorkingTimeService`:**
- Corregir `workingTimePercentage` y `startDate`.
- Cascade automático en predecesor si `startDate` cambia.
- Validar que no solape con otros períodos de jornada del mismo empleado.

---

## Frontend — Angular

### Archivos a modificar / crear

#### Contrato

**`employee-contract.mapper.ts`** — añadir `startDate` opcional a `ContractCorrectDraft`:
```typescript
export interface ContractCorrectDraft {
  startDate?: string;   // nuevo — opcional
  contractCode: string;
  contractSubtypeCode: string;
}
```

**`employee-contract-section.component.ts`** — añadir `startDateDraft` al modo edición:
- Añadir `protected readonly editingOriginalStartDate = signal<string | null>(null)` para detectar si el usuario ha cambiado la fecha.
- En `openEdit(index)`: inicializar `startDateDraft.set(row.startDate)` y `editingOriginalStartDate.set(row.startDate)`.
- En `submit()` modo `'edit'`: incluir `startDate: this.startDateDraft()` en el draft solo si difiere de `editingOriginalStartDate()`.
- Calcular `showCascadeWarning = computed(() => modalMode() === 'edit' && startDateDraft() !== editingOriginalStartDate())`.

**`employee-contract-section.component.html`** — en el bloque `@if (modalMode() === 'edit')`:
```html
<app-ui-date-input
  label="Fecha de inicio"
  [value]="startDateDraft()"
  (valueChanged)="startDateDraft.set($event)" />

@if (showCascadeWarning()) {
  <p class="contract-section__cascade-hint">
    El período anterior se ajustará automáticamente.
  </p>
}

<app-ui-select ...contractCode... />
<app-ui-select ...contractSubtypeCode... />
```

#### Clasificación laboral

Mismo patrón exacto que contrato:
- `LaborClassificationCorrectDraft`: añadir `startDate?: string`.
- `employee-labor-classification-section.component.ts`: añadir `startDateDraft` y `editingOriginalStartDate` al modo edición.
- `employee-labor-classification-section.component.html`: añadir `app-ui-date-input` en bloque edición.

#### Jornada

**`employee-working-time.mapper.ts`** — nuevo tipo:
```typescript
export interface WorkingTimeCorrectDraft {
  startDate: string;
  workingTimePercentage: number;
}
```

**`employee-working-time.store.ts`** — nuevo método:
```typescript
correctWorkingTime(key: EmployeeBusinessKey, workingTimeNumber: number, draft: WorkingTimeCorrectDraft): void
```
Llama al nuevo gateway `PUT .../working-times/{workingTimeNumber}`.

**`employee-working-time-read.gateway.ts`** (o equivalente) — añadir método:
```typescript
correctWorkingTime(key: EmployeeBusinessKey, number: number, draft: WorkingTimeCorrectDraft): Observable<void>
```

**`employee-working-time-section.component.ts`** — añadir modo `'edit'`:
```typescript
type WorkingTimeModalMode = 'create' | 'edit' | 'close';
```
- `openEdit(index)`: si `row.isActive` → modo `'edit'` (hoy va a `'close'`).
- Inicializar `startDateDraft` y `percentageDraft` desde el row.
- Añadir `editingOriginalStartDate` signal para el cascade warning.
- `submit()`: rama `'edit'` llama a `correctWorkingTime`.

**`employee-working-time-section.component.html`** — añadir bloque `@if (modalMode() === 'edit')`:
```html
<app-ui-date-input [value]="startDateDraft()" (valueChanged)="startDateDraft.set($event)" />
<app-ui-input-number [value]="percentageDraft()" (valueChanged)="percentageDraft.set($event)" />
@if (showCascadeWarning()) {
  <p class="working-time-section__cascade-hint">El período anterior se ajustará automáticamente.</p>
}
```

**`PeriodTableRow.canEdit`** — ya es `true` para la jornada activa; no cambia.

---

## Tests

### Backend
- Contrato: test que verifica que corregir `startDate` actualiza el predecesor (`endDate = newStart - 1`).
- Contrato: test que verifica rechazo `409` si la nueva fecha solapa con otro período.
- Clasificación laboral: mismos casos.
- Jornada: test del nuevo endpoint `PUT` con corrección de startDate y cascade.

### Frontend
- `employee-contract.mapper.spec.ts`: añadir caso para `ContractCorrectDraft` con `startDate`.
- `employee-working-time.mapper.spec.ts`: test para `WorkingTimeCorrectDraft`.
- Componentes: tests de que el modal muestra el campo `startDate` en modo `'edit'` y que el cascade warning aparece solo cuando la fecha difiere.

---

## Flujo de trabajo completo

1. **Actualizar OpenAPI spec** (`b4rrhh_backend/openapi/personnel-administration-api.yaml`).
2. **Implementar backend** (use cases + test de integración) para las tres verticales.
3. **Regenerar cliente frontend** (`npm run api:refresh` en `b4rrhh_frontend`).
4. **Implementar frontend** (mappers → store → componentes) para las tres verticales.
5. **Tests** de integración backend + unitarios frontend.

---

## Out of scope

- Centro de trabajo: ya implementado, no se toca.
- Dirección: pertenece al vertical `contact/`, no al laboral.
- Cost center (distribuciones): modelo distinto (distribuciones en ventanas), no incluido.
- Eliminar períodos: operación distinta, no incluida en este spec.
