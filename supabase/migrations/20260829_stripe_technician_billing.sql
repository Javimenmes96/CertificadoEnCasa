alter table public.technician_applications
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_payment_method_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists billing_plan_code text not null default 'basic',
  add column if not exists stripe_setup_token uuid,
  add column if not exists stripe_setup_completed_at timestamptz,
  add column if not exists billing_consent_at timestamptz,
  add column if not exists billing_terms_version text;

update public.technician_applications
set stripe_setup_token = gen_random_uuid()
where stripe_setup_token is null;

alter table public.technician_applications
  alter column stripe_setup_token set default gen_random_uuid(),
  alter column stripe_setup_token set not null;

create unique index if not exists idx_technician_stripe_customer
  on public.technician_applications (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists idx_technician_stripe_subscription
  on public.technician_applications (stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists idx_technician_stripe_setup_token
  on public.technician_applications (stripe_setup_token);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'technician_billing_plan_code_check'
  ) then
    alter table public.technician_applications
      add constraint technician_billing_plan_code_check
      check (billing_plan_code in ('basic', 'premium', 'plus'));
  end if;
end $$;
