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

type CancellationRole = "customer" | "technician";

type LeadRow = {
  id: string;
  billing_status: string;
};

async function findLeadByToken(
  supabaseUrl: string,
  secretKey: string,
  token: string,
): Promise<{ lead: LeadRow; role: CancellationRole } | null> {
  const baseUrl = supabaseUrl.replace(/\/$/, "");

  for (const candidate of [
    { column: "customer_cancel_token", role: "customer" as const },
    { column: "technician_cancel_token", role: "technician" as const },
  ]) {
    const response = await fetch(
      `${baseUrl}/rest/v1/leads?select=id,billing_status&${candidate.column}=eq.${encodeURIComponent(token)}&limit=1`,
      { headers: supabaseHeaders(secretKey, "return=minimal"), cache: "no-store" },
    );

    if (!response.ok) {
      console.error("Cancellation token lookup failed:", response.status, await response.text());
      continue;
    }

    const rows = await response.json() as LeadRow[];
    if (rows[0]) return { lead: rows[0], role: candidate.role };
  }

  return null;
}

function redirectToPage(request: Request, token: string, query: string) {
  return NextResponse.redirect(new URL(`/cancelar/${token}?${query}`, request.url), 303);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return redirectToPage(request, token, "error=invalid");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) {
    return redirectToPage(request, token, "error=server");
  }

  const found = await findLeadByToken(supabaseUrl, secretKey, token);
  if (!found) return redirectToPage(request, token, "error=invalid");

  if (found.lead.billing_status === "cancelled") {
    return redirectToPage(request, token, "cancelled=1");
  }

  if (found.lead.billing_status !== "pending") {
    return redirectToPage(request, token, "error=closed");
  }

  const formData = await request.formData();
  const reason = String(formData.get("reason") || "").trim().slice(0, 500);
  const details = String(formData.get("details") || "").trim().slice(0, 500);

  if (!reason) return redirectToPage(request, token, "error=reason");

  const cancellationReason = details ? `${reason}. ${details}` : reason;
  const baseUrl = supabaseUrl.replace(/\/$/, "");
  const response = await fetch(
    `${baseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(found.lead.id)}&billing_status=eq.pending`,
    {
      method: "PATCH",
      headers: supabaseHeaders(secretKey),
      body: JSON.stringify({
        billing_status: "cancelled",
        billing_cancelled_at: new Date().toISOString(),
        billing_cancelled_by: found.role,
        billing_cancel_reason: cancellationReason,
        status: "discarded",
      }),
    },
  );

  if (!response.ok) {
    console.error("Cancellation update failed:", response.status, await response.text());
    return redirectToPage(request, token, "error=server");
  }

  const rows = await response.json() as Array<{ id: string }>;
  if (!rows[0]) return redirectToPage(request, token, "error=closed");

  return redirectToPage(request, token, "cancelled=1");
}
