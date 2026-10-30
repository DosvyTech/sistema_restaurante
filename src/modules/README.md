# Module boundaries

Business modules are added only when their OpenSpec Changes implement a real capability. The F1-02 catalog is descriptive metadata and does not create module behavior.

- A module owns its domain rules and persistence.
- Modules may use `src/shared` foundations; they do not import routes from `src/app` or another module's internals.
- Cross-module workflows are coordinated through application contracts when a later Change authorizes them.
- Server-only code stays behind `import "server-only"` in its server-owned entry points.
- Do not add empty domain/application/infrastructure/ui folders or placeholder CRUD.
