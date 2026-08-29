import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

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

type DueLead = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  municipality: string;
  property_type: string;
  status: string;
  selected_technician_id: string | null;
  review_token: string | null;
  review_invited_at: string | null;
  review_submitted_at: string | null;
};

async function getTechnicianName(
  supabaseUrl: string,
  secretKey: string,
  technicianId: string,
) {
  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=name&id=eq.${encodeURIComponent(technicianId)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) return null;
  const rows = await response.json() as Array<{ name: string }>;
  return rows[0]?.name || null;
}

async function sendReviewInvite({
  lead,
  technicianName,
  token,
}: {
  lead: DueLead;
  technicianName: string;
  token: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!resendApiKey || !from || !siteUrl || !lead.email) return false;

  const reviewUrl = `${siteUrl.replace(/\/$/, "")}/valorar/${token}`;
  const subject = `¿Qué tal tu experiencia con ${technicianName}?`;
  const text = [
    `Hola ${lead.name},`,
    "",
    `Hace unos días solicitaste un Certificado de Eficiencia Energética en ${lead.municipality} y elegiste a ${technicianName}.`,
    "Nos gustaría conocer tu experiencia.",
    "",
    `Valorar al técnico: ${reviewUrl}`,
    "",
    "La valoración es opcional y se publicará en el perfil del técnico si aceptas su publicación.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#10203f">
      <div style="padding:22px 24px;background:#0c2f78;color:#fff;border-radius:14px 14px 0 0">
        <div style="font-size:13px;opacity:.8">CertificadoEnCasa</div>
        <h1 style="font-size:23px;margin:5px 0 0">¿Qué tal fue tu experiencia?</h1>
      </div>
      <div style="padding:24px;border:1px solid #dfe5ee;border-top:0;border-radius:0 0 14px 14px;background:#fff">
        <p>Hola <strong>${escapeHtml(lead.name)}</strong>,</p>
        <p>Hace unos días solicitaste un CEE en <strong>${escapeHtml(lead.municipality)}</strong> y elegiste a <strong>${escapeHtml(technicianName)}</strong>.</p>
        <p>Si quieres, cuéntanos qué tal fue tu experiencia. Solo te llevará un momento.</p>
        <div style="margin-top:24px">
          <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#1677ff;color:white;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700">Valorar al técnico</a>
        </div>
        <p style="margin-top:22px;color:#667085;font-size:13px">La valoración es opcional y se publicará en el perfil del técnico si aceptas su publicación.</p>
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

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) {
    return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const select = [
    "id",
    "created_at",
    "name",
    "email",
    "municipality",
    "property_type",
    "status",
    "selected_technician_id",
    "review_token",
    "review_invited_at",
    "review_submitted_at",
  ].join(",");

  const leadsResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?select=${select}&created_at=lte.${encodeURIComponent(cutoff)}&email=not.is.null&selected_technician_id=not.is.null&review_invited_at=is.null&review_submitted_at=is.null&status=neq.discarded&order=created_at.asc&limit=100`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!leadsResponse.ok) {
    console.error("Review cron leads fetch failed:", leadsResponse.status, await leadsResponse.text());
    return NextResponse.json({ error: "No se han podido cargar las solicitudes." }, { status: 500 });
  }

  const leads = await leadsResponse.json() as DueLead[];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of leads) {
    if (!lead.email || !lead.selected_technician_id) {
      skipped += 1;
      continue;
    }

    const technicianName = await getTechnicianName(supabaseUrl, secretKey, lead.selected_technician_id);
    if (!technicianName) {
      skipped += 1;
      continue;
    }

    const token = lead.review_token || randomUUID();

    if (!lead.review_token) {
      const tokenResponse = await fetch(
        `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?id=eq.${encodeURIComponent(lead.id)}`,
        {
          method: "PATCH",
          headers: supabaseHeaders(secretKey, "return=minimal"),
          body: JSON.stringify({ review_token: token }),
        },
      );

      if (!tokenResponse.ok) {
        console.error("Review token update failed:", tokenResponse.status, await tokenResponse.text());
        failed += 1;
        continue;
      }
    }

    const emailSent = await sendReviewInvite({ lead, technicianName, token });
    if (!emailSent) {
      failed += 1;
      continue;
    }

    const invitedResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?id=eq.${encodeURIComponent(lead.id)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(secretKey, "return=minimal"),
        body: JSON.stringify({ review_invited_at: new Date().toISOString() }),
      },
    );

    if (!invitedResponse.ok) {
      console.error("Review invited timestamp update failed:", invitedResponse.status, await invitedResponse.text());
      failed += 1;
      continue;
    }

    sent += 1;
  }

  return NextResponse.json({ ok: true, checked: leads.length, sent, skipped, failed });
}
