import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Certificados energéticos baratos en Madrid | Desde 40 €",
  description:
    "Encuentra certificados energéticos baratos en Madrid desde 40 €. Compara técnicos de tu zona, consulta precios orientativos y elige tú mismo al profesional.",
  alternates: {
    canonical: "https://certificadoencasa.com/certificado-energetico-barato-madrid",
  },
  openGraph: {
    title: "Certificados energéticos baratos en Madrid | Desde 40 €",
    description:
      "Certificados energéticos en Madrid desde 40 € para determinados inmuebles y zonas. Compara profesionales y elige directamente al técnico que prefieras.",
    url: "https://certificadoencasa.com/certificado-energetico-barato-madrid",
    type: "website",
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://certificadoencasa.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Certificados energéticos baratos",
        item: "https://certificadoencasa.com/certificados-energeticos-baratos",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Certificados energéticos baratos en Madrid",
        item: "https://certificadoencasa.com/certificado-energetico-barato-madrid",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Comparador de certificados energéticos en Madrid",
    serviceType: "Certificado de eficiencia energética",
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Comunidad de Madrid",
    },
    provider: {
      "@type": "Organization",
      name: "CertificadoEnCasa",
      url: "https://certificadoencasa.com/",
    },
    url: "https://certificadoencasa.com/certificado-energetico-barato-madrid",
    description:
      "Servicio para comparar técnicos verificados, zonas de trabajo y precios orientativos de certificados energéticos en Madrid.",
  },
];

export default function CertificadoEnergeticoBaratoMadridPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="page-hero">
        <div className="container">
          <p style={{ margin: "0 0 14px", fontSize: 14 }}>
            <Link href="/">Inicio</Link> · {" "}
            <Link href="/certificados-energeticos-baratos">Certificados energéticos baratos</Link> · Madrid
          </p>
          <span className="eyebrow">Certificado energético en Madrid</span>
          <h1>Certificados energéticos baratos en Madrid desde 40 €</h1>
          <p className="lead">
            Si buscas un certificado energético barato en Madrid, puedes encontrar opciones desde 40 € para determinados inmuebles y zonas. Compara profesionales que trabajen en tu zona, consulta sus precios orientativos y elige tú mismo con quién contactar.
          </p>
          <div className="hero-actions">
            <Link href="/tecnicos" className="button">Comparar técnicos en Madrid</Link>
            <Link href="/como-funciona" className="button button-secondary">Cómo funciona</Link>
          </div>
          <p style={{ marginTop: 14, marginBottom: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            *Precio desde 40 € para determinados inmuebles y zonas. El precio final depende del tipo de inmueble, superficie, ubicación, disponibilidad y tarifa del técnico.
          </p>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Compara antes de contratar</span>
            <h2 style={{ marginTop: 16 }}>Cómo encontrar un certificado energético económico en Madrid</h2>
            <p>
              El precio de un certificado energético en Madrid no es idéntico para todos los inmuebles. Puede variar según la superficie, el tipo de vivienda o local, la ubicación, el desplazamiento y la tarifa de cada técnico. Comparar varias opciones permite decidir con más información.
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
            <span className="eyebrow">Precio del CEE en Madrid</span>
            <h2 style={{ marginTop: 16 }}>¿De qué depende el precio de un certificado energético?</h2>
            <p>
              Puedes encontrar opciones desde 40 € en determinados casos, pero no existe una tarifa única para todos los certificados. Antes de elegir únicamente por precio, comprueba el tipo de inmueble, la zona cubierta por el técnico y las condiciones concretas del servicio. En CertificadoEnCasa puedes comparar esas opciones antes de contactar.
            </p>
          </div>
          <div className="grid-3">
            <article className="card">
              <h3>Tipo y tamaño del inmueble</h3>
              <p>Una vivienda, un local o un inmueble de mayor superficie pueden requerir tiempos de visita y toma de datos diferentes.</p>
            </article>
            <article className="card">
              <h3>Ubicación y desplazamiento</h3>
              <p>La distancia y la zona de servicio del profesional pueden influir en la tarifa que ofrece para un inmueble concreto.</p>
            </article>
            <article className="card">
              <h3>Tarifa de cada técnico</h3>
              <p>Los profesionales fijan sus propios precios. Por eso comparar antes de contratar puede ayudarte a encontrar una opción que encaje mejor.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2 style={{ marginTop: 16 }}>Certificado energético en Madrid: dudas habituales</h2>
          </div>
          <div className="grid-3">
            <article className="card">
              <h3>¿Cuánto cuesta un certificado energético en Madrid?</h3>
              <p>Puedes encontrar opciones desde 40 € para determinados inmuebles y zonas. El precio final depende del inmueble, la ubicación y la tarifa del profesional, por lo que conviene comparar varias opciones.</p>
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
            <Link href="/certificados-energeticos-baratos" className="button button-secondary">Guía de certificados energéticos baratos</Link>
          </div>
        </div>
      </section>
    </>
  );
}
