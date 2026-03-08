# B4RRHH Frontend - Repository Instructions

This repository implements the frontend for B4RRHH, an HR application for Spain.

## Core frontend principles

- The frontend is autonomous from the backend.
- It must be buildable, testable, and deployable independently.
- The backend contract is the source of truth for API communication.
- Do not hardcode backend assumptions that are not present in OpenAPI.
- Do not invent fields, endpoints, filters, or payloads.

## Architecture principles

- Use modern Angular with standalone components and signals where appropriate.
- Prefer signals plus services over heavier state libraries unless explicitly needed.
- Keep a clear separation between:
  - presentation components
  - smart/container components
  - application services
  - API client layer
- Components must remain thin.
- Business rules must not be hidden inside templates.
- Avoid coupling UI state with transport models more than necessary.

## API contract rules

- OpenAPI is the source of truth.
- If generation is used, generated clients/models belong to a dedicated boundary area and must not leak uncontrolled throughout the app.
- Wrap generated clients when needed to keep the app stable against contract evolution.
- Frontend naming must remain aligned with contract naming in API-facing code.
- View models may differ from API models when it improves UI clarity.

## Functional scope

Current scope is Personnel Administration for Spain only.

Included in pilot scope:
- Employee maintenance
- Personal data views/forms
- Contract views/forms
- Work center assignment
- Collective agreement category
- Collective agreement
- Regulation concept similar to HRAccess "reglementation"

Excluded for now:
- Payroll
- Legal reporting
- Any payroll-specific workflows

Do not mix Personnel Administration and Payroll concepts in components, routes, navigation, or models.

## UX and i18n

- i18n is required from the start.
- UI text must be ready for localization.
- Do not scatter literal strings across the codebase.
- Keep code identifiers in English.
- User-facing initial language may be Spanish, but implementation must remain localization-ready.
- Forms must be explicit, validated, and user-friendly.
- Prefer reactive patterns and predictable state transitions.

## Security

- Frontend must be designed for role-aware behavior.
- Do not rely on hidden UI elements as the only protection.
- Treat authorization as enforced by the backend.
- Frontend may adapt navigation and visibility by role, but never assume security is guaranteed client-side.

## Code quality

- Keep components focused and small.
- Prefer composition over monolithic pages.
- Avoid putting data access directly in components.
- Prefer typed models.
- Avoid any, implicit magic, and over-clever abstractions.
- Keep naming explicit and in English.

## Testing policy

- Add tests for non-trivial services, state handling, and important UI behavior.
- Do not consider generated code enough justification to skip tests around integration points.
- Avoid brittle tests tied to irrelevant DOM details.

## Copilot behavior rules

- Copilot may generate scaffolding, refactorings, and tests.
- Copilot must not invent business rules or legal interpretations.
- Copilot must not invent API shapes not present in OpenAPI.
- Copilot must not invent data model assumptions that belong to backend design decisions.
- Prefer conservative, maintainable code over flashy patterns.
- When in doubt, propose the smallest change consistent with the current contract.