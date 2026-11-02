# Design — CHG-006 / F1-06

## Contexto real y restricciones

`main` contiene Next.js 16 / Node 24.12.0 / npm 11.6.2, Drizzle con migraciones versionadas, servidor DB `server-only`, Compose local de PostgreSQL 18.6-alpine y CI con Vitest, tests DB y Playwright. El script actual `npm run db:migrate` y `getLocalDatabaseUrl()` prohíben destinos remotos por diseño; **no** relajar esa guardia para desplegar. Inspeccionar `src/shared/server/db/config.ts`, `scripts/db-migrate.ts`, `drizzle/`, `next.config.ts`, `.nvmrc`, `compose.yaml`, `docs/architecture/database-conventions.md` y workflows antes de Apply.

**Topología por cliente:** VPS Ubuntu LTS dedicado; un proyecto Docker Compose por restaurante (o un VPS nuevo por instalación); `Caddy -> app Next.js -> PostgreSQL`, con persistencia de DB y certificados Caddy; sin SaaS compartido ni DB multiempresa. La clave de aislamiento no es solamente el nombre de BD: volúmenes, secretos, redes, dominios y operaciones son por instalación.

## D1 — Imágenes y Compose reproducibles (Task 1)

- Mantener `compose.yaml` de desarrollo intacto. Introducir configuración de despliegue independiente, por ejemplo `deploy/compose.yaml` + overlay staging si aporta valor; evitar `container_name` fijo y redes/volúmenes globales. Usar nombre de proyecto único y explícito por instalación, identificador validado y referencias de imágenes fijadas por versión/digest en la liberación.
- Construir aplicación Next.js con `output: "standalone"` si es compatible con el código real; Dockerfile multi-stage, `npm ci`, copiar assets estáticos y `.next/standalone` necesarios; proceso no-root, señales y salud, sin secretos embebidos en imagen; build reproducible con `package-lock.json`. Seleccionar/taggear imágenes de PostgreSQL compatibles con CHG-003 y documentar actualización mayor por procedimiento, no implícita.
- Servicio `postgres` con volumen persistente **por instalación**, healthcheck, política restart y red interna. `app` usa DNS del servicio para `DATABASE_URL` generada de secretos específicos del despliegue; no publicar 5432 ni el puerto de Next.js al host; distinguir `expose` de `ports`.
- `docker compose config` debe fallar si faltan variables obligatorias; archivos plantilla sin valores reales; inyección de secretos en tiempo de ejecución mediante archivos/permisos seguros, proveedor autorizado o mecanismo equivalente compatible, nunca en imagen, repo, logs o argumentos visibles. No colocar `.env` real en el repositorio. Configurar backups de datos del VPS fuera del alcance de T1 (CHG-007).
- No montar Docker socket dentro de app/proxy/DB. Separar redes de borde/aplicación/datos cuando resulte razonable; Caddy no debe acceder directamente a PostgreSQL. Límites de recursos adecuados a VPS pequeño y soporte para un máximo inicial de ~1–10 usuarios simultáneos, sin introducir orquestador adicional.

## D2 — Caddy, HTTPS, dominios y defensa (Task 2)

- Caddy con Caddyfile versionado, `reverse_proxy` al servicio app interno; publicación externa limitada a 80/443 para ACME/HTTPS, sin exponer DB o app. Persistir almacenamiento de certificados y configuración relevante entre recreaciones.
- Dominio por restaurante desde configuración autorizada; DNS A/AAAA, firewall, acceso SSH administrativo, certificados públicos ACME, renovación, redirección HTTP→HTTPS, cabeceras de seguridad apropiadas. No desactivar validación TLS ni usar `tls_insecure_skip_verify`; distinguir HTTPS local autofirmado de staging con certificado público.
- Definir prueba positiva de ruta HTTPS, certificado válido/hostname/fechas y prueba negativa de conexión pública a 5432. Filtrar secretos y datos personales de logs. Documentar precondiciones de puertos abiertos DNS/ACME y fallback si staging no puede obtener certificado.
- La app es administrativa; considerar restricción de acceso a staging (allowlist/VPN/autenticación temporal) sin romper validación HTTPS; no simular autenticación definitiva.

## D3 — Bootstrap, migración, despliegue, rollback y staging (Task 3)

- Flujo versionado: provisionar VPS aislado -> configurar dominio/secrets fuera de Git -> obtener imagen versionada -> validar Compose -> inicializar BD dedicada -> migrar con migrador **específico de despliegue**, explícito y seguro -> esperar health -> comprobar rutas y HTTPS -> registrar release. El migrador de despliegue exige destino interno autorizado + identificador de instalación + confirmación y registro de migraciones; no quitar salvaguardas de `db:migrate` local.
- Migraciones ejecutadas como job de una sola vez, no concurrentes y no en build; comprobaciones idempotentes/estado de Drizzle, logs sin conexión URL. Definir qué ocurre si falla: no desplegar app nueva, conservar datos y apuntar a recuperación/backup antes de migraciones destructivas futuras. Rollback de aplicación a imagen anterior solo si el esquema es compatible; nunca prometer rollback automático de BD.
- Automatizar instalación limpia y un despliegue controlado staging usando datos **sintéticos**. Registrar SHA/digest de versión, nombre de proyecto, estado de health, cert TLS, DB y volumetría aislada, migraciones, resultados de smoke, fallos controlados y recuperación. Probar segundo despliegue independiente sin reutilizar volúmenes ni secretos y sin afectar `dosvy-chg003-postgres` ni otros stacks.
- La cobertura de CI de CHG-005 sigue siendo requerida; usar checks locales/CI existentes. Ni scripts ni workflow deben ejecutar despliegue a producción automáticamente desde PRs no confiables.

## Verificación mínima / evidencia proporcional

**Objetivo de ingeniería:** soportar instalaciones pequeñas (aprox. 1–10 usuarios) con una app, una base privada y Caddy, sin orquestadores ni infraestructura adicional innecesaria.

- **T1 / Docker:** build Next.js standalone reproducible, `docker compose config` positivo/negativo, dos proyectos de instalación con DB/volúmenes/secretos distintos; preservar stacks locales y contenedores ajenos.
- **T2 / proxy y redes:** Caddy valida el Caddyfile; HTTP→HTTPS comprobado en loopback con certificado **de prueba local**, persistencia y no publicación de PostgreSQL ni Next.js en Compose. Documentar DNS, firewall y cómo verificar un certificado público real, sin afirmar que existe.
- **T3 / actualización:** prueba real en Docker **desechable** de instalación limpia, inicialización, migración versionada idempotente, reinicio, actualización de imagen y smoke. Documentar y evaluar la compatibilidad del rollback de aplicación; nunca revertir SQL ni borrar datos automáticamente. Si faltan evidencias locales, dejar la tarea abierta.

Ejecutar `npm ci`, typecheck, lint, boundaries, build, unit, integración, E2E, `db:check`, TruffleHog, auditorías según CHG-005, `openspec validate chg-006-establish-deployment-platform --strict` y `git diff --check`. Marcar cada tarea solo por evidencia ejecutada.

## Gate operativo obligatorio previo a producción (no equivale a T2/T3 locales)

Para la **primera instalación pública y cada cambio relevante de host/dominio**, comprobar desde fuera del VPS un certificado TLS público válido y redirección HTTP→HTTPS, DNS correcto, puertos 5432/3000 bloqueados, firewall/SSH, aislamiento y secretos, volumen persistente, migración, health, smoke, reversión segura y plan de backup/restauración funcional. Registrar propietario, fecha, resultado y versión. Si alguna condición falta, **NO desplegar ni procesar datos reales**. Ningún resultado local prueba HTTPS público o las reglas de un firewall remoto.

## Riesgos / decisiones diferidas

- Sin VPS/dominio autorizado: el gate de producción está pendiente, pero no impide verificar la infraestructura **local** y cerrar CHG-006 técnicamente.
- CHG-007 integra respaldo/recuperación proporcional a la operación. No operar con datos reales sin una recuperación probada.
- Confirmar versiones y volúmenes PostgreSQL antes de actualizar imágenes; preservar protección de scripts locales y nunca emplear credenciales en Git.
- `NEXT_PUBLIC_*` se incorpora en build; no usar para secretos o configuración privada por restaurante.
