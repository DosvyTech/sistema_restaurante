# CHG-007 — Monitoreo, respaldos y recuperación (F1-07)

## Why

Una instalación Dosvy por VPS exige detectar fallos, conservar respaldos fuera del servidor y recuperar datos tras una pérdida del VPS o corrupción. CHG-006 establece el despliegue sobre el cual operar; CHG-007 no debe implementarse antes de que exista una instalación staging reproducible y probada.

**Prioridad:** P0. **Dependencia bloqueante:** F1-06 / CHG-006 **implementado y verificado**, no basta la existencia de documentos. Se permite aprobar esta planificación ahora, sin iniciar Apply.

## What Changes

- Logs estructurados, señales de salud y alertas para aplicación, PostgreSQL, proxy, espacio/disco, expiración TLS y antigüedad/fallos de copias. Umbrales, canales, responsables y simulaciones.
- pgBackRest con respaldos íntegros cifrados y repositorio **externo al VPS**, retención versionada, archivado WAL y comprobaciones de integridad. Control de credenciales y permisos; evitar incoherencias entre PostgreSQL 18.6 y pgBackRest.
- Restauración de una instalación en **staging aislado** a un punto temporal verificable; cuantificar RPO observado y RTO observado. Objetivos: RPO máximo **15 minutos** y RTO máximo **4 horas**, condicionados a mediciones y pruebas de fallos realistas, no garantizados por configuración.

## Capabilities

### New Capabilities
- `restaurant-operational-resilience`: salud, alertas, logs, copias externas, PITR y recuperación verificable.

### Modified Capabilities
- La plataforma de despliegue de CHG-006 se instrumenta con servicios y configuración operativa, sin cambiar negocio.

## Impacto y restricciones

Artefactos esperables: `deploy/` según estructura realmente entregada por CHG-006, políticas de monitoreo/respaldos, configuración pgBackRest, scripts de validación sin secretos y `docs/operations/backup-restore-runbook.md`. Nunca conectar repositorio de backups real o VPS de clientes desde CI de PR; no leer ni copiar datos personales reales a entornos de ensayo. Los secretos y la clave de cifrado quedan fuera de Git y de logs. No eliminar backups ni volúmenes al probar. Si no se dispone de almacenamiento externo autorizado, staging y mecanismo de alerta verificable, la tarea afectada queda pendiente con bloqueo explícito.

## Cierre

Tres tareas, evidencias reales de alertas y repositorio fuera del VPS, restauración aislada validada, RPO/RTO **medidos**, pruebas/regresiones y OpenSpec strict. No afirmar objetivos cumplidos cuando no existen mediciones.
