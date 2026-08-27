create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'contacted', 'assigned', 'completed', 'discarded')),
  name text not null,
  phone text,
  email text,
  postal_code text not null,
  municipality text not null,
  property_type text not null,
  surface_m2 integer,
  reason text,
  notes text,
  privacy_accepted boolean not null default false,
  source text not null default 'web'
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_postal_code_idx on public.leads (postal_code);
create index if not exists leads_status_idx on public.leads (status);

alter table public.leads enable row level security;

-- No public policies are created deliberately.
-- The website writes and reads leads only from server-side routes using the Supabase service-role key.
