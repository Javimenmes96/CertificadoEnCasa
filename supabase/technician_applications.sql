create table if not exists public.technician_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'verified', 'rejected')),
  name text not null,
  email text not null,
  phone text not null,
  city text not null,
  province text not null,
  qualification text not null,
  professional_number text,
  years_experience integer,
  work_zones text not null,
  travel_radius_km integer,
  price_from_eur numeric(10,2),
  notes text,
  privacy_accepted boolean not null default false,
  source text not null default 'web'
);

create index if not exists technician_applications_created_at_idx
  on public.technician_applications (created_at desc);

create index if not exists technician_applications_status_idx
  on public.technician_applications (status);

create index if not exists technician_applications_province_idx
  on public.technician_applications (province);

alter table public.technician_applications enable row level security;

grant select, insert, update, delete
on table public.technician_applications
to service_role;

-- Deliberately no anon/authenticated policies.
-- Public submissions and admin reads are performed only by server-side routes.
