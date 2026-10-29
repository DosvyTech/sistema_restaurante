# postgresql-drizzle-foundation Specification

## ADDED Requirements

### Requirement: PostgreSQL persistence per installation
The system SHALL use PostgreSQL through Drizzle ORM and shall define a reproducible local development/test setup. An installation's future production data SHALL belong to its own database; CHG-003 SHALL NOT create a centralized multi-restaurant database.

#### Scenario: Clean isolated database
- **WHEN** a developer creates a fresh isolated PostgreSQL database and runs the documented migration workflow
- **THEN** the versioned foundation schema/namespace is applied successfully and is visible in that database
- **AND** the application can continue running `/` and `/modules` without database initialization

#### Scenario: Another restaurant installation
- **WHEN** a second clean PostgreSQL database is initialized
- **THEN** the same ordered migrations can be applied independently
- **AND** no database or credentials are shared between installations

### Requirement: Version-controlled and repeatable migrations
All foundation schema changes SHALL be recorded as Drizzle Kit-managed versioned SQL migrations with their required metadata and committed to the repository. `drizzle-kit push` SHALL NOT substitute for migration files.

#### Scenario: Migration reapplication
- **WHEN** migrations have already been applied to an isolated database
- **AND** the migration command runs a second time
- **THEN** no additional application objects or duplicate migration effects are created

#### Scenario: Migration provenance
- **WHEN** a reviewer inspects the migration folder
- **THEN** SQL, migration order and tracking metadata are available
- **AND** the migration introduces no customer, sales, auth or inventory tables

### Requirement: Server-only validated connection management
Database access SHALL run only within the Node.js server runtime and SHALL validate required configuration at connection use rather than requiring a database to compile the public shell.

#### Scenario: Database URL absent
- **WHEN** a server-side operation requests database access with no `DATABASE_URL`
- **THEN** it fails with a controlled configuration error
- **AND** no credential value is logged or exposed to a client

#### Scenario: Client import violates boundary
- **WHEN** a Client Component imports the server-only database module
- **THEN** the existing Next.js boundary check or production build rejects that import

#### Scenario: Build without database
- **WHEN** production build executes without `DATABASE_URL` and without PostgreSQL online
- **THEN** the public `/` and `/modules` shell and compilation remain functional

### Requirement: Atomic transaction and connection ownership
The foundation SHALL provide a typed server-side transaction API that uses a single PostgreSQL transaction context for all operations in its callback, commits on success and rolls back on failure.

#### Scenario: Callback fails halfway
- **WHEN** a transaction callback inserts two related fixture records and throws before completion
- **THEN** both uncommitted effects are absent after the rollback
- **AND** the connection is returned safely to its pool

#### Scenario: Transaction succeeds
- **WHEN** a transaction callback completes without error
- **THEN** all valid fixture writes are committed exactly once

### Requirement: Referential integrity is demonstrated without business tables
Database validation SHALL test foreign-key enforcement using temporary or disposable test-only fixtures and SHALL NOT introduce permanent fake business entities into production migrations.

#### Scenario: Invalid foreign key
- **WHEN** a test tries to create a child referencing a nonexistent parent
- **THEN** PostgreSQL rejects the write
- **AND** the test database can be reset without impacting any other database

### Requirement: Non-destructive isolated verification
Automated database tests SHALL require a separate explicit test database URL, prevent use against a production-like/unknown target by default and shall never read or change customer data.

#### Scenario: Unsafe test configuration
- **WHEN** the test URL is missing, equal to the application database URL, remote, or fails the documented local test naming guard
- **THEN** the test runner refuses to run before performing DDL/DML

#### Scenario: Existing project workloads
- **WHEN** an isolated test PostgreSQL is created or disposed
- **THEN** no unrelated Docker container, network or volume is stopped, removed or pruned

### Requirement: Verifiable quality gates
CHG-003 SHALL preserve the passing Next.js/TypeScript, ESLint, dependency-boundary and build checks from CHG-002 and SHALL record actual migration, foreign-key and rollback verification results.

#### Scenario: Developer declares change complete
- **WHEN** all three CHG-003 tasks are checked
- **THEN** evidence exists for a clean migration, a second idempotent migration, a second clean database, FK rejection, commit/rollback behavior, Node-only isolation, existing gates and strict OpenSpec validation
- **AND** no test is claimed as passed unless executed
