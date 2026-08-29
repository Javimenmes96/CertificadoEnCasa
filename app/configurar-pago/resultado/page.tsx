import Link from "next/link";
import styles from "../payment.module.css";
import {
  BillingPlanCode,
  getCheckoutSession,
  getCustomer,
  getSetupIntent,
  getSubscription,
  objectId,
} from "@/lib/stripe-billing";

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function finalizeSession(sessionId: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) throw new Error("Supabase no está configurado.");

  const session = await getCheckoutSession(sessionId);
  if (session.status !== "complete") {
    throw new Error("La configuración con Stripe todavía no se ha completado.");
  }

  const technicianId = session.metadata?.technician_id || "";
  const planCode = session.metadata?.plan_code as BillingPlanCode | undefined;
  if (!/^[0-9a-f-]{36}$/i.test(technicianId) || !planCode || !["basic", "premium", "plus"].includes(planCode)) {
    throw new Error("Stripe no ha devuelto una configuración reconocible.");
  }

  const customerId = objectId(session.customer);
  if (!customerId) throw new Error("No hemos podido identificar el cliente de Stripe.");

  let paymentMethodId: string | null = null;
  let subscriptionId: string | null = null;
  let subscriptionStatus: string | null = null;

  if (planCode === "basic") {
    const setupIntentId = objectId(session.setup_intent);
    if (!setupIntentId) throw new Error("No hemos podido identificar el método de pago guardado.");
    const setupIntent = typeof session.setup_intent === "object" && session.setup_intent
      ? session.setup_intent
      : await getSetupIntent(setupIntentId);
    paymentMethodId = objectId(setupIntent.payment_method);
  } else {
    subscriptionId = objectId(session.subscription);
    if (!subscriptionId) throw new Error("No hemos podido identificar la suscripción creada.");
    const subscription = typeof session.subscription === "object" && session.subscription
      ? session.subscription
      : await getSubscription(subscriptionId);
    subscriptionStatus = subscription.status || null;
    paymentMethodId = objectId(subscription.default_payment_method);

    if (!paymentMethodId) {
      const customer = await getCustomer(customerId);
      paymentMethodId = objectId(customer.invoice_settings?.default_payment_method);
    }
  }

  if (!paymentMethodId) {
    throw new Error("Stripe ha completado el proceso, pero no hemos podido recuperar el método de pago.");
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?id=eq.${encodeURIComponent(technicianId)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(secretKey),
      body: JSON.stringify({
        billing_plan_code: planCode,
        stripe_customer_id: customerId,
        stripe_payment_method_id: paymentMethodId,
        stripe_subscription_id: subscriptionId,
        stripe_subscription_status: subscriptionStatus,
        stripe_setup_completed_at: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error("Stripe setup finalization failed:", response.status, await response.text());
    throw new Error("Stripe ha terminado correctamente, pero no hemos podido guardar la configuración.");
  }

  return { technicianId, planCode };
}

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId || !/^cs_(test_|live_)/.test(sessionId)) {
    return (
      <section className={styles.page}>
        <div className={styles.narrowCard}>
          <span className="eyebrow">Configuración de pagos</span>
          <h1>No hemos recibido una sesión válida de Stripe.</h1>
          <p>Vuelve al enlace de configuración que recibiste por correo e inténtalo de nuevo.</p>
          <Link href="/" className="button">Volver al inicio</Link>
        </div>
      </section>
    );
  }

  try {
    const result = await finalizeSession(sessionId);
    const planLabel = result.planCode === "basic" ? "Básico" : result.planCode === "premium" ? "Premium" : "Plus";

    return (
      <section className={styles.page}>
        <div className={styles.narrowCard}>
          <div className={styles.successIcon}>✓</div>
          <span className="eyebrow">Configuración completada</span>
          <h1>Tu plan y método de pago están preparados.</h1>
          <p>Stripe ha guardado tu método de pago de forma segura y CertificadoEnCasa ya tiene registrada tu configuración.</p>
          <div className={styles.summary}>
            Plan actual: <strong>{planLabel}</strong>
          </div>
          <p>
            Las comisiones solo se incluirán en las liquidaciones de los días 10, 20 y último día del mes cuando el encargo lleve al menos 5 días completos y no haya sido cancelado.
          </p>
          <Link href={`/tecnicos/${result.technicianId}`} className="button">Ver mi perfil</Link>
        </div>
      </section>
    );
  } catch (error) {
    console.error("Payment result failed:", error);
    return (
      <section className={styles.page}>
        <div className={styles.narrowCard}>
          <span className="eyebrow">Configuración de pagos</span>
          <h1>No hemos podido terminar la configuración.</h1>
          <p>{error instanceof Error ? error.message : "Ha ocurrido un error inesperado."}</p>
          <p>No vuelvas a introducir la tarjeta por tu cuenta si Stripe ya te mostró una confirmación. Escríbenos y revisaremos el estado antes de repetir el proceso.</p>
          <Link href="/" className="button">Volver al inicio</Link>
        </div>
      </section>
    );
  }
}
