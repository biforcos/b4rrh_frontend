# Local OpenAPI snapshot

Source of truth is backend contract:

- ../b4rrrh_backend/openapi/personnel-administration-api.yaml

Do not edit the local YAML manually.
Always refresh it with:

- npm run api:pull

api:pull keeps two synchronized copies:

- openapi/personnel-administration-api.yaml
- src/app/core/api/generated/personnel-administration-api.yaml

Then generate frontend API client with:

- npm run api:generate
