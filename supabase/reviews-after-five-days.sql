-- Reviews are invited automatically five days after a customer request.
-- They no longer depend on the lead being marked as completed.

alter table public.reviews
  alter column verified set default false;

update public.reviews
set verified = false
where verified = true;

drop trigger if exists validate_verified_review
on public.reviews;

drop trigger if exists validate_review_invitation
on public.reviews;

create or replace function public.validate_review_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lead_technician uuid;
  invited_at timestamptz;
  requested_at timestamptz;
begin
  select selected_technician_id, review_invited_at, created_at
    into lead_technician, invited_at, requested_at
  from public.leads
  where id = new.lead_id;

  if lead_technician is null or lead_technician is distinct from new.technician_id then
    raise exception 'Review technician does not match request';
  end if;

  if invited_at is null then
    raise exception 'Review invitation has not been sent';
  end if;

  if requested_at > now() - interval '5 days' then
    raise exception 'Review is not available yet';
  end if;

  new.verified := false;
  return new;
end;
$$;

create trigger validate_review_invitation
before insert on public.reviews
for each row
execute function public.validate_review_invitation();
