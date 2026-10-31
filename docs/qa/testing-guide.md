# Guía de pruebas

Esta guía describe las tres suites de CHG-004. Usan el catálogo estático existente y datos sintéticos; no habilitan operaciones de restaurante ni leen bases de producción.

## Versiones y requisitos

- Node.js `24.12.0` (versión del `.nvmrc`; el mínimo declarado es `20.19.0`).
- npm `11.6.2` fijado por `packageManager` en `package.json`.
- Vitest `4.1.12` y Playwright `1.64.1`, instalados como dependencias de desarrollo exactas.
- Docker Desktop con Docker Engine disponible y acceso al registro para la imagen `postgres:18.6-alpine`.
- Chromium instalado para la versión de Playwright del lockfile: `npx playwright install chromium`.

Instalación limpia:

```powershell
npm ci
```

## Suite unitaria — Vitest

```powershell
npm run test:unit
npm run test:unit:watch
```

`test:unit` usa `vitest run`, por lo que termina sin activar watch. `vitest.config.ts` incluye únicamente `tests/unit/**/*.test.ts`, configura el alias `@` y excluye explícitamente `tests/db/**` y `tests/e2e/**`. Las pruebas `node:test` de CHG-003 siguen bajo `npm run db:verify`.

La prueba de `src/modules/registry.ts` comprueba los IDs exactos `MOD-01/02/03/04/05/08/09`, unicidad y estado `planned`. Para comprobar el contrato negativamente, se cambió temporalmente `MOD-01` por el ID no permitido `MOD-10`: Vitest falló en la aserción de IDs. El registro se restauró y la suite volvió a pasar.

## Integración — PostgreSQL temporal

```powershell
npm run test:integration
```

Cada invocación crea su propio contenedor con nombre y etiquetas aleatorias, imagen `postgres:18.6-alpine`, usuario/contraseña sintéticos, puerto aleatorio publicado solo en `127.0.0.1` y `tmpfs` descartable. Comprueba readiness con `pg_isready` y ejecuta el `npm run db:verify` existente. Ese verificador migra dos bases vacías, comprueba reaplicación idempotente y corre las pruebas existentes de FK, commit y rollback.

El entorno hijo reemplaza `DATABASE_URL`, `TEST_DATABASE_URL` y las variables `PG*`/`POSTGRES_*` con valores que apuntan exclusivamente al contenedor de esta ejecución. No usa URLs heredadas de la consola ni valores de `.env`. Las URLs se mantienen fuera de la salida. El orquestador captura el ID del contenedor y en `finally` elimina únicamente ese ID y sus volúmenes anónimos; no ejecuta `compose down`, prune ni borra volúmenes nombrados. Compara antes/después los IDs de contenedores, volúmenes y el estado de `dosvy-chg003-postgres` y `dosvy_chg003_pgdata`.

Para verificar el manejo de fallo intencional después de readiness:

```powershell
npm run test:integration -- --simulate-failure-after-ready
```

Este comando debe salir distinto de cero y confirmar la limpieza del contenedor temporal. No es una prueba aprobada ni reemplaza las dos ejecuciones exitosas.

Si Docker no está disponible, la suite falla explícitamente; no hay fallback a PostgreSQL persistente. Para inspeccionar residuos de ejecuciones identificadas por etiqueta:

```powershell
docker ps -a --filter "label=com.dosvy.change=chg-004-establish-testing-infrastructure"
```

Después de una ejecución completa no debe quedar ningún contenedor listado por ese filtro.

## E2E — Playwright y Chromium

Instala Chromium una vez por versión del lockfile y ejecuta:

```powershell
npx playwright install chromium
npm run test:e2e
```

El runner reserva un puerto libre en loopback. `playwright.config.ts` inicia una compilación y un `next start` temporales ligados a `127.0.0.1`, con `reuseExistingServer: false`; así no se conecta a otro servidor local. El servidor de pruebas recibe URLs de base vacías y variables PG vacías; `/` y `/modules` se prueban sin PostgreSQL. Al finalizar Playwright, su `webServer` cierra el proceso temporal.

Los casos verifican navegación desde `/` a `/modules`, los siete IDs aprobados, el rótulo `Planificado · no implementado` en cada módulo, navegación con viewport de 375 px y navegación con teclado/foco visible. Los reportes y traces de fallos quedan bajo `test-results/`; `playwright-report/`, `test-results/` y `blob-report/` están ignorados por Git.

## Regresión y registro de CHG-004

```powershell
npm run typecheck
npm run lint
npm run check:boundaries
npm run build
npm run db:check
npx openspec validate chg-004-establish-testing-infrastructure --strict
git diff --check
```

Resultados ejecutados con Node.js `24.12.0`, npm `11.6.2` (pin del repositorio), Docker Engine `29.9.2`, Vitest `4.1.12`, Playwright `1.64.1`, Chromium `156.0.8078.4` y PostgreSQL `18.6-alpine`:

| Verificación | Resultado |
|---|---|
| `npm ci` | Pasó con npm `11.6.2`; instaló 253 paquetes del lockfile. Reportó las advertencias deprecadas conocidas de `@esbuild-kit` y cuatro vulnerabilidades moderadas pendientes; no se aplicó `npm audit fix --force`. |
| `npm run test:unit` | Pasó dos veces: 2/2 pruebas en cada ejecución. La prueba negativa temporal falló con el ID no aprobado, como se esperaba; después se restauró el registro. |
| `npm run test:integration` | Pasó dos veces: 10/10 pruebas `node:test` en cada ejecución. La segunda se ejecutó con URLs no locales heredadas y confirmó el aislamiento. |
| Fallo controlado de integración | Código de salida 1 esperado; el contenedor y almacenamiento temporal se eliminaron y los recursos previos quedaron intactos. |
| `npm run test:e2e` | Pasó dos veces con Chromium: 3/3 pruebas en cada ejecución. |
| `npm run typecheck` | Pasó después de incorporar las configuraciones y scripts. |
| `npm run lint` | Pasó. |
| `npm run check:boundaries` | Pasó: 12 módulos y 11 dependencias, sin violaciones. |
| `npm run build` | Pasó; `/` y `/modules` prerenderizaron como rutas estáticas. |
| `npm run db:check` | Pasó; el journal de migraciones está consistente. |
| `openspec validate chg-004-establish-testing-infrastructure --strict` | Pasó: el Change es válido. |
| `git diff --check` | Pasó sin errores de whitespace. |
| `npm audit` | Sigue saliendo con cuatro avisos moderados, todos en la cadena conocida de `esbuild@0.18.20`; no aparecieron avisos adicionales. |
| `npm audit --omit=dev` | Pasó: cero vulnerabilidades. |

## Riesgo de dependencias pendiente

La auditoría completa conserva cuatro avisos moderados de `esbuild@0.18.20` en la cadena de desarrollo de Drizzle Kit. Es la excepción provisional documentada en [dependency-audit.md](../security/dependency-audit.md), no una auditoría limpia ni una aprobación de esos avisos. En CHG-003, `npm audit --omit=dev` había reportado cero vulnerabilidades.
