# CHG-004 — Infraestructura de pruebas automatizadas (F1-04)

## Why

CHG-002 proporciona Next.js App Router, TypeScript estricto, ESLint y revisión de límites de importación. CHG-003 incorpora PostgreSQL, Drizzle, migraciones y un verificador `npm run db:verify` basado en `node:test` que requiere una base PostgreSQL local. Falta un flujo homogéneo y repetible de pruebas **unitarias, integración DB autónoma y E2E en navegador**. Este Change prepara esa infraestructura sin implementar funcionalidades de restaurante.

## What Changes

- Instalar y configurar **Vitest** para pruebas unitarias y, solo si resulta necesario, React Testing Library; añadir tests reales sobre código ya existente (p. ej. registro de siete módulos) y scripts no interactivos aptos para CI.
- Disponer de un **PostgreSQL temporal exclusivo por ejecución**, con Docker y la misma versión principal usada por CHG-003. Reutilizar `db:verify` y sus diez pruebas existentes, integrándolos en una ejecución aislada sin tocar el contenedor `dosvy-chg003-postgres`, el volumen `dosvy_chg003_pgdata` ni otros proyectos.
- Configurar **Playwright** con Chromium, `webServer` que ejecute una compilación Next.js de prueba y pruebas reales de `/` → `/modules`, visibilidad de los siete módulos y navegación a viewport móvil. Utilizar únicamente datos estáticos/sintéticos; no inventar operaciones administrativas.
- Documentar comandos reproducibles, aislamiento de datos, configuración, limpieza, diagnóstico de fallos y estado de las suites.

## Capabilities

### New Capabilities

- automated-testing-foundation: comandos reproducibles para pruebas unitarias con Vitest, integración con PostgreSQL efímero y E2E con Playwright, con aislamiento y limpieza verificables.

### Modified Capabilities

- Ninguna regla de negocio. Se integran y conservan los tests existentes de CHG-003 sin reemplazarlos ni declararlos obsoletos.

## Impact

- Previsto durante Apply: `vitest.config.ts`, `tests/unit/**`, `scripts/test-integration.ts` o equivalente, `playwright.config.ts`, `tests/e2e/**`, scripts npm, ajustes de `.gitignore`, `docs/qa/testing-guide.md`.
- Dependencias materiales: CHG-002 y CHG-003 implementados, disponibles en el checkout real; el diseño y la migración inicial se conservan.
- CI GitHub Actions y controles de calidad obligatorios **no se implementan aquí**; corresponden a CHG-005.
- La automatización E2E en Chromium es el alcance mínimo; Firefox/WebKit podrán añadirse si el costo no dificulta el flujo local.

## Out of Scope

- CI/CD GitHub Actions, rulesets y protección de ramas (CHG-005).
- Nuevas entidades de negocio, seeds de clientes reales, autenticación, facturas o despliegues.
- Sustituir todas las pruebas `node:test` existentes por Vitest por el solo hecho de unificar frameworks.
- Usar datos de producción ni ejecutar `docker system prune`, `docker volume prune` o `docker compose down -v` sobre recursos compartidos.

## Preconditions / risks

- El PR de implementación de CHG-003 puede no estar fusionado a `main` aún; **no iniciar Apply sobre una rama que carezca de `db:verify`, migraciones, código y contenedor definidos en CHG-003**.
- Si Docker Desktop o Chromium no están disponibles, informar bloqueo y dejar tarea afectada pendiente: no falsificar validaciones.
- Seleccionar versiones estables compatibles con Node pin del repositorio y lockfile; no añadir overrides inseguros ni borrar la excepción documentada de `esbuild` en `docs/security/dependency-audit.md`.
