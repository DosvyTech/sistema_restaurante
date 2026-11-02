# F1-07 — Monitoreo, respaldos y recuperación

**Prioridad:** P0  
**Dependencia bloqueante:** F1-06 / CHG-006 implementado e integrado, con instalación/actualización Docker aislada validada  
**Estado:** NOT_STARTED (planificación solamente)  
**Change:** CHG-007 — `chg-007-establish-observability-and-backups`

## Historia de usuario

Como operador Dosvy, quiero detectar incidentes y recuperar una instalación sin procesos improvisados.

## Alcance

1. Observabilidad ligera: logs JSON/rotación sin secretos, health de app/DB y alertas externas esenciales por caída, disco insuficiente y fallos/atrasos de backup; sin paneles complejos salvo necesidad.
2. pgBackRest o alternativa sencilla técnicamente equivalente, respaldo cifrado **externo al VPS real** antes de producción, claves recuperables y retención; WAL/PITR si es necesario para RPO de 15 minutos. No se aceptan solo snapshots locales.
3. Restore/PITR con datos sintéticos en entorno de prueba separado y descartable, integridad y métricas RPO/RTO del ejercicio; sin presentar la simulación como prueba real del VPS público.

## Tres tareas

**T1 / OPS:** salud, logs y alertas; evidencia: avisos reales enviados y resueltos con canal autorizado.

**T2 / DB-OPS:** pgBackRest, copias remotas cifradas, WAL y retención; evidencia: backup recuperable real fuera del VPS, pgBackRest check/info, monitoreo del retraso y pruebas de falla.

**T3 / QA:** runbook de restauración y simulacro aislado; evidencia: recuperación puntual, integridad de datos, RPO/RTO observados y documentación.

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
