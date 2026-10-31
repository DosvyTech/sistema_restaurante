# ci-quality-gates Specification

## ADDED Requirements

### Requirement: Reproducible pull request quality checks
The repository SHALL define GitHub Actions checks for pull requests to `main` that run clean-install TypeScript, lint, module-boundary, Next.js build, Vitest unit, ephemeral PostgreSQL integration and Playwright Chromium tests as implemented in CHG-004.

#### Scenario: Healthy pull request
- **WHEN** a PR targets `main` with all dependencies available
- **THEN** each required job runs to completion and publishes an identifiable result

#### Scenario: Failed test
- **WHEN** an intentionally failing test is introduced in a controlled test PR
- **THEN** the relevant required check reports failure rather than a skipped or green result

### Requirement: Safe CI execution
GitHub workflows SHALL run with least-privilege permissions, no production database or credentials, and shall avoid privileged execution of untrusted pull-request code.

#### Scenario: Untrusted pull request
- **WHEN** a PR is evaluated
- **THEN** CI does not use `pull_request_target` to execute attacker-controlled code with write permissions
- **AND** does not disclose `.env` contents, credentials or production data

### Requirement: Explicit security gates and known exception
CI SHALL evaluate production dependency advisories, total dependency advisories, secret detection and static code analysis. The four documented development-only moderate esbuild findings SHALL remain visible as a narrowly scoped provisional exception, not a clean audit.

#### Scenario: Runtime advisory
- **WHEN** `npm audit --omit=dev` reports a new vulnerability
- **THEN** the required security gate fails

#### Scenario: Changed or additional development advisory
- **WHEN** `npm audit` reports an unapproved advisory, different affected path, changed severity, expired exception or higher-risk finding
- **THEN** the security policy rejects the change
- **AND** no generic `--audit-level=high`, `continue-on-error` or ignoring all moderate findings passes as proof of compliance

#### Scenario: Leaked synthetic secret
- **WHEN** a controlled PR fixture matches the selected secret scanner's rule
- **THEN** the scanner returns a failure without showing the fixture value in logs

### Requirement: Effective main branch protection
The repository SHALL configure GitHub branch protection or repository rulesets such that pull requests and observed status checks are required for merges to `main`, with an explicit review policy.

#### Scenario: Failed required check
- **WHEN** a pull request has a failed required status check
- **THEN** GitHub rejects merge while that failure remains

#### Scenario: Protection not configured
- **WHEN** organization permissions or GitHub plan restrictions prevent configuring the ruleset
- **THEN** the Change SHALL report this as incomplete and its protection task remains unchecked

### Requirement: Evidence-based validation
The Change SHALL document the exact observed CI job names, results, security exceptions, branch ruleset configuration and verification outcomes without claiming that configuration files alone enforce policy.

#### Scenario: Completion
- **WHEN** CHG-005 is marked 3/3 complete
- **THEN** the workflow, security and branch enforcement checks have been executed and independently evidenced on GitHub
- **AND** strict OpenSpec validation passes
