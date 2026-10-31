# CHG-005 — GitHub Actions y controles de calidad (F1-05)

## Why

CHG-004 entrega suites de Vitest, PostgreSQL efímero y Playwright, mientras que CHG-002/003 ya incluyen lint, typecheck, revisión de límites arquitectónicos, build, Drizzle y registros de auditoría de dependencias. Se necesita una política de integración en GitHub que ejecute comprobaciones objetivas y evite merges a `main` cuando fallen controles obligatorios, sin filtrar secretos ni mezclar despliegue con CI.

**Dependencia bloqueante:** CHG-004 debe estar implementado y disponible en el checkout con comandos ejecutables, no solo su propuesta. No aplicar CHG-005 antes de completar/verificar CHG-004.

## What Changes

- Workflows de GitHub Actions para Pull Requests hacia `main`: instalación reproducible `npm ci`, Node fijado desde `.nvmrc`, lint, tipos, límites, build, Vitest, PostgreSQL de integración y Playwright Chromium; definir nombres de jobs estables para required checks.
- Añadir controles de seguridad: auditoría de dependencias (separando runtime y desarrollo), detección de secretos y análisis estático de código con herramientas apropiadas. Establecer políticas explícitas sobre vulnerabilidades conocidas y no introducir fallos silenciosamente omitidos.
- Configurar mediante GitHub ruleset/branch protection, **si los permisos de la organización lo permiten**, PR obligatorio a `main`, comprobaciones de estado requeridas, bloqueo de merges fallidos, políticas de revisión y documentación de excepciones. Verificar con un PR de prueba fallido y uno exitoso que las reglas son efectivas.

## Capabilities

### New Capabilities

- ci-quality-gates: ejecución GitHub Actions reproducible, seguridad comprobable, evidencia de revisiones y protección efectiva del flujo de integración en `main`.

### Modified Capabilities

- Ninguna capacidad de negocio; orquesta controles existentes de CHG-002/003/004.

## Impact

- Artefactos esperados durante Apply: `.github/workflows/quality.yml`, `.github/workflows/security.yml` o estructura equivalente, configuración mínima de análisis/secret scanning, scripts/documentación en `docs/operations/pr-quality-policy.md`.
- Configuración **externa** de GitHub rulesets/branch protection: no es suficiente crear YAML; registrar estado real, nombres de jobs observados y permisos. Si no es posible configurar/verificar la protección, Task 3 queda pendiente.
- No requiere credenciales reales de producción ni acceso a servidores de clientes. No hacer despliegues.

## Out of scope

- Deploy automático, secretos de producción, infraestructura VPS, release y cambios fiscales.
- Modificaciones a las reglas de negocio o estructura física de módulos.
- Ocultar errores con `continue-on-error`, `|| true` o desactivación arbitraria de comprobaciones.
- Resolver vulnerabilidades transitivas a través de degradaciones incompatibles.

## Known risk and security exception

`docs/security/dependency-audit.md` documenta cuatro vulnerabilidades moderadas de `esbuild@0.18.20` bajo `drizzle-kit` y cero en `npm audit --omit=dev`. Los controles deben tratar esa excepción de manera **auditable y acotada**: exigir audit runtime limpio; ejecutar audit completo e informar desviaciones, permitiendo únicamente hallazgos explícitamente aprobados y con verificación precisa (identidad/advisory/ruta/severidad) si se implementa una política de excepciones. Ninguna vulnerabilidad nueva, high/critical o distinta de la excepción debe pasar silenciosamente. Si no puede implementarse una política precisa, dejar la auditoría completa como fallo y solicitar decisión de tratamiento antes de activar protección.

## Dependencies / caveats

- F1-04 debe existir realmente; los comandos exactos deben tomarse del `package.json` resultante.
- La protección efectiva depende de permisos y disponibilidad de GitHub; probar y registrar el enforcement real, no afirmar que está protegido por crear workflows.
- Evitar PR workflows con ejecución insegura de código no confiable en `pull_request_target`; usar permisos mínimos por defecto y versiones de acciones apropiadas.
