import Link from "next/link";
import StatusSelect from "../StatusSelect";
import styles from "../admin.module.css";

type TechnicianApplication = {
  id: string;
  created_at: string;
  status: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  qualification: string;
  professional_number: string | null;
  years_experience: number | null;
  work_zones: string;
  travel_radius_km: number | null;
  price_from_eur: number | null;
  notes: string | null;
};

const technicianStatuses = [
  { value: "new", label: "Nueva" },
  { value: "contacted", label: "Contactado" },
  { value: "verified", label: "Verificado" },
  { value: "rejected", label: "Descartado" },
];

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

async function getApplications(): Promise<{ applications: TechnicianApplication[]; error?: string }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return { applications: [], error: "Supabase todavía no está configurado en Vercel." };
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=*&order=created_at.desc&limit=200`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) {
    return { applications: [], error: "No se han podido cargar las altas de técnicos. Comprueba que la tabla exista en Supabase." };
  }

  return { applications: await response.json() as TechnicianApplication[] };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

export default async function AdminTecnicosPage() {
  const { applications, error } = await getApplications();

  return (
    <>
      <section className={`page-hero ${styles.adminHero}`}>
        <div className="container">
          <span className="eyebrow">Panel interno</span>
          <h1>Altas de técnicos.</h1>
          <p>Revisa las solicitudes de profesionales y marca cuándo los has contactado o verificado.</p>
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
          ) : applications.length === 0 ? (
            <div className={styles.empty}>Todavía no hay solicitudes de alta.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Técnico</th>
                    <th>Contacto</th>
                    <th>Perfil</th>
                    <th>Zona</th>
                    <th>Condiciones</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>{formatDate(application.created_at)}</td>
                      <td>
                        <StatusSelect
                          value={application.status}
                          endpoint={`/admin/api/technicians/${application.id}`}
                          options={technicianStatuses}
                        />
                      </td>
                      <td>
                        <strong>{application.name}</strong>
                        <div className={styles.muted}>{application.city}, {application.province}</div>
                      </td>
                      <td>
                        <div><a href={`tel:${application.phone}`}>{application.phone}</a></div>
                        <div><a href={`mailto:${application.email}`}>{application.email}</a></div>
                      </td>
                      <td>
                        <strong>{application.qualification}</strong>
                        {application.professional_number && <div className={styles.muted}>N.º {application.professional_number}</div>}
                        {application.years_experience !== null && <div className={styles.muted}>{application.years_experience} años exp.</div>}
                      </td>
                      <td>
                        <div>{application.work_zones}</div>
                        {application.travel_radius_km !== null && <div className={styles.muted}>Radio: {application.travel_radius_km} km</div>}
                      </td>
                      <td>{application.price_from_eur !== null ? `Desde ${application.price_from_eur} €` : "—"}</td>
                      <td className={styles.notes}>{application.notes || "—"}</td>
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
