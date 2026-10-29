import type { Metadata } from "next";
import { AppShell } from "@/shared/ui/app-shell";
import { plannedModules } from "@/modules/registry";

export const metadata: Metadata = {
  title: "Módulos planificados | Dosvy",
  description: "Dominios previstos para el sistema restaurante de Dosvy.",
};

export default function ModulesPage() {
  return (
    <AppShell activeRoute="modules">
      <div className="modules-page">
        <header className="page-heading">
          <p className="eyebrow"><span className="eyebrow-mark" aria-hidden="true" />Mapa de dominios</p>
          <h1>Módulos planificados</h1>
          <p>Estos dominios forman parte de la arquitectura prevista. Se muestran como referencia; ninguno ofrece funciones operativas todavía.</p>
        </header>

        <ul className="modules-grid" aria-label="Catálogo de módulos planificados">
          {plannedModules.map((module) => (
            <li className="module-card" key={module.id}>
              <div className="module-card-topline">
                <span className="module-id">{module.id}</span>
                <span className="module-status">Planificado · no implementado</span>
              </div>
              <h2>{module.name}</h2>
              <p>{module.summary}</p>
            </li>
          ))}
        </ul>

        <p className="module-notice">
          No hay pantallas administrativas, cuentas de usuario ni datos de restaurante configurados en esta etapa.
        </p>
      </div>
    </AppShell>
  );
}
