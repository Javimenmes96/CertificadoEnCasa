import {
  createSettlementInvoice,
  createSettlementInvoiceItem,
  finalizeInvoice,
  getInvoice,
  payInvoice,
  StripeInvoice,
} from "@/lib/stripe-billing";

export type SettlementChargeResult = {
  settlementId: string;
  technicianId?: string;
  ok: boolean;
  alreadyPaid?: boolean;
  invoiceId?: string;
  commissionEur?: number;
  taxEur?: number;
  totalChargeEur?: number;
  error?: string;
};

type SettlementRow = {
  id: string;
  technician_id: string;
  scheduled_for: string;
  status: string;
  lead_count: number;
  total_commission_eur: number | string;
  stripe_invoice_id: string | null;
  payment_attempts: number | null;
};

type TechnicianPaymentRow = {
  id: string;
  name: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  stripe_setup_completed_at: string | null;
  billing_consent_at: string | null;
};

function supabaseHeaders(key: string, prefer = "return=representation") {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function centsFromEur(value: number | string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round((amount + Number.EPSILON) * 100);
}

async function patchSettlement(
  baseUrl: string,
  secretKey: string,
  settlementId: string,
  updates: Record<string, unknown>,
) {
  const response = await fetch(
    `${baseUrl}/rest/v1/settlements?id=eq.${encodeURIComponent(settlementId)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(secretKey, "return=minimal"),
      body: JSON.stringify(updates),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Settlement update failed:", response.status, detail);
    throw new Error("No se ha podido guardar el estado de la liquidación.");
  }
}

async function loadSettlement(
  baseUrl: string,
  secretKey: string,
  settlementId: string,
) {
  const response = await fetch(
    `${baseUrl}/rest/v1/settlements?select=id,technician_id,scheduled_for,status,lead_count,total_commission_eur,stripe_invoice_id,payment_attempts&id=eq.${encodeURIComponent(settlementId)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) throw new Error("No se ha podido cargar la liquidación.");
  const rows = await response.json() as SettlementRow[];
  return rows[0] || null;
}

async function loadTechnicianPayment(
  baseUrl: string,
  secretKey: string,
  technicianId: string,
) {
  const response = await fetch(
    `${baseUrl}/rest/v1/technician_applications?select=id,name,email,stripe_customer_id,stripe_payment_method_id,stripe_setup_completed_at,billing_consent_at&id=eq.${encodeURIComponent(technicianId)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) throw new Error("No se ha podido cargar el método de pago del técnico.");
  const rows = await response.json() as TechnicianPaymentRow[];
  return rows[0] || null;
}

function invoiceAmounts(invoice: StripeInvoice, commissionCents: number) {
  const totalCents = Number(invoice.total ?? invoice.amount_paid ?? invoice.amount_due ?? commissionCents);
  const safeTotal = Number.isFinite(totalCents) ? totalCents : commissionCents;
  const taxCents = Math.max(0, safeTotal - commissionCents);
  return {
    commissionEur: money(commissionCents / 100),
    taxEur: money(taxCents / 100),
    totalChargeEur: money(safeTotal / 100),
  };
}

export async function chargeSettlement(settlementId: string): Promise<SettlementChargeResult> {
  if (!/^[0-9a-f-]{36}$/i.test(settlementId)) {
    return { settlementId, ok: false, error: "Identificador de liquidación no válido." };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const taxRateId = process.env.STRIPE_TAX_RATE_ID;

  if (!supabaseUrl || !secretKey) {
    return { settlementId, ok: false, error: "Supabase no está configurado." };
  }
  if (!process.env.STRIPE_SECRET_KEY || !taxRateId) {
    return { settlementId, ok: false, error: "Stripe o el IVA no están configurados." };
  }

  const baseUrl = supabaseUrl.replace(/\/$/, "");
  let settlement: SettlementRow | null = null;
  let attemptNumber = 1;

  try {
    settlement = await loadSettlement(baseUrl, secretKey, settlementId);
    if (!settlement) {
      return { settlementId, ok: false, error: "Liquidación no encontrada." };
    }

    if (settlement.status === "paid") {
      return {
        settlementId,
        technicianId: settlement.technician_id,
        ok: true,
        alreadyPaid: true,
        invoiceId: settlement.stripe_invoice_id || undefined,
      };
    }

    if (!["ready", "failed", "charged"].includes(settlement.status)) {
      return {
        settlementId,
        technicianId: settlement.technician_id,
        ok: false,
        error: `La liquidación está en estado ${settlement.status} y no se puede cobrar.`,
      };
    }

    const commissionCents = centsFromEur(settlement.total_commission_eur);
    if (commissionCents <= 0 || settlement.lead_count <= 0) {
      throw new Error("La liquidación no contiene un importe cobrable.");
    }

    const technician = await loadTechnicianPayment(baseUrl, secretKey, settlement.technician_id);
    if (!technician) throw new Error("No se ha encontrado el técnico de la liquidación.");
    if (!technician.billing_consent_at) throw new Error("El técnico todavía no ha aceptado las condiciones de cobro.");
    if (!technician.stripe_setup_completed_at) throw new Error("El técnico todavía no ha completado la configuración de pago.");
    if (!technician.stripe_customer_id || !technician.stripe_payment_method_id) {
      throw new Error("El técnico no tiene un método de pago válido guardado en Stripe.");
    }

    attemptNumber = Number(settlement.payment_attempts || 0) + 1;
    const attemptAt = new Date().toISOString();

    await patchSettlement(baseUrl, secretKey, settlement.id, {
      payment_attempts: attemptNumber,
      last_payment_attempt_at: attemptAt,
      failure_message: null,
    });

    let invoice: StripeInvoice;
    if (settlement.stripe_invoice_id) {
      invoice = await getInvoice(settlement.stripe_invoice_id);
    } else {
      invoice = await createSettlementInvoice({
        settlementId: settlement.id,
        technicianId: settlement.technician_id,
        customerId: technician.stripe_customer_id,
        paymentMethodId: technician.stripe_payment_method_id,
        scheduledFor: settlement.scheduled_for,
      });

      await patchSettlement(baseUrl, secretKey, settlement.id, {
        stripe_invoice_id: invoice.id,
      });
    }

    if (invoice.status === "draft") {
      await createSettlementInvoiceItem({
        settlementId: settlement.id,
        technicianId: settlement.technician_id,
        invoiceId: invoice.id,
        customerId: technician.stripe_customer_id,
        commissionCents,
        taxRateId,
        leadCount: settlement.lead_count,
        scheduledFor: settlement.scheduled_for,
      });
      invoice = await finalizeInvoice(invoice.id, settlement.id);
    }

    if (invoice.status === "open") {
      invoice = await payInvoice(
        invoice.id,
        settlement.id,
        technician.stripe_payment_method_id,
        attemptNumber,
      );
    }

    if (invoice.status !== "paid") {
      throw new Error(`Stripe ha dejado la factura en estado ${invoice.status || "desconocido"}.`);
    }

    const amounts = invoiceAmounts(invoice, commissionCents);
    const paidAtUnix = invoice.status_transitions?.paid_at;
    const paidAt = paidAtUnix ? new Date(paidAtUnix * 1000).toISOString() : new Date().toISOString();

    await patchSettlement(baseUrl, secretKey, settlement.id, {
      status: "paid",
      tax_rate_percent: 21,
      tax_eur: amounts.taxEur,
      total_charge_eur: amounts.totalChargeEur,
      stripe_invoice_id: invoice.id,
      stripe_invoice_url: invoice.hosted_invoice_url || null,
      stripe_invoice_pdf: invoice.invoice_pdf || null,
      paid_at: paidAt,
      failure_message: null,
    });

    return {
      settlementId: settlement.id,
      technicianId: settlement.technician_id,
      ok: true,
      invoiceId: invoice.id,
      ...amounts,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se ha podido cobrar la liquidación.";
    console.error("Settlement charge failed:", settlementId, error);

    if (settlement) {
      try {
        await patchSettlement(baseUrl, secretKey, settlement.id, {
          status: "failed",
          payment_attempts: Math.max(attemptNumber, Number(settlement.payment_attempts || 0) + 1),
          last_payment_attempt_at: new Date().toISOString(),
          failure_message: message.slice(0, 500),
        });
      } catch (patchError) {
        console.error("Could not persist settlement failure:", patchError);
      }
    }

    return {
      settlementId,
      technicianId: settlement?.technician_id,
      ok: false,
      invoiceId: settlement?.stripe_invoice_id || undefined,
      error: message,
    };
  }
}

export async function chargeOutstandingSettlementsThrough(scheduledFor: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) throw new Error("Supabase no está configurado.");

  const baseUrl = supabaseUrl.replace(/\/$/, "");
  const response = await fetch(
    `${baseUrl}/rest/v1/settlements?select=id,scheduled_for,status&status=in.(ready,failed,charged)&scheduled_for=lte.${encodeURIComponent(scheduledFor)}&order=scheduled_for.asc,created_at.asc&limit=200`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) {
    console.error("Outstanding settlements lookup failed:", response.status, await response.text());
    throw new Error("No se han podido cargar las liquidaciones pendientes de cobro.");
  }

  const rows = await response.json() as Array<{ id: string; scheduled_for: string; status: string }>;
  const results: SettlementChargeResult[] = [];

  for (const row of rows) {
    results.push(await chargeSettlement(row.id));
  }

  return {
    checked: rows.length,
    paid: results.filter((row) => row.ok && !row.alreadyPaid).length,
    alreadyPaid: results.filter((row) => row.alreadyPaid).length,
    failed: results.filter((row) => !row.ok).length,
    totalChargeEur: money(results.reduce((sum, row) => sum + Number(row.totalChargeEur || 0), 0)),
    results,
  };
}
