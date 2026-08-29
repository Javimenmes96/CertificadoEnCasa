const STRIPE_API = "https://api.stripe.com/v1";

export type BillingPlanCode = "basic" | "premium" | "plus";

type StripeErrorBody = {
  error?: {
    message?: string;
  };
};

export type StripeCustomer = {
  id: string;
  invoice_settings?: {
    default_payment_method?: string | { id?: string } | null;
  };
};

export type StripePrice = {
  id: string;
  active: boolean;
  lookup_key?: string | null;
};

export type StripeCheckoutSession = {
  id: string;
  url?: string | null;
  status?: string | null;
  customer?: string | StripeCustomer | null;
  setup_intent?: string | StripeSetupIntent | null;
  subscription?: string | StripeSubscription | null;
  metadata?: Record<string, string> | null;
};

export type StripeSetupIntent = {
  id: string;
  status?: string | null;
  payment_method?: string | { id?: string } | null;
};

export type StripeSubscription = {
  id: string;
  status?: string | null;
  default_payment_method?: string | { id?: string } | null;
};

function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe no está configurado.");
  return key;
}

async function stripeRequest<T>(
  path: string,
  options: { method?: "GET" | "POST"; params?: Record<string, string> } = {},
): Promise<T> {
  const method = options.method || "GET";
  const params = new URLSearchParams(options.params || {});
  const url = method === "GET" && params.size > 0
    ? `${STRIPE_API}${path}?${params.toString()}`
    : `${STRIPE_API}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${stripeSecretKey()}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? params.toString() : undefined,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({})) as T & StripeErrorBody;
  if (!response.ok) {
    throw new Error(data.error?.message || `Stripe ha respondido con ${response.status}.`);
  }
  return data;
}

export async function createStripeCustomer(data: {
  name: string;
  email: string;
  technicianId: string;
}) {
  return stripeRequest<StripeCustomer>("/customers", {
    method: "POST",
    params: {
      name: data.name,
      email: data.email,
      "metadata[technician_id]": data.technicianId,
      "metadata[source]": "certificadoencasa",
    },
  });
}

async function priceByLookupKey(lookupKey: string) {
  const result = await stripeRequest<{ data: StripePrice[] }>("/prices", {
    params: {
      "lookup_keys[]": lookupKey,
      active: "true",
      limit: "1",
    },
  });
  const price = result.data?.[0];
  if (!price) throw new Error(`No existe un precio activo en Stripe para ${lookupKey}.`);
  return price;
}

export async function createTechnicianCheckoutSession(data: {
  technicianId: string;
  customerId: string;
  setupToken: string;
  planCode: BillingPlanCode;
  siteUrl: string;
}) {
  const baseUrl = data.siteUrl.replace(/\/$/, "");
  const common: Record<string, string> = {
    customer: data.customerId,
    client_reference_id: data.technicianId,
    locale: "es",
    billing_address_collection: "required",
    "payment_method_types[0]": "card",
    success_url: `${baseUrl}/configurar-pago/resultado?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/configurar-pago/${data.setupToken}?cancelado=1`,
    "metadata[technician_id]": data.technicianId,
    "metadata[plan_code]": data.planCode,
    "metadata[setup_token]": data.setupToken,
  };

  if (data.planCode === "basic") {
    return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
      method: "POST",
      params: {
        ...common,
        mode: "setup",
        "setup_intent_data[metadata][technician_id]": data.technicianId,
        "setup_intent_data[metadata][plan_code]": data.planCode,
      },
    });
  }

  const taxRateId = process.env.STRIPE_TAX_RATE_ID;
  if (!taxRateId) throw new Error("El IVA de Stripe no está configurado.");

  const lookupKey = data.planCode === "premium" ? "premium_monthly" : "plus_monthly";
  const price = await priceByLookupKey(lookupKey);

  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST",
    params: {
      ...common,
      mode: "subscription",
      "line_items[0][price]": price.id,
      "line_items[0][quantity]": "1",
      "line_items[0][tax_rates][0]": taxRateId,
      "subscription_data[metadata][technician_id]": data.technicianId,
      "subscription_data[metadata][plan_code]": data.planCode,
    },
  });
}

export function getCheckoutSession(sessionId: string) {
  return stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    params: {
      "expand[]": "setup_intent",
    },
  });
}

export function getSetupIntent(id: string) {
  return stripeRequest<StripeSetupIntent>(`/setup_intents/${encodeURIComponent(id)}`);
}

export function getSubscription(id: string) {
  return stripeRequest<StripeSubscription>(`/subscriptions/${encodeURIComponent(id)}`);
}

export function getCustomer(id: string) {
  return stripeRequest<StripeCustomer>(`/customers/${encodeURIComponent(id)}`);
}

export function objectId(value: string | { id?: string } | null | undefined) {
  if (typeof value === "string") return value;
  return value?.id || null;
}
