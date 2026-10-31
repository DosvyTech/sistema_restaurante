# Design — CHG-004 / F1-04

## Estado real de referencia

En `feature/chg-003-establish-database-foundation` se verificaron: `package.json` con Node >=20.19.0 y pin 24.12.0, Next 16.4.3, `db:verify`, `scripts/db-verify.ts`, `tests/db/{config,transactions}.test.ts`, `compose.yaml` del proyecto `dosvy-chg003` con PostgreSQL `18.6-alpine`, `src/app/page.tsx`, `src/app/modules/page.tsx` y el registro `src/modules/registry.ts`. `db:verify` crea dos DB efímeras y ejecuta los tests DB, pero depende de un servidor PostgreSQL ya accesible en la URL de prueba. CHG-004 añade **orquestación temporal completa** sin reutilizar el contenedor persistente de desarrollo.

Antes de aplicar, inspeccionar en el checkout actual scripts, nombres de módulos, paquetes, cambios Git y decisiones CHG-001/002/003. No sobrescribir archivos si CHG-003 ha evolucionado.

## Objetivos / exclusiones

**Objetivos:** tres suites ejecutables y deterministas; datos sintéticos; arranque y eliminación exclusiva de PostgreSQL temporal; E2E en navegador; comandos de ejecución local y uso posterior por CI.

**Exclusiones:** funcionalidades de negocio, cambios de permisos, reglas de `main`, GitHub Actions, sustitución obligatoria de pruebas DB ya aprobadas.

## Decisión D1 — Suite unitaria Vitest

- Incorporar `vitest` (y soporte Next/React Testing Library si la prueba lo necesita) como dependencias de desarrollo con versiones compatibles y lockfile.
- Scripts `test:unit` (`vitest run`, sin watch en CI); `test:unit:watch` opcional para desarrollo; `test:coverage` opcional si aporta a la suite. Directorio `tests/unit/**` o pruebas junto al módulo; documentar convención.
- Primeros casos reales: `plannedModules` contiene exactamente MOD-01/02/03/04/05/08/09, sin MOD-10, sin IDs repetidos y etiquetados planificados; comportamiento de un componente compartido si su render puede probarse sin instanciar Server Components asíncronos.
- Mantener `tests/db/**` en `node:test`, ejecutados por `db:verify`; configurar `vitest.config.ts` para excluir pruebas DB/E2E y evitar dobles ejecuciones o conexiones no autorizadas. Respetar aliases `@/*` y arquitectura `server-only`.
- No convertir los tests en snapshots triviales ni mockear los mismos resultados que se buscan demostrar.

## Decisión D2 — Docker PostgreSQL efímero por ejecución

- Crear un orquestador `scripts/test-integration.ts` o equivalente `npm run test:integration`. Arrancar un contenedor exclusivo `postgres:18.6-alpine` con nombre `dosvy-chg004-test-<run-id>`, etiqueta de propiedad, usuario/contraseña **sintéticos y exclusivos**, puerto dinámico vinculado a `127.0.0.1`, sin volúmenes nombrados persistentes.
- El almacenamiento del contenedor de pruebas será descartable (volumen anónimo asociado solo a ese contenedor o tmpfs compatible). Al cerrar, eliminar **solo el contenedor con nombre/ID conocido que creó esta ejecución**, en `finally`, inclusive ante tests fallidos o timeout; no tocar `dosvy-chg003-postgres`, volumen `dosvy_chg003_pgdata`, otros contenedores, redes o archivos de otros proyectos.
- Comprobar servicio healthy/readiness y puerto publicado, construir `TEST_DATABASE_URL` en la ejecución con base `dosvy_test`, host loopback y password sintético; construir `DATABASE_URL` diferente, también dentro del mismo servidor temporal, p. ej. `dosvy_dev`, si el proceso lo requiere. Sobrescribir explícitamente valores locales heredados para la ejecución hija y **verificar host/nombre antes de lanzar ningún DDL**; nunca caer sobre la URL en `.env`.
- Invocar el **`npm run db:verify` existente** y conservar sus pruebas de migraciones en dos bases nuevas, reintento idempotente, FK, commit y rollback. La ejecución temporal debe poder repetir `test:integration` sin colisiones o residuos, también tras fallo intencional.
- Docker no disponible, permiso denegado o puertos no asignables: fallar claramente, no degradar silenciosamente a una base compartida. Evidencia incluye contenedores existentes antes/después y ausencia del contenedor efímero, sin imprimir contraseñas.
- No reemplazar `compose.yaml` de CHG-003 ni reconfigurar la instalación de desarrollo existente.

## Decisión D3 — Playwright E2E real, separado de base de datos

- Instalar `@playwright/test` y navegador **Chromium** para la primera suite. `playwright.config.ts` usa `webServer` para iniciar un servidor Next.js de prueba en loopback, con puerto dedicado disponible y entorno sin URL real de DB.
- Ejecutar una compilación `npm run build` antes del server productivo, o definir un script que garantice su construcción; ejecutar `next start` con puerto de test, sin reutilizar automáticamente otro servidor que pueda atender ese puerto. Los E2E no requieren PostgreSQL porque `/` y `/modules` son públicos y están desacoplados de DB.
- `tests/e2e/**`: navegación `/` → `/modules`, siete identificadores exactos, etiquetas `Planificado · no implementado`, vínculos/encabezados accesibles y al menos un viewport estrecho con navegación por teclado. No asumir que el render estático demuestra accesibilidad integral; registrar límites.
- Datos sintéticos solamente desde el catálogo existente y fixtures de prueba declarados; ninguna credencial o seed de producción. `npx playwright install chromium` documentado. Guardar reportes y traces en carpetas ignoradas por Git; conservar evidencia de fallo con trace/screenshot si está disponible.
- `npm run test:e2e` debe fallar si el navegador o `webServer` no está disponible; no marcar la tarea como completa basándose solo en HTTP 200.

## Contratos / scripts previstos

- `test:unit`: Vitest en modo no interactivo.
- `test:integration`: orquestación de PostgreSQL efímero + reutilización de `db:verify`.
- `test:e2e`: Playwright Chromium real contra servidor test Next.js.
- `test:all` opcional: ejecución secuencial explícita de los tres, no sustituye scripts independientes.

## Estrategia de verificación

1. `npm ci`, `npm run test:unit` dos veces; test deliberadamente fallido temporal provoca salida no cero; restaurar fixture.
2. `npm run test:integration` dos veces; revisar 10 tests DB existentes, migración/idempotencia, contenedor eliminado en ambos éxitos y ante fallo controlado.
3. `npx playwright install chromium`, `npm run test:e2e` dos veces; comprobar navegación real en viewport móvil/teclado y manejo de fallo.
4. Regresión: `npm run typecheck`, `npm run lint`, `npm run check:boundaries`, `npm run build`, `npm run db:check`, `openspec validate chg-004-establish-testing-infrastructure --strict`, `git diff --check`.
5. Documentar versiones, comandos, datos ficticios, resultados reales, limitaciones y limpieza en `docs/qa/testing-guide.md`; si Docker o Chromium no ejecutan, la tarea correspondiente permanece sin completar.

## Riesgos y alternativas

- Testcontainers podría automatizar Docker, pero añade complejidad y versionado; preferimos un script dedicado y acotado que reutilice el `db:verify` existente.
- Pruebas de Server Components asíncronos con Vitest son limitadas; el contrato de navegación se verifica con Playwright.
- No exigir cobertura de módulos de negocio inexistentes ni pruebas de CI antes de CHG-005.
- Si el npm audit de desarrollo sigue mostrando cuatro avisos `esbuild` conocidos, registrar estado, conservar la excepción existente y no utilizar `npm audit fix --force` para lograr que un gate pase.
