import Link from "next/link";

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

async function getVerifiedTechnicians(): Promise<PublicTechnician[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) return [];

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
  ].join(",");

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=${select}&status=eq.verified&order=price_from_eur.asc.nullslast,created_at.asc`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) {
    console.error("Public technicians fetch failed:", response.status, await response.text());
    return [];
  }

  return await response.json() as PublicTechnician[];
}

export default async function TecnicosPage() {
  const tecnicos = await getVerifiedTechnicians();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Técnicos verificados</span>
          <h1>Compara y elige tú al profesional.</h1>
          <p>
            CertificadoEnCasa verifica a los profesionales, pero la decisión es tuya. Compara zona de trabajo,
            experiencia y precio orientativo antes de elegir quién realizará tu certificado.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {tecnicos.length === 0 ? (
            <div className="form-card">
              <h2 style={{ fontSize: 30 }}>Estamos incorporando técnicos verificados.</h2>
              <p className="lead">
                Todavía no hay perfiles públicos disponibles. Puedes enviarnos tu solicitud y te avisaremos cuando haya profesionales en tu zona.
              </p>
              <Link href="/solicitar" className="button">Pedir certificado</Link>
            </div>
          ) : (
            <div className="tech-grid">
              {tecnicos.map((tecnico) => (
                <article className="tech-card" key={tecnico.id}>
                  <div className="tech-head">
                    <div className="avatar">{initials(tecnico.name)}</div>
                    <div>
                      <h3 style={{ marginBottom: 2 }}>{tecnico.name}</h3>
                      <span style={{ color: "var(--muted)" }}>{tecnico.city}, {tecnico.province}</span>
                    </div>
                  </div>

                  <div className="verified-line">✓ Profesional verificado</div>
                  <p style={{ color: "var(--muted)", marginTop: 14 }}>{tecnico.qualification}</p>

                  <div className="tech-meta">
                    {tecnico.years_experience !== null && <span className="tag">{tecnico.years_experience} años de experiencia</span>}
                    {tecnico.travel_radius_km !== null && <span className="tag">Radio {tecnico.travel_radius_km} km</span>}
                  </div>

                  <p className="tech-zones"><strong>Zonas:</strong> {tecnico.work_zones}</p>

                  <div className="tech-choice-row">
                    <div>
                      <span style={{ color: "var(--muted)", fontSize: 13 }}>Precio orientativo desde</span>
                      <div className="price">{tecnico.price_from_eur !== null ? `${tecnico.price_from_eur} €` : "Consultar"}</div>
                    </div>
                    <div className="tech-choice-actions">
                      <Link href={`/tecnicos/${tecnico.id}`} className="button button-secondary button-small">Ver perfil</Link>
                      <Link href={`/solicitar?tecnico=${tecnico.id}`} className="button button-small">Elegir</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section-white">
        <div className="container split">
          <div>
            <span className="eyebrow">Tú decides</span>
            <h2 style={{ marginTop: 16 }}>La plataforma no te asigna un técnico.</h2>
            <p className="lead">Te damos información para comparar profesionales verificados y eres tú quien elige con quién quieres trabajar.</p>
          </div>
          <div className="panel">
            <h3>¿Eres técnico?</h3>
            <p>Solicita el alta, indica tus zonas y condiciones y, una vez verificado, tu perfil podrá aparecer para que los clientes te elijan.</p>
            <Link href="/unete-como-tecnico" className="button button-secondary">Únete como técnico</Link>
          </div>
        </div>
      </section>
    </>
  );
}
