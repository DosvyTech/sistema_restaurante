# Design — CHG-003 / F1-03: PostgreSQL + Drizzle

## Context and prerequisites

F1-01 define el monolito modular y propiedad de datos por módulo. F1-02 crea la aplicación Next.js App Router, Node.js, TypeScript estricto, `src/app`, `src/modules`, `src/shared`, alias y validaciones de importación. Antes de aplicar este Change, **leer los archivos reales que Codex generó para CHG-002**: `package.json`, `tsconfig.json`, `src/shared/server/**`, `docs/architecture/runtime-conventions.md`, `DESIGN.md` si existe, `openspec/changes/chg-002-bootstrap-modular-nextjs/tasks.md` y comprobar la rama.

No adoptar desde la rama de planificación una estructura contradictoria con el CHG-002 implementado. Si la implementación todavía no está publicada en GitHub, continuar únicamente sobre un checkout local donde se haya completado y comprobarlo con los gates reales. No sobrescribir `package.json` ni `src/shared` al recuperar este Change.

## Goals / non-goals

**Goals:** crear la base técnica PostgreSQL/Drizzle, un primer baseline SQL versionado, manejo seguro de conexiones/transacciones y pruebas reproducibles de migración/integridad/rollback.

**Non-goals:** modelos de negocios, Better Auth, API externas, migraciones de producción, Docker/Caddy de producción, CI y pruebas UI.

## D1 — PostgreSQL y diseño físico mínimo

- PostgreSQL es una base **por restaurante/instalación**, en red privada o local, nunca compartida entre negocios. En CHG-003 solo se usan bases aisladas de desarrollo/pruebas; no conectar a una base fiscal o de clientes.
- Usar un namespace PostgreSQL propio (por defecto `app`) como contrato de pertenencia futura, creado por la **primera migración SQL versionada**. La migración puede ser custom de Drizzle Kit si no existen tablas todavía. No crear entidades ficticias permanentes (`users`, `orders`, `sales`, `probe_parent`) para anticipar módulos posteriores.
- La integridad referencial se demuestra mediante **tablas fixture efímeras en la base exclusivamente de pruebas**, separadas de migraciones de producción, y desaparecen tras la ejecución. Validar FK `RESTRICT`/rechazo de referencia inexistente y transacción fallida con rollback.
- Convenciones físicas documentadas para Changes futuros: claves primarias inmutables, FKs indexadas cuando el patrón de consultas lo requiera, `not null` según negocio, singular/plural y snake_case elegidos consistentemente por este Change; timestamps en timestamptz UTC; cantidades monetarias `numeric` (no floating point) cuando se implementen. No decidir físicamente columnas fiscales aquí.

## D2 — Drizzle ORM, driver y migraciones

- Elegir Drizzle ORM con `pg` / `drizzle-orm/node-postgres`; Drizzle Kit ejecutado como devDependency. Fijar paquetes **estables compatibles** y registrar versiones reales en lockfile; no adoptar versiones `@rc` salvo decisión posterior justificada.
- Centralizar `drizzle.config.ts`, `src/shared/server/db/schema.ts` (o carpeta modular equivalente definida por CHG-002) y `drizzle/**` para migraciones y snapshots versionados.
- Scripts esperados o equivalentes documentados: `db:generate` (`drizzle-kit generate`), `db:migrate` (`drizzle-kit migrate`), `db:check` (`drizzle-kit check` si aplica a versión instalada), `db:test` (pruebas aisladas), y `db:verify` (secuencia reproducible). No ejecutar `db:push` como forma de desplegar.
- La primera migración establece el namespace o preparación neutral mínima, sin DDL de módulos de negocio; ha de producir cambio comprobable sobre una BD vacía. Si el cambio manual de namespace requiere migración custom, utilizar formato/journal correcto **generado por la CLI instalada**, no inventar estructura/snapshots.
- Repetir `migrate` sobre la misma base no duplica operaciones; una segunda base nueva queda en el mismo estado. Nunca eliminar/aplicar SQL destructivo indiscriminado a producción.

## D3 — Conexión Node-only y variables de entorno

- Exponer un módulo de servidor en `src/shared/server/db` (ajustar a convenciones reales de F1-02) con `import 'server-only'` y driver `pg.Pool`.
- `DATABASE_URL` es obligatoria **solo al usar DB o ejecutar migraciones**, no durante la compilación ni al renderizar `/` y `/modules`. Validar URL y valores obligatorios cuando se intenta obtener una conexión, con errores controlados sin reflejar cadenas de credenciales.
- `TEST_DATABASE_URL` será independiente de `DATABASE_URL`. El ejecutor de tests deberá verificar un host local/permitido para pruebas, base cuyo nombre identifique claramente prueba, rechazo si las URLs coinciden y rechazo de hosts externos por defecto; nunca caer automáticamente sobre `DATABASE_URL`.
- `.env.example` contiene solo placeholders seguros; archivos `.env*` reales deben estar ignorados por Git (excepto plantilla); no incluir secretos en logs, fixtures o snapshot.
- Pool reutilizable por proceso Node, tamaño y timeouts acotados según configuración; cerrable en scripts y pruebas para evitar procesos colgados; **no mantener transacciones entre solicitudes HTTP**.
- El módulo de DB no puede importarse en componentes cliente ni durante procesamiento Edge.

## D4 — Contrato de transacción

- Crear función o servicio `withTransaction<T>(callback: (tx: DrizzleTransaction) => Promise<T>): Promise<T>` o contrato fuertemente tipado compatible con la versión instalada: inicia transacción local; callback usa **el contexto tx**; confirma solo si el callback termina con éxito; fallo o excepción obliga rollback, propaga error seguro y libera conexión.
- Distinguir `DbContext` para operaciones habituales y `TxContext` para operación atómica futura; no llamar desde un callback transaccional a servicios que usen una nueva conexión o autocommit. Asegurar propiedad de conexión y límites de uso en documentación.
- No crear todavía el orquestador comercial de MOD-09, ni un repositorio genérico que escriba datos de otros dominios.
- Pruebas deben ejercitar inserción doble en tablas fixture con fallo intermedio, rollback de ambas; comprobar commit de caso exitoso y cierre de conexión.

## D5 — Test fixture PostgreSQL aislado y evaluación

- Para pruebas, PostgreSQL local **propio** por Docker (si está disponible) o instancia de pruebas autorizada. Utilizar nombres y puertos explícitos y no tocar contenedores/volúmenes ajenos.
- El test runner puede ser `node:test` + `tsx` (si es necesario) para mantener F1-04 como Change separado; no instalar suite E2E completa.
- Preparar procedimiento PowerShell en `docs/architecture/database-conventions.md` para levantar DB descartable, establecer URL de prueba, ejecutar migraciones, verificar tablas/namespace, volver a ejecutar, ejecutar pruebas FK/rollback y cerrar **solo los recursos propios**. Informar si Docker no está disponible.
- Probar la secuencia en BD vacía dos veces para reproducibilidad. Nunca usar datos reales.
- Mantener los gates de CHG-002 pasando: `npm run typecheck`, `npm run lint`, `npm run check:boundaries`, `npm run build` y `openspec validate chg-003-establish-database-foundation --strict`.
- Cuando no se pueda ejecutar PostgreSQL, no marcar como terminada la Task 3 ni afirmar que pasaron las pruebas de integración: informar bloqueo concreto.

## Decisions/tradeoffs

- `node-postgres` sobre `postgres.js`: pool y transacciones tradicionales bien documentados; un driver basta para el MVP.
- Migraciones SQL/Drizzle Kit sobre `push`: trazabilidad y revisión, necesarias para despliegues VPS independientes.
- Namespace `app` inicial sin tablas comerciales: evita datos irrelevantes y respeta la pertenencia futura de cada dominio.
- Driver exclusivamente del servidor: preserva el límite Next.js y evita filtrar secretos.
- Test infra mínima ahora; en F1-04 se integra Vitest y automatización completa.

## File ownership (confront with current CHG-002 output before writing)

Planned:
- `drizzle.config.ts`
- `src/shared/server/db/{config,client,transaction,schema}.ts` o archivos pequeños equivalentes
- `drizzle/**` (SQL + metadatos generados)
- `tests/db/**` fixtures y pruebas sobre PostgreSQL aislado
- `docs/architecture/database-conventions.md`
- `.env.example`, `.gitignore` si requiere mejora, `package.json`, `package-lock.json`

Do not modify `src/app/**` except to resolve a demonstrated compatibility failure, and do not introduce runtime DB dependencies in public routes.

## Verification / rollback

- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run check:boundaries`, `npm run build`.
- `npm run db:generate` (verificar cero diffs no planificados sobre migración generada), `npm run db:migrate` sobre BD limpia, repetición idempotente, segunda BD limpia, `npm run db:test`.
- `openspec validate chg-003-establish-database-foundation --strict` y `git diff --check`.
- Evitar rollback por eliminar datos reales; deshacer únicamente código/migraciones no desplegadas o restaurar respaldo/seguir un procedimiento de migración correctiva para instalaciones existentes (no aplicable a este Change).
