# CHG-001 — Caracterización inicial, contratos de arquitectura y trazabilidad

## Why

DosvyTech/sistema_restaurante inicia como producto administrativo de restaurante con OpenSpec configurado y una arquitectura aprobada, pero todavía requiere un baseline verificable antes de programar. Sin inventario ni límites de dominio documentados, los siguientes Changes podrían introducir dependencias cruzadas, inventar funcionalidades, trasladar premisas no aprobadas o incumplir decisiones del descubrimiento.

Esta propuesta implementa exclusivamente la historia F1-01 de la fase F1. Es trabajo documental y de descubrimiento estático, no la construcción de la aplicación.

## What Changes

- Inventariar el estado real del repositorio (rutas, herramientas, archivos, especificaciones, pruebas y dependencias observables), citando ruta y líneas o commit; clasificar cada hallazgo como OBSERVED, APPROVED_DECISION, INFERRED o NEEDS_CONFIRMATION.
- Documentar el contrato de arquitectura objetivo: Next.js/React/Node.js con TypeScript, monolito modular, PostgreSQL y Drizzle, Better Auth, siete dominios de negocio y sus dependencias admitidas; registrar un ADR con las alternativas y limitaciones.
- Construir una matriz inicial de trazabilidad por dominio y flujo: fuente/decisión → capacidad → historia/Change futuro → criterio de aceptación → caso QA. Para requisitos cuyo material fuente no esté en el repositorio, conservar la procedencia de entrevista y marcar evidencia a vincular, sin inventar rutas ni referencias.
- Publicar exclusiones, riesgos iniciales, decisiones pendientes y cobertura QA de los contratos de seguridad, integridad, facturación e inventario.

## Capabilities

### New Capabilities

- architecture-baseline: documentación verificable del estado real, contratos de arquitectura, decisiones y trazabilidad preliminar para habilitar el diseño e implementación de siguientes Changes.

### Modified Capabilities

- Ninguna. No existen capacidades de negocio a alterar mediante este Change.

## Impact

- Archivos a producir durante Apply: docs/architecture/repository-baseline.md, docs/architecture/target-architecture.md, docs/adr/ADR-0001-modular-monolith.md y docs/qa/traceability.md.
- No se modifican rutas, componentes, endpoints, esquemas de base de datos, credenciales ni configuración de producción.
- F1-02 y posteriores consumirán estos artefactos; los contratos aquí documentados son decisiones de diseño, no implementaciones verificadas.
- Se preserva la regla de máximo tres tareas principales y se exige evidencia para dar cada una por completada.

## Non-goals

- No crear la aplicación Next.js, contenedores, servicios, migraciones, tablas, API ni pantallas.
- No hacer despliegues, emitir e-CF ni contratar proveedores.
- No tratar documentación aprobada como evidencia de comportamiento existente.
- No declarar listos F1-02 a F11-01 ni producir todos los Changes del backlog.

## Risks and mitigations

- La fuente de requisitos reside parcialmente en conversaciones: registrar fuente como APPROVED_DECISION / entrevista y marcar los identificadores que deban vincularse a documentos de casos de uso posteriormente.
- El repositorio es un proyecto nuevo: diferenciar explícitamente ausencia verificada de código frente a ausencia no comprobada.
- Los detalles del proveedor e-CF permanecen sin seleccionar: declarar dependencia externa sin contratos supuestos.
