# CHG-006 — Entornos, Docker y despliegue reproducible (F1-06)

## Why

Dosvy entrega un monolito modular Next.js/Node y PostgreSQL/Drizzle, probado en CI (CHG-003 a CHG-005). Falta un mecanismo reproducible para instalar **un restaurante por VPS** Ubuntu LTS, con red privada, HTTPS y migraciones controladas. El `compose.yaml` actual es **solo desarrollo** (`dosvy-chg003`, volumen `dosvy_chg003_pgdata`, puerto 127.0.0.1:55432); no es apto para producción y no debe romperse.

**Prioridad:** P0. **Dependencias:** F1-03/CHG-003 y F1-05/CHG-005 implementados, integrados y verificados. Ambas están cumplidas en `main` al crear esta planificación.

## What Changes

- Declarar configuración de despliegue separada y versionada para contenedores de aplicación Next.js, PostgreSQL por instalación y Caddy. Imágenes reproducibles; configuración por instalación, sin editar código ni copiar secretos al repositorio.
- Introducir Caddy como único punto HTTP(S) público; DNS, certificados TLS automáticos y persistentes, red privada para PostgreSQL y aplicación. Seguridad de host y administración documentadas.
- Proveer inicialización, actualización y rollback de aplicación controlados, con migraciones Drizzle versionadas; validar una instalación nueva y una actualización **en proyectos Docker aislados con datos sintéticos**. El staging público y su TLS se verifican al habilitar el primer VPS real, no se simulan como completos.

## Capabilities

### New Capabilities
- `reproducible-restaurant-deployment`: instalación aislada, despliegue seguro en VPS, configuración, comprobaciones y evidencia de staging.

### Modified Capabilities
- Ninguna de negocio; se conserva la suite y reglas de CHG-005. Puede añadirse un endpoint mínimo de salud sin exponer información sensible si la implementación lo requiere.

## Impacto

Posibles artefactos en Apply: `deploy/` (Compose, Caddyfile, Dockerfile, scripts de despliegue/validación), `.dockerignore`, ajustes acotados de `next.config.ts` para build standalone y `docs/operations/deployment-runbook.md`. Rutas definitivas se fijan inspeccionando el checkout antes de editar. Conservar `compose.yaml` y contenedores/volúmenes de desarrollo.

## Out of scope

No desplegar en servidores de clientes ni producción real sin autorización explícita; no facturación/autenticación de negocio; no Kubernetes; no introducir monitoring/pgBackRest/WAL/alertas (CHG-007); no DNS ficticio, certificados falsamente presentados como públicos, ni credenciales de producción en CI o Git. No usar `drizzle-kit push` ni desactivar protecciones del migrador local para aceptar una URL remota.

## Principio de alcance — restaurante pequeño

Un restaurante pequeño (aprox. 1–10 usuarios simultáneos) debe operar con **una app Next.js + PostgreSQL + Caddy por VPS**, sin Kubernetes, microservicios, servicios de monitoreo redundantes ni una plataforma de despliegue multi-tenant. Se conserva la seguridad necesaria: secretos externos, DB privada, aislamiento, TLS obligatorio al salir a Internet, migraciones controladas y CI protegido. Ver también `docs/architecture/small-restaurant-principles.md`.

## Cierre del Change vs. puesta en servicio

**Cerrar CHG-006:** comprobar Dockerfile/Compose reproducible, secretos y aislamiento, validación Caddy, HTTP→HTTPS con certificado **local** claramente identificado, y prueba real de arranque limpio, migración idempotente, actualización y smoke en proyectos Docker desechables. Documentar rollback compatible. No se exige alquilar un VPS público para aceptar código de infraestructura.

**Antes de activar cualquier instalación accesible a clientes:** es obligatorio validar DNS, certificado HTTPS **público y confiable**, firewall/puertos desde fuera del host, almacenamiento persistente, permisos, migraciones, salud y recuperación/respaldo operativo. Registrar este gate en el runbook; si falta VPS/dominio, el estado es **NO VALIDADO PARA PRODUCCIÓN**, aunque CHG-006 quede 3/3. Jamás describir el certificado local como TLS público.
