create or replace function public.sync_technician_billing_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.plan_code := new.billing_plan_code;
  new.plan_commission_percent := case new.billing_plan_code
    when 'basic' then 20.00
    when 'premium' then 12.00
    when 'plus' then 7.00
    else new.plan_commission_percent
  end;
  return new;
end;
$$;

drop trigger if exists sync_technician_billing_plan_trigger
on public.technician_applications;

create trigger sync_technician_billing_plan_trigger
before insert or update of billing_plan_code
on public.technician_applications
for each row
execute function public.sync_technician_billing_plan();

update public.technician_applications
set
  plan_code = billing_plan_code,
  plan_commission_percent = case billing_plan_code
    when 'basic' then 20.00
    when 'premium' then 12.00
    when 'plus' then 7.00
    else plan_commission_percent
  end;
