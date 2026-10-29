# nextjs-modular-foundation Specification

## ADDED Requirements

### Requirement: Reproducible Next.js Node application
The repository SHALL provide an executable Next.js App Router application at repository root using TypeScript strict mode, Node.js server runtime, npm lockfile and reproducible install without overwriting OpenSpec, .agents or documentation.

#### Scenario: Clean installation
- **WHEN** an engineer checks out the completed Change using a supported Node.js version and runs `npm ci`, `npm run typecheck`, `npm run lint` and `npm run build`
- **THEN** dependencies install from the committed lockfile and all commands exit successfully

#### Scenario: Existing planning artifacts
- **WHEN** the application is initialized
- **THEN** existing `openspec/`, `.agents/` and `docs/` documents remain intact

### Requirement: Modular architecture boundaries
The project SHALL define a durable folder and import convention for `src/app`, `src/modules` and `src/shared` and present all seven authorized business modules as planned rather than implemented.

#### Scenario: Module catalog
- **WHEN** a user visits `/modules`
- **THEN** MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-08 and MOD-09 are identifiable and explicitly marked as not yet implemented
- **AND** no MOD-10 or invented business module appears

#### Scenario: Invalid dependency
- **WHEN** a cycle or prohibited import from shared to app/modules, or modules to app, is introduced
- **THEN** the automated boundaries check fails with a diagnostic identifying the violation

### Requirement: Strict server and client isolation
The project SHALL adopt Server Components by default and ensure modules containing server-only functionality cannot be imported into Client Components.

#### Scenario: Client attempts to access server-only module
- **WHEN** a Client Component imports a `server-only` module
- **THEN** the Next.js build fails or an equivalent effective automated check rejects the import

#### Scenario: Server environment
- **WHEN** the application runs in production
- **THEN** it operates with Node.js rather than a separate backend or Edge runtime

### Requirement: Functional accessible application shell
The application SHALL render usable Spanish-language navigation at `/` and `/modules`, semantic landmarks, visible focus states and responsive layout without requiring authentication or database access.

#### Scenario: Navigation
- **WHEN** a user opens `/` and follows the link to modules
- **THEN** `/modules` displays the seven planned modules without broken links or implied operational functionality

#### Scenario: Mobile keyboard accessibility
- **WHEN** a keyboard-only user navigates the application at narrow viewport
- **THEN** the navigation stays operable and has visible focus

### Requirement: Independent verifiable quality gates
The project SHALL provide npm scripts to run strict TypeScript checking, ESLint, import/cycle boundary verification, production build and server start. These checks SHALL report actual success/failure rather than skip validation.

#### Scenario: Change verification
- **WHEN** Codex finishes CHG-002
- **THEN** `npm run typecheck`, `npm run lint`, `npm run check:boundaries`, `npm run build` and `openspec validate chg-002-bootstrap-modular-nextjs --strict` have verifiable results
- **AND** the three OpenSpec tasks remain unchecked until their deliverables are demonstrated
