create or replace function public.generate_settlements(p_scheduled_for date)
returns table (
  settlement_id uuid,
  technician_id uuid,
  lead_count integer,
  total_commission_eur numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last_day date;
  v_cutoff timestamptz;
  v_technician_id uuid;
  v_settlement_id uuid;
  v_status text;
  v_count integer;
  v_total numeric(10,2);
begin
  v_last_day := (date_trunc('month', p_scheduled_for)::date + interval '1 month - 1 day')::date;

  if extract(day from p_scheduled_for)::integer not in (10, 20)
     and p_scheduled_for <> v_last_day then
    raise exception 'Settlement date must be day 10, day 20, or the last day of the month';
  end if;

  -- Incluye todos los encargos cuyo quinto día natural vence como máximo
  -- en la fecha de liquidación, independientemente de la hora concreta.
  v_cutoff := ((p_scheduled_for + 1)::timestamp at time zone 'Europe/Madrid');

  for v_technician_id in
    select distinct l.selected_technician_id
    from public.leads l
    where l.billing_status = 'pending'
      and l.selected_technician_id is not null
      and l.billing_eligible_at is not null
      and l.billing_eligible_at < v_cutoff
      and l.billing_price_eur is not null
      and l.billing_plan_code is not null
      and l.billing_commission_percent is not null
      and l.billing_commission_eur is not null
  loop
    insert into public.settlements (
      technician_id,
      scheduled_for,
      status,
      lead_count,
      total_commission_eur
    ) values (
      v_technician_id,
      p_scheduled_for,
      'draft',
      0,
      0
    )
    on conflict (technician_id, scheduled_for) do nothing;

    select s.id, s.status
      into v_settlement_id, v_status
    from public.settlements s
    where s.technician_id = v_technician_id
      and s.scheduled_for = p_scheduled_for
    limit 1;

    if v_settlement_id is null then
      raise exception 'Could not create or load settlement for technician %', v_technician_id;
    end if;

    -- Una liquidación ya cobrada/pagada/cerrada no se reabre.
    if v_status not in ('draft', 'ready') then
      continue;
    end if;

    insert into public.settlement_items (
      settlement_id,
      lead_id,
      billing_price_eur,
      plan_code,
      commission_percent,
      commission_eur
    )
    select
      v_settlement_id,
      l.id,
      l.billing_price_eur,
      l.billing_plan_code,
      l.billing_commission_percent,
      l.billing_commission_eur
    from public.leads l
    where l.billing_status = 'pending'
      and l.selected_technician_id = v_technician_id
      and l.billing_eligible_at is not null
      and l.billing_eligible_at < v_cutoff
      and l.billing_price_eur is not null
      and l.billing_plan_code is not null
      and l.billing_commission_percent is not null
      and l.billing_commission_eur is not null
    on conflict (lead_id) do nothing;

    -- Una vez incluido en settlement_items, deja de poder cancelarse por el
    -- flujo normal. Esto conserva el histórico económico del encargo.
    update public.leads l
    set billing_status = 'settled'
    where l.billing_status = 'pending'
      and exists (
        select 1
        from public.settlement_items si
        where si.lead_id = l.id
          and si.settlement_id = v_settlement_id
      );

    select
      count(*)::integer,
      coalesce(round(sum(si.commission_eur), 2), 0)::numeric(10,2)
      into v_count, v_total
    from public.settlement_items si
    where si.settlement_id = v_settlement_id;

    update public.settlements
    set
      status = 'ready',
      lead_count = v_count,
      total_commission_eur = v_total
    where id = v_settlement_id;

    settlement_id := v_settlement_id;
    technician_id := v_technician_id;
    lead_count := v_count;
    total_commission_eur := v_total;
    return next;
  end loop;
end;
$$;

revoke all on function public.generate_settlements(date) from public;
grant execute on function public.generate_settlements(date) to service_role;
