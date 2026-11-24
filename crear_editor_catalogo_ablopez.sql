begin;

-- Los usuarios existentes se conservan como administradores completos.
alter table public.admin_users
  add column if not exists role text;

update public.admin_users
set role = 'admin'
where role is null;

alter table public.admin_users
  alter column role set default 'catalog_editor',
  alter column role set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admin_users_role_check'
      and conrelid = 'public.admin_users'::regclass
  ) then
    alter table public.admin_users
      add constraint admin_users_role_check
      check (role in ('admin', 'catalog_editor'));
  end if;
end;
$$;

-- Administrador completo: usuarios, categorias y catalogo.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and active = true
      and role = 'admin'
  );
$$;

-- Administrador o editor limitado al catalogo.
create or replace function public.can_manage_catalog()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and active = true
      and role in ('admin', 'catalog_editor')
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.can_manage_catalog() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.can_manage_catalog() to authenticated;

-- Cada usuario autorizado puede leer solamente su propio perfil.
drop policy if exists "Users read own admin profile" on public.admin_users;
create policy "Users read own admin profile"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid() and active = true);

-- Puede consultar las categorias existentes, pero no modificarlas.
drop policy if exists "Catalog managers select categories" on public.categories;
create policy "Catalog managers select categories"
on public.categories
for select
to authenticated
using (public.can_manage_catalog());

-- El editor puede administrar motos, incluso ocultas y archivadas.
drop policy if exists "Catalog managers select motorcycles" on public.motorcycles;
create policy "Catalog managers select motorcycles"
on public.motorcycles
for select
to authenticated
using (public.can_manage_catalog());

drop policy if exists "Catalog managers insert motorcycles" on public.motorcycles;
create policy "Catalog managers insert motorcycles"
on public.motorcycles
for insert
to authenticated
with check (public.can_manage_catalog());

drop policy if exists "Catalog managers update motorcycles" on public.motorcycles;
create policy "Catalog managers update motorcycles"
on public.motorcycles
for update
to authenticated
using (public.can_manage_catalog())
with check (public.can_manage_catalog());

drop policy if exists "Catalog managers delete motorcycles" on public.motorcycles;
create policy "Catalog managers delete motorcycles"
on public.motorcycles
for delete
to authenticated
using (public.can_manage_catalog());

-- Permisos equivalentes para fotografias y videos del catalogo.
drop policy if exists "Catalog managers select motorcycle media" on public.motorcycle_media;
create policy "Catalog managers select motorcycle media"
on public.motorcycle_media
for select
to authenticated
using (public.can_manage_catalog());

drop policy if exists "Catalog managers insert motorcycle media" on public.motorcycle_media;
create policy "Catalog managers insert motorcycle media"
on public.motorcycle_media
for insert
to authenticated
with check (public.can_manage_catalog());

drop policy if exists "Catalog managers update motorcycle media" on public.motorcycle_media;
create policy "Catalog managers update motorcycle media"
on public.motorcycle_media
for update
to authenticated
using (public.can_manage_catalog())
with check (public.can_manage_catalog());

drop policy if exists "Catalog managers delete motorcycle media" on public.motorcycle_media;
create policy "Catalog managers delete motorcycle media"
on public.motorcycle_media
for delete
to authenticated
using (public.can_manage_catalog());

-- El historial se habilita si ya se ejecuto ampliar_panel_abr_motors.sql.
do $$
begin
  if to_regclass('public.motorcycle_history') is not null then
    execute 'drop policy if exists "Catalog managers read motorcycle history" on public.motorcycle_history';
    execute 'create policy "Catalog managers read motorcycle history" on public.motorcycle_history for select to authenticated using (public.can_manage_catalog())';
  end if;
end;
$$;

-- Archivos del bucket catalogo-motos.
drop policy if exists "Catalog managers upload catalog media" on storage.objects;
create policy "Catalog managers upload catalog media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'catalogo-motos' and public.can_manage_catalog());

drop policy if exists "Catalog managers update catalog media" on storage.objects;
create policy "Catalog managers update catalog media"
on storage.objects
for update
to authenticated
using (bucket_id = 'catalogo-motos' and public.can_manage_catalog())
with check (bucket_id = 'catalogo-motos' and public.can_manage_catalog());

drop policy if exists "Catalog managers delete catalog media" on storage.objects;
create policy "Catalog managers delete catalog media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'catalogo-motos' and public.can_manage_catalog());

-- La cuenta debe existir primero en Authentication > Users.
do $$
declare
  editor_id uuid;
begin
  select id
  into editor_id
  from auth.users
  where lower(email) = lower('ablopez2391@gmail.com')
  limit 1;

  if editor_id is null then
    raise exception 'Primero crea ablopez2391@gmail.com en Authentication > Users';
  end if;

  insert into public.admin_users (user_id, email, full_name, active, role)
  values (editor_id, 'ablopez2391@gmail.com', 'Editor de catalogo', true, 'catalog_editor')
  on conflict (user_id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      active = true,
      role = 'catalog_editor';
end;
$$;

commit;

select email, full_name, role, active
from public.admin_users
where lower(email) = lower('ablopez2391@gmail.com');
