# F1-07 — Monitoreo, respaldos y recuperación

**Prioridad:** P0  
**Dependencia bloqueante:** F1-06 / CHG-006 implementado e integrado, con instalación/actualización Docker aislada validada  
**Estado:** NOT_STARTED (planificación solamente)  
**Change:** CHG-007 — `chg-007-establish-observability-and-backups`

## Historia de usuario

Como operador Dosvy, quiero detectar incidentes y recuperar una instalación sin procesos improvisados.

## Alcance

1. Observabilidad ligera: healthchecks de Next.js, PostgreSQL y Caddy; logs JSON con rotación y alertas esenciales por ruta externa sencilla. Receptor de alertas sintético aislado permitido solo para pruebas; notificaciones externas reales requeridas antes de producción. Evitar stacks pesados sin necesidad demostrada.
2. pgBackRest con SeaweedFS `weed mini` como almacenamiento S3 sintético de desarrollo, en proyecto Docker separado y desechable, imagen fijada/verificable, credenciales sintéticas y sin exposición pública. Verificar API S3 con backup, restore, cifrado y WAL; evaluar una alternativa compatible mantenida si falla antes de implementarla. Producción requiere almacenamiento cifrado fuera del VPS, credenciales independientes y recuperación comprobada.
3. Restore/PITR en PostgreSQL desechable con datos sintéticos; registrar RPO/RTO observados, timestamps, transacciones recuperadas/perdidas y límites de simulación. Objetivos <=15 minutos / <=4 horas sujetos a medición; no extrapolar automáticamente a producción.

## Tres tareas

**T1 / OPS:** healthchecks, logs rotados y alertas esenciales; un receptor aislado prueba el flujo en desarrollo, pero no sustituye el canal externo real requerido antes de producción.

**T2 / DB-OPS:** pgBackRest y prueba S3 aislada con SeaweedFS `weed mini`; evidencia de compatibilidad de backup/restore/WAL. La evidencia local no demuestra copia externa real de producción.

**T3 / QA:** runbook y simulacro desechable; evidencia: recuperación puntual, integridad, transacciones recuperadas/perdidas y RPO/RTO observados. Los valores locales no se extrapolan automáticamente a producción.

## Acceptance criteria

- **F1-07-AC-01:** registros estructurados y métricas diagnósticas sin secretos ni PII.
- **F1-07-AC-02:** alertas observables por canal autorizado independiente del VPS.
- **F1-07-AC-03:** respaldos de PostgreSQL cifrados, verificables, fuera del VPS y accesibles para recuperar un host perdido; claves protegidas.
- **F1-07-AC-04:** WAL archivado sin huecos para ventana PITR acordada y alertas por retraso/fallo.
- **F1-07-AC-05:** restauración en instalación nueva sin modificar fuentes ni producción, con integridad y servicios saludables.
- **F1-07-AC-06:** RPO objetivo 15 min y RTO 4 horas, medidos y demostrados con timestamps; si no se cumplen no se da por cerrada T3.
- **F1-07-AC-07:** runbook documentado con owners, pasos, dependencias de claves/almacenamiento, mitigación y frecuencia de simulacros.
- **F1-07-AC-08:** suites y reglas CHG-005, OpenSpec strict y diff check sin regresiones.

## Restricciones

No iniciar Apply antes de integrar CHG-006 y comprobar su despliegue local aislado. El gate de producción real es independiente y obligatorio. No usar datos reales, VPS de clientes, volúmenes persistentes existentes ni repositorio de copias de producción en pruebas. No publicar bucket, credenciales ni claves. No confundir herramienta instalada con copias probadas. Si faltan recursos externos autorizados, documentar bloqueo y mantener tareas abiertas.
