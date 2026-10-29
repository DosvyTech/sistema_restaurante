# ADR-0001: Modular monolith per restaurant

- **Status:** Accepted as target architecture in CHG-001 planning; not implemented.
- **Date:** 2026-10-27 (source commit date; decision date itself is not separately recorded).
- **Decision owners:** NEEDS_CONFIRMATION — the versioned planning artifacts do not identify named approvers.
- **Related:** CHG-001 / F1-01; `openspec/changes/chg-001-architecture-baseline/design.md` (Context, D1–D4).

## Context

The repository at the inspected baseline commit has no application implementation. Before future module Changes begin, the project needs a target that keeps the initial business domains cohesive, gives each domain clear ownership, and avoids claiming that design decisions are already running in production.

The approved target is a Next.js/React application on Node.js with TypeScript, PostgreSQL/Drizzle, Better Auth, and a modular monolith. Each restaurant receives an independent installation and database. The initial scope contains MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-08, and MOD-09. A selected e-CF provider is not yet part of the decision.

## Decision

Build the initial system as one modular monolith per restaurant installation, with conceptual presentation, application, domain, persistence, and integration boundaries. Each module owns its rules and data; cross-module behavior goes through the owner’s application contract. Run local commercial consistency in the restaurant’s PostgreSQL transaction, and handle external fiscal submission and reconciliation separately.

This ADR captures the target decision from versioned planning material. It does not authorize scaffolding or define physical APIs, schema, deployment topology, or provider contracts.

## Alternatives considered

### Standalone backend separate from the Next.js application — not selected initially

The planning decision favors keeping the initial application and its server-side use cases together. A separate backend would add an independently operated service and a network boundary before the repository contains an implementation that needs one. It could provide independent scaling or deployment later, but that need is not established for the initial scope.

### Centralized multi-tenant SaaS — not selected initially

The approved deployment model is one independent installation and database per restaurant. A centralized multi-tenant service could simplify centralized upgrades and operations, but would require tenant isolation and shared-storage decisions that are outside the approved initial scope. It also changes the data and operational boundary.

### Modular monolith per restaurant — selected

This matches the approved independent-installation model while keeping the seven domains in one deployable application. Module boundaries preserve the option to change deployment structure later if actual needs justify it.

## Consequences

### Benefits

- One application deployment can host the initial modules while module ownership constrains dependencies.
- Local PostgreSQL transactions can keep commercial records and inventory effects consistent within an installation.
- Independent databases separate restaurant data operationally without introducing central multi-tenant storage in the initial design.
- A future service extraction remains possible if a concrete scaling, isolation, or ownership need appears, provided module contracts are maintained.

### Costs and risks

- A VPS and database per restaurant can multiply provisioning, upgrades, monitoring, backups, recovery, and support work. These are operational consequences inferred from the deployment model; runbooks and service objectives are not yet defined.
- A modular monolith needs enforced module boundaries; shared storage access or cross-module shortcuts can erode ownership.
- External fiscal reconciliation can lag commercial confirmation or fail independently. The selected provider’s exact failure and retry behavior remains unknown.
- Independent installations make fleet-wide version consistency and rollout management an operational concern.

## Reconsideration conditions

Revisit this decision when a versioned requirement establishes a need for multi-branch operations, shared multi-tenant SaaS storage, independent module scaling/deployment, or operational overhead that cannot be managed acceptably per restaurant. A change in e-CF provider or legal requirements may require updating the integration contract, but does not by itself imply a different application architecture.

## Open decisions

- Named decision approvers and the source record for the approval.
- Concrete hosting topology, sizing, backup/restore objectives, monitoring, upgrades, and fleet operations.
- Fiscal provider, provider contract, and reconciliation timing/failure policy.
- Detailed identity ownership boundary between MOD-01 installation identity and MOD-02 user identity; the split documented here is an explicit interpretation for module clarity.
