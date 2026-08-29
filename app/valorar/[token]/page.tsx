import Link from "next/link";
import ReviewForm from "./ReviewForm";

type ReviewContext = {
  leadId: string;
  customerName: string;
  municipality: string;
  propertyType: string;
  technicianId: string;
  technicianName: string;
  alreadyReviewed: boolean;
};

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

async function getReviewContext(token: string): Promise<ReviewContext | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) return null;

  const leadResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?select=id,name,created_at,municipality,property_type,selected_technician_id,review_invited_at,review_submitted_at&review_token=eq.${encodeURIComponent(token)}&review_invited_at=not.is.null&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!leadResponse.ok) return null;

  const leads = await leadResponse.json() as Array<{
    id: string;
    name: string;
    created_at: string;
    municipality: string;
    property_type: string;
    selected_technician_id: string | null;
    review_invited_at: string | null;
    review_submitted_at: string | null;
  }>;

  const lead = leads[0];
  const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
  if (
    !lead?.selected_technician_id
    || !lead.review_invited_at
    || new Date(lead.created_at).getTime() > fiveDaysAgo
  ) return null;

  const techResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=name&id=eq.${encodeURIComponent(lead.selected_technician_id)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!techResponse.ok) return null;
  const techRows = await techResponse.json() as Array<{ name: string }>;
  const technicianName = techRows[0]?.name;
  if (!technicianName) return null;

  let alreadyReviewed = Boolean(lead.review_submitted_at);
  if (!alreadyReviewed) {
    const reviewResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/reviews?select=id&lead_id=eq.${encodeURIComponent(lead.id)}&limit=1`,
      { headers: supabaseHeaders(secretKey), cache: "no-store" },
    );
    if (reviewResponse.ok) {
      const reviews = await reviewResponse.json() as Array<{ id: string }>;
      alreadyReviewed = Boolean(reviews[0]);
    }
  }

  return {
    leadId: lead.id,
    customerName: lead.name,
    municipality: lead.municipality,
    propertyType: lead.property_type,
    technicianId: lead.selected_technician_id,
    technicianName,
    alreadyReviewed,
  };
}

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const context = await getReviewContext(token);

  if (!context) {
    return (
      <>
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow">Valoración</span>
            <h1>Este enlace no está disponible.</h1>
            <p>Puede que no sea válido, todavía no hayan pasado cinco días o la valoración ya no esté disponible.</p>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <Link href="/" className="button button-secondary">Volver a CertificadoEnCasa</Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Tu opinión</span>
          <h1>Valora a {context.technicianName}.</h1>
          <p>
            Hace unos días realizaste una solicitud de {context.propertyType.toLowerCase()} en {context.municipality} y elegiste a este profesional.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          {context.alreadyReviewed ? (
            <div className="form-card">
              <span className="eyebrow">Valoración recibida</span>
              <h2 style={{ marginTop: 14 }}>Gracias por compartir tu experiencia.</h2>
              <p className="lead">Esta solicitud ya tiene una valoración registrada.</p>
              <Link href={`/tecnicos/${context.technicianId}`} className="button button-secondary">Ver perfil del técnico</Link>
            </div>
          ) : (
            <>
              <div className="legal-notice" style={{ marginBottom: 20 }}>
                Te enviamos esta invitación cinco días después de tu solicitud. La valoración es opcional y se publicará en el perfil del técnico si aceptas su publicación.
              </div>
              <ReviewForm token={token} technicianName={context.technicianName} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
