# Runtime foundation conventions — F1-02

## Runtime baseline

- Application: Next.js App Router at `src/app`, React Server Components by default, and Node.js runtime.
- Language and aliases: strict TypeScript; `@/*` resolves to `src/*`.
- Package manager: npm with exact direct dependency versions and committed `package-lock.json`. Use the repository Node pin (`.nvmrc`) and run `npm ci` for a clean install.
- The declared minimum is Node.js 20.19.0 (the F1-01 constraint). This repository currently pins Node.js 24.12.0; `.npmrc` rejects unsupported Node/npm versions.
- Current pinned runtime/toolchain: Next.js 16.4.3, React/React DOM 19.3.1, TypeScript 5.9.3, ESLint 10.13.0, and dependency-cruiser 18.7.0. The ESLint setup uses the standalone Next.js recommended plugin and TypeScript ESLint flat config so the lockfile has no ESLint peer-range overrides.
- Do not disable TypeScript or ESLint validation in Next configuration to make a command pass.

## Ownership and imports

- `src/app`: route composition, layouts, metadata, and route-level presentation; it may import module registry data and shared UI.
- `src/modules`: domain-owned contracts and behavior introduced by later Changes; no import from `src/app` or another module's internals.
- `src/shared`: genuinely cross-domain utilities/UI. `src/shared/server` is server-only and must begin with `import "server-only"`.
- Intended direction: `app -> modules -> shared`, plus `app -> shared`; shared code never imports app or modules. Dependency-cruiser enforces forbidden edges and cycles through `.dependency-cruiser.cjs`.
- Prefer Server Components. Add `'use client'` only for real browser interaction, and never import a server-only module from that client subtree.
- Do not add authentication, database access, APIs, fiscal integration, CRUD, or secrets in F1-02.

## Commands

| Command | Purpose |
|---|---|
| `npm ci` | Reproduce installation from the lockfile. |
| `npm run dev` | Start the local Node.js development server. |
| `npm run typecheck` | Run TypeScript without emitting output. |
| `npm run lint` | Run the ESLint CLI with Next.js recommended rules and TypeScript rules. |
| `npm run check:boundaries` | Validate imports/cycles (added with the architecture gate). |
| `npm run build` | Build production output. |
| `npm run start` | Serve the production build. |

## Verification record

**Environment:** Node.js 24.12.0; npm 11.6.2; registry `https://registry.npmjs.org/`.

| Command / check | Result |
|---|---|
| `npm ci --no-audit --no-fund` | PASS — 178 packages installed from the lockfile with no warnings. |
| `npm run dev` and GET `/` | PASS — server ready; route returned HTTP 200 with `lang="es"`. |
| `npm run typecheck` | PASS — `tsc --noEmit`, exit 0. |
| `npm run lint` | PASS — ESLint CLI, exit 0. |
| `npm run check:boundaries` | PASS — no dependency violations; 7 source modules, 4 dependencies. A temporary forbidden import plus cycle returned exit 1 with four diagnostics; all probe files were removed and the clean check passed again. |
| `npm run build` | PASS — production build and TypeScript validation completed; `/` and `/modules` prerendered. |
| `npm run start` and GET `/`, `/modules` | PASS — production server ready; both routes returned HTTP 200 and the seven expected module IDs were present. |
| Client import of `src/shared/server/runtime.ts` | PASS — temporary client route returned HTTP 500 with Next's explicit `server-only` import diagnostic; route fixture was removed. |
| `openspec validate chg-002-bootstrap-modular-nextjs --strict` | PASS — `Change 'chg-002-bootstrap-modular-nextjs' is valid`, exit 0. |
| `git diff --check` | PASS — no whitespace errors. |
| `designmd lint DESIGN.md` | PASS — 0 errors and 0 warnings. |

**Limitations:** no browser executable or browser-control tool was available. Route and Spanish-content checks used HTTP requests; keyboard/mobile behavior was checked in semantic markup and responsive/focus CSS, not exercised in a rendered browser. The premium UI audit script could not run because Python is not installed in this environment. No E2E or accessibility tests were added; their infrastructure is outside this Change (F1-04).
