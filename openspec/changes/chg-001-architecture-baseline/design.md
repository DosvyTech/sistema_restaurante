# Design — CHG-001 / F1-01

## Context

Producto reutilizable de Dosvy, una instalación y base de datos PostgreSQL independientes por restaurante, operación inicial de una sucursal y siete módulos: MOD-01 Configuración, MOD-02 Usuarios/Roles/Permisos, MOD-03 Empleados, MOD-04 Productos/Precios, MOD-05 Inventario/Recetas, MOD-08 Clientes y MOD-09 Facturación con cobros de contado.

Decisiones confirmadas: Next.js/React ejecutado sobre Node.js y TypeScript, monolito modular, Drizzle ORM, Better Auth, Ubuntu LTS/Docker Compose/Caddy, GitHub Actions, validación por riesgos, WCAG 2.2 AA. La integración fiscal se diseñará con proveedor e-CF seleccionado posteriormente. No existe autorización para implementar software en CHG-001.

## Goals / Non-goals

**Goals**
1. Establecer evidencia reproducible del estado del repositorio.
2. Fijar contratos conceptuales entre dominios, capas y procesos transversales.
3. Mapear requisitos y escenarios críticos hacia futuras historias y pruebas, sin ficción sobre código existente.

**Non-goals**
- Generar una estructura de proyecto, código, tablas, migraciones o endpoints.
- Diseñar detalladamente APIs del proveedor e-CF todavía no elegido.
- Dar por implementados controles de seguridad o recuperación.

## Design decisions

### D1 — Evidence-first baseline

Inventariar contenido rastreable al commit inspeccionado. Cada fila tendrá ID, fuente, ruta:línea o referencia verificable, certeza [OBSERVED | APPROVED_DECISION | INFERRED | NEEDS_CONFIRMATION], implicación de diseño y acción futura. Cuando no exista artefacto en el repositorio, registrar NO_EVIDENCE y no inventar fuente:línea. No ejecutar sistemas, instalaciones ni servicios externos durante este Change.

### D2 — Modular monolith boundaries

Definir presentación (React), aplicación (casos de uso, acciones de servidor/REST cuando corresponda), dominio (reglas y estados), persistencia (Drizzle/PostgreSQL y transacciones) e integraciones (fiscal/correo). Ningún módulo puede saltar la capa de aplicación de otro dominio para modificar su almacenamiento directamente.

Módulos:
- MOD-01: parámetros de negocio, identidad e instalación.
- MOD-02: identidad, sesiones, roles, permisos y auditoría.
- MOD-03: expedientes laborales, horarios, asistencia y permisos.
- MOD-04: catálogo, variantes, precios, impuestos comerciales.
- MOD-05: insumos, recetas versionadas, movimientos y valoración.
- MOD-08: expedientes de cliente, identidad fiscal e historial.
- MOD-09: ventas de contado, pagos combinados, facturación fiscal, E34 y reembolsos.

Contratos transversales: autorización en servidor, identificadores inmutables, operaciones críticas idempotentes, transacciones locales para venta+pago+consumo+registro fiscal pendiente, estados comerciales/fiscales separados y conciliación Node.js sin depender de navegadores.

### D3 — Traceability without manufactured evidence

La matriz deberá cubrir los siete módulos, los controles transversales y el flujo crítico venta → pago → inventario → e-CF → E34 → reembolso/devolución. Usar IDs P01–P159 y decisiones posteriores cuando su texto fuente sea verificable; donde la referencia detallada no esté en un archivo, registrar “conversación aprobada, documentación de origen pendiente” en lugar de atribuir archivo:línea inventado. Vincular F1-01, CHG-001, criterios AC y QA iniciales; incluir futuros F1-02..F11-01 solo como referencias planeadas, no implementaciones.

### D4 — Decision record

ADR-0001 explicará las alternativas descartadas (backend separado y SaaS multiempresa centralizado), consecuencias del VPS dedicado por cliente, límites y condiciones de revisión futura. Evitar afirmar que se ha realizado cualquier despliegue.

## Contracts / document ownership

- docs/architecture/repository-baseline.md: índice del estado observado, alcance y fuentes.
- docs/architecture/target-architecture.md: capas, módulos, límites, dependencias y flujos conceptuales.
- docs/adr/ADR-0001-modular-monolith.md: decisión, contexto, alternativas, riesgos y condiciones de revisión.
- docs/qa/traceability.md: cobertura fuente → contrato → historia → AC → QA con clasificación de certeza.

No se definen DTO, endpoints, tablas ni migraciones ejecutables en este Change.

## Validation approach

- Revisar cada afirmación “observada” contra el commit e identificar fuente real; probar casos sin código ni documentación disponible.
- Revisar que cada módulo y exclusión tenga propietario, dependencia y estado declarado.
- Verificar que la matriz represente al menos los flujos críticos, no contenga falsos “IMPLEMENTED” y marque claramente los pendientes.
- Ejecutar openspec validate chg-001-architecture-baseline --strict cuando el entorno tenga OpenSpec CLI; revisar los cuatro artefactos del Change y las tres tareas.

## Risks / trade-offs

- Fuente conversacional no versionada: no atribuirle citas de código; registrar pendiente de formalización.
- Documentación inicial puede cambiar: usar ADR y referencias estables sin congelar firmas de código.
- Falta de proveedor e-CF: mantener interfaces fiscales conceptuales, sin inventar contratos.
- Inventario negativo excepcional y E34 requieren integridad transaccional posterior, no implementar en CHG-001.

## Rollback

Si el diseño documental no se aprueba, revertir el commit/PR de CHG-001 antes de ejecutar F1-02; no hay migración ni datos que revertir.
