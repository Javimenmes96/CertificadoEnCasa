import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cancelar encargo | CertificadoEnCasa",
  robots: { index: false, follow: false },
};

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

type CancellationRole = "customer" | "technician";

type LeadRow = {
  municipality: string;
  property_type: string;
  billing_status: string;
};

function CancellationVisual({ success = false }: { success?: boolean }) {
  const background = success ? "#eef8f0" : "#fff4e5";
  const foreground = success ? "#2f6b43" : "#b54708";

  return (
    <div
      aria-hidden="true"
      style={{
        width: 72,
        height: 72,
        borderRadius: 22,
        display: "grid",
        placeItems: "center",
        background,
        color: foreground,
        marginBottom: 22,
      }}
    >
      {success ? (
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.2 2.2 2.2 4.8-5" />
        </svg>
      ) : (
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3.5h7l3.5 3.5v6.2" />
          <path d="M14 3.5V8h4.5" />
          <path d="M7 3.5v17h6" />
          <circle cx="17" cy="17" r="4" />
          <path d="m15.6 15.6 2.8 2.8M18.4 15.6l-2.8 2.8" />
        </svg>
      )}
    </div>
  );
}

async function findLeadByToken(token: string): Promise<{ lead: LeadRow; role: CancellationRole } | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey || !/^[0-9a-f-]{36}$/i.test(token)) return null;

  const baseUrl = supabaseUrl.replace(/\/$/, "");
  for (const candidate of [
    { column: "customer_cancel_token", role: "customer" as const },
    { column: "technician_cancel_token", role: "technician" as const },
  ]) {
    const response = await fetch(
      `${baseUrl}/rest/v1/leads?select=municipality,property_type,billing_status&${candidate.column}=eq.${encodeURIComponent(token)}&limit=1`,
      { headers: supabaseHeaders(secretKey), cache: "no-store" },
    );

    if (!response.ok) continue;
    const rows = await response.json() as LeadRow[];
    if (rows[0]) return { lead: rows[0], role: candidate.role };
  }

  return null;
}

export default async function CancelarPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ cancelled?: string; error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const found = await findLeadByToken(token);

  if (!found) {
    return (
      <section className="section">
        <div className="container">
          <div className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
            <span className="eyebrow">Gestión del encargo</span>
            <h1>Este enlace no es válido.</h1>
            <p className="lead">Puede haber caducado o no corresponder a ninguna solicitud.</p>
            <Link href="/" className="button">Volver a CertificadoEnCasa</Link>
          </div>
        </div>
      </section>
    );
  }

  const cancelled = query.cancelled === "1" || found.lead.billing_status === "cancelled";

  if (cancelled) {
    return (
      <section className="section">
        <div className="container">
          <div className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
            <CancellationVisual success />
            <span className="eyebrow">Cancelación registrada</span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.08, marginTop: 14, marginBottom: 20 }}>
              {found.role === "customer" ? "Cancelación registrada correctamente." : "El encargo ha sido cancelado."}
            </h1>
            <p className="lead">
              {found.role === "customer"
                ? "Hemos dejado tu solicitud cancelada y no se seguirá gestionando con este técnico. Gracias por indicarnos el motivo."
                : "La cancelación ha quedado registrada y este encargo no se incluirá en una liquidación."}
            </p>
            {found.role === "customer" ? (
              <Link href="/tecnicos" className="button">Buscar otro técnico</Link>
            ) : (
              <Link href="/" className="button">Volver a CertificadoEnCasa</Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (found.lead.billing_status !== "pending") {
    return (
      <section className="section">
        <div className="container">
          <div className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
            <span className="eyebrow">Gestión del encargo</span>
            <h1>Este encargo ya no puede cancelarse desde aquí.</h1>
            <p className="lead">Ya ha dejado de estar pendiente y su liquidación está cerrada.</p>
            <Link href="/" className="button">Volver a CertificadoEnCasa</Link>
          </div>
        </div>
      </section>
    );
  }

  const reasons = found.role === "customer"
    ? [
        "Ya no necesito el certificado",
        "He elegido otro profesional",
        "No hemos llegado a un acuerdo",
        "El técnico no puede realizar el encargo",
        "Otro motivo",
      ]
    : [
        "El cliente ha cancelado el encargo",
        "No puedo atender el encargo",
        "El cliente no responde",
        "No hemos llegado a un acuerdo",
        "Otro motivo",
      ];

  const isCustomer = found.role === "customer";

  return (
    <section className="section">
      <div className="container">
        <div className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
          <CancellationVisual />
          <span className="eyebrow">Cancelar encargo</span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.06, marginTop: 14, marginBottom: 20 }}>
            {isCustomer
              ? "Lamentamos que finalmente no vayas a realizar el certificado con nosotros"
              : "¿Este encargo finalmente no se va a realizar?"}
          </h1>
          <p className="lead">
            Solicitud de <strong>{found.lead.property_type}</strong> en <strong>{found.lead.municipality}</strong>.
          </p>
          <p>
            {isCustomer
              ? "Si has decidido no continuar con esta solicitud, indícanos el motivo y dejaremos el encargo cancelado. Tu respuesta nos ayuda a mejorar nuestro servicio."
              : "Si el trabajo no se va a realizar, indícanos el motivo. Mientras siga pendiente, no se contabilizará en tu próxima liquidación."}
          </p>

          {query.error === "reason" && <p className="field-error">Selecciona un motivo de cancelación.</p>}
          {query.error === "server" && <p className="field-error">No hemos podido registrar la cancelación. Inténtalo de nuevo.</p>}
          {query.error === "closed" && <p className="field-error">El encargo ya no está pendiente y no puede cancelarse.</p>}

          <form action={`/api/cancel/${token}`} method="post" style={{ marginTop: 28 }}>
            <div className="field">
              <label htmlFor="reason">Motivo *</label>
              <select id="reason" name="reason" required defaultValue="">
                <option value="" disabled>Selecciona un motivo</option>
                {reasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
              </select>
            </div>

            <div className="field" style={{ marginTop: 18 }}>
              <label htmlFor="details">Información adicional</label>
              <textarea
                id="details"
                name="details"
                maxLength={500}
                rows={4}
                placeholder={isCustomer
                  ? "Opcional. Añade algún detalle si puede ayudarnos a entender la cancelación."
                  : "Opcional. Añade algún detalle si ayuda a explicar la cancelación."}
              />
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              <button type="submit" className="button">Confirmar cancelación</button>
              <Link href="/" className="button button-secondary">No cancelar</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
