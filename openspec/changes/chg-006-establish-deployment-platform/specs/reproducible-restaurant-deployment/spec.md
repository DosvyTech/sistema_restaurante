# reproducible-restaurant-deployment Specification

## ADDED Requirements

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

#### Scenario: External port audit
- **WHEN** the staging host is inspected externally
- **THEN** PostgreSQL on port 5432 and the internal Next.js port are not reachable
- **AND** the app can access its own DB over the internal network

### Requirement: Domain-bound HTTPS through Caddy
The platform SHALL serve the configured restaurant domain via Caddy with publicly verifiable TLS and HTTP-to-HTTPS redirection, preserving certificate state across container recreation.

#### Scenario: Valid staging DNS and ACME
- **WHEN** a staging domain resolves to an authorized server with ports 80 and 443 available
- **THEN** an HTTPS client verifies a valid certificate for that hostname
- **AND** HTTP redirects to HTTPS

#### Scenario: Missing domain or TLS prerequisites
- **WHEN** DNS or publicly trusted TLS cannot be verified
- **THEN** staging HTTPS acceptance is reported as blocked, not as successfully validated

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

### Requirement: Staging evidence gate
The Change SHALL verify a clean installation and a controlled update in an authorized staging environment, with synthetic data and recorded isolation/HTTPS results.

#### Scenario: No staging access
- **WHEN** staging authorization, DNS or VPS is unavailable
- **THEN** Task 3 remains incomplete and the missing external evidence is documented
- **AND** local-only simulations are not presented as a successful public staging deployment
