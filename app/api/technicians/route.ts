import { NextResponse } from "next/server";
import { findPostalPlace, lookupSpanishPostalCode } from "@/lib/postal";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
  postalCode: string;
  city: string;
  province: string;
  qualification: string;
  professionalNumber: string;
  yearsExperience: number | null;
  workZones: string;
  travelRadiusKm: number | null;
  priceFromEur: number;
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
    `Base: CP ${data.postalCode} · ${data.city}, ${data.province}`,
    `Titulación: ${data.qualification}`,
    `N.º colegiado/registro: ${data.professionalNumber || "—"}`,
    `Experiencia: ${data.yearsExperience ?? "—"} años`,
    `Zonas: ${data.workZones}`,
    `Radio: ${data.travelRadiusKm ?? "—"} km`,
    `Precio desde: ${data.priceFromEur} €`,
    "Habilitación para emitir CEE: declarada por el solicitante (pendiente de verificar)",
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
          <tr><td style="padding:8px 0;color:#667085">Base</td><td style="padding:8px 0">${escapeHtml(`CP ${data.postalCode} · ${data.city}, ${data.province}`)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Titulación</td><td style="padding:8px 0">${escapeHtml(data.qualification)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">N.º profesional</td><td style="padding:8px 0">${escapeHtml(data.professionalNumber || "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Experiencia</td><td style="padding:8px 0">${data.yearsExperience ?? "—"} años</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Zonas</td><td style="padding:8px 0">${escapeHtml(data.workZones)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Radio</td><td style="padding:8px 0">${data.travelRadiusKm ?? "—"} km</td></tr>
          <tr><td style="padding:8px 0;color:#667085">Precio desde</td><td style="padding:8px 0"><strong>${data.priceFromEur} €</strong></td></tr>
          <tr><td style="padding:8px 0;color:#667085">Habilitación CEE</td><td style="padding:8px 0">Declarada · pendiente de verificar</td></tr>
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

async function sendTechnicianConfirmation(data: {
  id: string;
  name: string;
  email: string;
  city: string;
  province: string;
  workZones: string;
  priceFromEur: number;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  if (!resendApiKey || !from || !data.email) return;

  const text = [
    `Hola ${data.name},`,
    "",
    "Hemos recibido tu solicitud de alta en CertificadoEnCasa.",
    "",
    `Base profesional: ${data.city}, ${data.province}`,
    `Zonas indicadas: ${data.workZones}`,
    `Precio orientativo desde: ${data.priceFromEur} €`,
    "",
    "Ahora revisaremos tus datos profesionales. Antes de publicar el perfil podremos solicitarte la documentación necesaria para comprobar tu habilitación para emitir certificados energéticos.",
    "",
    "Te avisaremos por email cuando tu perfil quede verificado y publicado.",
    "",
    "Gracias por unirte a CertificadoEnCasa.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#132019">
      <div style="padding:22px 24px;background:#197a49;color:#fff;border-radius:14px 14px 0 0">
        <div style="font-size:13px;opacity:.85">CertificadoEnCasa</div>
        <h1 style="font-size:23px;margin:5px 0 0">Hemos recibido tu solicitud</h1>
      </div>
      <div style="padding:24px;border:1px solid #dfe6df;border-top:0;border-radius:0 0 14px 14px;background:#fff">
        <p>Hola <strong>${escapeHtml(data.name)}</strong>,</p>
        <p>Tu solicitud de alta como técnico ya está registrada. Ahora revisaremos tus datos profesionales antes de publicar el perfil.</p>
        <div style="margin:20px 0;padding:16px 18px;background:#f3f8f4;border-radius:12px">
          <div><strong>Base:</strong> ${escapeHtml(`${data.city}, ${data.province}`)}</div>
          <div style="margin-top:6px"><strong>Zonas:</strong> ${escapeHtml(data.workZones)}</div>
          <div style="margin-top:6px"><strong>Precio orientativo desde:</strong> ${data.priceFromEur} €</div>
        </div>
        <p>Durante la verificación podremos pedirte la documentación necesaria para comprobar tu habilitación para emitir CEE.</p>
        <p style="margin-bottom:0">Te enviaremos otro correo cuando tu perfil quede <strong>verificado y publicado</strong>.</p>
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
        "Idempotency-Key": `technician-confirmation-${data.id}`,
      },
      body: JSON.stringify({
        from,
        to: [data.email],
        subject: "Hemos recibido tu solicitud de alta · CertificadoEnCasa",
        text,
        html,
      }),
    });

    if (!response.ok) {
      console.error("Technician confirmation failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Technician confirmation failed:", error);
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
  const postalCode = cleanText(body.postalCode, 5).replace(/\D/g, "");
  const requestedCity = cleanText(body.city, 100);
  const qualification = cleanText(body.qualification, 180);
  const professionalNumber = cleanText(body.professionalNumber, 100);
  const workZones = cleanText(body.workZones, 500);
  const notes = cleanText(body.notes, 1800);
  const competenceDeclared = body.competenceDeclared === true;
  const privacyAccepted = body.privacyAccepted === true;

  const parsedYears = optionalNumber(body.yearsExperience);
  const yearsExperience = parsedYears !== null && parsedYears >= 0 && parsedYears <= 70
    ? Math.round(parsedYears)
    : null;

  const parsedRadius = optionalNumber(body.travelRadiusKm);
  const travelRadiusKm = parsedRadius !== null && parsedRadius >= 0 && parsedRadius <= 1000
    ? Math.round(parsedRadius)
    : null;

  const parsedPrice = optionalNumber(body.priceFromEur);
  const priceFromEur = parsedPrice !== null && parsedPrice > 0 && parsedPrice <= 10000
    ? Math.round(parsedPrice * 100) / 100
    : null;

  if (!name || !email || !phone || !postalCode || !requestedCity || !qualification || !workZones || priceFromEur === null) {
    return NextResponse.json({ error: "Completa los campos obligatorios, incluido un precio orientativo válido." }, { status: 400 });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Introduce un email válido." }, { status: 400 });
  }

  if (!competenceDeclared) {
    return NextResponse.json({ error: "Debes declarar que dispones de habilitación profesional para emitir CEE." }, { status: 400 });
  }

  if (!privacyAccepted) {
    return NextResponse.json({ error: "Debes aceptar la política de privacidad." }, { status: 400 });
  }

  const postalLookup = await lookupSpanishPostalCode(postalCode);
  if (!postalLookup) {
    return NextResponse.json({ error: "No hemos encontrado ese código postal en España." }, { status: 400 });
  }

  const postalPlace = findPostalPlace(postalLookup, requestedCity);
  if (!postalPlace) {
    const expected = postalLookup.places.map((place) => place.municipality).join(" / ");
    return NextResponse.json(
      { error: `El código postal ${postalCode} no corresponde con el municipio indicado. Municipio esperado: ${expected}.` },
      { status: 400 },
    );
  }

  const city = postalPlace.municipality;
  const province = postalPlace.province;

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
    await Promise.all([
      sendNotification({
        id,
        name,
        email,
        phone,
        postalCode,
        city,
        province,
        qualification,
        professionalNumber,
        yearsExperience,
        workZones,
        travelRadiusKm,
        priceFromEur,
        notes,
      }, request),
      sendTechnicianConfirmation({
        id,
        name,
        email,
        city,
        province,
        workZones,
        priceFromEur,
      }),
    ]);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
