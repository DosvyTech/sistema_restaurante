# F1-01 — Caracterización inicial, contratos de arquitectura y trazabilidad

**Prioridad:** P0 · **Tipo:** transversal de descubrimiento estático con controles verificables · **Dependencias:** ninguna · **Estado inicial:** NOT_STARTED · **Change:** CHG-001 (`openspec/changes/chg-001-architecture-baseline`).

## Historia de usuario

Como equipo técnico y responsable del sistema restaurante de Dosvy, quiero un inventario verificable del repositorio, sus decisiones aprobadas, límites de módulos y riesgos antes de implementar, para conservar trazabilidad, evitar funcionalidades supuestas y prevenir decisiones incompatibles con el alcance.

## Objetivo y frontera del alcance

Fijar el baseline inicial del repositorio y una matriz fuente/decisión → contrato → módulo → historia/Change → AC → QA. No implementar ni ejecutar módulos, crear esquemas, conectarse a entornos fiscales reales ni desplegar infraestructura.

## Flujo funcional y técnico completo

1. Identificar commit objetivo, árbol real del repositorio, archivos de configuración, agentes y OpenSpec; diferenciar rutas observadas de rutas propuestas.
2. Registrar evidencias por archivo/línea y clasificar su grado de certeza: OBSERVED, APPROVED_DECISION, INFERRED o NEEDS_CONFIRMATION. Las decisiones tomadas en conversación no tienen por defecto archivo:línea en GitHub.
3. Fijar arquitectura objetivo aprobada: Next.js sobre Node.js, TypeScript, PostgreSQL/Drizzle, Better Auth, monolito modular, instalación independiente por restaurante.
4. Documentar límites de los siete módulos: MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-08 y MOD-09; MOD-10 está expresamente excluido.
5. Documentar los contratos conceptuales de sesiones/permisos, auditoría, catálogo y receta versionada, costo y stock, clientes, confirmación comercial atómica, e-CF reconciliado y devoluciones. No inventar DTO/API físicos.
6. Producir matriz de cobertura con criterios comprobables y estados honestos de implementación.
7. Verificar los artefactos OpenSpec y enumerar riesgos o fuentes todavía no localizadas.

## Subtareas por capa (mapeo a tres tareas principales)

### Capa de investigación/documentación — Task 1
- Relevar archivos actuales, rutas y commits verificables.
- Catalogar la configuración OpenSpec y skills presentes sin ejecutarlas.
- Diferenciar evidencia existente, decisiones aprobadas y supuestos.
- Identificar ausencia de código inicial, pruebas y migraciones solo si el inventario lo demuestra.

### Arquitectura y dominios — Task 2
- Documentar presentación, aplicación, dominio, persistencia e integración como capas conceptuales.
- Definir límites y dependencias de módulos y servicios transversales.
- Registrar el ADR del monolito modular y alternativas descartadas.
- Detallar seguridad, idempotencia y separación comercial/fiscal como requisitos futuros, no comportamiento ya implementado.

### Contratos, QA y trazabilidad — Task 3
- Construir matriz de cobertura por módulo y escenarios críticos.
- Enlazar F1-01, CHG-001 y AC a los artefactos previstos.
- Marcar brechas de evidencia y responsables de aclaración en siguientes historias.
- Validar OpenSpec cuando haya CLI disponible; informar sin falsificar resultados.

## Contratos API, DTO o artefactos

- `docs/architecture/repository-baseline.md`
- `docs/architecture/target-architecture.md`
- `docs/adr/ADR-0001-modular-monolith.md`
- `docs/qa/traceability.md`
- Sin endpoints, DTO, tablas ni migraciones nuevos en F1-01.

## Fuentes, entidades y política de datos

Fuentes: archivos y commits GitHub verificables, `openspec/config.yaml`, skills del repositorio y decisiones del descubrimiento aprobadas en chat, claramente etiquetadas como tales. No consultar ni escribir bases de datos de restaurantes, credenciales reales o documentos fiscales. No generar datos operativos.

## Criterios de aceptación verificables (AC)

- **F1-01-AC-01:** existe inventario de estructura/configuración con commit, fuentes verificables y clasificación de certeza.
- **F1-01-AC-02:** el diseño objetivo distingue estado existente de futuro; incluye los siete dominios, capas, dependencias, seguridad y exclusiones.
- **F1-01-AC-03:** ADR documenta alternativas y consecuencias del monolito modular y del despliegue por restaurante.
- **F1-01-AC-04:** matriz de trazabilidad conecta dominios y flujos críticos con AC y QA, sin inventar evidencia fuente.
- **F1-01-AC-05:** ningún artefacto afirma que existan funcionalidades no verificadas ni que se hayan ejecutado pruebas sin resultado.
- **F1-01-AC-06:** no se ejecutan ni modifican servicios, software, migraciones, bases o despliegues; solo documentación y seguimiento OpenSpec.

## Condición de cierre

Las tres tareas del Change tendrán evidencia documentada. `openspec validate chg-001-architecture-baseline --strict` deberá completarse antes de declarar el Change listo para archivar. La existencia de los artefactos no significa que F1-01 esté implementada.
