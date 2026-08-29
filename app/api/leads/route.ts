import { NextResponse } from "next/server";
import { findPostalPlace, lookupSpanishPostalCode } from "@/lib/postal";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

type SelectedTechnician = {
  id: string;
  name: string;
  email: string;
  city: string;
  province: string;
  priceFromEur: number | null;
};

type LeadNotification = {
  id: string;
  postalCode: string;
  municipality: string;
  propertyType: string;
  surfaceM2: number | null;
  reason: string;
  notes: string;
  name: string;
  phone: string;
  email: string;
  technician: SelectedTechnician | null;
};

async function getVerifiedTechnician(
  supabaseUrl: string,
  secretKey: string,
  id: string,
): Promise<SelectedTechnician | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=id,name,email,city,province,price_from_eur&id=eq.${encodeURIComponent(id)}&status=eq.verified&limit=1`,
    {
      headers: supabaseHeaders(secretKey, "return=minimal"),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error("Selected technician lookup failed:", response.status, await response.text());
    return null;
  }

  const rows = await response.json() as Array<{
    id: string;
    name: string;
    email: string;
    city: string;
    province: string;
    price_from_eur: number | null;
  }>;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    city: row.city,
    province: row.province,
    priceFromEur: row.price_from_eur,
  };
}

async function sendLeadNotification(lead: LeadNotification, request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  const to = process.env.LEAD_NOTIFICATION_EMAIL || "solicitudes@certificadoencasa.com";

  if (!resendApiKey || !from || !to) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/admin`;

  const location = `${lead.postalCode} · ${lead.municipality}`;
  const property = `${lead.propertyType}${lead.surfaceM2 ? ` · ${lead.surfaceM2} m²` : ""}`;
  const chosenTechnician = lead.technician
    ? `${lead.technician.name} · ${lead.technician.city}, ${lead.technician.province}`
    : "Sin técnico elegido todavía";

  const text = [
    "Nueva solicitud de Certificado de Eficiencia Energética",
    "",
    `Cliente: ${lead.name}`,
    `Teléfono: ${lead.phone || "—"}`,
    `Email: ${lead.email || "—"}`,
    `Ubicación: ${location}`,
    `Inmueble: ${property}`,
    `Motivo: ${lead.reason || "—"}`,
    `Técnico elegido: ${chosenTechnician}`,
    `Observaciones: ${lead.notes || "—"}`,
    "",
    `Ver solicitudes: ${adminUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#10203f">
      <div style="padding:22px 24px;background:#0c2f78;color:#fff;border-radius:14px 14px 0 0">
        <div style="font-size:13px;opacity:.8">CertificadoEnCasa</div>
        <h1 style="font-size:23px;margin:5px 0 0">Nueva solicitud de CEE</h1>
      </div>
      <div style="padding:24px;border:1px solid #dfe5ee;border-top:0;border-radius:0 0 14px 14px;background:#fff">
        <table style="border-collapse:collapse;width:100%;font-size:15px">
          <tr><td style="padding:8px 0;color:#667085;width:145px">Cliente</td><td style="padding:8px 0"><strong>${escapeHtml(lead.name)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#667085">Teléfono</td><td style="padding:8px 0">${escapeHtml(lead.phone || "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Email</td><td style="padding:8px 0">${escapeHtml(lead.email || "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Ubicación</td><td style="padding:8px 0">${escapeHtml(location)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Inmueble</td><td style="padding:8px 0">${escapeHtml(property)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Motivo</td><td style="padding:8px 0">${escapeHtml(lead.reason || "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Técnico elegido</td><td style="padding:8px 0"><strong>${escapeHtml(chosenTechnician)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#667085;vertical-align:top">Observaciones</td><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(lead.notes || "—")}</td></tr>
        </table>
        <div style="margin-top:24px">
          <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#1677ff;color:white;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700">Abrir panel de solicitudes</a>
        </div>
      </div>
    </div>
  `;

  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "CertificadoEnCasa/1.0",
        "Idempotency-Key": `lead-${lead.id}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Nueva solicitud CEE · ${lead.municipality} · ${lead.propertyType}`,
        text,
        html,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Lead notification email failed:", emailResponse.status, await emailResponse.text());
    }
  } catch (error) {
    console.error("Lead notification email failed:", error);
  }
}

async function sendTechnicianChoiceNotification(lead: LeadNotification) {
  if (!lead.technician) return;

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  if (!resendApiKey || !from || !lead.technician.email) return;

  const location = `${lead.postalCode} · ${lead.municipality}`;
  const property = `${lead.propertyType}${lead.surfaceM2 ? ` · ${lead.surfaceM2} m²` : ""}`;

  const text = [
    `Hola ${lead.technician.name},`,
    "",
    "Un cliente de CertificadoEnCasa te ha elegido para solicitar su Certificado de Eficiencia Energética.",
    "",
    `Cliente: ${lead.name}`,
    `Teléfono: ${lead.phone || "—"}`,
    `Email: ${lead.email || "—"}`,
    `Ubicación: ${location}`,
    `Inmueble: ${property}`,
    `Motivo: ${lead.reason || "—"}`,
    `Observaciones: ${lead.notes || "—"}`,
    "",
    "Contacta con el cliente para confirmar disponibilidad, precio final y condiciones del servicio.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#10203f">
      <div style="padding:22px 24px;background:#0c2f78;color:#fff;border-radius:14px 14px 0 0">
        <div style="font-size:13px;opacity:.8">CertificadoEnCasa</div>
        <h1 style="font-size:23px;margin:5px 0 0">Un cliente te ha elegido</h1>
      </div>
      <div style="padding:24px;border:1px solid #dfe5ee;border-top:0;border-radius:0 0 14px 14px;background:#fff">
        <p>Hola <strong>${escapeHtml(lead.technician.name)}</strong>, un cliente te ha elegido para solicitar su CEE.</p>
        <table style="border-collapse:collapse;width:100%;font-size:15px">
          <tr><td style="padding:8px 0;color:#667085;width:145px">Cliente</td><td style="padding:8px 0"><strong>${escapeHtml(lead.name)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#667085">Teléfono</td><td style="padding:8px 0">${escapeHtml(lead.phone || "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Email</td><td style="padding:8px 0">${escapeHtml(lead.email || "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Ubicación</td><td style="padding:8px 0">${escapeHtml(location)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Inmueble</td><td style="padding:8px 0">${escapeHtml(property)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Motivo</td><td style="padding:8px 0">${escapeHtml(lead.reason || "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#667085;vertical-align:top">Observaciones</td><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(lead.notes || "—")}</td></tr>
        </table>
        <p style="margin-top:22px">Contacta con el cliente para confirmar disponibilidad, precio final y condiciones del servicio.</p>
      </div>
    </div>
  `;

  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "CertificadoEnCasa/1.0",
        "Idempotency-Key": `lead-${lead.id}-technician`,
      },
      body: JSON.stringify({
        from,
        to: [lead.technician.email],
        subject: `Un cliente te ha elegido · ${lead.municipality}`,
        text,
        html,
        ...(lead.email ? { reply_to: lead.email } : {}),
      }),
    });

    if (!emailResponse.ok) {
      console.error("Technician choice email failed:", emailResponse.status, await emailResponse.text());
    }
  } catch (error) {
    console.error("Technician choice email failed:", error);
  }
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return NextResponse.json(
      { error: "El formulario todavía no está conectado a la base de datos." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  if (cleanText(body.company, 200)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const postalCode = cleanText(body.postalCode, 5);
  let municipality = cleanText(body.municipality, 100);
  const propertyType = cleanText(body.propertyType, 80);
  const reason = cleanText(body.reason, 100);
  const notes = cleanText(body.notes, 1500);
  const name = cleanText(body.name, 120);
  const phone = cleanText(body.phone, 30);
  const email = cleanText(body.email, 200).toLowerCase();
  const selectedTechnicianId = cleanText(body.selectedTechnicianId, 36);
  const privacyAccepted = body.privacyAccepted === true;

  const parsedSurface = Number(body.surfaceM2);
  const surfaceM2 = Number.isFinite(parsedSurface) && parsedSurface > 0 ? Math.round(parsedSurface) : null;

  if (!/^\d{5}$/.test(postalCode)) {
    return NextResponse.json({ error: "Introduce un código postal válido de 5 cifras." }, { status: 400 });
  }

  if (!municipality || !propertyType || !name) {
    return NextResponse.json({ error: "Completa los campos obligatorios." }, { status: 400 });
  }

  const postalLookup = await lookupSpanishPostalCode(postalCode);
  if (!postalLookup) {
    return NextResponse.json({ error: "No hemos encontrado ese código postal en España." }, { status: 400 });
  }

  const postalPlace = findPostalPlace(postalLookup, municipality);
  if (!postalPlace) {
    const expected = postalLookup.places.map((place) => place.municipality).join(" / ");
    return NextResponse.json(
      { error: `El código postal ${postalCode} no corresponde con “${municipality}”. Municipio esperado: ${expected}.` },
      { status: 400 },
    );
  }
  municipality = postalPlace.municipality;

  if (!phone && !email) {
    return NextResponse.json({ error: "Necesitamos al menos un teléfono o un email de contacto." }, { status: 400 });
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Introduce un email válido." }, { status: 400 });
  }

  if (!privacyAccepted) {
    return NextResponse.json({ error: "Debes aceptar la política de privacidad." }, { status: 400 });
  }

  let technician: SelectedTechnician | null = null;
  if (selectedTechnicianId) {
    technician = await getVerifiedTechnician(supabaseUrl, secretKey, selectedTechnicianId);
    if (!technician) {
      return NextResponse.json(
        { error: "El técnico que habías elegido ya no está disponible. Elige otro profesional." },
        { status: 409 },
      );
    }
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads`, {
    method: "POST",
    headers: supabaseHeaders(secretKey),
    body: JSON.stringify({
      postal_code: postalCode,
      municipality,
      property_type: propertyType,
      surface_m2: surfaceM2,
      reason: reason || null,
      notes: notes || null,
      name,
      phone: phone || null,
      email: email || null,
      privacy_accepted: true,
      source: "web",
      status: "new",
      selected_technician_id: technician?.id || null,
      technician_selected_at: technician ? new Date().toISOString() : null,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase lead insert failed:", response.status, detail);
    return NextResponse.json(
      { error: "No hemos podido guardar la solicitud. Inténtalo de nuevo en unos minutos." },
      { status: 500 },
    );
  }

  const savedRows = (await response.json()) as Array<{ id: string }>;
  const leadId = savedRows[0]?.id;

  if (leadId) {
    const lead: LeadNotification = {
      id: leadId,
      postalCode,
      municipality,
      propertyType,
      surfaceM2,
      reason,
      notes,
      name,
      phone,
      email,
      technician,
    };

    await Promise.all([
      sendLeadNotification(lead, request),
      sendTechnicianChoiceNotification(lead),
    ]);
  }

  return NextResponse.json({ ok: true, leadId, technicianSelected: Boolean(technician) }, { status: 201 });
}
