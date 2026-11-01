# Deployment runbook (CHG-006)

This procedure targets one dedicated Ubuntu LTS VPS per restaurant. It is an operator-run Compose deployment, not an automatic production workflow. CHG-006 was validated locally with synthetic credentials and disposable Docker projects; **no authorized VPS, public staging DNS name, or staging credentials were supplied**, so this document does not claim a public deployment or TLS acceptance.

## Platform and isolation

- Build the application from the committed `deploy/Dockerfile`. It uses Next.js standalone output, the repository's Node `24.12.0` / npm `11.6.2` pins, production dependencies only in the final image, and runs the Next.js process as the image's unprivileged `node` user.
- The Node base image is pinned to `node:24.12.0-bookworm-slim@sha256:7326fb2dbdce998edd72140946851be64ef4a643e8715e138ca467e8e9d92c99`. PostgreSQL and Caddy are pinned in `deployment.env.example` to `postgres:18.6-alpine` and `caddy:2.10.2-alpine` multi-platform digests. Review and update digests deliberately.
- `deploy/compose.yaml` is separate from the development `compose.yaml`. It scopes project, networks and named volumes to `DOSVY_COMPOSE_PROJECT`; the data network is internal. PostgreSQL has no published host port. Next.js exposes only container port 3000 to the edge network. Caddy is the only service publishing 80/443 TCP and UDP.
- Do not use a fixed `container_name`, a shared volume/network name, `docker compose down -v` on an unknown project, `docker system prune`, or any global cleanup command. Keep installation IDs unique and use the validation command below before starting a stack.

## Host, DNS and secrets

1. Provision a dedicated, supported Ubuntu LTS host. Update the OS and Docker Engine/Compose plugin through the approved host procedure. Restrict SSH to authorized operators and keys; do not expose the Docker socket.
2. Create the DNS A/AAAA record for the authorized installation domain. Configure the host firewall to allow SSH only from approved addresses and public TCP/UDP 80/443 for Caddy/ACME. Do not allow public PostgreSQL 5432 or the internal application port 3000.
3. Create an operator-owned directory such as `/etc/dosvy/<installation-id>` outside the checkout, owned by root and mode `0700`. Store two separate files there: `postgres_password` (one password line) and `database_url` (one PostgreSQL URL line). Use a URL-encoded password in the URL; the database user and password must match the values in the secret files. Set both files to `root:root`, mode `0600`. Never put them in Git, an image, a command argument, a shell transcript or CI.
4. Copy `deploy/deployment.env.example` to an operator-only path outside the repository (for example `/etc/dosvy/<id>/deployment.env`). Set an installation-specific lowercase ID, exact project/database names (`dosvy-<id>` with `_` normalized to `-`, and `dosvy_<id>`), authorized public DNS name, external secret file paths, and the immutable application image reference. Replace every example value. The app image must be tagged for the release and pinned by its registry `sha256` digest; do not deploy `latest` or the sample placeholder.

The database URL must target `postgres:5432/dosvy_<installation-id>`, not loopback, a public host, `dosvy_dev`, or `dosvy_test`. The deployment checker reads secret files without printing them and rejects files within the repository, inconsistent credentials/targets, mutable images, mismatched project/database names, invalid domains, and permissive Unix secret-file modes.

## Build and validate a release

Build and publish an image using an approved release process and registry credentials that are not stored here. Record the Git commit and immutable image digest in the release record. A local image build is useful for validation but is not a published release.

```bash
export DOSVY_ENV_FILE=/etc/dosvy/<installation-id>/deployment.env
node --env-file="$DOSVY_ENV_FILE" scripts/deploy-config-check.mjs
docker compose --env-file "$DOSVY_ENV_FILE" -f deploy/compose.yaml config --quiet
docker compose --env-file "$DOSVY_ENV_FILE" -f deploy/compose.yaml pull
```

`config --quiet` must succeed before any `up` or migration command. Missing required variables, missing secret files or invalid Compose configuration are blockers. Keep the environment file and secrets outside the repository.

## New installation and controlled update

For a new installation, use a unique ID, project, database, secret files, volumes and domain. For an update, first confirm the target project and installation ID, inspect the current immutable app image and migration ledger, and take the authorized pre-change recovery point required by the operator's data-protection policy. Do not proceed with a destructive or data-affecting migration if no tested recovery path is available; CHG-007 owns the external backup/restore system.

Apply versioned migrations as a one-time, explicit operation. The script requires `DOSVY_DEPLOYMENT_MODE=authorized`, exact installation confirmation, a URL secret targeting the private Compose `postgres` service and a database named for that installation. It serializes execution with a PostgreSQL advisory lock. It does not change `scripts/db-migrate.ts` or weaken the local-only `npm run db:migrate` restrictions.

```bash
DOSVY_DEPLOYMENT_MODE=authorized \
DOSVY_MIGRATION_CONFIRMATION=<installation-id> \
docker compose --env-file "$DOSVY_ENV_FILE" -f deploy/compose.yaml \
  --profile operations run --rm migrate

docker compose --env-file "$DOSVY_ENV_FILE" -f deploy/compose.yaml \
  up -d --wait app caddy
```

If migration fails, stop and inspect its ledger and PostgreSQL state before retrying. Do not deploy the new app image after a failed migration. Once healthy, run smoke checks from an authorized external host:

```bash
curl --fail --show-error --silent --output /dev/null "https://<authorized-domain>/"
curl --fail --show-error --silent --head "http://<authorized-domain>/"
```

Confirm the first request validates the public certificate and hostname, and that the HTTP response redirects to HTTPS. Confirm externally that 5432 and port 3000 are unreachable. Local Caddy certificates, `curl -k`, Compose health, or a local port scan are not proof of publicly trusted TLS or external firewall behavior.

For a compatible application rollback, set `DOSVY_APP_IMAGE` to the prior recorded immutable image digest, validate the configuration again, then recreate only the selected installation's app/proxy services. Roll back the application image only when it is compatible with the current schema. Never downgrade or reverse SQL migrations automatically. If the schema is incompatible, stop and follow an approved restore/recovery procedure instead.

## Release evidence and cleanup

For each change, record outside the repository or in an access-controlled operations record: UTC start/end, installation ID, Git SHA, app/PostgreSQL/Caddy image references and digests, Compose project, migration ledger rows, container health, smoke-test result, public TLS hostname/validity, external port test, operator and any incident/recovery steps. Do not record secret values, database URLs, private bucket URLs or customer data.

Inspect only the chosen project with `docker compose ... ps` and `docker compose ... logs --since ... app postgres caddy`; check logs for accidental sensitive output before retaining them. Normal retirement and data deletion require a separate approved backup/retention process. Never remove volumes during routine deployment or use global Docker cleanup.

## CHG-006 verification and limits

Local disposable tests used two projects (`dosvy-install-a` and `dosvy-install-b`) with different synthetic database credentials, databases, networks, volumes and loopback-only ports. Both app/PostgreSQL/Caddy sets became healthy. Installation A was migrated on the earlier image, then its image was updated to the validation image and migrations were rerun; its migration ledger remained at one row and the updated app became healthy. Installation B received its initial migration and also had one ledger row. Local HTTP-to-HTTPS routing was checked with Caddy's local certificate in the stack validation; this is not public TLS evidence. Both temporary test projects were removed by their exact Compose project names. The existing `dosvy-chg003-postgres` container remained exited with the same ID, while `dosvy_chg003_pgdata` and `dosvy-chg003_default` remained present and untouched.

This local verification does not complete the authorized staging acceptance. CHG-006 Task 3 remains pending until an approved staging VPS and public domain are available and a clean install, controlled update, public TLS, external port isolation, smoke checks and recovery-compatible rollback are evidenced there. Task 2's implementation and local Caddy/network validations can be reviewed, but public TLS remains unverified.
