import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./brand.css";
import "./mvp.css";

export const metadata: Metadata = {
  title: "CertificadoEnCasa | Certificado energético fácil y rápido",
  description:
    "Encuentra técnicos habilitados para tramitar tu certificado de eficiencia energética en España.",
  icons: {
    icon: "/logo-mark.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="container nav-wrap">
            <Link href="/" className="brand" aria-label="CertificadoEnCasa">
              <img
                src="/logo-mark.svg"
                alt=""
                className="brand-logo-image"
                aria-hidden="true"
              />
              <span className="brand-wordmark" aria-hidden="true">
                <span className="brand-wordmark-main">Certificado</span>
                <span className="brand-wordmark-accent">EnCasa</span>
              </span>
            </Link>
            <nav className="nav-links" aria-label="Navegación principal">
              <Link href="/como-funciona">Cómo funciona</Link>
              <Link href="/tecnicos">Técnicos</Link>
              <Link href="/precios">Precios</Link>
              <Link href="/unete-como-tecnico">Únete como técnico</Link>
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
            <div className="footer-columns">
              <div className="footer-links">
                <Link href="/como-funciona">Cómo funciona</Link>
                <Link href="/unete-como-tecnico">Únete como técnico</Link>
                <Link href="/solicitar">Pedir certificado</Link>
              </div>
              <div className="footer-legal" aria-label="Información legal">
                <Link href="/aviso-legal">Aviso legal</Link>
                <Link href="/politica-de-privacidad">Política de privacidad</Link>
                <Link href="/politica-de-cookies">Política de cookies</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
