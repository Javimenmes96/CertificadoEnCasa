import { NextResponse } from "next/server";
import { isSettlementDate, madridDateString } from "@/lib/settlement-cycle";

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
  };

  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

type GeneratedSettlement = {
  settlement_id: string;
  technician_id: string;
  lead_count: number;
  total_commission_eur: number | string;
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const scheduledFor = madridDateString(now);

  if (!isSettlementDate(now)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "No es día de liquidación en Madrid.",
      madridDate: scheduledFor,
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/generate_settlements`,
    {
      method: "POST",
      headers: supabaseHeaders(secretKey),
      cache: "no-store",
      body: JSON.stringify({ p_scheduled_for: scheduledFor }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Settlement generation failed:", response.status, detail);
    return NextResponse.json(
      { error: "No se han podido generar las liquidaciones." },
      { status: 500 },
    );
  }

  const settlements = await response.json() as GeneratedSettlement[];
  const leadCount = settlements.reduce((sum, settlement) => sum + Number(settlement.lead_count || 0), 0);
  const totalCommissionEur = settlements.reduce(
    (sum, settlement) => sum + Number(settlement.total_commission_eur || 0),
    0,
  );

  return NextResponse.json({
    ok: true,
    skipped: false,
    scheduledFor,
    settlements: settlements.length,
    leadCount,
    totalCommissionEur: Math.round((totalCommissionEur + Number.EPSILON) * 100) / 100,
  });
}
