alter table public.leads
  add column if not exists review_token uuid;

alter table public.leads
  add column if not exists review_invited_at timestamptz;

alter table public.leads
  add column if not exists review_submitted_at timestamptz;

create unique index if not exists leads_review_token_unique_idx
  on public.leads (review_token)
  where review_token is not null;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  technician_id uuid not null references public.technician_applications(id) on delete cascade,
  reviewer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  verified boolean not null default true,
  status text not null default 'published'
    check (status in ('published', 'hidden'))
);

create index if not exists reviews_technician_created_idx
  on public.reviews (technician_id, created_at desc);

create index if not exists reviews_public_idx
  on public.reviews (technician_id, status, verified);

create or replace function public.validate_verified_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lead_status text;
  lead_technician uuid;
begin
  select status, selected_technician_id
    into lead_status, lead_technician
  from public.leads
  where id = new.lead_id;

  if lead_status is distinct from 'completed' then
    raise exception 'Reviews require a completed lead';
  end if;

  if lead_technician is null or lead_technician is distinct from new.technician_id then
    raise exception 'Review technician does not match completed lead';
  end if;

  new.verified := true;
  return new;
end;
$$;

drop trigger if exists validate_verified_review on public.reviews;
create trigger validate_verified_review
before insert on public.reviews
for each row execute function public.validate_verified_review();

alter table public.reviews enable row level security;

grant select, insert, update, delete
on table public.reviews
to service_role;
