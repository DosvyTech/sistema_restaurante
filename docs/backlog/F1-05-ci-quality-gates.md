# F1-05 — GitHub Actions y controles de calidad

**Prioridad:** P0 · **Dependencia:** F1-04 / CHG-004 implementado y validado · **Estado:** NOT_STARTED · **Change:** CHG-005 — `chg-005-establish-ci-quality-gates`

## Historia de usuario

Como equipo de Dosvy, queremos impedir la integración de código que no supere pruebas, controles de seguridad o revisiones mínimas, manteniendo rastreabilidad de la ejecución sobre los Pull Requests de GitHub.

## Alcance / flujo

1. Consumir scripts reales de CHG-004 (Vitest, integración PostgreSQL temporal, Playwright), junto con typecheck, lint, boundaries y build.
2. Ejecutar los trabajos en GitHub Actions con permisos mínimos, Node versionado, instalación npm reproducible, timeout y caché.
3. Aplicar auditoría runtime obligatoria y auditoría global transparente; gestionar excepcionalmente cuatro moderados conocidos de esbuild solo mediante allowlist exacta, revisable y con vencimiento.
4. Añadir detección real de secretos y análisis estático adecuado a JavaScript/TypeScript sin utilizar secretos de producción.
5. Comprobar nombres de status checks mediante ejecuciones reales y activar reglas de protección en `main` para revisión obligatoria y bloqueo de merges fallidos.
6. Registrar evidencia en GitHub y procedimiento PR/seguridad, sin asumir que un workflow YAML protege la rama por sí solo.

## Tres tareas principales

**T1 / OPS:** `.github/workflows/quality.yml` y flujos complementarios; `npm ci`, checks estáticos, unitarios, DB temporal, Chromium. Aceptación: jobs efectivamente observados en GitHub y cualquier fallo se refleja en check no aprobado.

**T2 / SEC:** workflow/configuración de auditoría, secret scanning y análisis estático, verificador de excepción esbuild específico. Aceptación: audit runtime cero, nuevos advisories bloqueados, fixture de secreto detectado y análisis estático activo.

**T3 / QA:** GitHub ruleset/branch protection y `docs/operations/pr-quality-policy.md`, revisión PR y prueba de bloqueo. Aceptación: required check fallido impide merge; si protección no puede activarse, estado de tarea permanece abierto.

## Acceptance criteria

- **F1-05-AC-01:** CI reproducible ejecuta los tres niveles de test y los controles de calidad de CHG-002/003.
- **F1-05-AC-02:** cada job requerido tiene identificador observado y resultado verificable; no hay falsos verdes o checks obligatorios permanentemente omitidos.
- **F1-05-AC-03:** workflow de PR no usa producción ni permisos privilegiados de `pull_request_target`.
- **F1-05-AC-04:** nueva vulnerabilidad de producción provoca fallo; las cuatro moderadas de esbuild son excepción explícita, temporal y exacta.
- **F1-05-AC-05:** secret scanning y análisis estático se ejecutan y detectan fixtures/fallos controlados.
- **F1-05-AC-06:** ruleset/branch protection bloquea merges con required checks fallidos y exige PR/revisión según disponibilidad.
- **F1-05-AC-07:** `docs/operations/pr-quality-policy.md` explica revisión, excepciones, owners, status, fallback de permisos y evidencia.
- **F1-05-AC-08:** OpenSpec strict y regresiones locales pasan; no se reporta protección activa sin verificarla.

## Restricciones y cierre

No instalar/deployar a producción, no usar credenciales reales, no ejecutar un merge de prueba, no iniciar CHG-005 antes de CHG-004. Mantener la distinción entre controles versionados y reglas externas de GitHub. El cierre requiere 3/3 tareas y evidencia real de branch protection.
