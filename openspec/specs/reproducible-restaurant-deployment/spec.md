# reproducible-restaurant-deployment Specification

## Purpose
Provide reproducible, isolated Docker Compose deployments for small restaurant installations, with a private PostgreSQL database, a Next.js app behind Caddy, controlled migrations, and a separate public go-live gate.

## Requirements

### Requirement: Isolated restaurant installation
The deployment platform SHALL support one independently configured restaurant installation per dedicated VPS, with installation-specific PostgreSQL database, credentials, persistent volumes and service network, without editing application source.

#### Scenario: Two installations
- **WHEN** two restaurant installations are provisioned with different authorized configuration
- **THEN** their database, storage and deployment identifiers do not overlap
- **AND** a restart or cleanup of one installation does not delete resources belonging to the other

### Requirement: Reproducible application and database containers
The system SHALL provide versioned Docker/Compose configuration and a reproducible Next.js application image compatible with the committed toolchain and versioned Drizzle migrations.

#### Scenario: Clean provisioning
- **WHEN** an authorized operator provisions a fresh environment from committed deployment definitions and external configuration
- **THEN** application, PostgreSQL and necessary internal services start with the intended image versions and health checks
- **AND** required configuration is validated before startup

#### Scenario: Local development preservation
- **WHEN** deployment definitions are introduced
- **THEN** existing `dosvy-chg003` development Compose resources and CHG-004 temporary test resources remain unaffected

### Requirement: Private database and application networking
The platform SHALL expose only the intended HTTP/HTTPS reverse-proxy entrypoints to public clients; PostgreSQL and the application service ports SHALL not be publicly published.

#### Scenario: Docker network validation
- **WHEN** a disposable installation is inspected through Docker Compose and local host-bound ports
- **THEN** PostgreSQL on port 5432 and the internal Next.js port are not published to the host
- **AND** the app accesses its own database over the private network

#### Scenario: Public installation approval
- **WHEN** a real installation is about to be made externally accessible
- **THEN** its public host must be checked externally to confirm 5432 and the Next.js port are unreachable before go-live

### Requirement: Domain-bound HTTPS through Caddy
The platform SHALL serve the configured restaurant domain via Caddy with publicly verifiable TLS and HTTP-to-HTTPS redirection, preserving certificate state across container recreation.

#### Scenario: Local Caddy verification
- **WHEN** an isolated test installation starts Caddy with test-only local TLS
- **THEN** the Caddy configuration validates and HTTP redirects to HTTPS on loopback
- **AND** the evidence explicitly identifies that local certificates are not publicly trusted

#### Scenario: Public domain release gate
- **WHEN** a restaurant installation will be opened to users on a real domain
- **THEN** DNS, publicly trusted TLS for that hostname and HTTP-to-HTTPS redirection SHALL be verified from an external client **before go-live**
- **AND** without that verification, the installation is not approved for production

### Requirement: Safe migration and release procedure
The deployment platform SHALL apply reviewed Drizzle migrations only through an explicit, environment-authorized one-time deployment operation, preserving CHG-003 safeguards on local migration commands.

#### Scenario: Successful fresh install and release
- **WHEN** a new restaurant is deployed with authorized settings
- **THEN** the correct database receives its versioned migration once and the application passes health and smoke checks
- **AND** the deployed image identifier and migration state are recorded

#### Scenario: Failed migration or incompatible rollback
- **WHEN** migration fails or a previous application image cannot use the new schema
- **THEN** the procedure stops safely and reports recovery steps
- **AND** it does not erase business data, downgrade SQL automatically or claim a successful release

### Requirement: Proportional engineering acceptance and external release gate
The Change SHALL verify reproducible clean provisioning, migration and controlled update in isolated disposable Docker installations with synthetic data, and SHALL document a separate mandatory public-deployment acceptance checklist. No public VPS is required merely to complete the infrastructure code Change.

#### Scenario: Verified local installation and update
- **WHEN** the deployment stack is created from authorized synthetic configuration in isolated Docker projects
- **THEN** migrations, restart/update, health, persistence and network isolation are demonstrated with actual execution records
- **AND** no production data or unrelated Docker resources are affected

#### Scenario: No public staging environment
- **WHEN** authorized public staging, DNS or VPS access is unavailable
- **THEN** completed local engineering tests may satisfy the Change only if all local criteria were demonstrated
- **AND** public TLS, external firewall and production readiness SHALL remain explicitly **unverified** and block real go-live
