# Principios de ingeniería — Dosvy Restaurante pequeño

## Producto objetivo

Sistema administrativo sencillo y confiable para **un restaurante pequeño por instalación**, inicialmente aproximadamente **1–10 usuarios simultáneos**. Se priorizan mostrador, usuarios/roles, productos, inventario apropiado, clientes, facturación y cobros, según el roadmap aprobado. No es una plataforma SaaS multi-restaurante ni requiere alta disponibilidad empresarial en el MVP.

## Regla para CHG-006 y los Changes siguientes

1. **Implementar solo lo necesario:** elegir la solución más pequeña que satisfaga requisitos reales y permita mantenimiento por 1–2 desarrolladores. Antes de añadir servicio, dependencia o abstracción, explicar el problema concreto y el costo.
2. **Arquitectura simple:** Next.js/TypeScript modular con PostgreSQL/Drizzle, Caddy y Docker Compose por VPS/cliente. Mantener la posibilidad de crecer, pero no implementar microservicios, Kubernetes, orquestadores de despliegue, dashboards complejos o multi-tenancy sin necesidad demostrada.
3. **Seguridad no negociable:** acceso autorizado, roles, datos fiscales/personales protegidos, base privada, secretos fuera de Git, TLS público validado antes de puesta en servicio, migraciones controladas, dependencias revisadas, reglas de CI y backup recuperable. Simplicidad no es ausencia de controles.
4. **Operación económica:** pocos componentes, actualizaciones reproducibles, registro de incidentes útil, backups externos y recuperación practicada, runbooks breves. Preferir capacidades nativas y servicios externos puntuales cuando reduzcan costo operativo.
5. **Prueba honesta por etapa:** pruebas locales en Docker/CI sirven para aceptar código; comprobaciones reales del VPS, DNS, certificado, firewall y restauración con datos de producción se realizan antes del go-live. Nunca describir una prueba sintética como validación pública.
6. **No ampliar silenciosamente el alcance:** máximo tres tareas principales por Change; funcionalidades fuera del MVP quedan en backlog explícito; no inventar requisitos de empresa grande.
7. **Criterios medibles:** tests reales, límites de exposición, integridad y recuperación. Mantener RPO/RTO comprometidos como objetivos sujetos a medición; no fingir cumplimiento ni debilitar protección para marcar tareas.
8. **Despliegue por cliente:** un restaurante por instalación independiente, no un único servicio compartido para varios clientes; evitar romper la configuración local y los entornos de otros clientes.

## Cierre de desarrollo frente a puesta en servicio

Una implementación puede quedar técnicamente cerrada con pruebas locales reales y código revisado, cuando el Change lo especifique expresamente. La producción mantiene un **gate obligatorio** de dominio/TLS público, puertos/SSH, secrets, datos persistentes y backups/restauración. Sin esa evidencia la instalación **NO está lista para clientes**, aunque el Change de infraestructura haya concluido.

CHG-007 debe preferir observabilidad ligera y respaldo externo recuperable; si el objetivo es RPO <=15 minutos, no eliminar WAL/PITR sin una decisión consciente de cambio de objetivo.
