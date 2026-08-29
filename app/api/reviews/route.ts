import { NextResponse } from "next/server";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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

function publicReviewerName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Cliente";
  if (parts.length === 1) return parts[0].slice(0, 40);
  return `${parts[0].slice(0, 30)} ${parts[1][0]?.toUpperCase() || ""}.`.trim();
}

type ReviewLead = {
  id: string;
  name: string;
  created_at: string;
  selected_technician_id: string | null;
  review_invited_at: string | null;
  review_submitted_at: string | null;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const token = cleanText(body.token, 36);
  const comment = cleanText(body.comment, 1200);
  const publishAccepted = body.publishAccepted === true;
  const honeypot = cleanText(body.company, 200);
  const rating = Number(body.rating);

  if (honeypot) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return NextResponse.json({ error: "El enlace de valoración no es válido." }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Selecciona una puntuación entre 1 y 5 estrellas." }, { status: 400 });
  }

  if (!publishAccepted) {
    return NextResponse.json({ error: "Debes aceptar la publicación de la valoración." }, { status: 400 });
  }

  const leadResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?select=id,name,created_at,selected_technician_id,review_invited_at,review_submitted_at&review_token=eq.${encodeURIComponent(token)}&review_invited_at=not.is.null&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!leadResponse.ok) {
    return NextResponse.json({ error: "No hemos podido comprobar la solicitud." }, { status: 500 });
  }

  const leads = await leadResponse.json() as ReviewLead[];
  const lead = leads[0];
  const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;

  if (
    !lead
    || !lead.selected_technician_id
    || !lead.review_invited_at
    || new Date(lead.created_at).getTime() > fiveDaysAgo
  ) {
    return NextResponse.json({ error: "Este enlace de valoración no está disponible." }, { status: 404 });
  }

  if (lead.review_submitted_at) {
    return NextResponse.json({ error: "Esta solicitud ya tiene una valoración enviada." }, { status: 409 });
  }

  const existingResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/reviews?select=id&lead_id=eq.${encodeURIComponent(lead.id)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (existingResponse.ok) {
    const existing = await existingResponse.json() as Array<{ id: string }>;
    if (existing[0]) {
      return NextResponse.json({ error: "Esta solicitud ya tiene una valoración enviada." }, { status: 409 });
    }
  }

  const reviewResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/reviews`, {
    method: "POST",
    headers: supabaseHeaders(secretKey),
    body: JSON.stringify({
      lead_id: lead.id,
      technician_id: lead.selected_technician_id,
      reviewer_name: publicReviewerName(lead.name),
      rating,
      comment: comment || null,
      verified: false,
      status: "published",
    }),
  });

  if (!reviewResponse.ok) {
    const detail = await reviewResponse.text();
    console.error("Review insert failed:", reviewResponse.status, detail);

    if (reviewResponse.status === 409) {
      return NextResponse.json({ error: "Esta solicitud ya tiene una valoración enviada." }, { status: 409 });
    }

    return NextResponse.json({ error: "No hemos podido guardar la valoración." }, { status: 500 });
  }

  const submittedAt = new Date().toISOString();
  const leadUpdate = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?id=eq.${encodeURIComponent(lead.id)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(secretKey, "return=minimal"),
      body: JSON.stringify({ review_submitted_at: submittedAt }),
    },
  );

  if (!leadUpdate.ok) {
    console.error("Review submitted timestamp update failed:", leadUpdate.status, await leadUpdate.text());
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
