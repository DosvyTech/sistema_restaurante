# restaurant-operational-resilience Specification

## ADDED Requirements

### Requirement: Operational health and structured logging
Each deployment SHALL expose non-sensitive health signals and structured, bounded logs that enable incident diagnosis without leaking secrets or personal data.

#### Scenario: Degraded application or database
- **WHEN** the application or PostgreSQL becomes unhealthy in a controlled staging test
- **THEN** the operator can identify the installation, affected service and timestamp without exposing credentials

### Requirement: Lightweight independently observable alerts
The platform SHALL emit actionable alerts for service outage, backup failure/staleness, WAL archival lag and material infrastructure degradation via an authorized notification path independent of the failing VPS.

During development, tests MAY use an isolated synthetic alert receiver to verify alert generation, delivery, recovery and closure. This receiver SHALL NOT satisfy the production requirement for real notifications delivered through an authorized external path independent of the VPS.

#### Scenario: Controlled alert
- **WHEN** staging simulates loss of a critical service or stale backup
- **THEN** the responsible operator receives an identifiable alert and can observe its recovery state

### Requirement: Encrypted recoverable backups with production externalization
Each production installation SHALL back up PostgreSQL using documented pgBackRest to encrypted, durable storage separate from the restaurant VPS, with recoverable credentials, retention and integrity checks.

#### Scenario: Production backup destination
- **WHEN** an installation is approved for production
- **THEN** its PostgreSQL backups use a durable repository outside the VPS with encryption and credentials independent from the host
- **AND** the repository has a documented, tested recovery procedure and integrity checks

### Requirement: Isolated S3 backup development target
Development backup tests SHALL use synthetic data and credentials in a disposable, isolated SeaweedFS `weed mini` S3 project with a verifiable pinned image and no public exposure.

#### Scenario: pgBackRest compatibility with SeaweedFS
- **WHEN** the pinned pgBackRest and SeaweedFS versions run the backup integration tests
- **THEN** the tests demonstrate the required S3 operations for backup, restore and WAL archival/recovery
- **AND** the test repository is not represented as production external storage
- **AND** if a required operation fails, implementation stops until a maintained S3-compatible alternative is evaluated and justified

#### Scenario: Simulated isolated recovery
- **WHEN** development tests restore synthetic backups to a fresh isolated database
- **THEN** the restored schema and expected synthetic records are checked without modifying the source
- **AND** this does not certify external production backup availability

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

#### Scenario: Synthetic disposable recovery measurement
- **WHEN** a disposable PostgreSQL installation is restored from synthetic test backups to a recorded point in time
- **THEN** the evidence records observed elapsed RPO/RTO, confirmed and recovered transactions, possible data loss, UTC timestamps and simulation limits
- **AND** local measurements are not automatically extrapolated to production

### Requirement: Deployment dependency and non-destructive checks
The Change SHALL not be implemented before CHG-006 is integrated with successful **real isolated Docker deployment/upgrade tests**; tests and recovery operations SHALL never remove unrelated installations, volumes or production data. A separate production go-live gate SHALL verify real external backups, independently delivered alerts and a tested recovery procedure.

#### Scenario: Missing local deployment foundation
- **WHEN** CHG-006 is not integrated or its isolated deployment acceptance is unverified
- **THEN** CHG-007 Apply is blocked

#### Scenario: Production without verified external recovery
- **WHEN** a restaurant would store real data without a verified independent backup and restore route
- **THEN** production go-live is blocked, even when CHG-007 local tests passed
