import type { ReactNode } from "react";
import Link from "next/link";

type AppShellProps = {
  activeRoute: "home" | "modules";
  children: ReactNode;
};

export function AppShell({ activeRoute, children }: AppShellProps) {
  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand-link" href="/" aria-label="Dosvy, inicio">
            <span className="brand-mark" aria-hidden="true">d</span>
            <span className="brand-wordmark">
              <span className="brand-name">DOSVY</span>
              <span className="brand-subtitle">Sistema Restaurante</span>
            </span>
          </Link>
          <nav className="primary-nav" aria-label="Navegación principal">
            <Link className="nav-link" href="/" aria-current={activeRoute === "home" ? "page" : undefined}>
              Inicio
            </Link>
            <Link className="nav-link" href="/modules" aria-current={activeRoute === "modules" ? "page" : undefined}>
              Módulos
            </Link>
          </nav>
        </div>
      </header>
      <main className="main-content" id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <p>Base de producto · F1-02</p>
        <p>Los dominios listados son planificados, aún no operativos.</p>
      </footer>
    </>
  );
}
