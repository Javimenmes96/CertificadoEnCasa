import { NextResponse } from "next/server";

const allowedStatuses = new Set(["new", "contacted", "completed", "discarded"]);

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

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(secretKey),
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    console.error("Lead status update failed:", response.status, await response.text());
    return NextResponse.json({ error: "No se ha podido guardar el estado." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
