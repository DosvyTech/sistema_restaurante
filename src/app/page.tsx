import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/shared/ui/app-shell";

export const metadata: Metadata = {
  title: "Inicio | Dosvy",
  description: "Punto de partida del sistema restaurante de Dosvy.",
};

export default function HomePage() {
  return (
    <AppShell activeRoute="home">
      <div className="home-page">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-mark" aria-hidden="true" />Base del sistema · F1-02</p>
            <h1 id="home-title">Una base clara para la operación que viene.</h1>
            <p className="hero-description">
              Dosvy reúne los dominios previstos para un sistema de restaurante. Esta etapa prepara la estructura; todavía no administra un restaurante ni procesa operaciones.
            </p>
            <Link className="primary-link" href="/modules">
              Explorar módulos planificados <span aria-hidden="true">→</span>
            </Link>
          </div>

          <aside className="foundation-note" aria-label="Estado de la aplicación">
            <p className="note-label">Estado del proyecto</p>
            <p className="note-title">En preparación</p>
            <p className="note-copy">La arquitectura define el rumbo. Las funciones de negocio se incorporarán en Changes posteriores.</p>
            <div className="note-divider" />
            <p className="note-foot">7 dominios previstos <span aria-hidden="true">·</span> 0 módulos implementados</p>
          </aside>
        </section>

        <section className="home-detail" aria-labelledby="home-detail-title">
          <div>
            <p className="section-kicker">Fundación técnica</p>
            <h2 id="home-detail-title">Primero, los límites correctos.</h2>
          </div>
          <p>
            La aplicación parte de un monolito modular: cada dominio tendrá responsabilidades claras y las rutas compartirán una navegación sencilla. Los módulos que ves son un mapa, no funcionalidades activas.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
