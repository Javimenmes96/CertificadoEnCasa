type Lead = {
  id: string;
  created_at: string;
  status: string;
  name: string;
  phone: string | null;
  email: string | null;
  postal_code: string;
  municipality: string;
  property_type: string;
  surface_m2: number | null;
  reason: string | null;
  notes: string | null;
};

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };

  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

async function getLeads(): Promise<{ leads: Lead[]; error?: string }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return { leads: [], error: "Supabase todavía no está configurado en Vercel." };
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?select=*&order=created_at.desc&limit=200`,
    {
      headers: supabaseHeaders(secretKey),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return { leads: [], error: "No se han podido cargar las solicitudes." };
  }

  return { leads: (await response.json()) as Lead[] };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "Nueva",
    contacted: "Contactada",
    assigned: "Asignada",
    completed: "Completada",
    discarded: "Descartada",
  };

  return labels[status] || status;
}

export default async function AdminPage() {
  const { leads, error } = await getLeads();

  return (
    <>
      <section className="page-hero admin-hero">
        <div className="container">
          <span className="eyebrow">Panel interno</span>
          <h1>Solicitudes de certificados.</h1>
          <p>Vista privada de los leads recibidos desde la web de CertificadoEnCasa.</p>
        </div>
      </section>

      <section className="section admin-section">
        <div className="container">
          {error ? (
            <div className="legal-notice">{error}</div>
          ) : leads.length === 0 ? (
            <div className="admin-empty">Todavía no hay solicitudes.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Inmueble</th>
                    <th>Ubicación</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{formatDate(lead.created_at)}</td>
                      <td><span className={`admin-status status-${lead.status}`}>{statusLabel(lead.status)}</span></td>
                      <td><strong>{lead.name}</strong></td>
                      <td>
                        {lead.phone && <div><a href={`tel:${lead.phone}`}>{lead.phone}</a></div>}
                        {lead.email && <div><a href={`mailto:${lead.email}`}>{lead.email}</a></div>}
                      </td>
                      <td>
                        <strong>{lead.property_type}</strong>
                        {lead.surface_m2 && <div>{lead.surface_m2} m²</div>}
                        {lead.reason && <div>{lead.reason}</div>}
                      </td>
                      <td>{lead.postal_code} · {lead.municipality}</td>
                      <td className="admin-notes">{lead.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
