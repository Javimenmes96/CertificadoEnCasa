import Link from "next/link";
import { notFound } from "next/navigation";

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
  ].join(",");

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=${select}&id=eq.${encodeURIComponent(id)}&status=eq.verified&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) return null;
  const rows = await response.json() as PublicTechnician[];
  return rows[0] || null;
}

export default async function TechnicianProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tecnico = await getTechnician(id);
  if (!tecnico) notFound();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Link href="/tecnicos" className="profile-back">← Volver a técnicos</Link>
          <div className="profile-title-row">
            <div className="avatar profile-avatar">{initials(tecnico.name)}</div>
            <div>
              <span className="eyebrow">✓ Profesional verificado</span>
              <h1 style={{ marginTop: 16 }}>{tecnico.name}</h1>
              <p>{tecnico.city}, {tecnico.province}</p>
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
            </div>
            {tecnico.notes && (
              <div className="profile-about">
                <h3>Sobre el técnico</h3>
                <p>{tecnico.notes}</p>
              </div>
            )}
          </div>

          <aside className="panel profile-choice-card">
            <span style={{ color: "var(--muted)", fontSize: 14 }}>Precio orientativo desde</span>
            <div className="profile-price">{tecnico.price_from_eur !== null ? `${tecnico.price_from_eur} €` : "Consultar"}</div>
            <p>El precio final puede variar según el inmueble, desplazamiento y condiciones concretas del servicio.</p>
            <Link href={`/solicitar?tecnico=${tecnico.id}`} className="button profile-choose-button">Elegir este técnico</Link>
            <p className="form-note">Al elegirlo podrás completar los datos de tu inmueble antes de enviar la solicitud.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
