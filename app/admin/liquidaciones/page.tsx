import Link from "next/link";
import styles from "../admin.module.css";
import {
  formatSettlementDate,
  isEligibleBySettlementDate,
  nextSettlementDate,
} from "@/lib/settlement-cycle";

type Settlement = {
  id: string;
  created_at: string;
  technician_id: string;
  scheduled_for: string;
  status: string;
  lead_count: number;
  total_commission_eur: number | string;
};

type PendingLead = {
  id: string;
  created_at: string;
  name: string;
  selected_technician_id: string | null;
  billing_status: string;
  billing_price_eur: number | string | null;
  billing_plan_code: string | null;
  billing_commission_percent: number | string | null;
  billing_commission_eur: number | string | null;
  billing_eligible_at: string | null;
};

type TechnicianSummary = {
  id: string;
  name: string;
  city: string;
  province: string;
};

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

function formatEuro(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

function planLabel(value: string | null) {
  if (value === "premium") return "Premium";
  if (value === "plus") return "Plus";
  return "Básico";
}

function settlementStatus(value: string) {
  const labels: Record<string, string> = {
    draft: "Preparando",
    ready: "Lista para cobrar",
    charged: "Cobrada",
    paid: "Pagada",
    failed: "Cobro fallido",
    void: "Anulada",
  };
  return labels[value] || value;
}

async function getBillingData(): Promise<{
  settlements: Settlement[];
  pending: PendingLead[];
  technicians: Map<string, TechnicianSummary>;
  error?: string;
}> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return { settlements: [], pending: [], technicians: new Map(), error: "Supabase todavía no está configurado en Vercel." };
  }

  const baseUrl = supabaseUrl.replace(/\/$/, "");
  const [settlementsResponse, pendingResponse] = await Promise.all([
    fetch(
      `${baseUrl}/rest/v1/settlements?select=*&order=scheduled_for.desc,created_at.desc&limit=200`,
      { headers: supabaseHeaders(secretKey), cache: "no-store" },
    ),
    fetch(
      `${baseUrl}/rest/v1/leads?select=id,created_at,name,selected_technician_id,billing_status,billing_price_eur,billing_plan_code,billing_commission_percent,billing_commission_eur,billing_eligible_at&billing_status=eq.pending&selected_technician_id=not.is.null&billing_eligible_at=not.is.null&order=billing_eligible_at.asc&limit=500`,
      { headers: supabaseHeaders(secretKey), cache: "no-store" },
    ),
  ]);

  if (!settlementsResponse.ok || !pendingResponse.ok) {
    return { settlements: [], pending: [], technicians: new Map(), error: "No se han podido cargar los datos de liquidaciones." };
  }

  const settlements = await settlementsResponse.json() as Settlement[];
  const pending = await pendingResponse.json() as PendingLead[];
  const ids = [...new Set([
    ...settlements.map((row) => row.technician_id),
    ...pending.map((row) => row.selected_technician_id).filter((id): id is string => Boolean(id)),
  ])];
  const technicians = new Map<string, TechnicianSummary>();

  if (ids.length > 0) {
    const techResponse = await fetch(
      `${baseUrl}/rest/v1/technician_applications?select=id,name,city,province&id=in.(${ids.join(",")})`,
      { headers: supabaseHeaders(secretKey), cache: "no-store" },
    );

    if (techResponse.ok) {
      const rows = await techResponse.json() as TechnicianSummary[];
      rows.forEach((row) => technicians.set(row.id, row));
    }
  }

  return { settlements, pending, technicians };
}

export default async function AdminLiquidacionesPage() {
  const { settlements, pending, technicians, error } = await getBillingData();
  const nextDate = nextSettlementDate();
  const preview = pending.filter((lead) => isEligibleBySettlementDate(lead.billing_eligible_at, nextDate));
  const previewTotal = preview.reduce((sum, lead) => sum + Number(lead.billing_commission_eur || 0), 0);
  const previewTechnicians = new Set(preview.map((lead) => lead.selected_technician_id).filter(Boolean)).size;

  return (
    <>
      <section className={`page-hero ${styles.adminHero}`}>
        <div className="container">
          <span className="eyebrow">Panel interno</span>
          <h1>Liquidaciones.</h1>
          <p>Controla qué encargos entrarán en cada ciclo y cuánto corresponde cobrar a cada técnico.</p>
          <nav className={styles.adminNav} aria-label="Secciones del panel">
            <Link href="/admin">Solicitudes de clientes</Link>
            <Link href="/admin/tecnicos">Altas de técnicos</Link>
            <Link href="/admin/liquidaciones">Liquidaciones</Link>
          </nav>
        </div>
      </section>

      <section className={`section ${styles.adminSection}`}>
        <div className="container">
          {error ? (
            <div className="legal-notice">{error}</div>
          ) : (
            <>
              <div className={styles.billingIntro}>
                <div>
                  <span className="eyebrow">Próximo ciclo</span>
                  <h2>{formatSettlementDate(nextDate)}</h2>
                  <p>Solo se incluirán encargos pendientes que hayan cumplido al menos 5 días completos cuando se ejecute la liquidación.</p>
                </div>
                <div className={styles.billingStats}>
                  <div className={styles.billingStat}><strong>{preview.length}</strong><span>Encargos previstos</span></div>
                  <div className={styles.billingStat}><strong>{formatEuro(previewTotal)}</strong><span>Comisión prevista</span></div>
                  <div className={styles.billingStat}><strong>{previewTechnicians}</strong><span>Técnicos</span></div>
                </div>
              </div>

              <div className="legal-notice" style={{ marginTop: 18 }}>
                Esta pantalla calcula comisiones por encargos. Las cuotas mensuales de Premium y Plus se conectarán más adelante al sistema de suscripciones.
              </div>

              <h2 style={{ marginTop: 34 }}>Encargos previstos para la próxima liquidación</h2>
              {preview.length === 0 ? (
                <div className={styles.empty}>Ahora mismo no hay encargos que vayan a entrar en el próximo ciclo.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Técnico</th>
                        <th>Solicitud</th>
                        <th>Precio congelado</th>
                        <th>Plan</th>
                        <th>Comisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((lead) => {
                        const technician = lead.selected_technician_id ? technicians.get(lead.selected_technician_id) : null;
                        return (
                          <tr key={lead.id}>
                            <td><strong>{lead.name}</strong></td>
                            <td>
                              <strong>{technician?.name || "Perfil no disponible"}</strong>
                              {technician && <div className={styles.muted}>{technician.city}, {technician.province}</div>}
                            </td>
                            <td>{formatDateTime(lead.created_at)}</td>
                            <td>{formatEuro(lead.billing_price_eur)}</td>
                            <td>
                              <strong>{planLabel(lead.billing_plan_code)}</strong>
                              <div className={styles.muted}>{Number(lead.billing_commission_percent || 0)}%</div>
                            </td>
                            <td><strong>{formatEuro(lead.billing_commission_eur)}</strong></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <h2 style={{ marginTop: 40 }}>Historial de liquidaciones</h2>
              {settlements.length === 0 ? (
                <div className={styles.empty}>Todavía no se ha generado ninguna liquidación. La primera aparecerá automáticamente en un día 10, 20 o fin de mes.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Técnico</th>
                        <th>Estado</th>
                        <th>Encargos</th>
                        <th>Total comisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((settlement) => {
                        const technician = technicians.get(settlement.technician_id);
                        return (
                          <tr key={settlement.id}>
                            <td><strong>{formatSettlementDate(settlement.scheduled_for)}</strong></td>
                            <td>
                              <strong>{technician?.name || "Perfil no disponible"}</strong>
                              {technician && <div className={styles.muted}>{technician.city}, {technician.province}</div>}
                            </td>
                            <td>{settlementStatus(settlement.status)}</td>
                            <td>{settlement.lead_count}</td>
                            <td><strong>{formatEuro(settlement.total_commission_eur)}</strong></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
