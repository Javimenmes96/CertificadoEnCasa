"use client";

import { FormEvent, useState } from "react";
import styles from "../payment.module.css";

type PlanCode = "basic" | "premium" | "plus";

const plans: Array<{
  code: PlanCode;
  name: string;
  monthly: string;
  commission: string;
  description: string;
  featured?: boolean;
}> = [
  {
    code: "basic",
    name: "Básico",
    monthly: "0 €/mes",
    commission: "20% + IVA",
    description: "Sin cuota fija. Ideal para empezar y pagar solo cuando recibes encargos facturables.",
  },
  {
    code: "premium",
    name: "Premium",
    monthly: "29 €/mes + IVA",
    commission: "12% + IVA",
    description: "Reduce la comisión si empiezas a recibir encargos con frecuencia.",
    featured: true,
  },
  {
    code: "plus",
    name: "Plus",
    monthly: "59 €/mes + IVA",
    commission: "7% + IVA",
    description: "La comisión más baja para profesionales con mayor volumen.",
  },
];

export default function PaymentSetupForm({
  token,
  initialPlan,
}: {
  token: string;
  initialPlan: PlanCode;
}) {
  const [planCode, setPlanCode] = useState<PlanCode>(initialPlan || "basic");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setError("Debes aceptar las condiciones de cobro antes de continuar.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/technicians/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, planCode, consent: true }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) {
        throw new Error(result.error || "No hemos podido abrir Stripe.");
      }
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No hemos podido abrir Stripe.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.planGrid}>
        {plans.map((plan) => {
          const selected = planCode === plan.code;
          return (
            <label
              key={plan.code}
              className={`${styles.planCard} ${selected ? styles.selected : ""} ${plan.featured ? styles.featured : ""}`}
            >
              <input
                type="radio"
                name="plan"
                value={plan.code}
                checked={selected}
                onChange={() => setPlanCode(plan.code)}
              />
              <div className={styles.planTopline}>
                <strong>{plan.name}</strong>
                {plan.featured && <span>Recomendado</span>}
              </div>
              <div className={styles.monthly}>{plan.monthly}</div>
              <div className={styles.commission}>{plan.commission} por encargo</div>
              <p>{plan.description}</p>
            </label>
          );
        })}
      </div>

      <div className={styles.rules}>
        <strong>Cómo se cobran los encargos</strong>
        <ul>
          <li>La comisión se calcula sobre el precio orientativo publicado cuando entra la solicitud.</li>
          <li>Los encargos cancelados antes de la liquidación no generan comisión.</li>
          <li>Las liquidaciones se realizan los días 10, 20 y último día del mes.</li>
          <li>Solo entran encargos que hayan cumplido al menos 5 días completos.</li>
        </ul>
      </div>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>
          Autorizo a CertificadoEnCasa a guardar mi método de pago en Stripe y a realizar los cargos correspondientes a mi plan y a las comisiones de los encargos no cancelados, con liquidaciones los días 10, 20 y último día de cada mes, aplicando el porcentaje vigente de mi plan sobre el precio anunciado del encargo, más los impuestos correspondientes.
        </span>
      </label>

      <div className={styles.securityNote}>
        🔒 Los datos de tu tarjeta se introducen y almacenan directamente en Stripe. CertificadoEnCasa no recibe ni guarda el número completo de tu tarjeta.
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <button className="button" type="submit" disabled={loading || !consent}>
        {loading ? "Abriendo Stripe…" : "Configurar pago con Stripe"}
      </button>
    </form>
  );
}
