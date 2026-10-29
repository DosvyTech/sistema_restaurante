# Design — CHG-002 / F1-02

## Context and prerequisites

El repositorio es un proyecto OpenSpec existente. CHG-001 / F1-01 establece el baseline y la arquitectura objetivo; CHG-002 debe leer el resultado **real** del repo antes de modificarlo: `docs/architecture/repository-baseline.md`, `docs/architecture/target-architecture.md`, `docs/adr/ADR-0001-modular-monolith.md`, `docs/qa/traceability.md`. Si faltan, detener Apply y pedir sincronización de F1-01; no recrearlos ni saltarse la dependencia. Los cambios hechos desde GitHub para planificar CHG-002 no representan implementación de Next.js.

## Goals / Non-goals

**Goals:** aplicación Next.js ejecutable en Windows/Node, TypeScript estricto, rutas iniciales reales, límites de código server/client, organización preparada para los siete módulos y comprobaciones automáticas.

**Non-goals:** autenticación, persistencia, permisos funcionales, funcionalidad real de módulos, backend REST aparte, API fiscal, estilo visual final, despliegue y pruebas E2E completas (F1-04).

## Architecture and file ownership

### D1 — Repository-root application, npm and App Router

- No crear subproyecto `web/`: el código Next.js debe vivir en la raíz actual junto a `openspec/`, `.agents/` y `docs/`.
- Usar **npm** y `package-lock.json` versionado; permitir instalación determinista con `npm ci`.
- Adoptar **Next.js App Router** bajo `src/app/`; usar React Server Components por defecto. El runtime de servidor será Node.js, sin Edge runtime ni backend separado.
- TypeScript estricto y alias `@/*` → `src/*`; no desactivar comprobaciones de compilación o eslint para hacer pasar el build.
- Versiones de Next/React/TypeScript compatibles y estables en el momento de Apply, confirmadas mediante `npm ci`, lockfile y versiones documentadas; Node mínimo para proyecto >=20.19.0.
- Si se configura un manejador de procesos o scripts de producción, usar `next build` y `next start`, sin desplegar servicios.

### D2 — Minimal modular boundaries

Proponer estructura inicial (ajustar nombres menores a la arquitectura F1-01 *antes* de implementar, dejando constancia):

```text
src/
  app/
    layout.tsx
    page.tsx
    modules/page.tsx
    globals.css
  modules/
    registry.ts                  # identificadores/nombres/estado de los 7 dominios
    README.md                    # contratos de pertenencia y dependencias
    [dominios se crean cuando sus Changes los implementen]
  shared/
    ui/app-shell.tsx             # componentes presentacionales compartidos
    server/runtime.ts            # punto de prueba server-only, no secretos
  ...
```

Mapa estable: MOD-01 configuración; MOD-02 usuarios/roles/permisos; MOD-03 empleados; MOD-04 productos/precios; MOD-05 inventario/recetas; MOD-08 clientes; MOD-09 facturación inmediata y reembolsos. MOD-10 queda excluido.

Dirección de dependencias: `app -> modules -> shared`, y `app -> shared`; módulos no importan rutas de `app`; `shared` no importa `modules` ni `app`; no acoplar un módulo al almacenamiento interno de otro. Un módulo puede referirse a contratos públicos futuros de otro solo cuando el Change de integración así lo autorice.

Separar conceptualmente `domain`, `application`, `infrastructure` y `ui` dentro de cada módulo cuando exista funcionalidad real. No crear carpetas vacías, funcionalidades simuladas ni clases artificiales solo para representar capas.

### D3 — Server/client safety

- Componentes de servidor por defecto; `'use client'` solo donde haya interacción real.
- Código exclusivo de Node o manejo de variables sensibles dentro de `shared/server` o áreas `server` de módulos; proteger módulos importables mediante `import 'server-only'`.
- Evitar pasar valores sensibles o instancias no serializables por la frontera RSC.
- Agregar control automatizado sobre importaciones prohibidas y ciclos en `src` (ESLint más comprobador de grafo de dependencias o alternativa demostrablemente equivalente); la verificación debe fallar ante al menos una importación contraria a las reglas y un ciclo, usando fixtures temporales o prueba de configuración sin dejar archivos inválidos.
- No incluir valores reales de secretos ni dependencia de PostgreSQL para construir las rutas públicas iniciales.

### D4 — Minimal accessible shell

`/` = inicio de la aplicación; `/modules` = índice de dominios **planificados**; ambas rutas deben ser navegables mediante enlaces reales.

Shell compartido: encabezado, identificación del producto Dosvy (sin confundirlo con un restaurante configurado), navegación semántica, área principal y pie o estado de proyecto cuando ayude. Texto en español, `<html lang="es">`, landmarks, orden de encabezados, foco visible, navegación de teclado y viewport móvil. Contenido sin credenciales ni operaciones administrativas; no fingir autenticación o módulos operativos.

CSS simple local; no crear el sistema visual definitivo de F1-08 ni instalar shadcn/ui. Si se adopta una hoja global, garantizar diseño razonable en móvil y escritorio.

### D5 — Executable quality gates

Scripts npm esperados:

- `npm run dev` — servidor de desarrollo.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` — CLI ESLint directa, no `next lint`.
- `npm run check:boundaries` — análisis real de ciclos e importaciones prohibidas.
- `npm run build` — compilación de producción Next.js.
- `npm run start` — servir build de producción.
- `npm ci` — instalación desde lockfile.

El propio `next build` NO sustituye lint; no utilizar exclusiones globales para evitar errores. Registrar salida o resumen real de ejecución, versión Node/npm y conflictos encontrados. No se exige Vitest/Playwright en esta historia porque su infraestructura pertenece a F1-04.

## Alternatives considered

- `create-next-app` directo sobre la raíz con documentos existentes: riesgo de conflicto y sobreescritura; preferir inicialización cuidadosa sin borrar nada.
- Pages Router: descartado por elegir App Router y Server Components.
- Backend API separado: descartado por arquitectura A.
- Generar anticipadamente todos los dominios, CRUD y menús activos: descartado por YAGNI y alcance de F1-02.
- Hacer toda la base de diseño visual ahora: pospuesto para F1-08.

## Risks / open questions

- Versiones y linters pueden variar: elegir versiones estables compatibles que realmente compilen, reflejarlas en lockfile e informar versiones instaladas.
- Código inicial con ciclo involuntario: comprobar y reparar antes de marcar Task 3.
- Diferencias entre CHG-001 local y remoto: ejecutar solo cuando el CHG-001 real esté sincronizado y disponible en la rama de trabajo.

## Validation

Manual: `npm run dev` y visitas a `/` y `/modules` comprueban navegación real, español, contraste básico y ausencia de errores de consola; no afirmar que se probaron navegadores no ejecutados.

Automática: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run check:boundaries`, `npm run build`, `openspec validate chg-002-bootstrap-modular-nextjs --strict`, `git diff --check`. Antes de marcar Task 3 completo, recoger resultados.

## Rollback

Revertir solamente archivos introducidos/modificados por CHG-002 manteniendo `openspec/`, `.agents/`, `docs/` y el historial de CHG-001. No hay migración de base de datos.
