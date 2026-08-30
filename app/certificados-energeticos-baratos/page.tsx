import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Certificados energéticos baratos | Compara técnicos y precios",
  description:
    "Compara técnicos verificados y precios orientativos para encontrar un certificado energético económico en tu zona. Tú eliges al profesional.",
  alternates: {
    canonical: "https://certificadoencasa.com/certificados-energeticos-baratos",
  },
  openGraph: {
    title: "Certificados energéticos baratos | CertificadoEnCasa",
    description:
      "Compara técnicos verificados, precios orientativos y zonas de servicio antes de elegir quién realizará tu certificado energético.",
    url: "https://certificadoencasa.com/certificados-energeticos-baratos",
    type: "website",
  },
};

export default function CertificadosEnergeticosBaratosPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Compara antes de contratar</span>
          <h1>Certificados energéticos baratos: compara técnicos de tu zona</h1>
          <p className="lead">
            Encontrar un certificado energético económico no debería significar elegir a ciegas. En CertificadoEnCasa puedes comparar profesionales verificados, precios orientativos y zonas de trabajo antes de decidir.
          </p>
          <div className="hero-actions">
            <Link href="/tecnicos" className="button">Comparar técnicos y precios</Link>
            <Link href="/como-funciona" className="button button-secondary">Cómo funciona</Link>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Precio y elección</span>
            <h2 style={{ marginTop: 16 }}>La forma más sencilla de buscar un certificado energético barato</h2>
            <p>
              Cada profesional fija su propio precio. Por eso comparar varias opciones puede ayudarte a encontrar una tarifa que encaje con tu inmueble y tu zona.
            </p>
          </div>

          <div className="grid-3">
            <article className="card">
              <div className="card-number">1</div>
              <h3>Introduce tu código postal</h3>
              <p>Mostramos técnicos que trabajan realmente en la zona donde se encuentra el inmueble.</p>
            </article>
            <article className="card">
              <div className="card-number">2</div>
              <h3>Compara precio y perfil</h3>
              <p>Consulta el precio orientativo, la experiencia, la disponibilidad y la información profesional antes de elegir.</p>
            </article>
            <article className="card">
              <div className="card-number">3</div>
              <h3>Elige tú al técnico</h3>
              <p>CertificadoEnCasa no te asigna un profesional automáticamente: tú decides con quién quieres contactar.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="panel">
            <span className="eyebrow">Qué comparar</span>
            <h2 style={{ marginTop: 18 }}>No mires solo el precio</h2>
            <p className="lead">
              El coste de un certificado energético puede variar según el tipo y tamaño del inmueble, la ubicación, el desplazamiento del técnico y los servicios incluidos.
            </p>
            <ul className="check-list">
              <li>Precio orientativo del profesional</li>
              <li>Zona en la que presta servicio</li>
              <li>Experiencia y perfil profesional</li>
              <li>Disponibilidad para realizar la visita</li>
              <li>Qué trámites están incluidos en el precio final</li>
            </ul>
          </div>

          <div className="panel highlight">
            <span className="eyebrow">Transparencia</span>
            <h2 style={{ marginTop: 18 }}>Un precio bajo debe seguir siendo un servicio correcto</h2>
            <p className="lead">
              El certificado de eficiencia energética debe ser realizado por un técnico competente y requiere la visita al inmueble cuando corresponda según la normativa aplicable. El profesional que elijas te confirmará el precio final y las condiciones del servicio antes de realizarlo.
            </p>
            <ul className="check-list">
              <li>Técnicos verificados antes de publicarse</li>
              <li>Contacto directo con el profesional elegido</li>
              <li>Sin asignaciones automáticas</li>
              <li>Comparación sencilla entre varias opciones</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <div className="panel">
            <span className="eyebrow">Búsqueda local</span>
            <h2 style={{ marginTop: 18 }}>¿Necesitas un certificado energético barato en Madrid?</h2>
            <p className="lead">
              Hemos preparado una página específica para Madrid con información sobre cómo comparar técnicos por zona, precio orientativo y disponibilidad.
            </p>
            <div className="hero-actions">
              <Link href="/certificado-energetico-barato-madrid" className="button">
                Certificado energético barato en Madrid
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2 style={{ marginTop: 16 }}>Dudas sobre certificados energéticos económicos</h2>
          </div>
          <div className="grid-3">
            <article className="card">
              <h3>¿Cuánto cuesta un certificado energético?</h3>
              <p>No existe un precio único. Depende del inmueble, de la zona y de la tarifa de cada técnico. En CertificadoEnCasa puedes comparar precios orientativos antes de elegir.</p>
            </article>
            <article className="card">
              <h3>¿El técnico más barato es siempre la mejor opción?</h3>
              <p>No necesariamente. Conviene comparar también experiencia, disponibilidad, zona de servicio y qué incluye el precio final.</p>
            </article>
            <article className="card">
              <h3>¿CertificadoEnCasa fija el precio?</h3>
              <p>No. Cada técnico fija su propia tarifa. La plataforma facilita la comparación y permite que el cliente elija directamente al profesional.</p>
            </article>
          </div>

          <div className="hero-actions" style={{ marginTop: 32 }}>
            <Link href="/tecnicos" className="button">Buscar técnicos en mi zona</Link>
          </div>
        </div>
      </section>
    </>
  );
}
