# architecture-baseline Specification

## ADDED Requirements

### Requirement: Reproducible repository baseline
The F1-01 documentation SHALL enumerate the observable repository state at an identified commit without running, modifying or deploying the application and SHALL distinguish observed evidence from approved decisions, inferences and unconfirmed claims.

#### Scenario: Verified repository evidence
- **WHEN** a repository feature, tool, directory or document is documented as existing
- **THEN** the baseline MUST identify the inspected commit and a verifiable file path/line or repository evidence
- **AND** classify the finding as OBSERVED

#### Scenario: Missing or inaccessible source
- **WHEN** the source for an asserted behavior is unavailable
- **THEN** the baseline MUST label it NEEDS_CONFIRMATION or NO_EVIDENCE
- **AND** MUST NOT present it as existing or implemented behavior

### Requirement: Approved architectural boundaries
The F1-01 design SHALL document a Next.js/React application running on Node.js with TypeScript, a PostgreSQL/Drizzle data layer, Better Auth, a modular monolith, and independent deployments and databases per restaurant. It SHALL describe ownership and dependencies for MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-08 and MOD-09.

#### Scenario: Layer and domain responsibilities
- **WHEN** an engineer starts a future module Change
- **THEN** they MUST be able to identify the responsible domain, dependencies, server authorization boundary and data-ownership rules from the target architecture
- **AND** distinguish target design from implemented code

#### Scenario: Explicit exclusions
- **WHEN** an excluded capability is considered
- **THEN** the documentation MUST identify MOD-10, credit sales, full POS, multi-branch installations and SaaS multi-tenant storage as out of initial scope
- **AND** MUST NOT imply they are implemented

### Requirement: Traceability and QA coverage
The F1-01 documentation SHALL define a preliminary mapping from verified sources or explicitly labeled approved conversation decisions to capability, future history/Change, testable acceptance criterion and QA scenario.

#### Scenario: Critical sales flow coverage
- **WHEN** the matrix is reviewed
- **THEN** it MUST cover the planned commercial confirmation, complete payment, one-time inventory consumption, fiscal submission and reconciliation, E34, refund and physical return flows
- **AND** MUST distinguish planned QA from executed QA

#### Scenario: Ambiguous legacy or approved requirement
- **WHEN** a use case cannot be linked to a versioned source
- **THEN** the matrix MUST preserve an explicit provenance label and open verification action
- **AND** MUST NOT manufacture a file:line citation

### Requirement: Architectural decision record
The F1-01 documentation SHALL contain an ADR describing the approved modular monolith and its alternatives, consequences and reconsideration conditions.

#### Scenario: Independent review
- **WHEN** an engineer reads the ADR without prior chat context
- **THEN** they MUST understand why a standalone backend and a central multi-tenant SaaS were not chosen initially
- **AND** the operational trade-offs of a VPS and database per restaurant

### Requirement: Read-only business system boundary
CHG-001 SHALL be a planning and discovery change only. Application code, APIs, database schema, migrations, external provider setup and deployment SHALL remain unmodified by its execution.

#### Scenario: Applying CHG-001
- **WHEN** an agent executes the three tasks
- **THEN** only approved documentation and OpenSpec task tracking SHALL change
- **AND** no app scaffold, SQL DDL/DML, secrets, remote infrastructure or e-CF transmission SHALL be created or executed
