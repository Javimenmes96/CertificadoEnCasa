import Link from "next/link";
import HomePostalSearch from "./HomePostalSearch";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Certificado energético sin complicaciones</span>
            <h1>Tu certificado energético, con un técnico de tu zona.</h1>
            <p className="lead">
              Indica dónde está el inmueble, compara profesionales verificados que trabajen en esa zona y elige tú mismo con quién quieres hacerlo.
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
          </div>

          <div className="energy-card" aria-label="Cómo se elige un técnico">
            <div className="energy-top">
              <div>
                <span className="tag">Tú mantienes el control</span>
                <h3 style={{ marginTop: 12 }}>Solo opciones que tengan sentido para tu inmueble</h3>
                <p style={{ color: "var(--muted)", marginBottom: 0 }}>Sin asignaciones automáticas.</p>
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
              <div className="quote-row"><span>1. Indica el código postal</span><strong>Tu zona</strong></div>
              <div className="quote-row"><span>2. Compara perfiles verificados</span><strong>Precio y experiencia</strong></div>
              <div className="quote-row"><span>3. Elige al que prefieras</span><strong>Tú decides</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Cómo funciona</span>
            <h2 style={{ marginTop: 16 }}>Tres pasos y tú mantienes el control.</h2>
            <p>Sin asignarte un técnico al azar.</p>
          </div>
          <div className="grid-3">
            <article className="card"><div className="card-number">1</div><h3>Indica la ubicación</h3><p>Escribe el código postal del inmueble y nosotros identificamos el municipio para mostrarte profesionales que trabajen en esa zona.</p></article>
            <article className="card"><div className="card-number">2</div><h3>Compara y elige</h3><p>Consulta técnicos verificados, precio orientativo, experiencia y zona de servicio antes de decidir.</p></article>
            <article className="card"><div className="card-number">3</div><h3>Visita y certificado</h3><p>El técnico elegido recibe tu solicitud, contacta contigo y acuerda directamente la visita y las condiciones del servicio.</p></article>
          </div>
        </div>
      </section>

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
