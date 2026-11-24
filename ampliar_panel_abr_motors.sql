begin;

-- Fechas operativas para apartados y ventas.
alter table public.motorcycles
  add column if not exists reserved_at date,
  add column if not exists sold_at date;

-- Historial automático de cambios del inventario.
create table if not exists public.motorcycle_history (
  id bigint generated always as identity primary key,
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists motorcycle_history_motorcycle_created_idx
  on public.motorcycle_history (motorcycle_id, created_at desc);

create or replace function public.log_motorcycle_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  change_action text;
begin
  if tg_op = 'INSERT' then
    change_action := 'creada';
  elsif old.deleted_at is null and new.deleted_at is not null then
    change_action := 'archivada';
  elsif old.deleted_at is not null and new.deleted_at is null then
    change_action := 'restaurada';
  elsif old.status is distinct from new.status then
    change_action := 'estado actualizado';
  elsif old.price is distinct from new.price then
    change_action := 'precio actualizado';
  else
    change_action := 'información actualizada';
  end if;

  insert into public.motorcycle_history (
    motorcycle_id,
    action,
    old_data,
    new_data,
    changed_by
  ) values (
    new.id,
    change_action,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new),
    auth.uid()
  );

  return new;
end;
$$;

drop trigger if exists motorcycle_history_trigger on public.motorcycles;
create trigger motorcycle_history_trigger
after insert or update on public.motorcycles
for each row execute function public.log_motorcycle_change();

alter table public.motorcycle_history enable row level security;

drop policy if exists "Admins read motorcycle history" on public.motorcycle_history;
create policy "Admins read motorcycle history"
on public.motorcycle_history
for select
to authenticated
using (public.is_admin());

revoke all privileges on public.motorcycle_history from anon, authenticated;
grant select on public.motorcycle_history to authenticated;

commit;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'motorcycles'
  and column_name in ('reserved_at', 'sold_at')
order by column_name;
