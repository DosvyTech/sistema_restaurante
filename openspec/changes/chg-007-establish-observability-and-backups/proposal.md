# CHG-007 — Monitoreo, respaldos y recuperación (F1-07)

## Why

Una instalación Dosvy por VPS exige detectar fallos, conservar respaldos fuera del servidor y recuperar datos tras una pérdida del VPS o corrupción. CHG-006 establece el despliegue sobre el cual operar; CHG-007 no debe implementarse antes de que CHG-006 esté integrado, sus pruebas locales de instalación/actualización estén aceptadas y sus artefactos estén disponibles. **No se requiere un VPS público solo para desarrollar observabilidad y backups**.

**Prioridad:** P0. **Dependencia bloqueante:** F1-06 / CHG-006 **implementado y verificado**, no basta la existencia de documentos. Se permite aprobar esta planificación ahora, sin iniciar Apply.

## What Changes

- Observabilidad **ligera**: logs estructurados/rotados, healthchecks y avisos esenciales de caída de app/DB, espacio insuficiente y backup atrasado/fallido; usar un servicio externo de alertas sencillo si aporta más fiabilidad que montar un stack de métricas.
- pgBackRest (u opción más simple solo si satisface los mismos objetivos medidos) con respaldos íntegros cifrados y repositorio **externo al VPS**, retención y archivado WAL/PITR según la ventana RPO aprobada, con comprobaciones de integridad. Control de credenciales y permisos; evitar incoherencias entre PostgreSQL 18.6 y pgBackRest.
- Restauración de una instalación en **staging aislado** a un punto temporal verificable; cuantificar RPO observado y RTO observado. Objetivos: RPO máximo **15 minutos** y RTO máximo **4 horas**, condicionados a mediciones y pruebas de fallos realistas, no garantizados por configuración.

## Capabilities

### New Capabilities
- `restaurant-operational-resilience`: salud, alertas, logs, copias externas, PITR y recuperación verificable.

### Modified Capabilities
- La plataforma de despliegue de CHG-006 se instrumenta con servicios y configuración operativa, sin cambiar negocio.

## Impacto y restricciones

Artefactos esperables: `deploy/` según estructura realmente entregada por CHG-006, políticas de monitoreo/respaldos, configuración pgBackRest, scripts de validación sin secretos y `docs/operations/backup-restore-runbook.md`. Nunca conectar repositorio de backups real o VPS de clientes desde CI de PR; no leer ni copiar datos personales reales a entornos de ensayo. Los secretos y la clave de cifrado quedan fuera de Git y de logs. No eliminar backups ni volúmenes al probar. Para desarrollo usar almacenamiento externo **de prueba** (p. ej. objeto S3 compatible separado del host o emulador remoto aislado, etiquetado como prueba) y datos sintéticos; un simulador local no acredita pérdida real de VPS ni copia externa real. Los requisitos de puesta en servicio con datos reales conservan alertas independientes, cifrado y restauración verificable. Si no hay evidencia suficiente para cumplir una tarea, dejarla pendiente.

## Cierre

Tres tareas con pruebas de integración de alertas y restauración **en recursos de prueba separados y sintéticos**, RPO/RTO **medidos en el escenario ensayado**, regresiones y OpenSpec strict. No presentar una simulación local como recuperación de VPS público ni como garantía de RPO/RTO de clientes. Mantener un gate de producción: almacenamiento externo independiente, claves recuperables, alertas externas y restauración probada antes de datos reales. Evitar Prometheus/Grafana/ELK o clústeres sin necesidad demostrada. Ver `docs/architecture/small-restaurant-principles.md` tras integrar CHG-006.
