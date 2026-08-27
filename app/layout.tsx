import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CertificadoEnCasa | Certificado energético fácil y rápido",
  description:
    "Encuentra técnicos habilitados para tramitar tu certificado de eficiencia energética en España.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="container nav-wrap">
            <Link href="/" className="brand" aria-label="CertificadoEnCasa">
              <span className="brand-mark">CE</span>
              <span>CertificadoEnCasa</span>
            </Link>
            <nav className="nav-links" aria-label="Navegación principal">
              <Link href="/como-funciona">Cómo funciona</Link>
              <Link href="/tecnicos">Técnicos</Link>
              <Link href="/precios">Precios</Link>
              <Link href="/solicitar" className="button button-small">Pedir certificado</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container footer-grid">
            <div>
              <strong>CertificadoEnCasa</strong>
              <p>CEE fácil, transparente y con técnicos verificados.</p>
            </div>
            <div className="footer-links">
              <Link href="/como-funciona">Cómo funciona</Link>
              <Link href="/tecnicos">Soy técnico</Link>
              <Link href="/solicitar">Pedir certificado</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
