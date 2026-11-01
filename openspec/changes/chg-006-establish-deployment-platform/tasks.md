# CHG-006 / F1-06 — Tres tareas ejecutables

> **Precondición:** CHG-003 y CHG-005 integrados en `main`; antes de Apply leer `compose.yaml`, `next.config.ts`, `scripts/db-migrate.ts`, reglas de URLs locales y `docs/operations/pr-quality-policy.md`. Planificación independiente; no iniciar CHG-007, no hacer merge/archive automáticamente. Máximo 3 tareas principales.

- [x] **1. OPS — Docker Compose para app y PostgreSQL por instalación.** Implementar imagen Next.js reproducible y Compose de despliegue separado del Compose local, con app no-root, PostgreSQL 18.6 compatible, volúmenes/redes/credenciales aisladas por restaurante, healthchecks y configuración autorizada externa. Preservar `dosvy-chg003` y recursos de CHG-004; no exponer DB/app directamente. **Evidencia:** build limpio, `docker compose config`, validación de secretos obligatorios y prueba de dos proyectos independientes sin solapamiento.

- [ ] **2. OPS — Caddy, dominio, HTTPS y aislamiento.** Implementar Caddy como único punto público 80/443 con `reverse_proxy`, TLS gestionado y persistente, redirección HTTPS, firewall y guía DNS/SSH. Probar que 5432 y puerto interno Next no están expuestos. **Evidencia:** validación Caddy/redes + prueba real de certificado de staging si el dominio autorizado existe; una simulación local no equivale a TLS público.

- [ ] **3. QA — Instalación limpia y despliegue controlado staging.** Implementar bootstrap y migraciones de despliegue con guardias independientes sin relajar `db:migrate` local, upgrade/rollback de imagen seguro y runbook; ejecutar instalación nueva y actualización en staging con datos sintéticos, DNS/certificados reales, health/smoke, segunda instalación aislada y evidencia de limpieza. Correr QA y OpenSpec strict. **Evidencia:** resultados observados en VPS de staging autorizado; si falta VPS/dominio/acceso o pruebas reales, dejar T3 pendiente y detallar bloqueo. No ejecutar sobre clientes ni producción.

> Evidencia de implementación (2026-11-01): T1 completada con build Docker standalone, configuración sintética válida y rechazo por variables ausentes, guardias de rutas/credenciales/digests, dos proyectos con redes/volúmenes/bases distintas y app/PostgreSQL/Caddy saludables. Las migraciones de despliegue se aplicaron a ambas bases; repetir en la instalación A dejó una sola fila en el ledger. Inspección confirmó que solo Caddy publicó puertos, ligados a loopback durante la prueba, y que `dosvy-chg003-postgres`/`dosvy_chg003_pgdata` permanecieron intactos.
>
> T2 pendiente de aceptación externa: Caddy valida localmente y el smoke de loopback confirma HTTP→HTTPS con certificado local. No hay dominio/VPS staging autorizado, así que no se declara ni se marca como probado TLS público.
>
> T3 pendiente: no se proporcionó VPS ni dominio staging autorizados. No se afirma instalación/actualización, TLS público ni RPO/RTO de staging; completar cuando exista acceso aprobado.
