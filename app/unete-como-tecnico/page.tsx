import Link from "next/link";
import TechnicianForm from "./TechnicianForm";

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
            <Link href="#registro" className="button">Solicitar alta</Link>
            <Link href="/precios" className="button button-secondary">Ver planes</Link>
          </div>
        </div>
      </section>

      <section className="section section-white" id="como-funciona">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Para profesionales</span>
            <h2 style={{ marginTop: 16 }}>Tú decides cómo trabajar.</h2>
            <p>No queremos convertirte en un técnico anónimo dentro de una lista. Tu perfil, tu precio y tu reputación formarán parte de la decisión del cliente.</p>
          </div>
          <div className="grid-3">
            <article className="card">
              <div className="card-number">1</div>
              <h3>Solicita el alta</h3>
              <p>Déjanos tus datos profesionales, experiencia, zonas de trabajo y un precio orientativo.</p>
            </article>
            <article className="card">
              <div className="card-number">2</div>
              <h3>Verificamos tu perfil</h3>
              <p>Revisamos contigo la titulación y documentación necesarias antes de publicar tu perfil como técnico verificado.</p>
            </article>
            <article className="card">
              <div className="card-number">3</div>
              <h3>Recibe solicitudes</h3>
              <p>Los clientes podrán comparar perfiles y elegir según precio, ubicación, disponibilidad y valoraciones.</p>
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
            <span className="eyebrow">Modelo flexible</span>
            <h2 style={{ marginTop: 18 }}>Empieza sin coste fijo en el plan Básico.</h2>
            <p className="lead">
              Puedes probar la plataforma sin una cuota mensual obligatoria y decidir más adelante si te compensa pasar a un plan con menor comisión.
            </p>
            <div className="hero-actions">
              <Link href="/precios" className="button" style={{ background: "white", color: "var(--brand-dark)", borderColor: "white" }}>
                Consultar planes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-white" id="registro">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Registro profesional</span>
            <h2 style={{ marginTop: 16 }}>Solicita tu alta como técnico.</h2>
            <p>Con estos datos podremos revisar tu candidatura y preparar tu perfil. La documentación acreditativa la pediremos durante la verificación.</p>
          </div>
          <TechnicianForm />
        </div>
      </section>
    </>
  );
}
