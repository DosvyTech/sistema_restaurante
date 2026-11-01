# CHG-006 — Entornos, Docker y despliegue reproducible (F1-06)

## Why

Dosvy entrega un monolito modular Next.js/Node y PostgreSQL/Drizzle, probado en CI (CHG-003 a CHG-005). Falta un mecanismo reproducible para instalar **un restaurante por VPS** Ubuntu LTS, con red privada, HTTPS y migraciones controladas. El `compose.yaml` actual es **solo desarrollo** (`dosvy-chg003`, volumen `dosvy_chg003_pgdata`, puerto 127.0.0.1:55432); no es apto para producción y no debe romperse.

**Prioridad:** P0. **Dependencias:** F1-03/CHG-003 y F1-05/CHG-005 implementados, integrados y verificados. Ambas están cumplidas en `main` al crear esta planificación.

## What Changes

- Declarar configuración de despliegue separada y versionada para contenedores de aplicación Next.js, PostgreSQL por instalación y Caddy. Imágenes reproducibles; configuración por instalación, sin editar código ni copiar secretos al repositorio.
- Introducir Caddy como único punto HTTP(S) público; DNS, certificados TLS automáticos y persistentes, red privada para PostgreSQL y aplicación. Seguridad de host y administración documentadas.
- Proveer inicialización, actualización y rollback controlados, con migraciones de Drizzle versionadas revisadas; ejecutar una instalación nueva y un despliegue en **staging autorizado** con evidencia. No declarar HTTPS real sin dominio DNS y certificado comprobados.

## Capabilities

### New Capabilities
- `reproducible-restaurant-deployment`: instalación aislada, despliegue seguro en VPS, configuración, comprobaciones y evidencia de staging.

### Modified Capabilities
- Ninguna de negocio; se conserva la suite y reglas de CHG-005. Puede añadirse un endpoint mínimo de salud sin exponer información sensible si la implementación lo requiere.

## Impacto

Posibles artefactos en Apply: `deploy/` (Compose, Caddyfile, Dockerfile, scripts de despliegue/validación), `.dockerignore`, ajustes acotados de `next.config.ts` para build standalone y `docs/operations/deployment-runbook.md`. Rutas definitivas se fijan inspeccionando el checkout antes de editar. Conservar `compose.yaml` y contenedores/volúmenes de desarrollo.

## Out of scope

No desplegar en servidores de clientes ni producción real sin autorización explícita; no facturación/autenticación de negocio; no Kubernetes; no introducir monitoring/pgBackRest/WAL/alertas (CHG-007); no DNS ficticio, certificados falsamente presentados como públicos, ni credenciales de producción en CI o Git. No usar `drizzle-kit push` ni desactivar protecciones del migrador local para aceptar una URL remota.

## Cierre

Tres tareas y evidencia real de instalación limpia, aislamiento de bases, acceso TLS válido en staging cuando esté autorizado y actualización/rollback documentados. Si falta VPS/dominio/acceso aprobado para validar staging, dejar T3 pendiente y reportar el bloqueo; no sustituirlo por una simulación local.
