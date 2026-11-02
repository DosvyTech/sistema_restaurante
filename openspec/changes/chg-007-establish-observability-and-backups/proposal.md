# CHG-007 — Monitoreo, respaldos y recuperación (F1-07)

## Why

Una instalación Dosvy por VPS exige detectar fallos, conservar respaldos fuera del servidor y recuperar datos tras una pérdida del VPS o corrupción. CHG-006 establece el despliegue sobre el cual operar; CHG-007 no debe implementarse antes de que CHG-006 esté integrado, sus pruebas locales de instalación/actualización estén aceptadas y sus artefactos estén disponibles. **No se requiere un VPS público solo para desarrollar observabilidad y backups**.

**Prioridad:** P0. **Dependencia bloqueante:** F1-06 / CHG-006 **implementado y verificado**, no basta la existencia de documentos. Se permite aprobar esta planificación ahora, sin iniciar Apply.

## What Changes

- Observabilidad **ligera**: healthchecks y logs JSON con rotación para Next.js, PostgreSQL y Caddy; alertas esenciales por una ruta de notificación externa sencilla e independiente del VPS. Un receptor aislado de pruebas puede validar el flujo durante desarrollo, pero no sustituye la entrega real de notificaciones externas antes de producción. No desplegar Prometheus, Grafana, ELK ni servicios adicionales sin una necesidad demostrada.
- pgBackRest como solución principal para copias cifradas, archivado WAL y recuperación puntual. En desarrollo, usar SeaweedFS `weed mini` como endpoint S3 dentro de un proyecto Docker separado y desechable, con datos y credenciales sintéticos, versión o digest verificable y sin exposición pública. La compatibilidad concreta de la API S3 con pgBackRest se debe demostrar mediante backup, restore y WAL; si falla, evaluar y justificar una alternativa S3 compatible mantenida antes de implementarla. Para producción, respaldos fuera del VPS, cifrados, con credenciales independientes y recuperación comprobada.
- Restauración en una instalación PostgreSQL desechable con datos sintéticos; registrar tiempos observados, transacciones recuperadas, datos posiblemente perdidos y límites de la simulación. Objetivos: RPO máximo **15 minutos** y RTO máximo **4 horas**, sujetos a medición; los resultados locales no se extrapolan automáticamente a producción.

## Capabilities

### New Capabilities
- `restaurant-operational-resilience`: salud, alertas, logs, copias externas, PITR y recuperación verificable.

### Modified Capabilities
- La plataforma de despliegue de CHG-006 se instrumenta con servicios y configuración operativa, sin cambiar negocio.

## Impacto y restricciones

Artefactos esperables: `deploy/` según estructura realmente entregada por CHG-006, políticas de observabilidad/respaldos, configuración pgBackRest, pruebas sin secretos y `docs/operations/backup-restore-runbook.md`. Nunca conectar repositorios de backups reales o VPS de clientes desde CI de PR ni copiar datos personales a pruebas. Los secretos y claves quedan fuera de Git y logs. El proyecto Docker de SeaweedFS de pruebas debe tener nombre, red, volúmenes y credenciales propios; sus recursos serán desechables y nunca se eliminarán recursos ajenos. La aceptación local no acredita un destino externo real ni recuperación ante pérdida real del VPS. Antes de producción se requieren almacenamiento fuera del VPS, cifrado, credenciales independientes, notificaciones externas y restauración comprobada. Si falta evidencia, la tarea correspondiente queda pendiente.

## Cierre

Tres tareas con pruebas de integración de alertas y restauración **en recursos de prueba separados y sintéticos**, RPO/RTO **medidos en el escenario ensayado**, regresiones y OpenSpec strict. No presentar una simulación local como recuperación de VPS público ni como garantía de RPO/RTO de clientes. Mantener un gate de producción: almacenamiento externo independiente, claves recuperables, alertas externas y restauración probada antes de datos reales. Evitar Prometheus/Grafana/ELK o clústeres sin necesidad demostrada. Ver `docs/architecture/small-restaurant-principles.md` tras integrar CHG-006.
