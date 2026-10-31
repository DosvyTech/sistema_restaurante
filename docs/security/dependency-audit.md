# Dependency audit summary

**Updated:** 2026-10-31
**Scope:** CHG-003 dependency remediation

## Current status

The dependency audit before remediation reported 15 moderate vulnerabilities. The root override pins the development dependency `minimatch` to stable version `11.0.1`, and `package-lock.json` records the matching resolution. `npm audit --omit=dev` reports zero vulnerabilities.

`npm audit` still reports **four moderate vulnerabilities** through this development-only path:

```text
drizzle-kit@0.31.11
└─ @esbuild-kit/esm-loader@2.6.5
   └─ @esbuild-kit/core-utils@3.3.2
      └─ esbuild@0.18.20
```

This is a provisional, explicitly accepted exception for CHG-003. It is an outstanding audit result, not an approval or a clean audit. The vulnerable esbuild range is `<=0.24.2`; the advisory concerns a website reading responses from an esbuild development server when its serve feature is used. The affected package is part of Drizzle Kit's development tooling and is not included in the production dependency audit. No evidence indicates that the application starts this esbuild serve feature.

## Follow-up

- Keep development servers bound to loopback and do not expose them to untrusted networks or browser origins while this dependency remains.
- Recheck the dependency path on each Drizzle Kit stable release and update when a compatible stable release removes the vulnerable `@esbuild-kit` chain.
- Do not downgrade Drizzle Kit to the version proposed by `npm audit`; it is incompatible with the established CHG-003 toolchain. Do not use a broad override that leaves an invalid dependency tree.
- Remove this exception only after `npm audit` no longer reports the four moderate esbuild findings, then record a fresh audit result.

## Verification record

The `minimatch@11.0.1` override was installed with `npm ci` and verified with typecheck, lint, dependency-boundary checks and production build. The database verification passed all 10 checks, including clean migrations, reapplication idempotency, foreign-key rejection, transaction commit and rollback. The strict OpenSpec validation passed. The remaining `npm audit` result is four moderate esbuild findings; `npm audit --omit=dev` reports zero.
