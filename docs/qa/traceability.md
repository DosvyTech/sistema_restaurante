# Traceability matrix — CHG-001 / F1-01

**Purpose:** preliminary trace from versioned source/decision to module contract, future work, acceptance criteria, and QA scenario.  
**Implementation status:** design/planning only. Every QA scenario below is **PLANNED — NOT RUN**. No row claims implemented behavior.  
**Evidence policy:** `APPROVED_DECISION` means the target is recorded in versioned planning artifacts; it does not prove an underlying interview or implementation. `NEEDS_CONFIRMATION` marks a missing versioned source, exact story/Change identifier, or detailed rule.

## Module contracts

| Source / decision | Module and contract | Future history / Change | Acceptance criteria | Planned QA scenario (not run) |
|---|---|---|---|---|
| `openspec/changes/chg-001-architecture-baseline/design.md` (D2); `docs/backlog/F1-01-architecture-baseline.md:17-18` — **APPROVED_DECISION** | **MOD-01 Configuration:** owns restaurant installation identity and business parameters; serves approved configuration through its application boundary. | F1-02+ module specification/implementation; exact ID and underlying discovery source **NEEDS_CONFIRMATION**. | F1-01-AC-02, AC-05 | In a future module test, verify a consumer obtains configuration through the owner boundary and cannot directly alter MOD-01 storage. Exact rules **NEEDS_CONFIRMATION**. |
| Same sources — **APPROVED_DECISION**; ownership split in `docs/architecture/target-architecture.md` is **INFERRED** pending confirmation | **MOD-02 Users/Roles/Permissions:** owns user identity, sessions, roles, permissions, and security audit; protected use cases authorize on the server. | F1-02+; exact history/Change, permission matrix, and discovery source **NEEDS_CONFIRMATION**. | F1-01-AC-02, AC-05 | Future authorization tests cover permitted and denied server requests and audit behavior; concrete actors, permissions, and events **NEEDS_CONFIRMATION**. |
| `openspec/changes/chg-001-architecture-baseline/design.md` (D2); backlog `:18-19` — **APPROVED_DECISION** | **MOD-03 Employees:** owns employee records, schedules, attendance, and leave. | F1-02+; exact ID and policy source **NEEDS_CONFIRMATION**. | F1-01-AC-02, AC-04 | Future tests cover employee record and schedule/attendance/leave rules after those rules have versioned acceptance criteria; **NEEDS_CONFIRMATION**. |
| Same sources — **APPROVED_DECISION** | **MOD-04 Products/Prices:** owns catalog, variants, prices, and commercial tax parameters; supplies catalog facts through its application boundary. | F1-02+; exact ID, pricing/tax rules, and discovery source **NEEDS_CONFIRMATION**. | F1-01-AC-02, AC-04 | Future tests verify approved price/tax calculations and that downstream modules do not write catalog storage directly; detailed calculation rules **NEEDS_CONFIRMATION**. |
| Same sources — **APPROVED_DECISION** | **MOD-05 Inventory/Recipes:** owns ingredients, versioned recipes, stock movements, and valuation. Inventory consumption for a confirmed sale is idempotent. | F1-02+; exact ID, valuation policy, negative-stock rule, and discovery source **NEEDS_CONFIRMATION**. | F1-01-AC-02, AC-04, AC-05 | Future tests retry a confirmed-sale inventory operation and verify one stock effect; test recipe-version selection and valuation against approved rules. Rules and fixtures **NEEDS_CONFIRMATION**. |
| Same sources — **APPROVED_DECISION** | **MOD-08 Customers:** owns customer records, fiscal identity details, and customer history. | F1-02+; exact ID, required fiscal fields, and discovery source **NEEDS_CONFIRMATION**. | F1-01-AC-02, AC-04 | Future tests verify customer records and fiscal identity validation against approved requirements; field rules **NEEDS_CONFIRMATION**. |
| Same sources — **APPROVED_DECISION**; provider remains unselected in design D1/D3 — **NEEDS_CONFIRMATION** | **MOD-09 Invoicing/Cash Sales:** owns cash sale workflow, combined payments, fiscal-document state including E34, and refunds; coordinates MOD-04, MOD-05, MOD-08 and the fiscal integration through application boundaries. | F1-02+; exact sales/fiscal/refund Change IDs and source records **NEEDS_CONFIRMATION**. | F1-01-AC-02, AC-04, AC-05 | Future tests cover sale/payment consistency, fiscal submission/reconciliation, E34, and refund behavior using selected provider contracts and approved cases. All detailed rules **NEEDS_CONFIRMATION**. |

## Critical flow coverage

| Stage | Source / contract | Planned future work | Acceptance criteria | Planned QA scenario (not run) |
|---|---|---|---|---|
| Commercial confirmation | CHG-001 design D2/D3: MOD-09 coordinates the commercial flow; approved conversation-derived requirements need a versioned source link (**NEEDS_CONFIRMATION**). | F1-02+; exact story/Change ID **NEEDS_CONFIRMATION**. | F1-01-AC-04, AC-05 | Confirm a valid cash sale once; verify retry/idempotency and that invalid confirmation has no partial local effects. Detailed preconditions **NEEDS_CONFIRMATION**. |
| Complete payment, including combined payment | Design D2: MOD-09 supports cash sales and combined payments; source detail **NEEDS_CONFIRMATION**. | F1-02+; exact payment story/Change ID and payment acceptance rules **NEEDS_CONFIRMATION**. | F1-01-AC-04, AC-05 | Exercise complete payment with the approved methods and a retry; confirm no duplicate payment effect. Methods and partial/failed-payment behavior **NEEDS_CONFIRMATION**. |
| One-time inventory consumption | Design D2: sale, payment, inventory consumption, and pending fiscal record belong to one local transaction; critical operations are idempotent. | F1-02+; exact transaction and stock rules **NEEDS_CONFIRMATION**. | F1-01-AC-04, AC-05 | Commit a confirmed sale and retry the same operation; assert exactly one inventory consumption. Force a local failure and assert no partial local transaction. Concrete entities and failure injection **NEEDS_CONFIRMATION**. |
| Fiscal submission | Design D2: external fiscal integration is separate from the local transaction; provider is not selected. | Future provider-selection and integration Changes; identifiers/provider **NEEDS_CONFIRMATION**. | F1-01-AC-04, AC-05 | Submit a pending fiscal record through a provider test double or sandbox after provider selection; verify commercial completion does not depend on a browser. Provider contract and sandbox **NEEDS_CONFIRMATION**. |
| Fiscal reconciliation | Design D2: planned Node.js reconciliation; commercial and fiscal states are separate. | F1-02+ plus provider integration; exact reconciliation Change and timing policy **NEEDS_CONFIRMATION**. | F1-01-AC-04, AC-05 | Reconcile accepted, rejected, delayed, duplicate, and unavailable-provider outcomes without changing the commercial state incorrectly. Provider-specific responses and retry schedule **NEEDS_CONFIRMATION**. |
| E34 | Design D2/D3 identifies E34 as planned MOD-09 fiscal workflow; legal and source details not versioned here (**NEEDS_CONFIRMATION**). | Future fiscal/e-CF Change; exact ID, eligibility, and source **NEEDS_CONFIRMATION**. | F1-01-AC-04, AC-05 | Exercise E34 creation/association and fiscal reconciliation against approved legal and provider cases; cases **NEEDS_CONFIRMATION**. |
| Refund | Design D2 identifies refunds in MOD-09; detailed eligibility/tax rules not provided. | F1-02+; exact refund Change and policy source **NEEDS_CONFIRMATION**. | F1-01-AC-04, AC-05 | Refund an eligible completed cash sale; verify idempotency, commercial state, and fiscal follow-up. Eligibility, limits, and fiscal treatment **NEEDS_CONFIRMATION**. |
| Physical return | Design D2/D3 identifies return as planned flow; inventory disposition and refund relationship not detailed. | F1-02+; exact return Change and source **NEEDS_CONFIRMATION**. | F1-01-AC-04, AC-05 | Process a physical return with approved disposition and verify inventory/refund/fiscal effects occur once. Restockability, condition, and partial-return rules **NEEDS_CONFIRMATION**. |

## Cross-cutting QA and evidence gaps

| Contract / decision | Acceptance criteria | Planned QA scenario (not run) | Open item |
|---|---|---|---|
| Module ownership, allowed application-boundary dependencies, and no direct cross-module persistence writes. | F1-01-AC-02, AC-05 | Architecture review or future module-boundary tests reject a direct storage dependency. | Implementation tooling and exact package/folder boundaries are intentionally unspecified. |
| Server-side authorization, roles/permissions, and security audit. | F1-01-AC-02, AC-05 | Test protected use cases as authorized and unauthorized users; verify required audit events. | Permission matrix, event policy, and retention **NEEDS_CONFIRMATION**. |
| Immutable identifiers and idempotent critical operations. | F1-01-AC-02, AC-05 | Retry critical requests and verify one business effect. | Identifier format and idempotency policy **NEEDS_CONFIRMATION**. |
| Local sale/payment/inventory/pending-fiscal transaction and separate fiscal state. | F1-01-AC-04, AC-05 | Inject a local transaction failure; separately simulate external fiscal delay/failure and reconcile. | Exact data model, transaction boundary, and provider behavior **NEEDS_CONFIRMATION**. |
| Scope exclusions: MOD-10, credit sales, full POS, multi-branch, and SaaS multi-tenant storage. | F1-01-AC-05, AC-06 | Review future scope proposals against the exclusions; require a new approved Change before inclusion. | Scope changes require explicit approval and updated traceability. |
| CHG-001 documentation-only boundary. | F1-01-AC-01 through AC-06 | Review diff and strict OpenSpec validation; no application or service tests are applicable to this documentation-only Change. | Validation result is recorded below after the command is run. |

## F1-01 acceptance-criteria index

The acceptance criteria are defined in `docs/backlog/F1-01-architecture-baseline.md:55-62`:

- **F1-01-AC-01:** repository/configuration inventory, commit, verifiable sources, and certainty classification — `repository-baseline.md`.
- **F1-01-AC-02:** target layers, seven domains, dependencies, security, and exclusions — `target-architecture.md`.
- **F1-01-AC-03:** alternatives and consequences — `ADR-0001-modular-monolith.md`.
- **F1-01-AC-04:** domain/critical-flow traceability with testable QA — this matrix.
- **F1-01-AC-05:** no unsupported implementation or test claims — all artifacts and QA status labels.
- **F1-01-AC-06:** documentation and OpenSpec tracking only — scoped diff review.

## Validation record

- `npx.cmd --yes @fission-ai/openspec validate chg-001-architecture-baseline --strict` — **passed**, exit code 0: `Change 'chg-001-architecture-baseline' is valid` (2026-10-29). Do not treat planned QA scenarios as executed tests.
