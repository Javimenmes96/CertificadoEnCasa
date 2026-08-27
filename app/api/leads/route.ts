import { NextResponse } from "next/server";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
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
  const municipality = cleanText(body.municipality, 100);
  const propertyType = cleanText(body.propertyType, 80);
  const reason = cleanText(body.reason, 100);
  const notes = cleanText(body.notes, 1500);
  const name = cleanText(body.name, 120);
  const phone = cleanText(body.phone, 30);
  const email = cleanText(body.email, 200).toLowerCase();
  const privacyAccepted = body.privacyAccepted === true;

  const parsedSurface = Number(body.surfaceM2);
  const surfaceM2 = Number.isFinite(parsedSurface) && parsedSurface > 0 ? Math.round(parsedSurface) : null;

  if (!/^\d{5}$/.test(postalCode)) {
    return NextResponse.json({ error: "Introduce un código postal válido de 5 cifras." }, { status: 400 });
  }

  if (!municipality || !propertyType || !name) {
    return NextResponse.json({ error: "Completa los campos obligatorios." }, { status: 400 });
  }

  if (!phone && !email) {
    return NextResponse.json({ error: "Necesitamos al menos un teléfono o un email de contacto." }, { status: 400 });
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Introduce un email válido." }, { status: 400 });
  }

  if (!privacyAccepted) {
    return NextResponse.json({ error: "Debes aceptar la política de privacidad." }, { status: 400 });
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
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

  return NextResponse.json({ ok: true }, { status: 201 });
}
