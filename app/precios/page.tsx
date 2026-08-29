import Link from "next/link";

const sharedBenefits = [
  "Perfil profesional público tras la verificación",
  "Tú defines tu precio orientativo y tus zonas de trabajo",
  "Recepción de solicitudes de clientes que te eligen",
  "Valoraciones de clientes en tu perfil",
];

export default function PreciosPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Planes para técnicos</span>
          <h1>Empieza sin cuota y reduce tu comisión a medida que creces.</h1>
          <p>
            Elige el plan que mejor encaje con tu volumen de trabajo. En CertificadoEnCasa el cliente te elige a ti y tú mantienes el control sobre tu precio y tus zonas.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ marginBottom: 34 }}>
          <div className="panel" style={{ maxWidth: 860 }}>
            <span className="eyebrow">Sin riesgo para empezar</span>
            <h2 style={{ marginTop: 16, marginBottom: 12 }}>Un modelo más justo: coste fijo 0 € en el plan Básico.</h2>
            <p className="lead" style={{ marginBottom: 0 }}>
              Puedes probar la plataforma sin cuota mensual. Si empiezas a recibir más encargos, los planes Premium y Plus reducen progresivamente la comisión.
            </p>
          </div>
        </div>

        <div className="container pricing-grid">
          <article className="price-card">
            <span className="tag">Básico</span>
            <div className="plan-price">0 € <small>/ mes</small></div>
            <p>Para empezar y comprobar cuánto trabajo te aporta la plataforma sin asumir una cuota fija.</p>
            <ul className="check-list">
              <li><strong>20% de comisión</strong> por encargo facturable</li>
              <li>Sin cuota mensual</li>
              <li>Todos los servicios esenciales de la plataforma</li>
            </ul>
          </article>

          <article className="price-card featured">
            <span className="eyebrow">Premium</span>
            <div className="plan-price">29 € <small>/ mes</small></div>
            <p>Para profesionales que ya reciben encargos de forma recurrente y quieren reducir su comisión.</p>
            <ul className="check-list">
              <li><strong>12% de comisión</strong> por encargo facturable</li>
              <li>Todo lo incluido en el plan Básico</li>
              <li>Menor coste variable por cada trabajo recibido</li>
            </ul>
          </article>

          <article className="price-card">
            <span className="tag">Plus</span>
            <div className="plan-price">59 € <small>/ mes</small></div>
            <p>Para técnicos con un volumen alto de certificados que buscan la comisión más reducida.</p>
            <ul className="check-list">
              <li><strong>7% de comisión</strong> por encargo facturable</li>
              <li>Todo lo incluido en el plan Premium</li>
              <li>La comisión más baja de CertificadoEnCasa</li>
            </ul>
          </article>
        </div>

        <div className="container" style={{ marginTop: 46 }}>
          <div className="section-heading" style={{ marginBottom: 24 }}>
            <span className="eyebrow">Incluido en todos los planes</span>
            <h2 style={{ marginTop: 16 }}>La diferencia está en cuánto pagas, no en poder recibir clientes.</h2>
            <p>
              Un técnico del plan Básico también puede tener perfil verificado, recibir solicitudes y acumular valoraciones. Los planes superiores reducen la comisión a cambio de una cuota mensual.
            </p>
          </div>
          <div className="grid-3">
            {sharedBenefits.slice(0, 3).map((benefit, index) => (
              <div className="card" key={benefit}>
                <div className="card-number">{index + 1}</div>
                <strong>{benefit}</strong>
              </div>
            ))}
          </div>
          <div className="panel" style={{ marginTop: 20, maxWidth: 760 }}>
            <strong>✓ {sharedBenefits[3]}</strong>
          </div>
        </div>

        <div className="container" style={{ marginTop: 54 }}>
          <div className="panel" style={{ maxWidth: 900 }}>
            <span className="eyebrow">Cómo se calcula la comisión</span>
            <h2 style={{ marginTop: 16 }}>Reglas claras desde que entra el encargo.</h2>
            <ul className="check-list">
              <li>
                La comisión se calcula sobre el <strong>precio orientativo publicado por el técnico en el momento en que el cliente realiza la solicitud</strong>.
              </li>
              <li>
                El precio, el plan y el porcentaje de comisión quedan registrados para ese encargo y <strong>no cambian de forma retroactiva</strong>.
              </li>
              <li>
                Una solicitud se considera facturable por defecto. Si el cliente o el técnico comunica una cancelación antes de su liquidación, <strong>no se cobra comisión</strong>.
              </li>
              <li>
                Las liquidaciones se preparan los días <strong>10, 20 y último día de cada mes</strong>, incluyendo solo solicitudes recibidas al menos <strong>5 días antes</strong>.
              </li>
            </ul>
            <p className="form-note" style={{ marginBottom: 0 }}>
              Ejemplo: si tu precio publicado es 50 € y estás en el plan Básico, la comisión de ese encargo será de 10 €, aunque después acuerdes otro importe directamente con el cliente.
            </p>
          </div>
        </div>

        <div className="container" style={{ marginTop: 40 }}>
          <div className="panel highlight" style={{ maxWidth: 900 }}>
            <span className="eyebrow" style={{ background: "rgba(255,255,255,.15)", color: "white" }}>Únete como técnico</span>
            <h2 style={{ marginTop: 18 }}>Empieza con el Básico y cambia de plan cuando te compense.</h2>
            <p>
              El alta no publica automáticamente tu perfil: primero revisamos tu habilitación profesional. Tampoco se activa ningún cobro automático durante el proceso de solicitud de alta.
            </p>
            <div className="hero-actions">
              <Link href="/unete-como-tecnico" className="button" style={{ background: "white", color: "var(--brand-dark)", borderColor: "white" }}>
                Solicitar alta como técnico
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
