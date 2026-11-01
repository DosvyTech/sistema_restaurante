# F1-06 — Entornos, Docker y despliegue reproducible

**Prioridad:** P0  
**Dependencias:** F1-03 / CHG-003 y F1-05 / CHG-005 completos  
**Estado:** NOT_STARTED (planificación solamente)  
**Change:** CHG-006 — `chg-006-establish-deployment-platform`

## Historia de usuario

Como administrador técnico de Dosvy, quiero desplegar cada restaurante independientemente sin alterar manualmente el código ni afectar otros clientes.

## Contexto

Monolito modular Next.js/Node, PostgreSQL/Drizzle, Docker Compose local para DB y CI de CHG-005. Una instalación por VPS Ubuntu LTS; 1–10 usuarios concurrentes iniciales. La configuración local `compose.yaml` es de desarrollo y no debe reemplazarse ni desplegarse tal cual en VPS.

## Alcance / decisiones

1. Imagen Next.js determinista (preferiblemente standalone), app no-root, Compose separado de despliegue por instalación, PostgreSQL persistente y secretos externos al repositorio; `app` y DB en redes privadas.
2. Caddy: dominio configurable, único servicio público en 80/443, certificados ACME persistentes, redirect HTTPS; SSH/firewall y controles de acceso a staging documentados.
3. Migraciones versionadas mediante migrador de despliegue explícito (no relajar el migrador local), inicialización/release reproducibles, rollback conservador y smoke/health; dos instalaciones aisladas sin colisión.
4. Staging autorizado: verificar instalación limpia, actualización, DNS/TLS real, DB no accesible públicamente, imágenes/migraciones y logs de validación. Sin infraestructura de staging, registrar bloqueo, no afirmar AC cumplidos.

## Tres tareas principales

**T1 / OPS:** Dockerfile + Compose de despliegue por cliente. Evidencia: dos proyectos separados, redes/volúmenes/secretos únicos, build reproducible y DB interna.

**T2 / OPS:** Caddy/HTTPS/DNS/seguridad de red. Evidencia: Caddy validate, prueba HTTPS con certificado público, redirección y puertos internos inaccesibles desde fuera.

**T3 / QA:** bootstrap/migraciones/versionado + staging instalación limpia, despliegue y rollback controlados. Evidencia: ejecución autorizada, smoke y ausencia de contaminación de Docker local.

## Criterios de aceptación

- **F1-06-AC-01:** despliegue reproducible desde repositorio, imagen y configuración autorizada sin editar fuentes.
- **F1-06-AC-02:** cada restaurante usa base, credenciales, volúmenes y entorno propios.
- **F1-06-AC-03:** PostgreSQL y puerto de Next.js no están expuestos públicamente.
- **F1-06-AC-04:** Caddy sirve dominio staging por HTTPS público válido y redirige HTTP.
- **F1-06-AC-05:** migraciones de Drizzle se ejecutan con autorización/guardias y registro; sin `push`, SQL downgrade ni acceso accidental a destino local/test.
- **F1-06-AC-06:** instalación nueva y actualización controlada en staging verificadas, con rollback de app condicionado por compatibilidad del esquema.
- **F1-06-AC-07:** `npm ci`, typecheck, lint, boundaries, build, test:unit, test:integration, test:e2e, db:check, OpenSpec strict y git diff --check aprobados en checkout.
- **F1-06-AC-08:** no se modifican stacks Docker ajenos, ni se usan credenciales/datos reales en CI o validación.

## Riesgos y límites

No hacer despliegue automático en producción, ni cambiar código de módulos; observabilidad avanzada, pgBackRest y WAL quedan para F1-07. Necesita VPS y dominio staging aprobados para cerrar T3. Las excepciones de seguridad de CHG-005 siguen vigentes; el audit completo no es limpio y `esbuild` requiere seguimiento antes del 2027-01-31.
