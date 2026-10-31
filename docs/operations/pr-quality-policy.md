# Pull request quality and security policy

## Scope and enforcement

Pull requests targeting `main` are evaluated by the workflows under `.github/workflows/`. The quality workflow uses the repository's `.nvmrc` and lockfile, and runs on GitHub-hosted `ubuntu-24.04` runners. Its stable job checks are `quality / static`, `quality / database`, and `quality / e2e`. The security workflow has `security / dependency audit` and `security / secrets`; CodeQL reports as `codeql / analyze (javascript-typescript)`.

The workflows use `pull_request`, `push` to `main`, and explicit manual dispatch where appropriate. They do not use `pull_request_target`, production credentials, or write permission for ordinary CI. The database suite calls CHG-004's disposable PostgreSQL runner, which allocates synthetic credentials, a loopback-only random port, a unique container, and temporary storage, then removes only its own container. The E2E suite installs the lockfile-matched Chromium and starts its Next.js test server on loopback.

Creating a workflow does not by itself protect `main`. Repository administrators must use the observed status checks and PR policy below to configure and verify the repository ruleset. Until a GitHub ruleset is active and tested, treat the policy as a required operating procedure rather than effective platform enforcement.

## Required checks and review

Observed check names on the real PR run are: `quality / static`, `quality / database`, `quality / e2e`, `security / dependency audit`, `security / secrets`, and `codeql / analyze (javascript-typescript)`. The ruleset requires each context from the GitHub Actions integration (15368), and requires checks on the latest commit. It also requires a PR, one approving review, and resolved conversations.

Do not bypass failed checks to merge. If a ruleset allows administrator bypass for recovery, restrict it to repository administrators, document the reason in the PR, and use it only to restore a broken protection configuration or address an urgent incident. Recheck the ruleset after any recovery. The administrator account must retain its explicit bypass/recovery route; never test policy by merging a PR.

For a controlled failure test, use a throwaway PR with a deterministic failing assertion and verify GitHub marks a required check failed and blocks the PR. For the positive case, verify every required check and independent review on the implementation PR; the ruleset must evaluate both pull request and required status checks successfully. A green run is necessary but not sufficient for merge: review, resolved discussion, and the remaining required checks still apply.

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

YAML validation or local test output is not evidence that GitHub enforced a rule. The following real PR runs and ruleset results are recorded for this implementation:

| Evidence | Result |
|---|---|
| [PR #9 quality run](https://github.com/DosvyTech/sistema_restaurante/actions/runs/41238494514) | Success: `quality / static`, `quality / database`, and `quality / e2e`. |
| [PR #9 dependency and secrets run](https://github.com/DosvyTech/sistema_restaurante/actions/runs/41238494403) | Success: `security / dependency audit` (runtime audit zero, full audit exception accepted) and `security / secrets` (fixture detected; repository range scan passed). |
| [PR #9 CodeQL run](https://github.com/DosvyTech/sistema_restaurante/actions/runs/41238494533) | Success: `codeql / analyze (javascript-typescript)` executed and reported through CodeQL. |
| [PR #9 implementation](https://github.com/DosvyTech/sistema_restaurante/pull/9) | `Steven2413` (member) approved head `3c983672c662a7f29a6fec5459ff1f6153f24649` at 2026-10-31 20:54:21 UTC. All six required contexts passed. GitHub reports no unresolved review threads. PR merged at 20:54:45 UTC as `2bd5434bab90a3d4b10a94c5b13012ae3944f3f9`. |
| [PR #10 controlled failure](https://github.com/DosvyTech/sistema_restaurante/pull/10) | `quality / static` failed at the intentional unit assertion; the other five required contexts passed. GitHub returned `BLOCKED` with `REVIEW_REQUIRED` while the required check was failed. The PR was closed without merge and its temporary remote branch deleted. |
| [Active repository ruleset](https://github.com/DosvyTech/sistema_restaurante/rules/26286430) | ID `26286430`, active on `refs/heads/main`; requires PR, one approval, resolved conversations, and all six required contexts. Admin role has `pull_request`-only bypass for recovery. |
| Ruleset evaluation for PR #9 merge | Rule suite `4835811329` records `result: pass`; both `pull_request` and `required_status_checks` evaluations from ruleset `26286430` were `pass`. GitHub's rule-suite result is recorded as pass; no separate inference about bypass is needed. |

The negative enforcement case is demonstrated by PR #10, and the positive case by PR #9's independent approval, successful required checks, successful ruleset evaluation, and merge. These records complete the acceptance evidence for CHG-005 task 3. The separate documentation close-out PR must still be reviewed and merged normally; do not use an administrative bypass.

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

Local results do not prove GitHub behavior. The real Actions, independent review, merge, and ruleset-evaluation evidence above demonstrate the positive and negative protection cases for CHG-005 task 3.

Before this change, `main` had no repository or inherited rulesets. The GitHub API reported repository administrator permissions and Actions enabled with read-only default workflow permissions. Repository ruleset management was available and the active ruleset above was created. The organization-level ruleset endpoint was not queried successfully because the current token lacks `admin:org`; no organization-level rule is claimed.
