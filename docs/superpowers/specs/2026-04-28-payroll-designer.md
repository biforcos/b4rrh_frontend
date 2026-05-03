# Payroll Designer — Spec

**Fecha:** 2026-04-28  
**Estado:** Draft

---

## Contexto

El motor de nómina de B4RRHH es completamente dirigido por datos: conceptos, operandos, feeds y reglas de asignación viven en base de datos. Sin embargo, hoy la única forma de añadir o modificar un concepto es escribir una migración SQL de Flyway. Esto impide que un configurador de nómina pueda evolucionar el modelo sin ayuda de desarrollo.

El **Payroll Designer** es una herramienta de configuración visual que permite definir el catálogo de conceptos de nómina — su tipo de cálculo, cableado de operandos y reglas de elegibilidad — sin escribir código ni SQL. Es el "back-office del back-office".

---

## Alcance MVP

| Módulo | Descripción |
|--------|-------------|
| **Canvas de conceptos** | Editor visual de nodos y aristas que mapea el grafo de `PayrollConcept` |
| **Objetos de soporte** | CRUD de `PayrollObject` tipo TABLE y CONSTANT |
| **Reglas de asignación** | CRUD de `ConceptAssignment` — qué conceptos aplican a qué contexto |

Fuera de alcance en MVP: simulador de cálculo, versionado de conceptos, fórmulas libres.

---

## Arquitectura

### Repositorio separado: `b4rrhh_designer`

El Payroll Designer es una aplicación React independiente, no una sección de `b4rrhh_frontend`. Razones:

- Audiencia distinta: el configurador de nómina vs. el gestor de RRHH
- UX más técnica sin contaminar el frontal operacional
- El canvas de nodos (React Flow) es first-class en React; forzarlo en Angular sería costoso
- Despliegue independiente

Comparte backend (`b4rrhh_backend`) y autenticación JWT con el resto del sistema.

### Tech stack

| Pieza | Tecnología |
|-------|-----------|
| Framework | React 18 + Vite |
| Canvas | **React Flow** (node editor, typed ports, custom nodes) |
| UI | shadcn/ui + Tailwind CSS (tema oscuro) |
| Estado servidor | React Query (TanStack Query) |
| Estado local canvas | Zustand |
| Lenguaje | TypeScript |
| Auth | JWT del backend (mismo token que `b4rrhh_frontend`) |

---

## Layout general

```
┌──────────────────────────────────────────────────┐
│  ⬡ Payroll Designer  │ ES · Convenio General  [+ Concepto] [⏵ Validar] [↑ Guardar] │
├────┬─────────────────────────────────┬────────────┤
│ ⬡  │                                 │  Panel de  │
│ ≡  │         Canvas React Flow       │  propied.  │
│ ⊞  │         (nodos + aristas)       │  (nodo     │
│    │                                 │  selec.)   │
│ ⚙  │                     [minimap]   │            │
└────┴─────────────────────────────────┴────────────┘
```

**Nav lateral icónica** (44 px): Canvas · Objetos · Asignaciones · (sep.) · Ajustes  
**Panel derecho** (200 px): propiedades del nodo seleccionado, colapsable  
**Canvas**: ocupa el espacio central, fondo oscuro con grid de puntos

---

## Módulo 1 — Canvas de conceptos

### Tipos de nodo (mapeados a `CalculationType`)

| CalculationType | Puertos de entrada | Puerto salida | Color acento |
|----------------|-------------------|---------------|--------------|
| `JAVA_PROVIDED` / `DIRECT_AMOUNT` | — | `out` | gris |
| `RATE_BY_QUANTITY` | `qty` (azul), `rate` (ámbar) | `out` | azul |
| `PERCENTAGE` | `base` (violeta), `pct` (rosa) | `out` | violeta |
| `AGGREGATE` | `feed ×n` (verde, multi) | `out` | verde |

Cada nodo muestra: badge de tipo, código, mnemónico, puertos con nombre y color.

### Regla de las aristas

Una arista conecta el puerto `out` de un nodo origen con un puerto nombrado del nodo destino. El rol del operando queda codificado en el puerto destino — no en la etiqueta de la arista. Para feeds AGGREGATE, el puerto `feed` acepta múltiples conexiones entrantes; cada una puede marcar `invertSign = true` (arista roja punteada).

### Panel de propiedades (nodo seleccionado)

- **Identidad**: código, mnemónico, orden en nómina
- **Clasificación**: tipo cálculo, naturaleza funcional, modo composición, ámbito
- **Operandos**: lista de puertos con el concepto fuente asignado; puertos sin conectar se muestran en rojo
- **Asignaciones activas**: resumen inline de `ConceptAssignment` para este concepto
- Botones: Editar · Eliminar

### Creación de conceptos

Botón `+ Concepto` en la toolbar abre un drawer lateral con:
1. Código + mnemónico
2. Tipo de cálculo (dropdown) → genera automáticamente los puertos del nodo
3. Naturaleza funcional, ámbito de ejecución, modo de composición, orden
4. El nodo aparece en el canvas al confirmar, pendiente de cableado

### Estado del canvas

El canvas mantiene dos capas de estado: el **estado persistido** (lo que está en BD) y el **estado local** (cambios pendientes de guardar). Los nodos o aristas con cambios locales muestran un indicador visual sutil (borde punteado o badge "●"). El botón `↑ Guardar` se habilita solo cuando hay cambios pendientes.

### Acciones de toolbar

| Acción | Comportamiento |
|--------|---------------|
| `⏵ Validar` | Ejecuta validación local: ciclos, puertos sin conectar, conceptos sin asignación. Muestra errores sobre los nodos afectados. |
| `↑ Guardar` | Persiste todos los cambios pendientes al backend vía API. Requiere validación previa sin errores. Deshabilita el botón al no haber cambios. |
| Selector de contexto | Filtra el canvas por rule system + convenio. Afecta qué `ConceptAssignment` se muestra activo. |

---

## Módulo 2 — Objetos de soporte

Vista de tabla (sin canvas). Dos sub-secciones en la nav: **Tablas** y **Constantes**.

### Constantes (`PayrollObject` type=CONSTANT)

Campos: código, mnemónico, valor decimal, descripción, activo, vigencia (startDate/endDate).  
Uso típico: porcentaje de IRPF, tipo de cotización SS.

### Tablas (`PayrollObject` type=TABLE)

Campos: código, mnemónico, descripción.  
Filas de la tabla: clave → valor decimal, con vigencia temporal.  
Uso típico: tramos de IRPF, tablas de cotización.

---

## Módulo 3 — Reglas de asignación

Vista de tabla filtrable. Cada fila es un `ConceptAssignment`.

**Columnas**: Concepto · Rule System · Empresa · Convenio · Tipo empleado · Prioridad · Desde · Hasta · Activo

**Filtros**: rule system, convenio, tipo empleado, empresa.

**Wildcard**: los campos de empresa/convenio/tipo admiten `*` (cualquiera), igual que el backend.

Acciones: Nueva regla · Editar · Desactivar.

---

## API backend requerida

El backend necesita exponer endpoints CRUD que hoy no existen (la configuración se hace vía Flyway). Nuevos endpoints necesarios:

```
# Conceptos
GET    /payroll-engine/concepts
POST   /payroll-engine/concepts
PUT    /payroll-engine/concepts/{ruleSystemCode}/{conceptCode}
DELETE /payroll-engine/concepts/{ruleSystemCode}/{conceptCode}

# Operandos (wiring)
GET    /payroll-engine/concepts/{ruleSystemCode}/{conceptCode}/operands
PUT    /payroll-engine/concepts/{ruleSystemCode}/{conceptCode}/operands   (reemplaza todos)

# Feed relations
GET    /payroll-engine/concepts/{ruleSystemCode}/{conceptCode}/feeds
PUT    /payroll-engine/concepts/{ruleSystemCode}/{conceptCode}/feeds       (reemplaza todos)

# Objetos (tablas y constantes)
GET    /payroll-engine/objects?type=TABLE|CONSTANT
POST   /payroll-engine/objects
PUT    /payroll-engine/objects/{ruleSystemCode}/{objectCode}
DELETE /payroll-engine/objects/{ruleSystemCode}/{objectCode}

# Asignaciones
GET    /payroll-engine/assignments
POST   /payroll-engine/assignments
PUT    /payroll-engine/assignments/{id}
DELETE /payroll-engine/assignments/{id}
```

Todos los endpoints siguen la convención OpenAPI del proyecto y se añaden a `personnel-administration-api.yaml`.

---

## Seguridad

- Rol requerido: `ADMIN` (los gestores de RRHH no acceden al Designer)
- El token JWT se obtiene del mismo endpoint de auth del backend
- El Designer puede vivir en un subdominio separado: `designer.b4rrhh.local`

---

## Repo y estructura de proyecto

```
b4rrhh_designer/
├── src/
│   ├── app/
│   │   ├── canvas/          # React Flow canvas, custom nodes, edges
│   │   ├── objects/         # Tablas y constantes CRUD
│   │   ├── assignments/     # Reglas de asignación CRUD
│   │   ├── shared/          # Layout, nav, auth
│   │   └── api/             # Clientes generados desde OpenAPI
│   └── main.tsx
├── package.json
└── vite.config.ts
```

El cliente API se genera desde `personnel-administration-api.yaml` (mismo flujo que `b4rrhh_frontend`).

---

## Verificación (criterios de aceptación MVP)

1. **Canvas carga conceptos existentes** — al abrir, el grafo refleja los conceptos actualmente en BD (los del seed V71–V77)
2. **Nuevo concepto RATE×QTY** — crear un concepto de tipo RATE×QTY, cablearlo a dos fuentes, guardar y verificar que el motor lo usa en el siguiente cálculo de nómina
3. **Puerto sin conectar bloqueado** — `Validar` impide guardar si hay puertos de entrada requeridos sin conectar
4. **Ciclo detectado** — si A→B→A, `Validar` señala el ciclo con error visual
5. **Asignación funciona end-to-end** — asignar el nuevo concepto a un contexto desde el módulo de Asignaciones y verificar que aparece en el resultado de nómina del empleado correspondiente
6. **Constante editable** — modificar el valor de una constante (ej. tipo SS) y verificar que el siguiente cálculo usa el valor nuevo
