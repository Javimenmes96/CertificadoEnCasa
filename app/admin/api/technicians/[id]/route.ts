import { NextResponse } from "next/server";

const allowedStatuses = new Set(["new", "contacted", "verified", "rejected"]);
const allowedAvailabilityStatuses = new Set(["available", "limited", "unavailable"]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

async function sendVerificationEmail({
  id,
  name,
  email,
  request,
}: {
  id: string;
  name: string;
  email: string;
  request: Request;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  if (!resendApiKey || !from || !email) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const profileUrl = `${siteUrl.replace(/\/$/, "")}/tecnicos/${id}`;

  const text = [
    `Hola ${name},`,
    "",
    "Tu perfil profesional en CertificadoEnCasa ha sido verificado y ya está publicado.",
    "",
    "Los clientes de las zonas que has indicado podrán encontrar tu perfil, consultar tus datos profesionales y elegirte para solicitar su certificado energético.",
    "",
    `Ver mi perfil: ${profileUrl}`,
    "",
    "Cuando un cliente te elija, recibirás por email los datos necesarios para contactar con él y gestionar el servicio.",
    "",
    "Gracias por formar parte de CertificadoEnCasa.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#132019">
      <div style="padding:22px 24px;background:#197a49;color:#fff;border-radius:14px 14px 0 0">
        <div style="font-size:13px;opacity:.85">CertificadoEnCasa</div>
        <h1 style="font-size:23px;margin:5px 0 0">Tu perfil ya está publicado</h1>
      </div>
      <div style="padding:24px;border:1px solid #dfe6df;border-top:0;border-radius:0 0 14px 14px;background:#fff">
        <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
        <p>Hemos verificado tu perfil profesional y ya está publicado en CertificadoEnCasa.</p>
        <p>Los clientes de las zonas que has indicado podrán encontrarte, consultar tu perfil y elegirte para solicitar su certificado energético.</p>
        <div style="margin-top:24px">
          <a href="${escapeHtml(profileUrl)}" style="display:inline-block;background:#197a49;color:white;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700">Ver mi perfil</a>
        </div>
        <p style="margin-top:22px;color:#657168">Cuando un cliente te elija, te enviaremos por email sus datos para que podáis acordar directamente la visita y las condiciones del servicio.</p>
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
        "Idempotency-Key": `technician-verified-${id}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Tu perfil ya está verificado y publicado · CertificadoEnCasa",
        text,
        html,
      }),
    });

    if (!response.ok) {
      console.error("Technician verification email failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Technician verification email failed:", error);
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
  const updates: Record<string, string> = {};

  if (typeof body.status === "string") {
    if (!allowedStatuses.has(body.status)) {
      return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (typeof body.availabilityStatus === "string") {
    if (!allowedAvailabilityStatuses.has(body.availabilityStatus)) {
      return NextResponse.json({ error: "Disponibilidad no válida." }, { status: 400 });
    }
    updates.availability_status = body.availabilityStatus;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No hay cambios válidos que guardar." }, { status: 400 });
  }

  let technicianToNotify: { status: string; name: string; email: string } | null = null;

  if (updates.status === "verified") {
    const currentResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=status,name,email&id=eq.${encodeURIComponent(id)}&limit=1`,
      { headers: supabaseHeaders(secretKey), cache: "no-store" },
    );

    if (!currentResponse.ok) {
      console.error("Technician verification lookup failed:", currentResponse.status, await currentResponse.text());
      return NextResponse.json({ error: "No se ha podido comprobar el estado actual del técnico." }, { status: 500 });
    }

    const rows = await currentResponse.json() as Array<{ status: string; name: string; email: string }>;
    technicianToNotify = rows[0] || null;

    if (!technicianToNotify) {
      return NextResponse.json({ error: "Técnico no encontrado." }, { status: 404 });
    }
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(secretKey),
      body: JSON.stringify(updates),
    },
  );

  if (!response.ok) {
    console.error("Technician update failed:", response.status, await response.text());
    return NextResponse.json({ error: "No se ha podido guardar el cambio." }, { status: 500 });
  }

  if (updates.status === "verified" && technicianToNotify?.status !== "verified") {
    await sendVerificationEmail({
      id,
      name: technicianToNotify.name,
      email: technicianToNotify.email,
      request,
    });
  }

  return NextResponse.json({ ok: true });
}
