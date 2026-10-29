import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Dosvy | Sistema Restaurante",
  description: "Fundación técnica del sistema restaurante de Dosvy.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
