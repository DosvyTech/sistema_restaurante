# Operación, respaldos y recuperación CHG-007

Este runbook cubre una instalación Dosvy por restaurante, operada con Docker Compose en un VPS dedicado. Usa backups pgBackRest cifrados a almacenamiento S3 externo, WAL para PITR, healthchecks nativos y avisos HTTPS. **Estado: NO VALIDADO PARA PRODUCCIÓN.** La prueba local con SeaweedFS es sintética y no demuestra durabilidad fuera del VPS, entrega externa de alertas ni recuperación ante pérdida real del host.

## Configuración inicial

1. Copiar `deploy/deployment.env.example` a `/etc/dosvy/<id>/deployment.env`, fuera del checkout. Sustituir todos los valores de ejemplo y fijar los digests publicados e inmutables de la app, PostgreSQL con pgBackRest y Caddy.
2. Crear `/etc/dosvy/<id>` con propietario `root:root`, modo `0700`. Mantener `postgres_password`, `database_url`, `pgbackrest.conf` y `alert-webhook-url` fuera de Git, con modo `0600`. El URL debe usar usuario/contraseña concordantes y apuntar al servicio privado `postgres`.
3. Partir de `deploy/pgbackrest.conf.example`. Configurar endpoint S3 HTTPS independiente del VPS, bucket privado, credenciales de privilegio mínimo, stanza igual al identificador de instalación, TLS verificado (`repo1-storage-verify-tls=y`), cifrado `aes-256-cbc` y retención de dos full. Guardar la frase de cifrado en un gestor de secretos externo y comprobar su recuperación por dos operadores autorizados. No guardar la única copia de claves en el VPS.
4. Crear `/var/lib/dosvy/<id>` para el estado de alertas, el marcador del último backup exitoso y la bandera genérica de fallo; limitarlo a operadores y excluirlo del checkout. Configurar un webhook HTTPS autorizado; el monitor no acepta HTTP excepto en tests loopback.
5. Ejecutar `node --env-file=/etc/dosvy/<id>/deployment.env scripts/deploy-config-check.mjs` y `docker compose --project-name "$DOSVY_COMPOSE_PROJECT" --env-file "$DOSVY_DEPLOYMENT_ENV_FILE" -f deploy/compose.yaml config --quiet`. Resolver cualquier error antes de arrancar.

PostgreSQL se une a una red de salida específica de backup, sin puertos publicados; la app no se une a esa red. La red privada `data` permanece interna. Limitar la salida del host o del proveedor al endpoint S3 aprobado cuando esa política esté disponible y verificada.

El `deploy/pgbackrest-postgres.Dockerfile` combina PostgreSQL 18.6 Alpine con pgBackRest 2.60.0. El entrypoint copia el secreto montado a `/etc/pgbackrest/pgbackrest.conf`, propiedad `postgres`, modo `0600`; no incorpora configuración ni claves a la imagen. Construir, publicar por el proceso aprobado y desplegar solo la referencia con digest publicada. La imagen local de la prueba no es un artefacto publicable.

## Activación WAL y copias

Después del primer inicio saludable de PostgreSQL, crear la stanza, activar archivado WAL y validar el repositorio. El comando es idempotente y opera solo sobre el proyecto identificado en el archivo de entorno:

```sh
node --env-file=/etc/dosvy/<id>/deployment.env scripts/configure-pgbackrest-archive.mjs
```

La secuencia crea la stanza si aún no existe, aplica por separado `archive_mode=on`, `archive_timeout=60s` y `pgbackrest archive-push %p`, reinicia únicamente `postgres` de ese proyecto, espera su healthcheck y ejecuta `pgBackRest check`. Si falla, no registrar el backup como exitoso; revisar el endpoint, TLS, permisos S3, espacio y WAL sin imprimir secretos.

Programar un único propietario de backups con systemd (Node.js del runtime aprobado, `User=root` solo porque Compose requiere acceso al socket Docker; proteger Docker como acceso root). Usar un servicio oneshot y un timer: full semanal y `DOSVY_BACKUP_TYPE=incr` diario, con aleatoriedad de inicio pequeña y sin ejecuciones concurrentes. pgBackRest bloquea operaciones concurrentes. Ejecutar manualmente:

```sh
node --env-file=/etc/dosvy/<id>/deployment.env scripts/run-pgbackrest-backup.mjs
```

El runner ejecuta `check`, backup, lee `info --output=json`, exige cifrado confirmado y stanza correcta, y solo entonces reemplaza atómicamente el marcador UTC externo y limpia la bandera de fallo. Si el comando falla, conserva el marcador anterior y escribe una bandera genérica sin datos sensibles; el monitor genera una alerta inmediata `backup:failed`. Alertar también si el full supera 7 días, el marcador de backup supera 36 horas o el último WAL supera 15 minutos. La periodicidad y estos umbrales se deben revisar junto con el tamaño y la actividad medidos de cada restaurante; no son garantía de RPO.

Ejecutar el monitor cada cinco minutos desde el mismo host para fallos de contenedores, backup/WAL atrasado y recuperación de alertas:

```sh
node --env-file=/etc/dosvy/<id>/deployment.env scripts/deployment-monitor.mjs
```

El estado de transición se conserva fuera del repositorio; solo se envían eventos nuevos y cierres. Para detectar pérdida completa del VPS, configurar adicionalmente un monitor HTTP sencillo ubicado fuera del host y un destinatario de alertas independiente. Un timer local no puede notificar si el VPS está apagado. La recepción local con webhook sintético no prueba entrega externa de producción.

Docker guarda líneas con envoltura JSON `json-file` y rota cada servicio a 3 archivos de 10 MiB; Caddy emite access logs JSON. PostgreSQL y Next.js aportan su mensaje de servicio dentro de esa envoltura. Limitar permisos al grupo operador, no copiar logs a tickets públicos y no incluir tokens, URL de base, cuerpos de requests, datos fiscales o credenciales. Antes de retener una captura de incidente, revisar/redactar y escanearla.

## Simulacro de recuperación y PITR

Ejecutar el simulacro en un proyecto Compose nuevo, con volumen vacío y aislado, usando solo credenciales sintéticas o el proceso de emergencia autorizado. Nunca montar el volumen origen, restaurar sobre el proyecto original ni publicar puertos de PostgreSQL. No usar `down --volumes`, `volume prune` o limpieza global para preparar el restore.

1. Registrar en UTC declaración del incidente, instalación/proyecto fuente, último backup válido, última transacción confirmada, último WAL archivado y timestamp objetivo.
2. Verificar `pgBackRest check` e `info`, el cipher `aes-256-cbc` y la disponibilidad de todos los WAL necesarios. Confirmar el punto objetivo **después del commit** de la transacción que debe recuperarse.
3. Con el Compose de recuperación que comparte solo el repositorio S3 autorizado y crea un volumen propio, restaurar a un target explícito. Ejemplo de la fase de restore antes de iniciar PostgreSQL:

   ```sh
   docker compose --project-name "$DOSVY_RESTORE_PROJECT" -f "$DOSVY_RESTORE_COMPOSE" \
     run --rm --no-deps --user postgres --entrypoint /usr/local/bin/pgbackrest postgres \
     --config=/run/secrets/pgbackrest_config --stanza="$DOSVY_INSTALLATION_ID" \
     --type=time --target="$DOSVY_PITR_TARGET_UTC" --target-action=promote restore
   docker compose --project-name "$DOSVY_RESTORE_PROJECT" -f "$DOSVY_RESTORE_COMPOSE" \
     up -d --wait postgres app
   ```

4. Comprobar `pg_isready`, readiness HTTP de app, integridad funcional seleccionada y `SELECT count(*) FROM drizzle.__drizzle_migrations`. Comparar transacciones confirmadas antes del incidente con las recuperadas; anotar transacciones ausentes y presentes tras el target.
5. Calcular RPO desde el target PITR hasta la última transacción confirmada antes de la pérdida que no se recuperó. Calcular RTO desde declaración/pérdida de instalación hasta base y app saludables y validadas. Guardar los timestamps UTC y duración, no secretos ni datos personales.
6. Mantener origen y nueva recuperación aislados hasta aprobación humana. El cambio DNS/endpoint es manual y requiere el gate de producción CHG-006. No retroceder migraciones SQL automáticamente; revertir aplicación solo si es compatible con el esquema restaurado.

## Evidencia del laboratorio CHG-007 (2026-11-02)

- Versiones fijadas: `postgres:18.6-alpine@sha256:10a5c69a83035ab5239f5620d708520e8b28f5aa1f2b20143e6024532edadfb5`; `woblerr/pgbackrest:2.60.0-alpine@sha256:f9e1e3989ed2d2476827ae6d48b1e41a959cdc2ece9596948b63299461c34c82`; `chrislusf/seaweedfs:4.51@sha256:3a522c379599e163433a636e75022630848b63a74f08ea37bf06f8d776e9a707`; `caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d`; Next.js standalone sobre `node:24.12.0-bookworm-slim@sha256:7326fb2dbdce998edd72140946851be64ef4a643e8715e138ca467e8e9d92c99`. La imagen custom PostgreSQL/pgBackRest se construyó solo localmente; su digest OCI observado fue `sha256:c0e8d7a151301452df1e096aca9a38496163a38f2b2051eb483110b1b8defa51`, no publicado ni utilizable como release. Todas las pruebas usaron proyectos/redes/volúmenes etiquetados `dosvy.change=CHG-007`, `dosvy.execution=a4f91d`; no se publicaron puertos.
- pgBackRest y `weed mini` interoperaron en endpoint HTTPS S3 sintético: stanza, `check`, backup full, listado `info`, restore, WAL archivado y PITR fueron ejecutados. Backup confirmado con `aes-256-cbc`; `pg_stat_archiver` informó 0 fallos. Se detuvo SeaweedFS: el runner falló (exit 1) y el SHA-256 del marcador no cambió; tras reactivarlo completó otro backup.
- En el full-loss drill final, backup base completado a `2026-11-02T20:14:03.086Z`; transacción `before-target` confirmada, target PITR `2026-11-02T20:14:28.003199Z`, transacción posterior a `2026-11-02T20:14:31.763635Z`, y último WAL archivado observado `2026-11-02T20:14:32.266962Z`. Se eliminó únicamente el volumen fuente sintético luego de comprobar sus etiquetas y referencias. PITR a volumen nuevo conservó `before-target`, excluyó `after-target`, mantuvo 1 fila en el ledger de Drizzle y app readiness quedó `healthy` a `2026-11-02T20:16:01.384553Z`.
- RPO observado: `3.760436 s` desde target hasta la transacción posterior no recuperada. RTO observado: `68.914522 s` desde inicio de pérdida simulada (`20:14:52.470032Z`) hasta app saludable. Ambos cumplen los objetivos **solo en este escenario local, pequeño y sintético**; no predicen una recuperación pública ni con datos reales.
- El test SeaweedFS usó certificado local autocertificado y `repo1-storage-verify-tls=n` únicamente porque no se instaló su CA de prueba en la imagen. La configuración de producción exige `repo1-storage-verify-tls=y`; el checker lo rechaza si se desactiva. Caddy local tampoco equivale a TLS público. No se probó S3 externo, DNS, firewall de VPS ni entrega real de alertas.
- La prueba de alertas observó 12 transiciones en receptor loopback: 6 `triggered` y 6 `recovered`, para `service:app`, `service:caddy`, `service:postgres`, `wal:stale` y `backup:stale`. En 1,958 líneas de logs de contenedores etiquetados no aparecieron las credenciales sintéticas de prueba. El scanner TruffleHog 3.99.7 encontró cero hallazgos en los archivos modificados y su smoke test detectó el fixture sintético con la salida retenida.
- Verificación de código: `npm ci` instaló 250 paquetes; typecheck, lint, boundaries, build, unit (28/28), integration (12/12, incluyendo `db:verify`), E2E Chromium (3/3), `db:check`, Compose y `caddy validate` pasaron. `npm audit --omit=dev` reportó cero; el full audit conserva cuatro moderadas de `esbuild@0.18.20` en la cadena dev de Drizzle Kit y su excepción temporal aprobada. La excepción no representa auditoría limpia.
- En el pico observado hubo 37 contenedores Docker activos, aproximadamente 4,905 MiB sumados frente a 7,543 MiB asignados. La ejecución detuvo temporalmente solo sus seis contenedores CHG-007 para liberar memoria; no detuvo ni eliminó los 31 contenedores de otros proyectos.

## Gate previo a producción

Estado actual: **NO VALIDADO PARA PRODUCCIÓN**. Antes de datos reales, demostrar y registrar un destino S3 durable fuera del VPS con TLS verificado, cifrado, retención y credenciales independientes; recuperación de claves por más de un operador; backup y PITR desde ese destino; notificación real independiente del host; DNS y certificado público; firewall y puertos externos; capacidad/retención; y restauración completa en una instalación autorizada. Los objetivos RPO/RTO quedan sujetos a medición en esa infraestructura.
