import Link from "next/link";
import StatusSelect from "./StatusSelect";
import styles from "./admin.module.css";

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

const leadStatuses = [
  { value: "new", label: "Nueva" },
  { value: "contacted", label: "Contactada" },
  { value: "assigned", label: "Asignada" },
  { value: "completed", label: "Completada" },
  { value: "discarded", label: "Descartada" },
];

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

export default async function AdminPage() {
  const { leads, error } = await getLeads();

  return (
    <>
      <section className={`page-hero ${styles.adminHero}`}>
        <div className="container">
          <span className="eyebrow">Panel interno</span>
          <h1>Solicitudes de certificados.</h1>
          <p>Gestiona los clientes que llegan desde la web y cambia su estado a medida que avanzas con cada solicitud.</p>
          <nav className={styles.adminNav} aria-label="Secciones del panel">
            <Link href="/admin">Solicitudes de clientes</Link>
            <Link href="/admin/tecnicos">Altas de técnicos</Link>
          </nav>
        </div>
      </section>

      <section className={`section ${styles.adminSection}`}>
        <div className="container">
          {error ? (
            <div className="legal-notice">{error}</div>
          ) : leads.length === 0 ? (
            <div className={styles.empty}>Todavía no hay solicitudes.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
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
                      <td>
                        <StatusSelect
                          value={lead.status}
                          endpoint={`/admin/api/leads/${lead.id}`}
                          options={leadStatuses}
                        />
                      </td>
                      <td><strong>{lead.name}</strong></td>
                      <td>
                        {lead.phone && <div><a href={`tel:${lead.phone}`}>{lead.phone}</a></div>}
                        {lead.email && <div><a href={`mailto:${lead.email}`}>{lead.email}</a></div>}
                      </td>
                      <td>
                        <strong>{lead.property_type}</strong>
                        {lead.surface_m2 && <div className={styles.muted}>{lead.surface_m2} m²</div>}
                        {lead.reason && <div className={styles.muted}>{lead.reason}</div>}
                      </td>
                      <td>{lead.postal_code} · {lead.municipality}</td>
                      <td className={styles.notes}>{lead.notes || "—"}</td>
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
