import { NextResponse } from "next/server";

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Técnico no válido." }, { status: 400 });
  }

  const select = [
    "id",
    "name",
    "city",
    "province",
    "qualification",
    "years_experience",
    "work_zones",
    "travel_radius_km",
    "price_from_eur",
    "availability_status",
  ].join(",");

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/technician_applications?select=${select}&id=eq.${encodeURIComponent(id)}&status=eq.verified&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!response.ok) {
    return NextResponse.json({ error: "No se ha podido cargar el técnico." }, { status: 500 });
  }

  const rows = await response.json() as Array<Record<string, unknown>>;
  const technician = rows[0];
  if (!technician) {
    return NextResponse.json({ error: "Este técnico no está disponible." }, { status: 404 });
  }

  if (technician.availability_status === "unavailable") {
    return NextResponse.json(
      { error: "Este técnico está temporalmente no disponible y no acepta nuevas solicitudes." },
      { status: 409 },
    );
  }

  return NextResponse.json({ technician });
}
