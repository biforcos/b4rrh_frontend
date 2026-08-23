# ── Etapa 1: construir la SPA ────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# package*.json primero: mientras no cambien las dependencias, Docker
# reutiliza la capa del npm ci, que es la que tarda.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Etapa 2: servir ──────────────────────────────────────────────────
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
# El builder @angular/build:application deja el resultado en browser/.
COPY --from=build /app/dist/b4rrhh-frontend/browser /usr/share/nginx/html

EXPOSE 80
