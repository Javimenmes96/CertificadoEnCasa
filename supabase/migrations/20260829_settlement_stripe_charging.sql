alter table public.settlements
  add column if not exists tax_rate_percent numeric(5,2) not null default 21.00,
  add column if not exists tax_eur numeric(10,2),
  add column if not exists total_charge_eur numeric(10,2),
  add column if not exists stripe_invoice_id text,
  add column if not exists stripe_invoice_url text,
  add column if not exists stripe_invoice_pdf text,
  add column if not exists payment_attempts integer not null default 0,
  add column if not exists last_payment_attempt_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists failure_message text;

create unique index if not exists idx_settlements_stripe_invoice_id
  on public.settlements (stripe_invoice_id)
  where stripe_invoice_id is not null;

create index if not exists idx_settlements_charge_queue
  on public.settlements (status, scheduled_for)
  where status in ('ready', 'failed', 'charged');

-- El cobro de una liquidación actualiza intentos, estado, IVA y datos de factura.
grant update on table public.settlements to service_role;
