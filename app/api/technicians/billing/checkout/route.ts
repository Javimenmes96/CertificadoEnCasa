import { NextResponse } from "next/server";
import {
  BillingPlanCode,
  createStripeCustomer,
  createTechnicianCheckoutSession,
} from "@/lib/stripe-billing";

const allowedPlans = new Set<BillingPlanCode>(["basic", "premium", "plus"]);
const BILLING_TERMS_VERSION = "2026-08-29-v1";

function supabaseHeaders(key: string, prefer = "return=representation") {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

type TechnicianBillingRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  billing_plan_code: BillingPlanCode;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_setup_completed_at: string | null;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) {
    return NextResponse.json({ error: "La configuración de pagos no está disponible." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const planCode = typeof body.planCode === "string" ? body.planCode.trim() as BillingPlanCode : null;
  const consent = body.consent === true;

  if (!/^[0-9a-f-]{36}$/i.test(token) || !planCode || !allowedPlans.has(planCode)) {
    return NextResponse.json({ error: "Enlace o plan no válido." }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Debes aceptar las condiciones de cobro antes de continuar." }, { status: 400 });
  }

  const baseUrl = supabaseUrl.replace(/\/$/, "");
  const lookup = await fetch(
    `${baseUrl}/rest/v1/technician_applications?select=id,name,email,status,billing_plan_code,stripe_customer_id,stripe_subscription_id,stripe_setup_completed_at&stripe_setup_token=eq.${encodeURIComponent(token)}&limit=1`,
    { headers: supabaseHeaders(secretKey), cache: "no-store" },
  );

  if (!lookup.ok) {
    console.error("Billing technician lookup failed:", lookup.status, await lookup.text());
    return NextResponse.json({ error: "No hemos podido comprobar el enlace de configuración." }, { status: 500 });
  }

  const rows = await lookup.json() as TechnicianBillingRow[];
  const technician = rows[0];
  if (!technician) {
    return NextResponse.json({ error: "Este enlace de configuración no es válido." }, { status: 404 });
  }
  if (technician.status === "rejected") {
    return NextResponse.json({ error: "Este perfil no puede configurar pagos." }, { status: 403 });
  }
  if (technician.stripe_setup_completed_at) {
    return NextResponse.json({ error: "El método de pago de este perfil ya está configurado." }, { status: 409 });
  }
  if (technician.stripe_subscription_id) {
    return NextResponse.json({ error: "Este perfil ya tiene una suscripción asociada." }, { status: 409 });
  }

  try {
    let customerId = technician.stripe_customer_id;
    if (!customerId) {
      const customer = await createStripeCustomer({
        name: technician.name,
        email: technician.email,
        technicianId: technician.id,
      });
      customerId = customer.id;
    }

    const consentResponse = await fetch(
      `${baseUrl}/rest/v1/technician_applications?id=eq.${encodeURIComponent(technician.id)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(secretKey, "return=minimal"),
        body: JSON.stringify({
          stripe_customer_id: customerId,
          billing_consent_at: new Date().toISOString(),
          billing_terms_version: BILLING_TERMS_VERSION,
        }),
      },
    );

    if (!consentResponse.ok) {
      console.error("Billing consent save failed:", consentResponse.status, await consentResponse.text());
      return NextResponse.json({ error: "No hemos podido guardar la autorización de cobro." }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const session = await createTechnicianCheckoutSession({
      technicianId: technician.id,
      customerId,
      setupToken: token,
      planCode,
      siteUrl,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe no ha generado una página de pago." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("Stripe checkout creation failed:", error);
    const message = error instanceof Error ? error.message : "No hemos podido iniciar Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
