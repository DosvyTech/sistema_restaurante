# CHG-003 — PostgreSQL, Drizzle y migraciones versionadas (F1-03)

## Why

CHG-002 aporta una aplicación Next.js/Node.js con TypeScript estricto y límites de importación entre `app`, `modules` y `shared`. El sistema aún necesita una base de persistencia PostgreSQL por instalación, migraciones SQL versionadas, transacciones locales controladas y pruebas que demuestren la integridad sin acceder a datos reales. Esta fundación es previa a los módulos de negocio y a la confirmación atómica futura de ventas, pagos e inventario.

**Dependencia bloqueante:** antes de ejecutar Apply, verificar en el checkout local que CHG-002 está completado (3/3, validación estricta) y disponibles sus archivos reales (`package.json`, `src/app`, `src/shared`, convenciones de runtime y barreras). El código completado localmente todavía puede no estar publicado en GitHub: no reconstruir ni sobrescribir CHG-002.

## What Changes

- Preparar PostgreSQL para **desarrollo y pruebas aisladas**, sin configurar todavía infraestructura de producción (reservada a F1-06). Mantener PostgreSQL independiente por restaurante; no añadir Supabase, SaaS multicliente ni base compartida.
- Integrar Drizzle ORM y Drizzle Kit usando driver **node-postgres (`pg`)**, tipos de PostgreSQL y migraciones SQL **generadas, revisadas y versionadas** con journal/snapshots de Drizzle. No usar `drizzle-kit push` como mecanismo de despliegue.
- Crear una primera migración no destructiva y significativa como fundación de espacio de nombres de aplicación, sin inventar entidades de negocio o adelantar esquemas de MOD-01/MOD-02. Usar fixtures descartables exclusivamente en pruebas para validar claves foráneas.
- Proveer módulo exclusivo de servidor para variables de entorno, pool de conexiones y coordinación de transacciones con rollback automático al fallar, liberación ordenada de recursos y bloqueo de uso desde Client Components.
- Comprobar arranque de una base completamente vacía, reaplicación segura de migraciones, restricciones referenciales y rollback; nunca contra una base de producción.

## Capabilities

### New Capabilities
- postgresql-drizzle-foundation: configuración reproducible de PostgreSQL + Drizzle, migraciones versionadas, conexiones y transacciones seguras, y verificación reproducible en datos sintéticos.

### Modified Capabilities
- Ninguna funcionalidad comercial existente. Se conserva el shell de CHG-002 y los contratos de arquitectura de CHG-001.

## Impact

- Código planeado: `src/shared/server/db/**` (o la ruta server-only equivalente ya establecida), `drizzle.config.ts`, `drizzle/**` para SQL y snapshots, `.env.example`, ajustes conservadores a `package.json`, lockfile, scripts de verificación y documentación `docs/architecture/database-conventions.md`.
- `src/app/page.tsx` y `src/app/modules/page.tsx` seguirán funcionando sin conexiones a PostgreSQL en build o render.
- Migraciones de esta historia solo se aplican a **bases vacías de desarrollo y pruebas**; la estrategia de producción/migraciones operativas queda para F1-06/F1-07.
- No crear clientes, empleados, inventario, sesiones, comprobantes ni tablas ficticias para que las pruebas pasen.

## Non-goals

- Better Auth, usuarios, permisos y RLS de Supabase.
- Esquemas de negocio, seeds reales o datos personales.
- Provisionamiento de VPS, Compose de producción, Caddy, CI/CD o backups.
- Instalar Vitest o Playwright (F1-04) salvo que el código CHG-002 ya lo requiera; pruebas de DB mínimas mediante `node:test` o equivalente reproducible.
- Exposición de un endpoint público que compruebe la base o revele credenciales.
- Ejecutar migraciones contra bases existentes/desconocidas ni utilizar `push` sin archivos SQL.

## Dependencies & risks

- **F1-02** debe existir realmente en el checkout al iniciar Apply; confirmar arquitectura actual antes de elegir rutas/versión de paquetes.
- Docker Desktop puede tener contenedores y volúmenes de otros proyectos: usar nombre y puertos propios o un PostgreSQL local aislado ya aprobado; nunca `docker system prune`, `docker volume prune`, `docker compose down --volumes` fuera de una pila exclusiva de pruebas ni modificar otros stacks.
- Los cambios de Drizzle/Next.js dependen de versiones: elegir paquetes estables compatibles con el lockfile real, documentar versiones y pruebas, no asumir compatibilidad sin ejecutarlas.
- `DATABASE_URL` y `TEST_DATABASE_URL` son secretos; no almacenarlos en Git ni enviarlos al navegador.
