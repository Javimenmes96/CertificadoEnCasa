create extension if not exists pgcrypto;

create table if not exists public.technician_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'verified', 'rejected')),
  availability_status text not null default 'available'
    check (availability_status in ('available', 'limited', 'unavailable')),
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

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'completed', 'discarded')),
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
  source text not null default 'web',
  selected_technician_id uuid references public.technician_applications(id) on delete set null,
  technician_selected_at timestamptz
);

create index if not exists technician_applications_created_at_idx
  on public.technician_applications (created_at desc);
create index if not exists technician_applications_status_idx
  on public.technician_applications (status);
create index if not exists technician_applications_availability_idx
  on public.technician_applications (availability_status);
create index if not exists technician_applications_province_idx
  on public.technician_applications (province);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_postal_code_idx on public.leads (postal_code);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_selected_technician_idx on public.leads (selected_technician_id);

create or replace function public.prevent_unavailable_technician_selection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.selected_technician_id is not null and exists (
    select 1
    from public.technician_applications
    where id = new.selected_technician_id
      and availability_status = 'unavailable'
  ) then
    raise exception 'Selected technician is temporarily unavailable';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_unavailable_technician_selection on public.leads;
create trigger prevent_unavailable_technician_selection
before insert or update of selected_technician_id on public.leads
for each row execute function public.prevent_unavailable_technician_selection();

alter table public.technician_applications enable row level security;
alter table public.leads enable row level security;

-- The public site does not access Supabase directly. Server routes use the privileged service role.
grant select, insert, update, delete on table public.technician_applications to service_role;
grant select, insert, update, delete on table public.leads to service_role;

-- No anon/authenticated grants or public RLS policies are created deliberately.
