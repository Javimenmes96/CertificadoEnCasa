import Link from "next/link";

export default function ComoFuncionaPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Cómo funciona</span>
          <h1>Un proceso claro desde la solicitud hasta tu certificado.</h1>
          <p>CertificadoEnCasa conecta propietarios con técnicos habilitados. Tú comparas y eliges; el profesional realiza la visita, prepara el CEE y gestiona contigo la entrega.</p>
        </div>
      </section>
      <section className="section">
        <div className="container grid-3">
          <article className="card"><div className="card-number">1</div><h3>Solicita</h3><p>Indica dónde está el inmueble, qué tipo es y algunos datos básicos.</p></article>
          <article className="card"><div className="card-number">2</div><h3>Compara</h3><p>Revisa precio, perfil, valoraciones, zona de servicio y disponibilidad de los técnicos.</p></article>
          <article className="card"><div className="card-number">3</div><h3>Elige</h3><p>Selecciona al profesional que prefieras. No te asignamos uno automáticamente.</p></article>
          <article className="card"><div className="card-number">4</div><h3>Agenda la visita</h3><p>Coordina con el técnico el día y la hora para inspeccionar el inmueble.</p></article>
          <article className="card"><div className="card-number">5</div><h3>Recibe tu CEE</h3><p>El técnico prepara la documentación y tramita el certificado según corresponda.</p></article>
          <article className="card"><div className="card-number">6</div><h3>Valora el servicio</h3><p>Tu valoración ayuda a que futuros clientes puedan elegir con más información.</p></article>
        </div>
        <div className="container" style={{ marginTop: 30 }}>
          <Link href="/solicitar" className="button">Empezar solicitud</Link>
        </div>
      </section>
    </>
  );
}
