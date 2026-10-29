# CHG-002 — Inicialización de Next.js y estructura del monolito modular

## Why

Tras F1-01, el repositorio de Dosvy necesita una aplicación full-stack ejecutable para comenzar a implementar el sistema restaurante sin perder las fronteras de dominio, la seguridad entre servidor y cliente ni los contratos de arquitectura aprobados. Actualmente el repositorio remoto de planificación no tiene una aplicación Next.js; F1-01 documenta el baseline y sus decisiones. El resultado de F1-01 generado localmente aún debe sincronizarse a GitHub antes de comenzar Apply de CHG-002.

## What Changes

- Inicializar **en la raíz del repositorio existente**, sin eliminar OpenSpec, docs ni .agents, una aplicación **Next.js con App Router, React, TypeScript estricto y runtime Node.js**, usando npm y un lockfile reproducible.
- Establecer organización del monolito por dominios y capas, con fronteras server/client explícitas: `src/app` para rutas, `src/modules` para dominios, `src/shared` para infraestructura y componentes realmente compartidos. Activar medidas prácticas contra importaciones cruzadas y dependencias circulares.
- Crear un shell administrativo mínimo, accesible y responsive con rutas funcionales de inicio y catálogo de módulos, identificando de forma inequívoca los siete módulos **planificados y no implementados**.
- Añadir y ejecutar verificaciones independientes de TypeScript, ESLint, compilación de producción y restricciones de dependencias, documentando comandos y evidencia de resultados reales.

## Capabilities

### New Capabilities

- nextjs-modular-foundation: arranque reproducible de Next.js full-stack con navegación funcional, organización modular y barreras comprobables entre código exclusivo de servidor y cliente.

### Modified Capabilities

- Ninguna: F1-01 documenta contratos, no comportamiento de aplicación.

## Impact

- Archivos esperados durante Apply: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.gitignore` (si hace falta actualizarlo); `src/app/**`, `src/modules/**`, `src/shared/**`; convenciones técnicas y verificación para límites de importaciones.
- Dependencia material: F1-01 documentado y revisado en la rama de trabajo con `docs/architecture/target-architecture.md`, ADR y matriz de trazabilidad; no reproducir la arquitectura desde conjeturas.
- Conservar los archivos `openspec/**`, `.agents/**` y `docs/**` actuales.
- No configurar aún Better Auth, Drizzle, PostgreSQL, Docker/Caddy, shadcn/ui ni integraciones fiscales, porque pertenecen a Changes posteriores.

## Out of Scope

- Autenticación y autorización; bases de datos, migraciones y API de negocio.
- CRUD real, formularios de negocio y navegación hacia funcionalidades inexistentes.
- Diseño visual definitivo de F1-08 (Tailwind/shadcn, tokens, personalización); basta CSS mínimo accesible.
- Despliegue, CI de GitHub Actions, correo, facturación y datos reales.

## Dependencies / Conditions

1. F1-01 debe estar disponible en la rama local efectiva antes de Apply, con las tres tareas documentadas y validadas. Codex no debe sobreescribir ni omitir sus artefactos.
2. Node.js compatible con la versión estable de Next.js seleccionada; adoptar **Node.js >= 20.19.0** para ser compatible también con OpenSpec 1.14.3; fijar versiones exactas mediante lockfile tras comprobar compatibilidad.
3. Instalar dependencias desde el registry aprobado; no generar secretos ni agregar proveedores externos en CHG-002.

## Risks

- El generador de Next.js podría rechazar una raíz no vacía o sobrescribir archivos existentes: usar inicialización manual o procedimiento conservador y revisar diferencias antes de aplicar.
- Importaciones de código sensible a componentes cliente: utilizar `server-only` para módulos reservados y validación de límites.
- El pipeline Next.js no reemplaza ESLint: cada comprobación debe poder ejecutarse independientemente.
