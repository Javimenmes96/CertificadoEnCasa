import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Certificado energético sin complicaciones</span>
            <h1>Tu certificado energético, con un técnico de tu zona.</h1>
            <p className="lead">
              Compara técnicos habilitados, precios y valoraciones. Elige tú mismo al profesional y acuerda directamente la visita y el pago.
            </p>
            <div className="hero-actions">
              <Link href="/solicitar" className="button">Pedir mi certificado</Link>
              <Link href="/tecnicos" className="button button-secondary">Ver técnicos</Link>
            </div>
            <div className="trust-row">
              <span>Técnicos verificados</span>
              <span>Precios visibles</span>
              <span>Servicio en toda España</span>
            </div>
          </div>

          <div className="energy-card" aria-label="Ejemplo de comparación de técnicos">
            <div className="energy-top">
              <div>
                <span className="tag">Ejemplo de CEE</span>
                <h3 style={{ marginTop: 12 }}>Vivienda en Madrid</h3>
                <p style={{ color: "var(--muted)", marginBottom: 0 }}>Piso · 82 m²</p>
              </div>
              <div className="energy-label" aria-hidden="true">
                <div className="energy-grade">
                  <span className="grade" />
                  <span className="grade" />
                  <span className="grade active" />
                  <span className="grade" />
                  <span className="grade" />
                  <span className="grade" />
                  <span className="grade" />
                </div>
              </div>
            </div>
            <div className="quote-box">
              <div className="quote-row"><span>Laura M. · 4,9 ★</span><span className="price">79 €</span></div>
              <div className="quote-row"><span>Carlos R. · 4,8 ★</span><span className="price">85 €</span></div>
              <div className="quote-row"><span>Ana P. · 5,0 ★</span><span className="price">92 €</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Cómo funciona</span>
            <h2 style={{ marginTop: 16 }}>Tres pasos y tú mantienes el control.</h2>
            <p>Sin tarifas ocultas para el cliente y sin asignarte un técnico al azar.</p>
          </div>
          <div className="grid-3">
            <article className="card"><div className="card-number">1</div><h3>Cuéntanos tu inmueble</h3><p>Indica ubicación, tipo de inmueble y algunos datos básicos para encontrar profesionales disponibles.</p></article>
            <article className="card"><div className="card-number">2</div><h3>Compara y elige</h3><p>Consulta técnicos verificados, sus precios, valoraciones y disponibilidad antes de decidir.</p></article>
            <article className="card"><div className="card-number">3</div><h3>Visita y certificado</h3><p>El técnico realiza la visita, prepara el CEE y gestiona contigo la entrega y el pago del servicio.</p></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="panel">
            <span className="eyebrow">Para propietarios</span>
            <h2 style={{ marginTop: 18 }}>Elige con información real.</h2>
            <p className="lead">No todos los técnicos trabajan igual ni cobran lo mismo. Compara antes de contratar.</p>
            <ul className="check-list">
              <li>Precio fijado por cada profesional</li>
              <li>Valoraciones de otros clientes</li>
              <li>Disponibilidad y zona de servicio</li>
              <li>Contacto directo con el técnico elegido</li>
            </ul>
          </div>
          <div className="panel highlight">
            <span className="eyebrow">Para técnicos</span>
            <h2 style={{ marginTop: 18 }}>Consigue clientes sin regalar tu trabajo.</h2>
            <p className="lead">Crea tu perfil profesional, define tu precio y decide qué solicitudes quieres atender.</p>
            <ul className="check-list">
              <li>Perfil profesional verificado</li>
              <li>Tu propio precio y radio de trabajo</li>
              <li>Agenda y solicitudes centralizadas</li>
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
