import Link from "next/link";

export default function ComoFuncionaPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Cómo funciona</span>
          <h1>Un proceso claro desde la búsqueda hasta tu certificado.</h1>
          <p>CertificadoEnCasa te muestra técnicos verificados que trabajan en la zona del inmueble. Tú comparas y eliges; el profesional realiza la visita, prepara el CEE y gestiona contigo la entrega.</p>
        </div>
      </section>
      <section className="section">
        <div className="container grid-3">
          <article className="card"><div className="card-number">1</div><h3>Indica la ubicación</h3><p>Introduce el código postal y municipio del inmueble para buscar profesionales que cubran esa zona.</p></article>
          <article className="card"><div className="card-number">2</div><h3>Compara</h3><p>Revisa precio orientativo, perfil, experiencia y zona de servicio de los técnicos disponibles.</p></article>
          <article className="card"><div className="card-number">3</div><h3>Elige</h3><p>Selecciona al profesional que prefieras. No te asignamos uno automáticamente.</p></article>
          <article className="card"><div className="card-number">4</div><h3>Envía tu solicitud</h3><p>Completa los datos del inmueble y la solicitud se enviará al técnico que tú hayas elegido.</p></article>
          <article className="card"><div className="card-number">5</div><h3>Agenda la visita</h3><p>Coordina directamente con el técnico el día, la hora y las condiciones finales del servicio.</p></article>
          <article className="card"><div className="card-number">6</div><h3>Recibe tu CEE</h3><p>El técnico realiza la visita, prepara la documentación y tramita el certificado según corresponda.</p></article>
        </div>
        <div className="container" style={{ marginTop: 30 }}>
          <Link href="/tecnicos" className="button">Buscar técnicos en mi zona</Link>
        </div>
      </section>
    </>
  );
}
