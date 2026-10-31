# Pull request quality and security policy

## Scope and enforcement

Pull requests targeting `main` are evaluated by the workflows under `.github/workflows/`. The quality workflow uses the repository's `.nvmrc` and lockfile, and runs on GitHub-hosted `ubuntu-24.04` runners. Its stable job checks are `quality / static`, `quality / database`, and `quality / e2e`. The security workflow has `security / dependency audit` and `security / secrets`; CodeQL reports as `codeql / analyze`.

The workflows use `pull_request`, `push` to `main`, and explicit manual dispatch where appropriate. They do not use `pull_request_target`, production credentials, or write permission for ordinary CI. The database suite calls CHG-004's disposable PostgreSQL runner, which allocates synthetic credentials, a loopback-only random port, a unique container, and temporary storage, then removes only its own container. The E2E suite installs the lockfile-matched Chromium and starts its Next.js test server on loopback.

Creating a workflow does not by itself protect `main`. Repository administrators must use the observed status checks and PR policy below to configure and verify the repository ruleset. Until a GitHub ruleset is active and tested, treat the policy as a required operating procedure rather than effective platform enforcement.

## Required checks and review

Before enabling protection, observe successful runs for each stable quality and security job on a real PR. Require these checks by their exact names: `quality / static`, `quality / database`, `quality / e2e`, `security / dependency audit`, `security / secrets`, and `codeql / analyze`. A branch update invalidates old results; require checks on the latest commit. Require pull requests, at least one approving review, resolved conversations, and no direct pushes to `main`.

Do not bypass failed checks to merge. If a ruleset allows administrator bypass for recovery, restrict it to repository administrators, document the reason in the PR, and use it only to restore a broken protection configuration or address an urgent incident. Recheck the ruleset after any recovery. The administrator account must retain its explicit bypass/recovery route; never test policy by merging a PR.

For a controlled failure test, open a throwaway PR that introduces only a deterministic failing assertion in a test fixture and verify GitHub marks the required check failed and the PR as blocked. Remove the failure on the same branch and verify the same check becomes successful. Keep both PRs unmerged and close them after recording the evidence. A green run is necessary but not sufficient for merge: review, resolved discussion, and the remaining required checks still apply.

## Dependency audit and provisional exception

The security workflow runs `npm audit --omit=dev` as a mandatory gate. It must report zero production/runtime vulnerabilities; any finding fails that job. It also runs a full `npm audit --json` and reports every finding. The full audit is not clean while the known exception is active.

The only temporary allowlist is `security/npm-audit-exception.json`. It expires on **2027-01-31** and is owned by **DosvyTech repository maintainers**. It accepts exactly the four moderate npm vulnerability records caused by advisory **GHSA-67mh-4wv8-2f99** for `esbuild@0.18.20`, at the recorded package-lock path and this resolved development chain:

```text
drizzle-kit@0.31.11
└─ @esbuild-kit/esm-loader@2.6.5
   └─ @esbuild-kit/core-utils@3.3.2
      └─ esbuild@0.18.20
```

The checker verifies the complete vulnerability package set and totals, severity, directness, npm advisory source/title/URL/range, package effects, lockfile nodes, resolved versions, and each dependency edge. An added finding, changed severity/advisory/path/version, malformed report, or expired exception fails. Do not add broad severity-based ignores or use `continue-on-error`. The exception is not an audit approval and does not hide the four moderate findings. The production-only audit remains zero. Follow the remediation guidance in [dependency-audit.md](../security/dependency-audit.md): keep development servers on loopback; review stable Drizzle Kit releases and remove the exception as soon as a compatible update removes the vulnerable chain. Reapprove or replace the exception before its expiry; do not downgrade Drizzle Kit to an incompatible release.

The audit checker has synthetic tests for the approved report, an additional low finding, changed severity or advisory, altered dependency path, broken package-lock route, expired exception, and a fully clean report.

## Secret scanning

The `security / secrets` job runs the maintained TruffleHog GitHub Action, pinned to an upstream commit and TruffleHog `3.99.7`. It scans the PR/push commit range for verified and unknown findings and fails on findings. Its smoke test creates a narrow custom detector and a synthetic fixture in a temporary directory, runs the pinned scanner image with networking disabled, checks only that the fixture was detected, and never prints the finding or test value. The fixture and temporary detector are deleted on success or failure. This smoke test validates scanner execution and custom-detector wiring; the normal PR scan separately uses TruffleHog's maintained built-in detectors. Do not add actual secrets to fixtures, documentation, or logs.

GitHub's native secret scanning availability has not been confirmed for this repository; TruffleHog is the repository-level CI control. A scanner finding should be handled as a secret incident: revoke/rotate the exposed credential, remove it from the active code and history according to incident guidance, and record the response without copying the value into the issue.

## Static analysis

The `codeql / analyze` job uses GitHub CodeQL for `javascript-typescript`, with read-only repository access and `security-events: write` limited to the analysis job. It runs on PRs to `main`, pushes to `main`, and a weekly schedule. Review CodeQL findings as security alerts; do not silence a query without documenting the reason and scope.

## Evidence and known limitations

Record links to real Actions runs and the exact observed check names here before making any check required. Record the ruleset ID, enforcement mode, required reviews/checks, bypass recovery, and the two unmerged PR test results here after verification. YAML validation or local test output is not evidence that GitHub enforced a rule.

### Local validation record (2026-10-31)

Environment: Node.js `24.12.0`, npm `11.6.2`, Docker Engine `29.9.2`, PostgreSQL image `postgres:18.6-alpine`, Chromium installed for Playwright `1.64.1`.

| Check | Result |
|---|---|
| `npm ci` | Passed; installed 250 packages from the lockfile. npm reported four moderate audit findings and warned that three esbuild install scripts are not yet covered by `allowScripts`; no approval was added. |
| `npm run test:unit` | Passed twice, 2/2 Vitest tests each run. |
| `npm run test:integration` | Passed twice, 12/12 DB tests each run. Each run used a unique loopback-only PostgreSQL container and temporary storage; cleanup confirmed that pre-existing containers/volumes and `dosvy-chg003-postgres` were unchanged. |
| `npm run test:e2e` | Passed twice with Chromium, 3/3 tests each run. |
| `npm run typecheck`, `npm run lint`, `npm run check:boundaries`, `npm run build`, `npm run db:check` | Passed. |
| Strict OpenSpec validation and `git diff --check` | Passed. |
| Production audit | `npm audit --omit=dev`: zero vulnerabilities. |
| Full dependency audit | The custom checker accepted only the four documented moderate findings on the exact Drizzle Kit/esbuild path. Full `npm audit` remains non-clean. Six synthetic auditor tests passed. |
| Secret scanner smoke test | TruffleHog `3.99.7` detected the synthetic fixture; output was withheld and temporary files were removed. |

These are local results; they do not prove GitHub Actions behavior or effective branch protection. Real workflow runs and controlled GitHub PR checks remain to be recorded after the draft PR is opened.

At the time this policy was prepared, `main` had no branch protection/ruleset. The GitHub API reported repository administrator permissions and Actions enabled with read-only default workflow permissions; the organization ruleset endpoint was unavailable to the current token. No branch protection is claimed until a repository ruleset and both controlled PR outcomes have been observed.
