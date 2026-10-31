# Design — CHG-005 / F1-05

## Contexto / precondición

Aplicación Next.js + TypeScript + Drizzle PostgreSQL, controles CHG-002/003 y, al iniciar Apply, suites implementadas de CHG-004 (Vitest, Docker PostgreSQL efímero, Playwright). Leer archivos reales `package.json`, `.nvmrc`, `docs/qa/testing-guide.md`, `docs/security/dependency-audit.md`, y la configuración de workflows/rulesets vigente antes de cambiarla.

CHG-005 solo planifica ahora; no ejecutar hasta CHG-004 completado. Los nombres de jobs se fijarán según el YAML efectivo y luego se observarán en GitHub antes de marcarlos obligatorios.

## D1 — Workflows estables de CI

- Workflow `.github/workflows/quality.yml` sobre `pull_request` a `main` y `push` a `main` para vigilar la propia integración, con permisos mínimos `contents: read`, sin secretos de producción; evitar `pull_request_target`.
- Jobs estables y no condicionalmente omitidos: `quality / static` (Node `.nvmrc`, `npm ci`, typecheck, lint, check:boundaries, build y Vitest), `quality / database` (PostgreSQL efímero usando el orquestador de CHG-004 y su cleanup), `quality / e2e` (Chromium y servidor test; artefactos de fallo de acceso limitado). Nombres exactos se ajustarán al YAML final, pero los required checks deben usar IDs no ambiguos.
- Caché npm basada en `package-lock.json`; versionar las actions a releases estables/pins de commit cuando sea práctico; timeouts, cancelación de concurrencia en PRs, ausencia de escritura en repositorio.
- No depender de Docker Desktop ni de nombres o rutas Windows en el runner Ubuntu. No usar la BD de desarrollo `dosvy_chg003_pgdata`; si el verificador de integración administra Docker, ejecutar solo en runner de GitHub de alcance de job.

## D2 — Seguridad en CI

- Job separado de seguridad para `npm audit --omit=dev` (siempre requerido y con fallo ante hallazgos) y auditoría global con emisión explícita de resultados.
- Los cuatro avisos moderados conocidos de `esbuild` (cadena `drizzle-kit` → `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils` → `esbuild@0.18.20`) son excepción provisional de CHG-003. Si se permite excepcionalmente, implementar un verificador propio que **compare la totalidad de advisories de npm JSON** con allowlist estrecha y caducidad/owner documentados, marque fallos por adición, severidad mayor, modificación de ruta o expiración. No emplear excepciones genéricas a `moderate` ni `continue-on-error` indiscriminado. Si no es fiable, fallar y resolver con decisión explícita.
- Detección de secretos: elegir herramienta mantenida compatible con GitHub, configuración versionada y fixture sintético de comprobación; no confiar únicamente en un grep a variables. No mostrar secretos en logs y no requerir tokens personales. Complementar con GitHub secret scanning cuando esté disponible en la organización.
- Análisis estático de código: CodeQL o analizador equivalente compatible con TypeScript/JavaScript, con permisos mínimos (p.ej. `security-events: write` solo en job que cargue hallazgos), respetando restricciones de ejecución sobre PR forks y permisos. Integración debe señalar riesgos reales en lugar de ejecutar check vacío.
- Reportes de cobertura/artefactos con retención limitada y sin `.env` ni trazas que capturen datos personales.

## D3 — Ruleset/protección de `main`

- Establecer política PR a `main`, prohibición de pushes directos según permisos, al menos una aprobación cuando sea factible, prohibición de merge si falta check requerido, conversaciones resueltas y checks actualizados sobre la punta actual.
- Comprobar primero plan y capacidades de la organización para rulesets de repositorios públicos; aplicar por API/UI a través de permisos autorizados. Los archivos YAML no activan protección automáticamente.
- La selección exacta de checks deberá esperar la **primera ejecución real** de GitHub Actions; no inventar nombres ni marcar jobs opcionales como requeridos.
- Demostrar enforcement con un PR controlado de falla sintética (bloquea merge) y uno saludable (apto sujeto a revisión). No provocar merge real ni publicar código inseguro; documentar evidencia de GitHub.
- Si no hay permisos o la capacidad no está disponible, entregar instrucciones UI/API y dejar Task 3 abierta; no representar la protección como activa.

## Contratos / artefactos previstos

- `.github/workflows/quality.yml` y `.github/workflows/security.yml` (o distribución pequeña equivalente)
- Configuración de verificador de excepciones npm, configuración de secret scanning y CodeQL si es viable
- `docs/operations/pr-quality-policy.md` y evidencia de estado de protección; ajustes mínimos en scripts si son necesarios.

## Verificaciones

1. Inspección/YAML lint, disparar PR de validación en GitHub Actions: static, database, E2E.
2. Confirmar cada job sobre GitHub y reportar salidas reales; validar regresión en rama.
3. Probar con fixtures sintéticos que secret scanning rechaza token de prueba seguro y auditoría rechaza nuevos advisories, pero maneja únicamente la excepción aprobada.
4. Configurar reglas de `main`, verificar con PR fallido y aprobado en GitHub sin ejecutar merge.
5. `npm run typecheck`, `npm run lint`, `npm run check:boundaries`, `npm run build`, suites CHG-004, `openspec validate chg-005-establish-ci-quality-gates --strict` y `git diff --check`.

## Riesgos / pendientes

- Privilegios insuficientes pueden bloquear reglas de branch protection: registrar y no marcar Task 3.
- Nombres/jobs requeridos pueden cambiar: evitar cambios sin revisar ruleset.
- Excepción `esbuild` no equivale a auditoría completa limpia; vigilar y vencimiento/owner.
- Tests E2E pueden necesitar instalación del navegador y librerías Linux; no falsear checks por no instalar dependencias.
- No ejecutar workflows privilegiados sobre contenido de PR sin confianza.
