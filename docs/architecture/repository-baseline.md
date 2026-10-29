# Repository baseline — CHG-001 / F1-01

**Inspected commit:** `5d1bbd92ac584af9cf68d21c9f7623abe64928c1`  
**Commit date:** 2026-10-27 22:01:23 -0400  
**Inspection scope:** tracked repository tree and text configuration at the commit above. This is a static baseline; application behavior was not executed.

## Evidence and certainty labels

- **OBSERVED** — directly present in the inspected Git tree or file contents.
- **APPROVED_DECISION** — stated as approved target design in versioned planning material; not evidence of implementation.
- **INFERRED** — conclusion from the inspected evidence, with its basis stated.
- **NEEDS_CONFIRMATION** — source or decision detail is not available in versioned material and needs an owner or source reference.
- **NO_EVIDENCE** — no supporting artifact was found in the inspected tree; this does not prove a feature is impossible or absent from external systems.

## Repository state at the inspected commit

| ID | Finding | Verifiable evidence | Certainty | Implication / follow-up |
|---|---|---|---|---|
| B-01 | The inspected commit is `5d1bbd92ac584af9cf68d21c9f7623abe64928c1`, titled `docs(openspec): CHG-001 F1-01-architecture-baseline.md`. | `git show -s --format="%H %ci %s" HEAD` at inspection; commit date recorded above. | OBSERVED | Use this commit as the baseline reference; later changes require a new inventory. |
| B-02 | The tracked top-level project content is `.agents/`, `docs/`, and `openspec/`; the tracked file inventory is limited to OpenSpec skill instructions, the F1-01 backlog, and OpenSpec configuration/change artifacts. | `git ls-tree -r --name-only HEAD`; paths include `.agents/skills/*`, `docs/backlog/F1-01-architecture-baseline.md`, `openspec/config.yaml`, and CHG-001 artifacts. | OBSERVED | This commit is a documentation/planning baseline. |
| B-03 | The tracked tree contains no application source, dependency manifest, automated test suite, database migration, deployment manifest, or environment configuration. | Complete tracked path list from `git ls-tree -r --name-only HEAD` (see B-02). | OBSERVED | These assets are not present in this commit’s tracked tree. Do not claim runtime capabilities or test results. |
| B-04 | The versioned backlog identifies F1-01 as `NOT_STARTED`, and limits it to static discovery and documentation. | `docs/backlog/F1-01-architecture-baseline.md:3,9-11,64-66`. | OBSERVED | This change must not be represented as application implementation. |
| B-05 | OpenSpec is configured with the `spec-driven` schema. | `openspec/config.yaml:1`. | OBSERVED | CHG-001 planning artifacts and task tracking are available in the repository. |
| B-06 | CHG-001 includes proposal, design, architecture-baseline spec, and task artifacts. | `openspec/changes/chg-001-architecture-baseline/proposal.md`, `design.md`, `specs/architecture-baseline/spec.md`, and `tasks.md`; all are tracked at the inspected commit. | OBSERVED | These are the controlling versioned requirements for this baseline work. |
| B-07 | The local repository includes OpenSpec workflow skill files. | `.agents/skills/openspec-apply-change/SKILL.md` and sibling skill paths in the tracked tree. | OBSERVED | Workflow guidance exists as project content; its presence does not establish that any external system is configured. |
| B-08 | No versioned source in this commit describes an implemented restaurant application, API, database schema, or fiscal provider integration. | Complete tracked path list from `git ls-tree -r --name-only HEAD`; no such source paths are present. | NO_EVIDENCE | Treat these as future work. Confirm with stakeholders if additional repositories or untracked sources are in scope. |
| B-09 | The intended architecture is a Next.js/React application on Node.js with TypeScript, PostgreSQL/Drizzle, Better Auth, and a modular monolith, with an independent installation/database per restaurant. | `openspec/changes/chg-001-architecture-baseline/design.md:3-7,27-40`; `docs/backlog/F1-01-architecture-baseline.md:17`. | APPROVED_DECISION | Document as a target contract only; no corresponding implementation exists in the inspected tree. |
| B-10 | Seven initial business modules are named: MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-08, MOD-09; MOD-10 is excluded. | `openspec/changes/chg-001-architecture-baseline/design.md:5,31-39`; `docs/backlog/F1-01-architecture-baseline.md:18`. | APPROVED_DECISION | Define conceptual ownership and dependency rules in target architecture; physical contracts remain future design. |
| B-11 | Some source requirements originate in discovery conversations and are not linked to versioned source files in this commit. | `openspec/changes/chg-001-architecture-baseline/design.md:42-46,66-70`; `docs/backlog/F1-01-architecture-baseline.md:16,53`. | NEEDS_CONFIRMATION | Keep provenance labeled as approved conversation/discovery and link source records when they are versioned. No file:line citation is available for the conversations. |
| B-12 | The target includes Ubuntu LTS, Docker Compose, Caddy, GitHub Actions, risk-based validation, and WCAG 2.2 AA. | `openspec/changes/chg-001-architecture-baseline/design.md:7`. | APPROVED_DECISION | These are planning decisions, not observed configuration or deployed services. Confirm operational details in the relevant future changes. |

## Scope, risks, and evidence limits

- The baseline is limited to Git commit `5d1bbd92ac584af9cf68d21c9f7623abe64928c1`; it does not inventory remote repositories, local ignored files, production systems, or unversioned conversations.
- The tracked file listing proves which paths are in this commit, not that no code or data exists elsewhere.
- Risk: future contributors may mistake approved target decisions for implemented behavior. Keep architecture statements labeled as target design until implementation evidence is added.
- Risk: conversational requirements may lose provenance. Add a versioned source or record owner-confirmed references in a later change; do not manufacture citations.
- No application, database, migration, test suite, deployment, or fiscal service was run or modified during static inspection. OpenSpec CLI was used only to inspect change metadata and instructions.

## Sources to revisit

1. `docs/backlog/F1-01-architecture-baseline.md` — user story, scope, target decisions, and acceptance criteria.
2. `openspec/changes/chg-001-architecture-baseline/proposal.md` — rationale and exclusions.
3. `openspec/changes/chg-001-architecture-baseline/design.md` — approved conceptual boundaries and evidence policy.
4. `openspec/changes/chg-001-architecture-baseline/specs/architecture-baseline/spec.md` — normative scenarios.
5. `openspec/changes/chg-001-architecture-baseline/tasks.md` — tracked completion criteria.
