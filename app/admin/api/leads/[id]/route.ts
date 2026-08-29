import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const allowedStatuses = new Set(["new", "contacted", "completed", "discarded"]);

function supabaseHeaders(key: string, prefer = "return=minimal") {
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

type LeadForReview = {
  id: string;
  name: string;
  email: string | null;
  municipality: string;
  property_type: string;
  selected_technician_id: string | null;
  review_token: string | null;
  review_invited_at: string | null;
  review_submitted_at: string | null;
};

async function getLead(
  supabaseUrl: string,
  secretKey: string,
  id: string,
): Promise<LeadForReview | null> {
  const select = [
    "id",
    "name",
    "email",
    "municipality",
    "property_type",
    "selected_technician_id",
    "review_token",
    "review_invited_at",
    "review_submitted_at",
  ].join(",");

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?select=${select}&id=eq.${encodeURIComponent(id)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) return null;
  const rows = await response.json() as LeadForReview[];
  return rows[0] || null;
}

async function getTechnicianName(
  supabaseUrl: string,
  secretKey: string,
  id: string,
): Promise<string> {
  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=name&id=eq.${encodeURIComponent(id)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) return "tu técnico";
  const rows = await response.json() as Array<{ name: string }>;
  return rows[0]?.name || "tu técnico";
}

async function sendReviewInvite({
  lead,
  technicianName,
  reviewToken,
}: {
  lead: LeadForReview;
  technicianName: string;
  reviewToken: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!resendApiKey || !from || !siteUrl || !lead.email) return false;

  const reviewUrl = `${siteUrl.replace(/\/$/, "")}/valorar/${reviewToken}`;
  const subject = `¿Qué tal fue tu certificado con ${technicianName}?`;
  const text = [
    `Hola ${lead.name},`,
    "",
    `Tu solicitud de Certificado de Eficiencia Energética en ${lead.municipality} figura como completada.`,
    `Si quieres, puedes valorar a ${technicianName}.`,
    "",
    "Tu opinión aparecerá como valoración verificada porque está vinculada a un servicio completado a través de CertificadoEnCasa.",
    "",
    `Valorar al técnico: ${reviewUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#10203f">
      <div style="padding:22px 24px;background:#0c2f78;color:#fff;border-radius:14px 14px 0 0">
        <div style="font-size:13px;opacity:.8">CertificadoEnCasa</div>
        <h1 style="font-size:23px;margin:5px 0 0">Cuéntanos qué tal fue</h1>
      </div>
      <div style="padding:24px;border:1px solid #dfe5ee;border-top:0;border-radius:0 0 14px 14px;background:#fff">
        <p>Hola <strong>${escapeHtml(lead.name)}</strong>,</p>
        <p>Tu solicitud de CEE en <strong>${escapeHtml(lead.municipality)}</strong> figura como completada.</p>
        <p>Si quieres, puedes valorar a <strong>${escapeHtml(technicianName)}</strong>. La opinión se mostrará como <strong>valoración verificada</strong> porque está vinculada a un servicio completado a través de CertificadoEnCasa.</p>
        <div style="margin-top:24px">
          <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#1677ff;color:white;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700">Valorar al técnico</a>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "CertificadoEnCasa/1.0",
        "Idempotency-Key": `review-invite-${lead.id}`,
      },
      body: JSON.stringify({
        from,
        to: [lead.email],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      console.error("Review invite email failed:", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Review invite email failed:", error);
    return false;
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Identificador no válido." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const status = typeof body.status === "string" ? body.status : "";

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
  }

  const currentLead = await getLead(supabaseUrl, secretKey, id);
  if (!currentLead) {
    return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
  }

  const canInviteReview = status === "completed"
    && Boolean(currentLead.email)
    && Boolean(currentLead.selected_technician_id)
    && !currentLead.review_submitted_at;

  const reviewToken = canInviteReview
    ? currentLead.review_token || randomUUID()
    : currentLead.review_token;

  const patch: Record<string, unknown> = { status };
  if (canInviteReview && !currentLead.review_token && reviewToken) {
    patch.review_token = reviewToken;
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(secretKey, "return=representation"),
      body: JSON.stringify(patch),
    },
  );

  if (!response.ok) {
    console.error("Lead status update failed:", response.status, await response.text());
    return NextResponse.json({ error: "No se ha podido guardar el estado." }, { status: 500 });
  }

  const rows = await response.json() as LeadForReview[];
  const savedLead = rows[0] || currentLead;
  let reviewInviteSent = false;

  if (
    canInviteReview
    && reviewToken
    && !savedLead.review_invited_at
    && savedLead.selected_technician_id
  ) {
    const technicianName = await getTechnicianName(
      supabaseUrl,
      secretKey,
      savedLead.selected_technician_id,
    );

    reviewInviteSent = await sendReviewInvite({
      lead: savedLead,
      technicianName,
      reviewToken,
    });

    if (reviewInviteSent) {
      const invitedAt = new Date().toISOString();
      const invitedResponse = await fetch(
        `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: supabaseHeaders(secretKey),
          body: JSON.stringify({ review_invited_at: invitedAt }),
        },
      );

      if (!invitedResponse.ok) {
        console.error("Review invited timestamp update failed:", invitedResponse.status, await invitedResponse.text());
      }
    }
  }

  return NextResponse.json({ ok: true, reviewInviteSent });
}
