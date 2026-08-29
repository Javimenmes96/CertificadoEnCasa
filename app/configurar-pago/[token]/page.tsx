import Link from "next/link";
import PaymentSetupForm from "./PaymentSetupForm";
import styles from "../payment.module.css";

type PlanCode = "basic" | "premium" | "plus";

type TechnicianBillingView = {
  id: string;
  name: string;
  email: string;
  status: string;
  billing_plan_code: PlanCode;
  stripe_setup_completed_at: string | null;
};

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function getTechnician(token: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) return null;

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=id,name,email,status,billing_plan_code,stripe_setup_completed_at&stripe_setup_token=eq.${encodeURIComponent(token)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );
  if (!response.ok) return null;
  const rows = await response.json() as TechnicianBillingView[];
  return rows[0] || null;
}

export default async function TechnicianPaymentSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ cancelado?: string }>;
}) {
  const { token } = await params;
  const { cancelado } = await searchParams;

  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return (
      <section className={styles.page}>
        <div className={styles.narrowCard}>
          <span className="eyebrow">Configuración de pagos</span>
          <h1>Este enlace no es válido.</h1>
          <p>Comprueba que has abierto el enlace completo recibido por correo.</p>
          <Link href="/" className="button">Volver al inicio</Link>
        </div>
      </section>
    );
  }

  const technician = await getTechnician(token);
  if (!technician || technician.status === "rejected") {
    return (
      <section className={styles.page}>
        <div className={styles.narrowCard}>
          <span className="eyebrow">Configuración de pagos</span>
          <h1>No hemos encontrado este perfil.</h1>
          <p>Si crees que se trata de un error, responde al correo de CertificadoEnCasa para que podamos revisarlo.</p>
          <Link href="/" className="button">Volver al inicio</Link>
        </div>
      </section>
    );
  }

  if (technician.stripe_setup_completed_at) {
    return (
      <section className={styles.page}>
        <div className={styles.narrowCard}>
          <div className={styles.successIcon}>✓</div>
          <span className="eyebrow">Pago configurado</span>
          <h1>Tu método de pago ya está preparado.</h1>
          <p>Actualmente tienes configurado el plan <strong>{technician.billing_plan_code}</strong>. Más adelante podrás gestionar cambios de plan desde tu área de técnico.</p>
          <Link href={`/tecnicos/${technician.id}`} className="button">Ver mi perfil</Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className="eyebrow">Plan y método de pago</span>
          <h1>Hola, {technician.name}. Elige cómo quieres trabajar con CertificadoEnCasa.</h1>
          <p>
            Puedes empezar sin cuota mensual o reducir tu comisión con Premium o Plus. Después te enviaremos a Stripe para introducir tu tarjeta de forma segura.
          </p>
        </div>

        {cancelado === "1" && (
          <div className={styles.notice}>
            No se ha realizado ningún cambio. Puedes revisar el plan y volver a Stripe cuando quieras.
          </div>
        )}

        <PaymentSetupForm token={token} initialPlan={technician.billing_plan_code || "basic"} />
      </div>
    </section>
  );
}
