import Link from "next/link";

export default function UneteComoTecnicoPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Únete como técnico</span>
          <h1>Consigue más solicitudes de CEE sin perder el control de tu trabajo.</h1>
          <p>
            CertificadoEnCasa está pensado para técnicos habilitados que quieren captar nuevos clientes,
            fijar sus propios precios y decidir en qué zonas y solicitudes quieren trabajar.
          </p>
          <div className="hero-actions">
            <Link href="/precios" className="button">Ver planes</Link>
            <Link href="#como-funciona" className="button button-secondary">Cómo funcionará</Link>
          </div>
        </div>
      </section>

      <section className="section section-white" id="como-funciona">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Para profesionales</span>
            <h2 style={{ marginTop: 16 }}>Tú decides cómo trabajar.</h2>
            <p>No queremos convertirte en un técnico anónimo dentro de una lista. Tu perfil, tu precio y tu reputación serán parte de la decisión del cliente.</p>
          </div>
          <div className="grid-3">
            <article className="card">
              <div className="card-number">1</div>
              <h3>Crea tu perfil</h3>
              <p>Indica tu experiencia, zonas de trabajo, especialidades y documentación profesional para verificar tu perfil.</p>
            </article>
            <article className="card">
              <div className="card-number">2</div>
              <h3>Fija tus condiciones</h3>
              <p>Define tu precio, radio de desplazamiento y disponibilidad. Tú eliges cómo organizar tu actividad.</p>
            </article>
            <article className="card">
              <div className="card-number">3</div>
              <h3>Recibe solicitudes</h3>
              <p>Los clientes podrán comparar perfiles y elegirte directamente según precio, ubicación, disponibilidad y valoraciones.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="panel">
            <span className="eyebrow">Ventajas</span>
            <h2 style={{ marginTop: 18 }}>Una plataforma pensada también para el técnico.</h2>
            <ul className="check-list">
              <li>Precio fijado por ti</li>
              <li>Zona de trabajo configurable</li>
              <li>Perfil profesional con valoraciones</li>
              <li>Solicitudes centralizadas</li>
              <li>Sin exclusividad</li>
            </ul>
          </div>
          <div className="panel highlight">
            <span className="eyebrow">Próximamente</span>
            <h2 style={{ marginTop: 18 }}>Abriremos el registro de técnicos.</h2>
            <p className="lead">
              La plataforma está todavía en fase de desarrollo. El registro profesional será uno de los siguientes módulos en activarse.
            </p>
            <div className="hero-actions">
              <Link href="/precios" className="button" style={{ background: "white", color: "var(--brand-dark)", borderColor: "white" }}>
                Consultar planes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
