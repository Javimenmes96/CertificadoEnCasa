import Link from "next/link";

const tecnicos = [
  { initials: "LM", name: "Laura Martín", city: "Madrid", rating: "4,9", reviews: 47, price: "79 €", areas: ["Viviendas", "Locales"] },
  { initials: "CR", name: "Carlos Ruiz", city: "Valencia", rating: "4,8", reviews: 31, price: "85 €", areas: ["Viviendas", "Oficinas"] },
  { initials: "AP", name: "Ana Pérez", city: "Sevilla", rating: "5,0", reviews: 22, price: "92 €", areas: ["Viviendas", "Locales"] },
];

export default function TecnicosPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Técnicos verificados</span>
          <h1>Compara profesionales antes de contratar.</h1>
          <p>Esta primera demo muestra cómo se presentarán los perfiles. En la versión funcional podrás filtrar por ubicación, precio, disponibilidad y valoraciones.</p>
        </div>
      </section>
      <section className="section">
        <div className="container tech-grid">
          {tecnicos.map((tecnico) => (
            <article className="tech-card" key={tecnico.name}>
              <div className="tech-head">
                <div className="avatar">{tecnico.initials}</div>
                <div><h3 style={{ marginBottom: 2 }}>{tecnico.name}</h3><span style={{ color: "var(--muted)" }}>{tecnico.city}</span></div>
              </div>
              <div><strong>{tecnico.rating} ★</strong> <span style={{ color: "var(--muted)" }}>({tecnico.reviews} valoraciones)</span></div>
              <div className="tech-meta">{tecnico.areas.map((area) => <span className="tag" key={area}>{area}</span>)}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div><span style={{ color: "var(--muted)", fontSize: 13 }}>Desde</span><div className="price">{tecnico.price}</div></div>
                <Link href="/solicitar" className="button button-small">Elegir</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-white">
        <div className="container split">
          <div><span className="eyebrow">¿Eres técnico?</span><h2 style={{ marginTop: 16 }}>Únete a CertificadoEnCasa.</h2><p className="lead">Cada profesional fija su precio, define su zona de trabajo y decide qué solicitudes acepta.</p></div>
          <div className="panel"><h3>Verificación profesional</h3><p>Antes de publicar un perfil comprobaremos la documentación necesaria para confirmar que el técnico puede ejercer y emitir CEE.</p><Link href="/precios" className="button button-secondary">Ver planes</Link></div>
        </div>
      </section>
    </>
  );
}
