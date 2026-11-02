# F1-06 — Entornos, Docker y despliegue reproducible

**Prioridad:** P0  
**Dependencias:** F1-03 / CHG-003 y F1-05 / CHG-005 completos  
**Estado:** IN_PROGRESS (T1 verificada; T2/T3 por cerrar con criterios proporcionales)  
**Change:** CHG-006 — `chg-006-establish-deployment-platform`

## Historia de usuario

Como administrador técnico de Dosvy, quiero desplegar cada restaurante independientemente sin alterar manualmente el código ni afectar otros clientes.

## Contexto

Monolito modular Next.js/Node, PostgreSQL/Drizzle, Docker Compose local para DB y CI de CHG-005. Una instalación por VPS Ubuntu LTS; 1–10 usuarios concurrentes iniciales. La configuración local `compose.yaml` es de desarrollo y no debe reemplazarse ni desplegarse tal cual en VPS.

## Alcance / decisiones

1. Imagen Next.js determinista (preferiblemente standalone), app no-root, Compose separado de despliegue por instalación, PostgreSQL persistente y secretos externos al repositorio; `app` y DB en redes privadas.
2. Caddy: dominio configurable, único servicio público en 80/443, certificados ACME persistentes, redirect HTTPS; SSH/firewall y controles de acceso a staging documentados.
3. Migraciones versionadas mediante migrador de despliegue explícito (no relajar el migrador local), inicialización/release reproducibles, rollback conservador y smoke/health; dos instalaciones aisladas sin colisión.
4. Validar instalación limpia y actualización en dos proyectos Docker desechables con datos sintéticos y limpieza segura. Mantener **un gate distinto y obligatorio de producción** para DNS, TLS público, firewall externo y backups antes de habilitar datos reales.

## Tres tareas principales

**T1 / OPS:** Dockerfile + Compose de despliegue por cliente. Evidencia: dos proyectos separados, redes/volúmenes/secretos únicos, build reproducible y DB interna.

**T2 / OPS:** Caddy, red y seguridad. Evidencia para cerrar código: Caddy validate, HTTP→HTTPS con certificado **local de prueba** y puertos DB/app no publicados. TLS público es gate anterior a producción.

**T3 / QA:** bootstrap/migraciones/versionado + instalación limpia, actualización y documentación de rollback en entorno Docker aislado; evidencia: ejecuciones sintéticas, smoke, estado migraciones y ausencia de contaminación Docker.

## Criterios de aceptación

- **F1-06-AC-01:** despliegue reproducible desde repositorio, imagen y configuración autorizada sin editar fuentes.
- **F1-06-AC-02:** cada restaurante usa base, credenciales, volúmenes y entorno propios.
- **F1-06-AC-03:** PostgreSQL y puerto de Next.js no están expuestos públicamente.
- **F1-06-AC-04:** Caddy valida configuración y HTTP→HTTPS con TLS local de prueba; DNS y certificado público real son obligatorios **antes del go-live** y no se confunden con las pruebas locales.
- **F1-06-AC-05:** migraciones de Drizzle se ejecutan con autorización/guardias y registro; sin `push`, SQL downgrade ni acceso accidental a destino local/test.
- **F1-06-AC-06:** instalación nueva y actualización controlada verificadas en proyectos Docker desechables; rollback de app documentado y condicionado por compatibilidad del esquema.
- **F1-06-AC-07:** `npm ci`, typecheck, lint, boundaries, build, test:unit, test:integration, test:e2e, db:check, OpenSpec strict y git diff --check aprobados en checkout.
- **F1-06-AC-08:** no se modifican stacks Docker ajenos, ni se usan credenciales/datos reales en CI o validación.

## Riesgos y límites

No hacer despliegue automático en producción ni cambiar módulos; observabilidad y recuperación quedan para F1-07. **Cerrar CHG-006 no autoriza instalar en producción**: antes del primer VPS público comprobar DNS, certificado válido, firewall desde fuera, migraciones, aislamiento y restauración/backup operativo según el runbook. Las excepciones de CHG-005 siguen vigentes; el audit completo no es limpio y `esbuild` requiere seguimiento antes del 2027-01-31.
