import Link from "next/link";
import { notFound } from "next/navigation";

type AvailabilityStatus = "available" | "limited" | "unavailable";

type PublicTechnician = {
  id: string;
  name: string;
  city: string;
  province: string;
  qualification: string;
  years_experience: number | null;
  work_zones: string;
  travel_radius_km: number | null;
  price_from_eur: number | null;
  notes: string | null;
  availability_status: AvailabilityStatus;
};

type PublicReview = {
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
};

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function availabilityMeta(status: AvailabilityStatus | string) {
  if (status === "unavailable") {
    return { label: "No disponible temporalmente", color: "#8b2e28", background: "#fff1ef", border: "#e5b5b1" };
  }
  if (status === "limited") {
    return { label: "Disponibilidad limitada", color: "#7a5200", background: "#fff8e6", border: "#efd18b" };
  }
  return { label: "Disponible", color: "#17653b", background: "#eff9f1", border: "#b8dec2" };
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

async function getTechnician(id: string): Promise<PublicTechnician | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) return null;

  const select = [
    "id",
    "name",
    "city",
    "province",
    "qualification",
    "years_experience",
    "work_zones",
    "travel_radius_km",
    "price_from_eur",
    "notes",
    "availability_status",
  ].join(",");

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=${select}&id=eq.${encodeURIComponent(id)}&status=eq.verified&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) return null;
  const rows = await response.json() as PublicTechnician[];
  return rows[0] || null;
}

async function getReviews(id: string): Promise<PublicReview[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) return [];

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/reviews?select=rating,comment,reviewer_name,created_at&technician_id=eq.${encodeURIComponent(id)}&verified=eq.true&status=eq.published&order=created_at.desc&limit=30`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) {
    console.error("Public reviews fetch failed:", response.status, await response.text());
    return [];
  }

  return await response.json() as PublicReview[];
}

export default async function TechnicianProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cp?: string | string[]; municipio?: string | string[] }>;
}) {
  const { id } = await params;
  const queryParams = await searchParams;
  const [tecnico, reviews] = await Promise.all([getTechnician(id), getReviews(id)]);
  if (!tecnico) notFound();

  const postalCode = firstParam(queryParams.cp).replace(/\D/g, "").slice(0, 5);
  const municipality = firstParam(queryParams.municipio).trim().slice(0, 100);
  const locationParams = new URLSearchParams();
  if (/^\d{5}$/.test(postalCode)) locationParams.set("cp", postalCode);
  if (municipality) locationParams.set("municipio", municipality);
  const locationQuery = locationParams.toString();
  const backHref = locationQuery ? `/tecnicos?${locationQuery}` : "/tecnicos";
  const chooseHref = locationQuery
    ? `/solicitar?tecnico=${tecnico.id}&${locationQuery}`
    : `/solicitar?tecnico=${tecnico.id}`;
  const availability = availabilityMeta(tecnico.availability_status);
  const unavailable = tecnico.availability_status === "unavailable";
  const reviewAverage = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
    : null;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Link href={backHref} className="profile-back">← Volver a técnicos</Link>
          <div className="profile-title-row">
            <div className="avatar profile-avatar">{initials(tecnico.name)}</div>
            <div>
              <span className="eyebrow">✓ Profesional verificado</span>
              <h1 style={{ marginTop: 16 }}>{tecnico.name}</h1>
              <p>{tecnico.city}, {tecnico.province}</p>
              {reviewAverage !== null && (
                <p style={{ margin: "8px 0 0", fontWeight: 800 }}>
                  ★ {reviewAverage.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "valoración verificada" : "valoraciones verificadas"}
                </p>
              )}
              <div style={{ marginTop: 12 }}>
                <span style={{ display: "inline-flex", padding: "6px 10px", borderRadius: 999, fontSize: 13, fontWeight: 800, color: availability.color, background: availability.background, border: `1px solid ${availability.border}` }}>
                  {availability.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split profile-layout">
          <div className="panel">
            <h2>Perfil profesional</h2>
            <div className="profile-detail-list">
              <div><span>Titulación</span><strong>{tecnico.qualification}</strong></div>
              <div><span>Experiencia</span><strong>{tecnico.years_experience !== null ? `${tecnico.years_experience} años` : "No indicada"}</strong></div>
              <div><span>Zona de trabajo</span><strong>{tecnico.work_zones}</strong></div>
              <div><span>Radio de desplazamiento</span><strong>{tecnico.travel_radius_km !== null ? `${tecnico.travel_radius_km} km` : "Consultar"}</strong></div>
              <div><span>Disponibilidad</span><strong>{availability.label}</strong></div>
            </div>
            {tecnico.notes && (
              <div className="profile-about">
                <h3>Sobre el técnico</h3>
                <p>{tecnico.notes}</p>
              </div>
            )}
          </div>

          <aside className="panel profile-choice-card">
            {locationQuery && (
              <div className="profile-location-context">
                <span>Inmueble</span>
                <strong>{postalCode} · {municipality}</strong>
              </div>
            )}
            <span style={{ color: "var(--muted)", fontSize: 14 }}>Precio orientativo desde</span>
            <div className="profile-price">{tecnico.price_from_eur !== null ? `${tecnico.price_from_eur} €` : "Consultar"}</div>
            <p>El precio final puede variar según el inmueble, desplazamiento y condiciones concretas del servicio.</p>
            {unavailable ? (
              <div className="legal-notice" style={{ marginTop: 18 }}>
                Este técnico está temporalmente no disponible y no acepta nuevas solicitudes. Su perfil permanece visible para que puedas consultarlo.
              </div>
            ) : (
              <>
                <Link href={chooseHref} className="button profile-choose-button">Elegir este técnico</Link>
                <p className="form-note">
                  {tecnico.availability_status === "limited"
                    ? "Tiene disponibilidad limitada, pero puedes enviarle una solicitud. Confirmará contigo si puede atenderla."
                    : "Al elegirlo podrás completar el resto de datos del inmueble antes de enviar la solicitud."}
                </p>
              </>
            )}
          </aside>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <span className="eyebrow">Valoraciones verificadas</span>
          <h2 style={{ marginTop: 14 }}>Opiniones de clientes reales.</h2>
          <p className="lead" style={{ maxWidth: 760 }}>
            Solo mostramos opiniones vinculadas a solicitudes que constan como completadas en CertificadoEnCasa.
          </p>

          {reviews.length === 0 ? (
            <div className="panel" style={{ marginTop: 24 }}>
              <strong>Aún no tiene valoraciones verificadas.</strong>
              <p style={{ marginBottom: 0, color: "var(--muted)" }}>Las opiniones aparecerán aquí cuando clientes con servicios completados las publiquen.</p>
            </div>
          ) : (
            <>
              <div className="panel" style={{ marginTop: 24, marginBottom: 18 }}>
                <div style={{ fontSize: 34, fontWeight: 900 }}>★ {reviewAverage?.toFixed(1)}</div>
                <div style={{ color: "var(--muted)" }}>{reviews.length} {reviews.length === 1 ? "valoración verificada" : "valoraciones verificadas"}</div>
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                {reviews.map((review, index) => (
                  <article className="panel" key={`${review.created_at}-${index}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <strong>{review.reviewer_name}</strong>
                        <div style={{ fontSize: 18, marginTop: 4 }}>{"★".repeat(Number(review.rating))}{"☆".repeat(5 - Number(review.rating))}</div>
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 14 }}>{formatReviewDate(review.created_at)}</div>
                    </div>
                    {review.comment && <p style={{ marginTop: 16, marginBottom: 12 }}>{review.comment}</p>}
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#17653b" }}>✓ Servicio verificado</span>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
