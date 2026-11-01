# Design — CHG-007 / F1-07

## Contexto y precondiciones

CHG-006 debe haberse implementado y validado en staging: imágenes/Compose, Caddy, Postgres privado, TLS, identificadores por restaurante, proceso de release y migraciones. Antes de Apply inspeccionar sus artefactos y versiones efectivas. CHG-003 y CHG-004 establecen DB y pruebas, CHG-005 exige seis checks en PR a main. CHG-007 debe preservar aislamiento y reglas existentes.

## D1 — Observabilidad y alertas (T1)

- Registros estructurados JSON de app y procesos con timestamp UTC, servicio, entorno, instalación opaca, nivel, categoría, correlación/request ID y resultado; no volcar tokens, credenciales, cuerpo de facturas, PII ni cadenas DB. Proxies y Docker con rotación/retención y límites de disco; acceso restringido a operadores.
- Liveness y readiness separados cuando sea útil: app responde, PostgreSQL alcanzable a través de red interna sin reflejar secretos o información sensible al cliente; fallos de Caddy/TLS, espacio, memoria, recursos, errores app y retraso/fracaso backup. Definir claramente qué condición reinicia un servicio y cuál solo alerta, con umbrales y ventanas para evitar tormentas.
- Stack mínimo adecuado a VPS pequeño (p. ej. healthchecks + exporter/colector + notificación) configurable por instalación; no meter credenciales de mensajería en imagen, repositorio o PR. Integración externa supervisada o host de monitoreo separado evita punto único de falla del propio VPS.
- Pruebas: detención controlada de servicio/indisponibilidad DB y condición ficticia backup atrasado, recepción de aviso real en canal autorizado, recuperación y cierre del aviso, prueba de no exposición de secretos. Señales de alerta con owner y documentación.

## D2 — pgBackRest, backup externo cifrado y WAL (T2)

- Verificar compatibilidad concreta con PostgreSQL del despliegue y elegir versiones **fijadas** de pgBackRest. Repositorio remoto objeto S3 compatible u otro destino independiente con credenciales de privilegio mínimo y cifrado en reposo (AES-256 o cifrado de servicio equivalente verificado), TLS en tránsito, permisos y rotación. No almacenar la clave maestra únicamente en el VPS; documentar recuperación de secretos, costes, almacenamiento y retención. No usar un volumen local como única copia.
- Configurar `archive_mode=on`, `archive_command` comprobado, stanza de pgBackRest y retención full/differential/incremental según pruebas; evaluar impacto de WAL y tiempos de archivado para RPO <=15m, más monitor de `archive_command`, lag y copia recuperable. PostgreSQL WAL segment handling: `archive_timeout` puede limitar el retraso de archivado pero **no garantiza por sí solo** durabilidad externa; confirmar llegada WAL y consistencia. Evitar `wal_level=minimal` y nunca deshabilitar fsync.
- Servicio/job de backup y scheduling seguros (un único propietario por instalación), bloqueo de concurrencia, timeout y reintentos acotados. Inventario/retención protegidos; acceso externo, inventarios, prueba de `pgbackrest info`/check y validación de backups y cadenas WAL. Mantener al menos un recovery point utilizable, nunca borrar la última copia sana.
- Dar alarma por full fallido, retardo WAL y espacio local/remoto; evitar guardar secretos en variables impresas o comandos. El backup no debe convertir puerto 5432 en público ni añadir privilegios de root dentro de la app.

## D3 — Restauración aislada, PITR y medición (T3)

- Ejecutar ejercicio desde repositorio externo en nuevo ambiente staging **desechable** con nuevo proyecto/volúmenes/credenciales sin tocar origen. Incluir pérdida de VPS simulada y restauración puntual a timestamp registrado, verificación de WAL, integridad/ledger, acceso app y datos sintéticos conocidos. No restaurar copias de clientes reales al entorno de prueba.
- Cronometrar RTO desde la declaración del incidente hasta servicio restaurado validado, incluyendo aprovisionar host/secrets y reconfigurar DNS/HTTPS si forman parte del escenario. Medir RPO como diferencia entre último commit sintético confirmado previo a pérdida y último recuperado; registrar UTC, precisión, marcas de WAL y qué datos se perdieron; reportar también datos pendientes no archivados. Comparar con 15m/4h; si se excede, no aceptar AC como cumplido.
- Simular corrupción/interrupción de backup/archivo WAL, recuperación fallida y alerta o bloqueo; validar que scripts no eliminan infra existente y que la restauración nunca apunta a la instalación original. Procedimientos humanos: responsables, credenciales de emergencia, escalamiento, comunicaciones, verificación de servicio y revocación de accesos temporales.
- Documentar periodicidad de simulacros y resultados, versiones/digests, prueba de restauración, coste y capacidad. Preservar evidencias sin incluir secretos, URLs de buckets privados o datos sensibles.

## Validación y criterios de cierre

T1: logs sin secretos + alertas observadas en canales autorizados, recuperación y auto-cierre. T2: respaldo cifrado verificado fuera del VPS, pgBackRest check/info y continuidad WAL comprobada; failure tests. T3: restore PITR real aislado, checksum/integridad y prueba de funcionamiento, RPO observado <=15 minutos, RTO observado <=4 horas. Ejecutar suites CI, controles de seguridad, `openspec validate chg-007-establish-observability-and-backups --strict` y `git diff --check`. Documentar bloqueos sin inventar valores.

## Riesgos

Staging o repositorio externo faltantes impiden concluir T2/T3. Un reinicio o DNS cache puede afectar mediciones; registrar alcance. Claves perdidas hacen backups irrecuperables: verificar custodia y recuperación. RTO depende de aprovisionamiento y tamaño DB; no prometer objetivo sin evidencia. Alertar desde el mismo VPS puede fallar cuando cae el host: usar ruta independiente para alertas críticas.
