# Database conventions — CHG-003 / F1-03

## Scope

This Change establishes PostgreSQL and Drizzle plumbing for one restaurant installation at a time. The initial versioned migration creates only the `app` namespace. Domain tables, seeds, authentication, production provisioning and production migration operations belong to later Changes.

The Drizzle TypeScript schema is the source for future schema changes. Generate SQL with Drizzle Kit, review the SQL, journal and snapshot, and commit all of them together. Apply versioned SQL with `npm run db:migrate`; never use `drizzle-kit push` as a deployment mechanism.

## Local PostgreSQL

The repository uses the official `postgres:18.6-alpine` image through `compose.yaml`. Its container, Compose project, network and named volume are specific to this project:

| Resource | Name / boundary |
|---|---|
| Compose project | `dosvy-chg003` |
| Container | `dosvy-chg003-postgres` |
| Network | `dosvy-chg003_default` |
| Named volume | `dosvy_chg003_pgdata` |
| Host port | `127.0.0.1:55432` |
| Development database | `dosvy_dev` |
| Test database | `dosvy_test` |

In PowerShell, create a local environment file once and replace the password placeholder with a local-only URL-safe value. Update the password in both connection URLs to match:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose config --quiet
docker compose up -d --wait postgres
docker exec dosvy-chg003-postgres psql -U dosvy_local -d dosvy_dev -c 'SELECT version();'
```

`.env` is ignored by Git. `.env.example` contains placeholders only. The test database is created by the PostgreSQL initialization SQL when the named volume is first initialized. The container publishes PostgreSQL only on loopback. Do not use this Compose project as production infrastructure.

`docker compose stop postgres` stops only this project's database. Do not use global Docker prune commands. The named volume is persistent across container restarts.

## URLs and safety

`DATABASE_URL` is read lazily when application code requests a database context. The public `/` and `/modules` routes do not import the database module and do not connect during build or rendering. Migration commands additionally require a loopback host and a database named `dosvy_dev*` or `dosvy_test*`.

Database integration tests require the separate `TEST_DATABASE_URL`. It must use `localhost`, `127.0.0.1` or `::1`, and a database named `dosvy_test` or `dosvy_test_*`. Test setup refuses a missing URL, a non-loopback host, another database name, or the same connection target as `DATABASE_URL`; it never falls back to the application URL. Error messages do not include URL contents or credentials.

`npm run db:verify` requires a local test role with `CREATEDB` (provided by this repository's local-only Compose setup). It generates a random run suffix, creates two databases named `dosvy_test_chg003_<run>_a` and `_b`, applies migrations to both, reapplies them to the first, checks the `app` namespace and Drizzle migration ledger, runs the database tests, then drops only the exact temporary databases it created. It does not stop containers or remove volumes.

## Schema and connection conventions

- The permanent migration history is in `drizzle/`; Drizzle Kit's journal and snapshots are committed under `drizzle/meta/`.
- Migration tracking uses the `drizzle.__drizzle_migrations` table. The application-owned namespace is `app`.
- `src/shared/server/db/**` is Node.js-only and begins with `import "server-only"`. Do not import it from a Client Component or Edge runtime.
- The process-wide `pg.Pool` is bounded to five connections with finite idle and connection timeouts. Scripts and tests close their pools.
- `withTransaction<T>` commits only when its callback succeeds. All callback writes must use the supplied `tx`; work through another pool connection is outside the transaction.
- Test fixtures use a random schema in `dosvy_test`, define only parent/child rows for FK and transaction checks, and drop the schema after the run. No fixture table is part of a permanent migration.
- Future tables should use immutable primary keys, consistent `snake_case`, `timestamptz` for UTC instants, and `numeric` rather than floating point for money when those domain models are introduced. Add foreign keys and indexes according to the owning module's access patterns.

## Commands

```powershell
npm ci
npm run db:generate       # after an intentional schema change; review generated SQL
npm run db:check
npm run db:migrate        # local dosvy_dev* or dosvy_test* databases only
npm run db:test           # TEST_DATABASE_URL only
npm run db:verify         # two blank databases, idempotency, then database tests
npm run typecheck
npm run lint
npm run check:boundaries
npm run build
```

## Versions and verification record

The implementation was verified in this environment with Node.js 24.12.0, npm 11.6.2, Docker Engine 29.9.2 and PostgreSQL 18.6. Direct package versions are pinned exactly in `package.json` and `package-lock.json`: `drizzle-orm` 0.45.4, `drizzle-kit` 0.31.11, `pg` 8.23.1, `@types/pg` 8.23.1 and `tsx` 4.23.15.

Observed results for CHG-003:

| Check | Result |
|---|---|
| `npm ci` | Passed; installed 210 packages from the lockfile. npm reported four moderate advisories in Drizzle Kit's transitive `@esbuild-kit` / older `esbuild` development tooling; no high or critical advisories. |
| `npm run db:generate` | Passed. Initial generated SQL is `CREATE SCHEMA "app";`; subsequent generation reports no schema changes. |
| `npm run db:check` | Passed; Drizzle migration journal is consistent. |
| `npm run db:migrate` | Passed twice against `dosvy_dev`; both runs completed successfully. |
| `npm run db:verify` | Passed. Two newly created databases each received one migration; the first was reapplied without an additional ledger row. All 10 URL, FK, commit and rollback tests passed. The script removed its two temporary databases. |
| Build without `.env` and with empty database URLs | Passed; `/` and `/modules` prerendered as static routes. |
| Production route requests without `.env` or database URLs | Passed; `GET /` and `GET /modules` each returned HTTP 200 with `lang="es"`. |
| Client import probe | Next.js rejected a temporary Client Component importing `src/shared/server/db/client.ts` because it depends on `server-only`. The probe was removed afterward. |

The application routes contain no database initialization. Do not treat the local verification database, credentials or fixture contents as production data.
