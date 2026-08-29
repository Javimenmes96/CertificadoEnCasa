import { randomUUID } from "crypto";
import { POST as createLead } from "@/app/api/leads/route";

function supabaseHeaders(key: string, prefer = "return=representation") {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: prefer,
  };

  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type CreatedLeadResponse = {
  leadId?: string;
  technicianSelected?: boolean;
};

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  municipality: string;
  property_type: string;
  selected_technician_id: string | null;
  billing_status: string;
};

type TechnicianRow = {
  name: string;
  email: string;
};

async function sendEmail({
  to,
  subject,
  text,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  if (!resendApiKey || !from || !to) return;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "CertificadoEnCasa/1.0",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
    });

    if (!response.ok) {
      console.error("Cancellation management email failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Cancellation management email failed:", error);
  }
}

export async function POST(request: Request) {
  const response = await createLead(request);
  if (!response.ok) return response;

  const result = await response.clone().json().catch(() => ({})) as CreatedLeadResponse;
  if (!result.leadId || !result.technicianSelected) return response;

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) return response;

  const customerToken = randomUUID();
  const technicianToken = randomUUID();
  const baseUrl = supabaseUrl.replace(/\/$/, "");

  const tokenResponse = await fetch(
    `${baseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(result.leadId)}&billing_status=eq.pending`,
    {
      method: "PATCH",
      headers: supabaseHeaders(secretKey),
      body: JSON.stringify({
        customer_cancel_token: customerToken,
        technician_cancel_token: technicianToken,
      }),
    },
  );

  if (!tokenResponse.ok) {
    console.error("Cancellation tokens update failed:", tokenResponse.status, await tokenResponse.text());
    return response;
  }

  const updatedRows = await tokenResponse.json() as Array<{ id: string }>;
  if (!updatedRows[0]) return response;

  const leadResponse = await fetch(
    `${baseUrl}/rest/v1/leads?select=id,name,email,municipality,property_type,selected_technician_id,billing_status&id=eq.${encodeURIComponent(result.leadId)}&limit=1`,
    { headers: supabaseHeaders(secretKey, "return=minimal"), cache: "no-store" },
  );

  if (!leadResponse.ok) {
    console.error("Cancellation lead lookup failed:", leadResponse.status, await leadResponse.text());
    return response;
  }

  const leads = await leadResponse.json() as LeadRow[];
  const lead = leads[0];
  if (!lead?.selected_technician_id || lead.billing_status !== "pending") return response;

  const technicianResponse = await fetch(
    `${baseUrl}/rest/v1/technician_applications?select=name,email&id=eq.${encodeURIComponent(lead.selected_technician_id)}&limit=1`,
    { headers: supabaseHeaders(secretKey, "return=minimal"), cache: "no-store" },
  );

  if (!technicianResponse.ok) {
    console.error("Cancellation technician lookup failed:", technicianResponse.status, await technicianResponse.text());
    return response;
  }

  const technicians = await technicianResponse.json() as TechnicianRow[];
  const technician = technicians[0];
  if (!technician) return response;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const customerCancelUrl = `${siteUrl}/cancelar/${customerToken}`;
  const technicianCancelUrl = `${siteUrl}/cancelar/${technicianToken}`;
  const location = lead.municipality;

  const customerEmail = lead.email
    ? sendEmail({
        to: lead.email,
        subject: `Tu solicitud a ${technician.name} · CertificadoEnCasa`,
        idempotencyKey: `lead-${lead.id}-customer-cancellation`,
        text: [
          `Hola ${lead.name},`,
          "",
          `Hemos enviado tu solicitud de ${lead.property_type} a ${technician.name}.`,
          `Ubicación: ${location}`,
          "",
          "Si finalmente el encargo no se va a realizar con este técnico, puedes cancelarlo desde este enlace:",
          customerCancelUrl,
          "",
          "Mientras el encargo siga pendiente, la cancelación evitará que se contabilice al profesional.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#10203f">
            <div style="padding:22px 24px;background:#0c2f78;color:#fff;border-radius:14px 14px 0 0">
              <div style="font-size:13px;opacity:.8">CertificadoEnCasa</div>
              <h1 style="font-size:23px;margin:5px 0 0">Tu solicitud ha sido enviada</h1>
            </div>
            <div style="padding:24px;border:1px solid #dfe5ee;border-top:0;border-radius:0 0 14px 14px;background:#fff">
              <p>Hola <strong>${escapeHtml(lead.name)}</strong>, hemos enviado tu solicitud a <strong>${escapeHtml(technician.name)}</strong>.</p>
              <p>Si finalmente el encargo no se va a realizar con este técnico, puedes cancelarlo mientras siga pendiente.</p>
              <div style="margin-top:24px">
                <a href="${escapeHtml(customerCancelUrl)}" style="display:inline-block;background:#fff;color:#0c2f78;text-decoration:none;padding:12px 18px;border:1px solid #0c2f78;border-radius:9px;font-weight:700">Cancelar encargo</a>
              </div>
              <p style="margin-top:22px;color:#667085;font-size:13px">La cancelación queda registrada junto con el motivo indicado.</p>
            </div>
          </div>
        `,
      })
    : Promise.resolve();

  const technicianEmail = technician.email
    ? sendEmail({
        to: technician.email,
        subject: `Gestión del encargo · ${lead.name} · CertificadoEnCasa`,
        idempotencyKey: `lead-${lead.id}-technician-cancellation`,
        text: [
          `Hola ${technician.name},`,
          "",
          `Tienes un nuevo encargo de ${lead.name} en ${location}.`,
          "",
          "Si finalmente este encargo no se realiza, debes cancelarlo antes de que entre en una liquidación:",
          technicianCancelUrl,
          "",
          "Te pediremos el motivo de la cancelación para que quede registrado.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#10203f">
            <div style="padding:22px 24px;background:#0c2f78;color:#fff;border-radius:14px 14px 0 0">
              <div style="font-size:13px;opacity:.8">CertificadoEnCasa</div>
              <h1 style="font-size:23px;margin:5px 0 0">Gestiona este encargo</h1>
            </div>
            <div style="padding:24px;border:1px solid #dfe5ee;border-top:0;border-radius:0 0 14px 14px;background:#fff">
              <p>Hola <strong>${escapeHtml(technician.name)}</strong>.</p>
              <p>Si el encargo de <strong>${escapeHtml(lead.name)}</strong> finalmente no se realiza, cancélalo antes de que entre en una liquidación para que no se contabilice la comisión.</p>
              <div style="margin-top:24px">
                <a href="${escapeHtml(technicianCancelUrl)}" style="display:inline-block;background:#fff;color:#0c2f78;text-decoration:none;padding:12px 18px;border:1px solid #0c2f78;border-radius:9px;font-weight:700">Cancelar encargo</a>
              </div>
              <p style="margin-top:22px;color:#667085;font-size:13px">La cancelación queda registrada junto con el motivo indicado.</p>
            </div>
          </div>
        `,
      })
    : Promise.resolve();

  await Promise.all([customerEmail, technicianEmail]);
  return response;
}
