import { NextResponse } from "next/server";

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

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

async function sendNotification(data: {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  qualification: string;
  professionalNumber: string;
  yearsExperience: number | null;
  workZones: string;
  travelRadiusKm: number | null;
  priceFromEur: number | null;
  notes: string;
}, request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  const to = process.env.LEAD_NOTIFICATION_EMAIL || "solicitudes@certificadoencasa.com";

  if (!resendApiKey || !from || !to) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/admin/tecnicos`;

  const text = [
    "Nueva solicitud de alta de técnico",
    "",
    `Nombre: ${data.name}`,
    `Email: ${data.email}`,
    `Teléfono: ${data.phone}`,
    `Base: ${data.city}, ${data.province}`,
    `Titulación: ${data.qualification}`,
    `N.º colegiado/registro: ${data.professionalNumber || "—"}`,
    `Experiencia: ${data.yearsExperience ?? "—"} años`,
    `Zonas: ${data.workZones}`,
    `Radio: ${data.travelRadiusKm ?? "—"} km`,
    `Precio desde: ${data.priceFromEur ?? "—"} €`,
    `Notas: ${data.notes || "—"}`,
    "",
    `Revisar altas: ${adminUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#10203f">
      <div style="padding:22px 24px;background:#0c2f78;color:#fff;border-radius:14px 14px 0 0">
        <div style="font-size:13px;opacity:.8">CertificadoEnCasa</div>
        <h1 style="font-size:23px;margin:5px 0 0">Nueva solicitud de alta de técnico</h1>
      </div>
      <div style="padding:24px;border:1px solid #dfe5ee;border-top:0;border-radius:0 0 14px 14px;background:#fff">
        <table style="border-collapse:collapse;width:100%;font-size:15px">
          <tr><td style="padding:8px 0;color:#667085;width:155px">Nombre</td><td style="padding:8px 0"><strong>${escapeHtml(data.name)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#667085">Contacto</td><td style="padding:8px 0">${escapeHtml(data.phone)} · ${escapeHtml(data.email)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Base</td><td style="padding:8px 0">${escapeHtml(`${data.city}, ${data.province}`)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Titulación</td><td style="padding:8px 0">${escapeHtml(data.qualification)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">N.º profesional</td><td style="padding:8px 0">${escapeHtml(data.professionalNumber || "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Experiencia</td><td style="padding:8px 0">${data.yearsExperience ?? "—"} años</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Zonas</td><td style="padding:8px 0">${escapeHtml(data.workZones)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Radio</td><td style="padding:8px 0">${data.travelRadiusKm ?? "—"} km</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Precio desde</td><td style="padding:8px 0">${data.priceFromEur ?? "—"} €</td></tr>
          <tr><td style="padding:8px 0;color:#667085;vertical-align:top">Notas</td><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(data.notes || "—")}</td></tr>
        </table>
        <div style="margin-top:24px">
          <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#1677ff;color:white;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700">Revisar técnico</a>
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
        "Idempotency-Key": `technician-${data.id}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Nuevo técnico · ${data.province} · ${data.name}`,
        text,
        html,
      }),
    });

    if (!response.ok) {
      console.error("Technician notification failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Technician notification failed:", error);
  }
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return NextResponse.json({ error: "El registro todavía no está conectado a la base de datos." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  if (cleanText(body.company, 200)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 200).toLowerCase();
  const phone = cleanText(body.phone, 30);
  const city = cleanText(body.city, 100);
  const province = cleanText(body.province, 100);
  const qualification = cleanText(body.qualification, 180);
  const professionalNumber = cleanText(body.professionalNumber, 100);
  const workZones = cleanText(body.workZones, 500);
  const notes = cleanText(body.notes, 1800);
  const privacyAccepted = body.privacyAccepted === true;

  const parsedYears = Number(body.yearsExperience);
  const yearsExperience = Number.isFinite(parsedYears) && parsedYears >= 0 ? Math.round(parsedYears) : null;
  const parsedRadius = Number(body.travelRadiusKm);
  const travelRadiusKm = Number.isFinite(parsedRadius) && parsedRadius >= 0 ? Math.round(parsedRadius) : null;
  const parsedPrice = Number(body.priceFromEur);
  const priceFromEur = Number.isFinite(parsedPrice) && parsedPrice >= 0 ? Math.round(parsedPrice * 100) / 100 : null;

  if (!name || !email || !phone || !city || !province || !qualification || !workZones) {
    return NextResponse.json({ error: "Completa los campos obligatorios." }, { status: 400 });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Introduce un email válido." }, { status: 400 });
  }

  if (!privacyAccepted) {
    return NextResponse.json({ error: "Debes aceptar la política de privacidad." }, { status: 400 });
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications`, {
    method: "POST",
    headers: supabaseHeaders(secretKey),
    body: JSON.stringify({
      status: "new",
      name,
      email,
      phone,
      city,
      province,
      qualification,
      professional_number: professionalNumber || null,
      years_experience: yearsExperience,
      work_zones: workZones,
      travel_radius_km: travelRadiusKm,
      price_from_eur: priceFromEur,
      notes: notes || null,
      privacy_accepted: true,
      source: "web",
    }),
  });

  if (!response.ok) {
    console.error("Technician insert failed:", response.status, await response.text());
    return NextResponse.json({ error: "No hemos podido guardar tu solicitud. Inténtalo de nuevo en unos minutos." }, { status: 500 });
  }

  const savedRows = await response.json() as Array<{ id: string }>;
  const id = savedRows[0]?.id;

  if (id) {
    await sendNotification({
      id,
      name,
      email,
      phone,
      city,
      province,
      qualification,
      professionalNumber,
      yearsExperience,
      workZones,
      travelRadiusKm,
      priceFromEur,
      notes,
    }, request);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
