# F1-03 — PostgreSQL, Drizzle y migraciones versionadas

**Prioridad:** P0  
**Tipo:** fundamento de persistencia, transacciones y pruebas de DB  
**Dependencias:** F1-02 / CHG-002 implementado y verificado  
**Estado:** NOT_STARTED (planeado; implementación pendiente)  
**Change:** CHG-003 — `chg-003-establish-database-foundation`

## Historia de usuario

Como desarrollador del sistema de restaurante Dosvy, quiero un sistema PostgreSQL y Drizzle con migraciones versionadas, conexiones seguras y transacciones verificables para garantizar integridad y reproducibilidad de las instalaciones independientes por restaurante.

## Objetivo y alcance

Integrar una base de persistencia en el monolito Next.js/Node.js creado en F1-02. Crear una migración neutral inicial, reproducible e inspeccionable; probar restricciones referenciales y fallos controlados en PostgreSQL aislado. Proteger límites server-only, sin crear todavía modelos reales de negocio.

## Flujo técnico completo

1. Verificar el checkout real y dependencia F1-02; inspeccionar `package.json`, scripts, arquitectura de código, convenciones y barreras de importación.
2. Elegir versiones estables compatibles de `pg`, Drizzle y CLI; instalar mediante npm con lockfile actualizado, conservar herramientas ya existentes.
3. Definir `drizzle.config.ts`, namespace lógico `app` y migración SQL inicial con metadatos generados por Drizzle Kit; no crear tablas de clientes, sesiones, ventas ni inventario.
4. Levantar PostgreSQL local/test aislado con credenciales sintéticas, sin afectar otros Docker containers ni servicios.
5. Ejecutar migraciones desde bases vacías, reejecutar idempotentemente y comprobar estado real de namespace y journal.
6. Implementar conexión `pg.Pool` en Node, validación de configuración en el momento de conexión y `withTransaction` tipado; preservar build y shell sin DB.
7. Ejecutar pruebas con tablas fixture temporales de FK, éxito y rollback; limpiar al finalizar.
8. Verificar gates heredados de CHG-002, pruebas y OpenSpec, documentando resultados y limitaciones.

## Tareas por capa — tres tareas principales

### Task 1 — DB: PostgreSQL y migraciones

**Archivos previstos:** `drizzle.config.ts`, `drizzle/**`, base de declaraciones Drizzle bajo `src/shared/server/db/**` si respeta el diseño de F1-02, `package.json`, `package-lock.json`, `.env.example` y configuración aislada de pruebas.

**Pruebas:** migración limpia, reejecución sin duplicación, instalación independiente, no exposición de puertos públicos ni manejo de datos reales.

### Task 2 — BE: conexión y contexto transaccional

**Archivos previstos:** `src/shared/server/db/{config,client,transaction}.ts` o rutas equivalentes según F1-02.

**Contratos:** 
- `getDatabase()` o equivalente: acceso server-only, carga diferida.
- `withTransaction<T>(callback: (tx: DrizzleTransaction) => Promise<T>): Promise<T>`: operaciones dentro de una sola transacción PostgreSQL; rollback automático al fallar.
- `closeDatabase()` o equivalente: liberación de pool en pruebas y scripts.

**Políticas:** `DATABASE_URL` no se usa en clientes; no lectura durante build; no logging de credenciales; pool con timeouts; errores controlados; límite de propiedad de datos por módulo.

### Task 3 — QA: test de PostgreSQL real

**Archivos previstos:** `tests/db/**`, `docs/architecture/database-conventions.md`, scripts de pruebas y configuración de entorno seguro.

**Pruebas:** dos bases nuevas migradas, migración repetida, FK inválida rechazada, commit correcto y rollback de todos los cambios ante error inyectado, aislamiento de URLs y bloqueos de objetivos inseguros, regresión de `lint`, `typecheck`, `check:boundaries`, `build`.

**Regla:** no declarar éxito si una prueba de DB no se ha ejecutado.

## Criterios de aceptación

- **F1-03-AC-01:** PostgreSQL funciona en base local/test aislada, sin modificar otros contenedores, servicios ni datos.
- **F1-03-AC-02:** Drizzle y `pg` instalados con versiones compatibles, lockfile reproducible y esquema de aplicación inicial versionado en SQL/journal.
- **F1-03-AC-03:** migraciones aplicables en base completamente vacía y repetibles sin duplicados; también funcionan en segunda base independiente.
- **F1-03-AC-04:** pruebas de claves foráneas en fixtures descartables rechazan referencias inválidas y no dejan datos permanentes de negocio.
- **F1-03-AC-05:** conexión y transacción Node-only, protegidas de importación al navegador; credenciales ausentes producen error seguro en uso de DB.
- **F1-03-AC-06:** `withTransaction` confirma todo al éxito y revierte completamente ante un fallo intermedio; pool queda liberado.
- **F1-03-AC-07:** `TEST_DATABASE_URL` es obligatorio para pruebas, distinto de `DATABASE_URL` y protegido contra objetivos remotos/producción no autorizados.
- **F1-03-AC-08:** `npm ci`, `npm run typecheck`, `npm run lint`, `npm run check:boundaries`, `npm run build`, pruebas DB y OpenSpec strict pasan con resultados reales.
- **F1-03-AC-09:** `/` y `/modules` continúan siendo independientes del estado de PostgreSQL; no hay regresión visible de CHG-002.

## Dependencias y riesgos

- F1-02 finalizado localmente, pero su publicación en GitHub debe verificarse antes de fusionar cambios; el Change de planificación no se puede usar para recrear el runtime real.
- Las pruebas necesitan PostgreSQL local y acceso a Docker Desktop o servidor de pruebas autorizado. No iniciar ni detener stacks ajenos.
- El esquema inicial no introduce datos de usuarios, autenticación, productos ni ventas.
- Drizzle puede tener cambios de versión: no imponer versiones candidatas ni firmas incompatibles con el lockfile actual.
- La integración de Vitest/Playwright se deja para F1-04; aquí bastan pruebas mínimas reproducibles de SQL/DB.
- La configuración de VPS, Caddy, respaldos y migraciones operativas de producción pertenece a fases posteriores.

## Definition of Done

Solo considerar completado CHG-003 cuando las tres tareas tengan evidencia de resultados y `openspec validate chg-003-establish-database-foundation --strict` sea válido. No archivar ni fusionar de manera automática sin revisión.
