-- Marketplace: el cliente elige al técnico.
-- Ejecutar una sola vez en Supabase SQL Editor antes de desplegar esta rama.

alter table public.leads
  add column if not exists selected_technician_id uuid
  references public.technician_applications(id) on delete set null;

alter table public.leads
  add column if not exists technician_selected_at timestamptz;

create index if not exists leads_selected_technician_idx
  on public.leads (selected_technician_id);

-- El modelo ya no asigna técnicos desde administración.
-- Si existiera algún registro antiguo como "assigned", lo dejamos como contactado.
update public.leads
set status = 'contacted'
where status = 'assigned';

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check
  check (status in ('new', 'contacted', 'completed', 'discarded'));

grant select, insert, update, delete
on table public.leads
to service_role;
