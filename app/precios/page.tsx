import Link from "next/link";

export default function PreciosPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Planes para técnicos</span>
          <h1>Empieza sin cuota y reduce tu comisión a medida que creces.</h1>
          <p>Los planes están pensados para que cada técnico elija el modelo que mejor encaja con su volumen de certificados.</p>
        </div>
      </section>
      <section className="section">
        <div className="container pricing-grid">
          <article className="price-card">
            <span className="tag">Básico</span>
            <div className="plan-price">0 € <small>/ mes</small></div>
            <p>Para probar la plataforma sin coste fijo.</p>
            <ul className="check-list">
              <li>20% de comisión por servicio</li>
              <li>Perfil profesional público</li>
              <li>Precio y zona definidos por ti</li>
              <li>Recepción de solicitudes</li>
            </ul>
          </article>
          <article className="price-card featured">
            <span className="eyebrow">Premium</span>
            <div className="plan-price">29 € <small>/ mes</small></div>
            <p>Para profesionales con actividad recurrente.</p>
            <ul className="check-list">
              <li>12% de comisión por servicio</li>
              <li>Todo lo incluido en Básico</li>
              <li>Mayor visibilidad del perfil</li>
              <li>Herramientas avanzadas de agenda</li>
            </ul>
          </article>
          <article className="price-card">
            <span className="tag">Plus</span>
            <div className="plan-price">— <small>por cerrar</small></div>
            <p>Para técnicos con un volumen alto de certificados.</p>
            <ul className="check-list">
              <li>Comisión inferior a Premium</li>
              <li>Todo lo incluido en Premium</li>
              <li>Máxima visibilidad</li>
              <li>Prioridad y herramientas adicionales</li>
            </ul>
          </article>
        </div>
        <div className="container" style={{ marginTop: 34 }}>
          <p style={{ color: "var(--muted)" }}>La contratación y el cobro de cuotas todavía no están activados en esta demo.</p>
          <Link href="/tecnicos" className="button button-secondary">Volver a técnicos</Link>
        </div>
      </section>
    </>
  );
}
