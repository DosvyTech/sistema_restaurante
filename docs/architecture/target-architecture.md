# Target architecture — CHG-001 / F1-01

**Status:** approved target design captured by CHG-001; not implemented in the inspected repository.  
**Sources:** `openspec/changes/chg-001-architecture-baseline/design.md` (Context, D1–D3), `proposal.md` (What Changes / Non-goals), and `docs/backlog/F1-01-architecture-baseline.md:17-21,43-62`.

## System shape

The target is a **modular monolith**: one Next.js application using React, running on Node.js and written in TypeScript, with PostgreSQL accessed through Drizzle ORM and Better Auth for authentication. Each restaurant has an independent installation and PostgreSQL database. This is an approved design decision; the repository baseline contains no application code or deployment configuration that implements it.

The planning material also names Ubuntu LTS, Docker Compose, Caddy, GitHub Actions, risk-based validation, and WCAG 2.2 AA as target decisions (`openspec/changes/chg-001-architecture-baseline/design.md`, Context). Exact deployment topology, pipeline jobs, recovery objectives, and accessibility verification remain future design work.

## Conceptual layers

| Layer | Responsibility | Boundary |
|---|---|---|
| Presentation | React UI rendered through Next.js. | Sends user intent to application use cases; it is not an authorization authority. |
| Application | Coordinates use cases and cross-module workflows; server actions or REST may be selected where appropriate. | Authenticates/authorizes at the server boundary and invokes other modules through their application contracts. No physical endpoint or signature is specified here. |
| Domain | Owns module rules, decisions, and state transitions. | A module owns its business concepts; another module cannot change them by reaching into its persistence. |
| Persistence | Drizzle and PostgreSQL for the installation. | Stores module-owned data. Local business transactions are possible within the restaurant database; table layout and schema are future work. |
| Integrations | External fiscal provider and email integrations. | External calls are not part of a local database transaction. Provider selection and wire contracts are future work. |

These are conceptual boundaries, not folders, packages, APIs, or database schemas already present in the repository.

## Module ownership and allowed dependencies

Cross-module calls must go through the owning module’s application contract. A caller must not write another module’s storage directly. The dependency list below is the target direction for the initial business flow; it does not define API signatures.

| Module | Owns | Allowed calls / dependency direction |
|---|---|---|
| **MOD-01 — Configuration** | Restaurant installation identity and business parameters. | Foundational; no dependency on another business module is defined. Other modules may read approved configuration through its application boundary. |
| **MOD-02 — Users, roles, and permissions** | User identities, authentication sessions, roles, permissions, and security audit records. | Uses installation context from MOD-01 where needed; does not own restaurant configuration. |
| **MOD-03 — Employees** | Employee records, schedules, attendance, and leave. | MOD-01 for installation/business context; MOD-02 for server-side authorization. |
| **MOD-04 — Products and prices** | Product catalog, variants, prices, and commercial tax parameters. | MOD-01 for business parameters. |
| **MOD-05 — Inventory and recipes** | Ingredients, versioned recipes, stock movements, and valuation. | MOD-01 for installation context; MOD-04 for product references via its application boundary. |
| **MOD-08 — Customers** | Customer records, fiscal identity details, and customer history. | MOD-01 for installation context; MOD-02 for authorization. |
| **MOD-09 — Invoicing and cash sales** | Cash sales, split/combined payments, fiscal-document workflow including E34, and refunds. | Coordinates MOD-02 authorization, MOD-04 product/price data, MOD-05 inventory effects, and MOD-08 customer data through their application boundaries; connects to the selected fiscal provider through an integration boundary. |

**Boundary clarification (INFERRED):** the design material uses “identity” for both MOD-01 and MOD-02. This document assigns restaurant/installation identity to MOD-01 and user identity, sessions, and authorization to MOD-02 to keep ownership distinct. Confirm this naming split when detailed module specifications are authored; it does not create physical entities or interfaces.

MOD-10 is excluded from initial scope. The initial seven modules are MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-08, and MOD-09.

## Cross-module business and security contracts

### Commercial confirmation and inventory

The target local transaction covers commercial confirmation, completed payment, the corresponding one-time inventory consumption, and creation of a pending fiscal record. The local transaction must preserve all-or-nothing consistency for the local records. Critical operations must be idempotent so retries do not duplicate payment or inventory effects. Exact idempotency keys, entities, and failure policies are not defined by CHG-001 and remain future design work.

MOD-09 coordinates the workflow; MOD-04 owns product/price facts, MOD-05 owns inventory movement and recipe consumption, and MOD-08 owns customer records. Module application contracts preserve ownership. Fiscal submission is an external side effect and is not included inside the PostgreSQL transaction.

### Fiscal submission and reconciliation

Fiscal state is separate from commercial state. A Node.js reconciliation process is the planned mechanism for handling fiscal submission and reconciling the external result without depending on a browser. The provider is not selected. Provider-specific messages, retries, timing, credentials, and legal behavior are not specified and must be designed with the selected provider and applicable requirements.

E34, refunds, and physical returns are planned flows. Their detailed eligibility, tax treatment, and stock rules require versioned use-case sources and later acceptance criteria; this baseline does not claim them as implemented behavior.

### Security and integrity controls

- Authorization is enforced on the server for every protected use case; hiding UI controls is not sufficient.
- MOD-02 owns roles, permissions, sessions, and security audit records. Detailed permission matrices, retention, and audit event schemas remain future decisions.
- Restaurant installations and databases are independent. Do not infer central SaaS multi-tenant storage or shared customer data.
- Use immutable identifiers and idempotent handling for critical operations as target design principles; physical types and keys are unspecified.
- Use local database transactions for local commercial consistency; reconcile external fiscal state separately.
- Secrets, provider credentials, data-retention rules, backups, restore objectives, and incident procedures have no implementation evidence in the baseline and require future security/operations design.

## Exclusions and unresolved design

Out of initial scope: MOD-10, credit sales, a full POS, multi-branch installations, and SaaS multi-tenant storage. This document defines no DTOs, API signatures, tables, migrations, provider contracts, or deployment topology. Those details belong to later Changes and must preserve the boundaries above.

Open evidence work: link the discovery interview/source records for requirement IDs P01–P159 where available; confirm module naming and ownership details; select the e-CF provider in its own decision process; and define concrete security, operations, and QA criteria before implementation.
