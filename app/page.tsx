import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HomePostalSearch from "./HomePostalSearch";
import HowItWorksSection from "./HowItWorksSection";
import styles from "./heroImage.module.css";

const heroImage = "/hero-certificado-desde-40.png.png";

export const metadata: Metadata = {
  title: "CertificadoEnCasa | Tu certificado energético desde 40 €",
  description:
    "Tu certificado energético desde 40 €. Compara técnicos de tu zona, consulta precios orientativos y elige tú mismo al profesional.",
  alternates: {
    canonical: "https://certificadoencasa.com/",
  },
  openGraph: {
    title: "CertificadoEnCasa | Tu certificado energético desde 40 €",
    description:
      "Tu certificado energético desde 40 €. Compara técnicos de tu zona, consulta precios orientativos y elige tú mismo al profesional.",
    url: "https://certificadoencasa.com/",
    type: "website",
    images: [
      {
        url: `https://certificadoencasa.com${heroImage}`,
        width: 1448,
        height: 1086,
        alt: "Certificado energético desde 40 euros con técnicos verificados",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CertificadoEnCasa | Tu certificado energético desde 40 €",
    description:
      "Compara técnicos de tu zona y consigue tu certificado energético desde 40 €.",
    images: [`https://certificadoencasa.com${heroImage}`],
  },
};

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Certificado energético sin complicaciones</span>
            <h1>Tu certificado energético desde 40 €</h1>
            <p className="lead">
              Indica dónde está el inmueble, compara profesionales verificados que trabajen en tu zona y elige tú mismo con quién hacerlo.
            </p>

            <HomePostalSearch />

            <div className="hero-actions hero-secondary-actions">
              <Link href="/como-funciona" className="button button-secondary">Cómo funciona</Link>
            </div>
            <div className="trust-row">
              <span>Técnicos verificados</span>
              <span>Precios orientativos visibles</span>
              <span>Tú eliges al profesional</span>
            </div>
            <p style={{ marginTop: 14, marginBottom: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              *Precio desde 40 € para determinados inmuebles y zonas. El precio final depende del tipo de inmueble, superficie, ubicación y tarifa del técnico.
            </p>
          </div>

          <div className={styles.heroVisual}>
            <Image
              src={heroImage}
              alt="Certificado energético desde 40 euros con técnicos verificados"
              width={1448}
              height={1086}
              className={styles.heroIllustration}
              sizes="(max-width: 820px) 100vw, 48vw"
              priority
            />
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <section className="section">
        <div className="container split">
          <div className="panel">
            <span className="eyebrow">Para propietarios</span>
            <h2 style={{ marginTop: 18 }}>Elige con información real.</h2>
            <p className="lead">No todos los técnicos trabajan en las mismas zonas ni cobran lo mismo. Compara antes de contratar.</p>
            <ul className="check-list">
              <li>Precio fijado por cada profesional</li>
              <li>Perfil profesional verificado</li>
              <li>Zona de servicio visible</li>
              <li>Contacto directo con el técnico elegido</li>
            </ul>
            <p>
              Si el precio es una prioridad, consulta nuestra guía para encontrar {" "}
              <Link href="/certificados-energeticos-baratos">certificados energéticos baratos</Link> comparando profesionales de tu zona.
            </p>
            <p>
              ¿Tu inmueble está en la Comunidad de Madrid? Consulta {" "}
              <Link href="/certificado-energetico-barato-madrid">
                certificados energéticos baratos en Madrid
              </Link>{" "}
              y compara técnicos que trabajen en tu zona.
            </p>
          </div>
          <div className="panel highlight">
            <span className="eyebrow">Para técnicos</span>
            <h2 style={{ marginTop: 18 }}>Consigue clientes sin regalar tu trabajo.</h2>
            <p className="lead">Crea tu perfil profesional, define tu precio y especifica con precisión dónde quieres trabajar.</p>
            <ul className="check-list">
              <li>Perfil profesional verificado</li>
              <li>Tu propio precio y zonas de trabajo</li>
              <li>Los clientes te eligen directamente</li>
              <li>Planes adaptados a tu volumen</li>
            </ul>
            <div className="hero-actions">
              <Link href="/unete-como-tecnico" className="button" style={{ background: "white", color: "var(--brand-dark)", borderColor: "white" }}>
                Únete como técnico
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
