# restaurant-operational-resilience Specification

## ADDED Requirements

### Requirement: Operational health and structured logging
Each deployment SHALL expose non-sensitive health signals and structured, bounded logs that enable incident diagnosis without leaking secrets or personal data.

#### Scenario: Degraded application or database
- **WHEN** the application or PostgreSQL becomes unhealthy in a controlled staging test
- **THEN** the operator can identify the installation, affected service and timestamp without exposing credentials

### Requirement: Independently observable alerts
The platform SHALL emit actionable alerts for service outage, backup failure/staleness, WAL archival lag and material infrastructure degradation via an authorized notification path independent of the failing VPS.

#### Scenario: Controlled alert
- **WHEN** staging simulates loss of a critical service or stale backup
- **THEN** the responsible operator receives an identifiable alert and can observe its recovery state

### Requirement: External encrypted recoverable backups
Each installation SHALL back up PostgreSQL through a versioned compatible pgBackRest configuration to durable storage physically/logically separate from the installation VPS, with verified encryption, recoverable credentials, retention and integrity checks.

#### Scenario: VPS loss
- **WHEN** the restaurant VPS and local volumes are unavailable
- **THEN** an operator can locate an independently stored backup and its necessary decryption keys without accessing that VPS

#### Scenario: Backup failure
- **WHEN** a backup fails, is stale or loses integrity
- **THEN** the system raises an alert and does not silently count that copy as usable

### Requirement: WAL archival and point-in-time recovery
The platform SHALL archive required PostgreSQL WAL to its external pgBackRest repository and demonstrate point-in-time recovery with an explicit timestamp and intact application schema.

#### Scenario: PITR drill
- **WHEN** a target recovery time within an available backup-and-WAL window is selected on synthetic staging data
- **THEN** an isolated database can be restored to that point and its expected records and migration ledger verified
- **AND** the source database and installation are not modified

### Requirement: Measured recovery objectives
The documented operational objectives SHALL be RPO <=15 minutes and RTO <=4 hours, and acceptance SHALL depend on recovery-drill measurements rather than configuration claims.

#### Scenario: Successful recovery exercise
- **WHEN** a simulated VPS-loss incident is exercised using an external encrypted backup and WAL
- **THEN** recorded UTC timestamps show observed RPO no greater than 15 minutes and RTO no greater than four hours
- **AND** service health and data integrity are verified

#### Scenario: Unmeasured or exceeded objective
- **WHEN** an isolated recovery cannot run, lacks authentic external backup/WAL evidence, or exceeds either objective
- **THEN** Task 3 remains incomplete, the measured result or blocker is reported, and the objectives are not represented as achieved

### Requirement: Deployment dependency and non-destructive checks
The Change SHALL not be implemented before CHG-006 has passed real staging deployment acceptance; tests and recovery operations SHALL never remove unrelated installations, volumes or production data.

#### Scenario: Missing staging foundation
- **WHEN** CHG-006 lacks proven deployment or authorized staging infrastructure
- **THEN** only planning may be reviewed and CHG-007 Apply is blocked
