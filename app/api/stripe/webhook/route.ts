import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  BillingPlanCode,
  getCheckoutSession,
  getCustomer,
  getSetupIntent,
  getSubscription,
  objectId,
} from "@/lib/stripe-billing";

export const runtime = "nodejs";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const SIGNATURE_TOLERANCE_SECONDS = 300;

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

type WebhookSubscription = {
  id: string;
  status?: string | null;
  customer?: string | { id?: string } | null;
  default_payment_method?: string | { id?: string } | null;
  metadata?: Record<string, string> | null;
};

function supabaseHeaders(key: string) {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

function billingPlan(value: unknown): BillingPlanCode | null {
  return value === "basic" || value === "premium" || value === "plus" ? value : null;
}

function technicianId(value: unknown) {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const entries = header.split(",").map((part) => part.trim());
  const timestampEntry = entries.find((part) => part.startsWith("t="));
  const signatures = entries
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestampEntry || signatures.length === 0) return false;

  const timestamp = Number(timestampEntry.slice(2));
  if (!Number.isFinite(timestamp)) return false;

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (ageSeconds > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  return signatures.some((signature) => safeEqualHex(signature, expected));
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase no está configurado.");
  return { baseUrl: url.replace(/\/$/, ""), key };
}

async function updateTechnician(id: string, updates: Record<string, unknown>) {
  const { baseUrl, key } = supabaseConfig();
  const response = await fetch(
    `${baseUrl}/rest/v1/technician_applications?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(key),
      body: JSON.stringify(updates),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`No se ha podido sincronizar el técnico (${response.status}): ${await response.text()}`);
  }
}

async function syncCompletedCheckout(sessionId: string) {
  const session = await getCheckoutSession(sessionId);
  if (session.status !== "complete") {
    throw new Error("Stripe ha enviado una sesión que todavía no está completada.");
  }

  const techId = technicianId(session.metadata?.technician_id);
  const planCode = billingPlan(session.metadata?.plan_code);
  if (!techId || !planCode) return false;

  const customerId = objectId(session.customer);
  if (!customerId) throw new Error("Stripe no ha devuelto el cliente del técnico.");

  let paymentMethodId: string | null = null;
  let subscriptionId: string | null = null;
  let subscriptionStatus: string | null = null;

  if (planCode === "basic") {
    const setupIntentId = objectId(session.setup_intent);
    if (!setupIntentId) throw new Error("Stripe no ha devuelto el SetupIntent del plan Básico.");
    const setupIntent = typeof session.setup_intent === "object" && session.setup_intent
      ? session.setup_intent
      : await getSetupIntent(setupIntentId);
    paymentMethodId = objectId(setupIntent.payment_method);
  } else {
    subscriptionId = objectId(session.subscription);
    if (!subscriptionId) throw new Error("Stripe no ha devuelto la suscripción del técnico.");
    const subscription = typeof session.subscription === "object" && session.subscription
      ? session.subscription
      : await getSubscription(subscriptionId);
    subscriptionStatus = subscription.status || null;
    paymentMethodId = objectId(subscription.default_payment_method);

    if (!paymentMethodId) {
      const customer = await getCustomer(customerId);
      paymentMethodId = objectId(customer.invoice_settings?.default_payment_method);
    }
  }

  if (!paymentMethodId) {
    throw new Error("Stripe ha completado el Checkout, pero no se ha podido recuperar el método de pago.");
  }

  await updateTechnician(techId, {
    billing_plan_code: planCode,
    stripe_customer_id: customerId,
    stripe_payment_method_id: paymentMethodId,
    stripe_subscription_id: subscriptionId,
    stripe_subscription_status: subscriptionStatus,
    stripe_setup_completed_at: new Date().toISOString(),
  });

  return true;
}

async function syncSubscription(subscription: WebhookSubscription) {
  const techId = technicianId(subscription.metadata?.technician_id);
  const planCode = billingPlan(subscription.metadata?.plan_code);
  if (!techId || !planCode || planCode === "basic") return false;

  const status = subscription.status || "unknown";
  const isEntitled = ACTIVE_SUBSCRIPTION_STATUSES.has(status);
  const customerId = objectId(subscription.customer);
  let paymentMethodId = objectId(subscription.default_payment_method);

  if (!paymentMethodId && customerId) {
    const customer = await getCustomer(customerId);
    paymentMethodId = objectId(customer.invoice_settings?.default_payment_method);
  }

  const updates: Record<string, unknown> = {
    billing_plan_code: isEntitled ? planCode : "basic",
    stripe_subscription_id: status === "canceled" ? null : subscription.id,
    stripe_subscription_status: status,
  };

  if (customerId) updates.stripe_customer_id = customerId;
  if (paymentMethodId) updates.stripe_payment_method_id = paymentMethodId;

  await updateTechnician(techId, updates);
  return true;
}

async function syncSubscriptionById(subscriptionId: string) {
  const subscription = await getSubscription(subscriptionId) as unknown as WebhookSubscription;
  return syncSubscription(subscription);
}

function invoiceSubscriptionId(invoice: Record<string, unknown>) {
  const direct = objectId(invoice.subscription as string | { id?: string } | null | undefined);
  if (direct) return direct;

  const parent = invoice.parent;
  if (!parent || typeof parent !== "object") return null;
  const subscriptionDetails = (parent as Record<string, unknown>).subscription_details;
  if (!subscriptionDetails || typeof subscriptionDetails !== "object") return null;
  return objectId((subscriptionDetails as Record<string, unknown>).subscription as string | { id?: string } | null | undefined);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "El webhook de Stripe no está configurado." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta la firma de Stripe." }, { status: 400 });
  }

  const payload = await request.text();
  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Firma de Stripe no válida." }, { status: 400 });
  }

  let event: StripeWebhookEvent;
  try {
    event = JSON.parse(payload) as StripeWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Payload de Stripe no válido." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const sessionId = typeof event.data.object.id === "string" ? event.data.object.id : null;
      const metadata = event.data.object.metadata;
      const hasTechnicianMetadata = metadata && typeof metadata === "object"
        && technicianId((metadata as Record<string, unknown>).technician_id)
        && billingPlan((metadata as Record<string, unknown>).plan_code);
      if (sessionId && hasTechnicianMetadata) await syncCompletedCheckout(sessionId);
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await syncSubscription(event.data.object as unknown as WebhookSubscription);
    }

    if (event.type === "invoice.payment_failed" || event.type === "invoice.paid") {
      const subscriptionId = invoiceSubscriptionId(event.data.object);
      if (subscriptionId) await syncSubscriptionById(subscriptionId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", event.id, event.type, error);
    return NextResponse.json({ error: "No se ha podido procesar el evento de Stripe." }, { status: 500 });
  }
}
