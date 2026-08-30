import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Certificado energético barato en Madrid | Compara técnicos",
  description:
    "Compara técnicos verificados y precios orientativos para encontrar un certificado energético económico en Madrid. Tú eliges al profesional.",
  alternates: {
    canonical: "https://certificadoencasa.com/certificado-energetico-barato-madrid",
  },
  openGraph: {
    title: "Certificado energético barato en Madrid | CertificadoEnCasa",
    description:
      "Busca técnicos que trabajen en Madrid, compara precios orientativos y elige directamente al profesional que prefieras.",
    url: "https://certificadoencasa.com/certificado-energetico-barato-madrid",
    type: "website",
  },
};

export default function CertificadoEnergeticoBaratoMadridPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Certificado energético en Madrid</span>
          <h1>Certificado energético barato en Madrid: compara técnicos y precios</h1>
          <p className="lead">
            Si necesitas un certificado de eficiencia energética en Madrid, puedes comparar profesionales que trabajen en tu zona, consultar sus precios orientativos y elegir tú mismo con quién contactar.
          </p>
          <div className="hero-actions">
            <Link href="/tecnicos" className="button">Buscar técnicos en Madrid</Link>
            <Link href="/como-funciona" className="button button-secondary">Cómo funciona</Link>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Compara antes de contratar</span>
            <h2 style={{ marginTop: 16 }}>Cómo encontrar un certificado energético económico en Madrid</h2>
            <p>
              El precio de un certificado energético no es idéntico para todos los inmuebles. Puede variar según la superficie, el tipo de vivienda o local, la ubicación, el desplazamiento y la tarifa de cada técnico.
            </p>
          </div>

          <div className="grid-3">
            <article className="card">
              <div className="card-number">1</div>
              <h3>Introduce el código postal</h3>
              <p>Usamos la ubicación del inmueble para mostrarte profesionales que trabajen realmente en esa zona de Madrid.</p>
            </article>
            <article className="card">
              <div className="card-number">2</div>
              <h3>Compara precios orientativos</h3>
              <p>Cada técnico fija su propia tarifa. Puedes revisar precio, experiencia, disponibilidad y zona de servicio antes de decidir.</p>
            </article>
            <article className="card">
              <div className="card-number">3</div>
              <h3>Elige al profesional</h3>
              <p>CertificadoEnCasa no asigna un técnico automáticamente. Tú eliges directamente con quién quieres realizar el certificado.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="panel">
            <span className="eyebrow">Madrid capital y alrededores</span>
            <h2 style={{ marginTop: 18 }}>Busca por la ubicación real del inmueble</h2>
            <p className="lead">
              Madrid tiene diferencias importantes de desplazamiento entre barrios y municipios. Por eso la búsqueda por código postal ayuda a evitar comparar profesionales que no trabajan en tu zona.
            </p>
            <ul className="check-list">
              <li>Madrid capital</li>
              <li>Municipios de la Comunidad de Madrid</li>
              <li>Precio definido por cada profesional</li>
              <li>Zona de trabajo visible</li>
              <li>Contacto con el técnico elegido</li>
            </ul>
          </div>

          <div className="panel highlight">
            <span className="eyebrow">Precio con criterio</span>
            <h2 style={{ marginTop: 18 }}>Barato no significa elegir a ciegas</h2>
            <p className="lead">
              El objetivo es que puedas encontrar una opción económica sin perder información sobre quién realizará el trabajo. Compara también experiencia, disponibilidad y qué incluye el precio final.
            </p>
            <ul className="check-list">
              <li>Profesionales verificados antes de publicarse</li>
              <li>Precio orientativo visible</li>
              <li>Sin asignaciones automáticas</li>
              <li>Elección directa por parte del cliente</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2 style={{ marginTop: 16 }}>Certificado energético en Madrid: dudas habituales</h2>
          </div>
          <div className="grid-3">
            <article className="card">
              <h3>¿Cuánto cuesta un certificado energético en Madrid?</h3>
              <p>No existe una tarifa única. El importe depende del inmueble y del profesional. Comparar varias opciones te permite valorar qué precio encaja mejor.</p>
            </article>
            <article className="card">
              <h3>¿Puedo elegir al técnico?</h3>
              <p>Sí. En CertificadoEnCasa el cliente consulta los perfiles disponibles y elige directamente al profesional que prefiera.</p>
            </article>
            <article className="card">
              <h3>¿Sirve para viviendas y locales?</h3>
              <p>La plataforma permite solicitar certificados para distintos tipos de inmuebles. El técnico elegido confirmará el alcance, el precio y las condiciones del servicio.</p>
            </article>
          </div>

          <div className="hero-actions" style={{ marginTop: 32 }}>
            <Link href="/tecnicos" className="button">Comparar técnicos en Madrid</Link>
            <Link href="/certificados-energeticos-baratos" className="button button-secondary">Ver certificados energéticos baratos</Link>
          </div>
        </div>
      </section>
    </>
  );
}
