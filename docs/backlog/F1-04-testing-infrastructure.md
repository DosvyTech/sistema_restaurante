# F1-04 — Infraestructura de pruebas automatizadas

**Prioridad:** P0 · **Dependencias:** F1-02 / CHG-002; F1-03 / CHG-003 implementados · **Estado:** NOT_STARTED · **Change:** CHG-004 — `chg-004-establish-testing-infrastructure`

## Historia
Como equipo técnico, queremos comprobar las funcionalidades mediante pruebas reproducibles, aisladas y ejecutables antes de integrar cambios.

## Objetivos y flujo

- Ejecutar pruebas unitarias de lógica pura mediante Vitest sobre contratos existentes (registro exacto de siete módulos, sin inventar pantallas).
- Ejecutar pruebas de integración contra PostgreSQL temporal en Docker, aprovechando `db:verify` ya existente: migraciones Drizzle, idempotencia, FK, commit y rollback.
- Ejecutar pruebas Playwright con Chromium verdadero para navegar `/` y `/modules`, verificar contenidos de estado 'planificado' y enfoque/viewport móvil.
- Publicar scripts y procedimiento de desarrollo que CHG-005 consumirá posteriormente para CI, dejando claro qué depende de Docker, navegador y fuentes sintéticas.

## Tres tareas y artefactos

**T1 / QA — Vitest:** `vitest.config.ts`, `tests/unit/**`, `package.json`, `package-lock.json`. Script `test:unit` y pruebas reales del módulo registry. Vitest no debe descubrir `node:test` ni E2E.

**T2 / DB-QA — PostgreSQL efímero:** `scripts/test-integration.ts` o equivalente, script `test:integration`. Contenedor PostgreSQL 18.6 aislado, identificación única, puerto aleatorio local y limpieza propia; llamar al `db:verify` de CHG-003 sin modificar su volumen/Compose persistentes ni usar credenciales reales.

**T3 / FE-QA — Playwright:** `playwright.config.ts`, `tests/e2e/**`, `docs/qa/testing-guide.md`, reportes ignorados. Suite `test:e2e` con Chromium, navegación real, siete módulos planificados, viewport móvil y foco visible, más regresiones completas.

## Contratos y protecciones

- `npm run test:unit` no requiere base de datos ni navegador.
- `npm run test:integration` debe crear y eliminar sus recursos propios, incluso si fallan pruebas; no consumir la URL `.env` del usuario.
- `npm run test:e2e` usa un servidor Next.js de pruebas en loopback y no requiere PostgreSQL.
- Los tests de CHG-003 siguen operativos. No implementar CI ni rulesets (CHG-005), módulos o datos reales.
- Conservar la excepción provisional de cuatro avisos moderados de `esbuild` documentada durante CHG-003; no reducir la seguridad para simular `npm audit` aprobado.

## Acceptance Criteria

- **F1-04-AC-01:** Vitest se ejecuta de forma determinista dos veces, con tests sobre comportamiento real y prueba negativa comprobada.
- **F1-04-AC-02:** las suites unitarias no cargan tests DB `node:test` ni tests de Playwright.
- **F1-04-AC-03:** PostgreSQL temporal se aprovisiona y aísla por ejecución; reutiliza tests de migraciones, FK, commit/rollback sin conexión a producción.
- **F1-04-AC-04:** sucesivas ejecuciones de integración dejan cero contenedores de prueba huérfanos y no alteran `dosvy-chg003-postgres` ni `dosvy_chg003_pgdata`.
- **F1-04-AC-05:** una falla controlada detona error y limpieza de recursos propios; nunca se degrada a DB compartida.
- **F1-04-AC-06:** Playwright/Chromium navega `/` → `/modules`, comprueba siete módulos y teclado/foco en móvil; fallos salen con código no cero.
- **F1-04-AC-07:** `npm run typecheck`, `npm run lint`, `npm run check:boundaries`, `npm run build`, `npm run db:check` y OpenSpec strict pasan.
- **F1-04-AC-08:** documentación de configuración, repetición, limpieza, condiciones y resultados reales sin afirmar pruebas no ejecutadas.

## Definition of Done

Las tres tareas disponen de evidencia verificable, las suites corren sin depender de datos reales, la base se elimina al terminar y `openspec validate chg-004-establish-testing-infrastructure --strict` aprueba. No fusionar ni archivar automáticamente.
