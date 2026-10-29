# F1-02 — Inicialización de Next.js y estructura del monolito modular

**Prioridad:** P0 · **Tipo:** infraestructura de aplicación · **Dependencia:** F1-01 completado y sincronizado · **Estado inicial:** NOT_STARTED · **Change:** CHG-002 / `chg-002-bootstrap-modular-nextjs`.

## Historia de usuario

Como desarrollador, quiero una base Next.js organizada por dominios para implementar el producto Dosvy Restaurante con componentes, acciones, servicios y contratos reutilizables sin acoplar frontend, backend y persistencia.

## Objetivo y alcance

Instalar en la raíz del repositorio existente una aplicación React/Next.js App Router full-stack en Node.js/TypeScript estricto, una interfaz administrativa mínima navegable y controles automáticos que aseguren fronteras de módulos. No implementar módulos de negocio, Better Auth, PostgreSQL, Drizzle, API fiscal, CI ni despliegues.

## Flujo técnico y navegación

1. Comprobar documentación aprobada de F1-01 y estado Git antes de editar.
2. Instalar Next.js/React con npm lockfile, habilitar `src/app`, TypeScript y separación de entornos.
3. Crear ruta de inicio `/` y catálogo `/modules` con enlaces funcionales y siete módulos etiquetados como planificados.
4. Documentar dependencias permitidas `app -> modules -> shared`; prohibir `shared -> modules/app` y `modules -> app`.
5. Ejecutar instalación reproducible, validación estática, restricciones arquitectónicas, producción y OpenSpec.
6. Presentar evidencia y no fusionar ni archivar de manera automática.

## Tareas y responsables

### Task 1 — BE / Plataforma y límites
- Inicialización no destructiva en raíz, `package.json` y `package-lock.json`.
- Next.js App Router + React + TypeScript estricto y alias `@/*`.
- Separación server/client y módulo marcado `server-only`.
- Gate: `npm ci`, `npm run typecheck` y confirmación del aislamiento servidor/cliente.

### Task 2 — FE / Shell y navegación
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/modules/page.tsx`, estilos simples.
- Componentes compartidos de layout y registro de los siete dominios, no implementaciones simuladas.
- UI en español, landmarks semánticos, enlaces reales, foco visible y responsive.
- Gate: `/` y `/modules` accesibles sin dependencias de autenticación o BD.

### Task 3 — QA / Build y arquitectura
- Scripts de typecheck, lint, check:boundaries, build y start.
- Verificación contra importaciones prohibidas y ciclos con casos negativos temporales.
- Ejecución real de verificaciones, `openspec validate --strict`, `git diff --check`.
- Gate: calidad y límites observables pasan; resultados documentados; no afirmar pruebas no ejecutadas.

## Contratos y artefactos

- Entrada: cuatro documentos de F1-01 en `docs/architecture`, `docs/adr` y `docs/qa`.
- Salida: código base `src/app/**`, catálogo `src/modules/**`, shell `src/shared/**`, configuración raíz y scripts.
- Regla: la ruta `/modules` muestra **planificado**, nunca **funcional**, hasta que futuros Changes implementen cada módulo.
- No definir aún DTO públicos, tablas ni migraciones.

## Criterios de aceptación

- **F1-02-AC-01:** `npm ci` y `npm run build` terminan con éxito desde el repositorio con lockfile.
- **F1-02-AC-02:** TypeScript estricto y `npm run typecheck` funcionan sin supresiones.
- **F1-02-AC-03:** `npm run lint` y `npm run check:boundaries` detectan errores reales y se ejecutan independientemente.
- **F1-02-AC-04:** una importación server-only en un componente cliente falla mediante una comprobación efectiva.
- **F1-02-AC-05:** no hay ciclos o dependencias prohibidas entre `app`, `modules` y `shared`.
- **F1-02-AC-06:** `/` y `/modules` funcionan, en español y con navegación accesible.
- **F1-02-AC-07:** se preservan OpenSpec, docs y .agents, y no hay lógica de negocio ficticia.
- **F1-02-AC-08:** `openspec validate chg-002-bootstrap-modular-nextjs --strict` es válido antes de archivar.

## Riesgos y decisiones operativas

- GitHub todavía puede no contener los resultados locales del Change F1-01; no comenzar implementación si falta la dependencia.
- La instalación debe evitar sobrescribir archivos existentes.
- Adoptar Node >=20.19.0 y versiones estables compatibles según verificación en Apply.
- No incluir diseño de marca definitivo, test E2E ni nuevas dependencias ajenas al alcance.
- No editar `main`, fusionar o archivar sin revisión.

**Cierre:** tres tareas realizadas, evidencia técnica real y Change validado, pendientes de revisión antes de archive.
