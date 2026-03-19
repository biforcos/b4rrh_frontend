# B4RRHH Frontend

Frontend Angular para B4RRHH con base orientada a backoffice administrativo y crecimiento por verticales.

## Stack

- Angular 21 con standalone components
- Routing moderno con lazy loading por feature
- Signals + servicios ligeros para estado local
- Vitest para pruebas unitarias

## Estructura base

```
src/app/
	core/
		api/
			generated/
			clients/
			mappers/
		i18n/
		layout/
	shared/
		ui/
	features/
		employee/
			shell/
			overview/
			contact/
			presence/
			data-access/
```

## Ejecutar en local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar frontend en modo desarrollo:

```bash
npm start
```

El frontend usa [proxy.conf.json](proxy.conf.json) para reenviar rutas de backend al servidor local de Spring Boot en http://localhost:8080.

## Generacion de cliente OpenAPI

El contrato fuente de verdad esta en el backend:

- ../b4rrrh_backend/openapi/personnel-administration-api.yaml

No se copia manualmente.
Se sincroniza automaticamente en:

- openapi/personnel-administration-api.yaml
- src/app/core/api/generated/personnel-administration-api.yaml

Comandos:

- npm run api:pull
- npm run api:generate
- npm run api:refresh

Detalles:

- api:pull sincroniza el contrato desde el repo backend al repo frontend (snapshot en openapi y copia junto a generated).
- api:generate genera cliente TypeScript en src/app/core/api/generated usando la copia local.
- api:refresh ejecuta pull + generate.

Reglas:

- El codigo generado se escribe en src/app/core/api/generated.
- No editar manualmente archivos dentro de generated.
- Adaptadores propios y mapeos van en core/api/clients y core/api/mappers.

## Build y tests

```bash
npm run build
npm run test
```
