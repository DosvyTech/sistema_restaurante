# automated-testing-foundation Specification

## ADDED Requirements

### Requirement: Deterministic Vitest unit tests
The repository SHALL provide a non-interactive Vitest unit-test command and real unit tests covering existing pure project behavior. Vitest SHALL not discover the existing node:test database tests or Playwright E2E tests.

#### Scenario: Fresh installation
- **WHEN** a developer runs `npm ci` followed by `npm run test:unit` twice
- **THEN** both runs exit zero and test the same documented invariants of the seven-module registry

#### Scenario: Defective registry
- **WHEN** a registry test encounters a repeated or unsupported module identifier
- **THEN** the unit suite fails instead of silently passing

### Requirement: Independent ephemeral PostgreSQL integration tests
The project SHALL offer `npm run test:integration` that provisions its own temporary PostgreSQL 18-compatible Docker instance and runs the CHG-003 migration/integrity verification without using shared or production databases.

#### Scenario: Repeated successful runs
- **WHEN** the integration command runs twice from a clean checkout with Docker available
- **THEN** each run creates a separate disposable instance, executes the existing migration, FK, commit and rollback tests, and removes only its own temporary resources

#### Scenario: Failure and cleanup
- **WHEN** database provisioning or a test fails
- **THEN** the command exits non-zero, reports the failure without credentials and cleans up only the container created by this run

#### Scenario: Unsafe inherited environment
- **WHEN** the caller's environment contains a production or unrelated `DATABASE_URL` or `TEST_DATABASE_URL`
- **THEN** the test runner does not use those URLs and instead supplies exclusively local generated disposable targets
- **AND** it refuses to continue if isolation cannot be established

### Requirement: Playwright Chromium browser E2E
The repository SHALL support repeatable browser-based E2E tests against a dedicated Next.js server using synthetic/static project data, independent of PostgreSQL.

#### Scenario: Navigation and planned modules
- **WHEN** the E2E suite navigates from `/` to `/modules` in Chromium
- **THEN** it verifies the page headings, navigation and exactly the seven approved module IDs, all presented as planned rather than operational

#### Scenario: Narrow viewport keyboard navigation
- **WHEN** Playwright runs the mobile-width scenario
- **THEN** the relevant navigation remains keyboard-accessible, its focus is visible and the link reaches `/modules`

#### Scenario: Browser or test server unavailable
- **WHEN** the required Chromium executable or local server cannot launch
- **THEN** E2E returns nonzero instead of being reported as passed

### Requirement: Existing quality gates and truthful reporting
The new testing infrastructure SHALL preserve CHG-002/CHG-003 lint, typecheck, import boundaries, build, Drizzle migration checks and safe database verification.

#### Scenario: Completion claims
- **WHEN** CHG-004 is marked 3/3 complete
- **THEN** the unit, ephemeral database integration, browser E2E, regression checks and strict OpenSpec validation have recorded actual results
- **AND** skipped or unavailable systems remain explicit limitations rather than successful checks

### Requirement: No production impact
No CHG-004 test SHALL read production data, use permanent business fixtures, alter the persistent CHG-003 PostgreSQL container or volume, or initialize features that are outside F1-04.

#### Scenario: Existing local database
- **WHEN** `dosvy-chg003-postgres` is running
- **THEN** CHG-004 integration tests create and destroy only their own isolated PostgreSQL instance
- **AND** leave `dosvy_chg003_pgdata` and other Docker resources unchanged
