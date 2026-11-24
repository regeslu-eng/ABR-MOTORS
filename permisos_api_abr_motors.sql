begin;

-- Elimina concesiones automáticas demasiado amplias y deja solo lo necesario.
revoke all privileges on public.admin_users from anon, authenticated;
revoke all privileges on public.categories from anon, authenticated;
revoke all privileges on public.motorcycles from anon, authenticated;
revoke all privileges on public.motorcycle_media from anon, authenticated;

-- La API pública solo puede leer el catálogo; RLS decide qué filas son visibles.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.motorcycles, public.motorcycle_media to anon, authenticated;

-- Los cambios requieren sesión y además pasan por las políticas de administrador.
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.motorcycles to authenticated;
grant insert, update, delete on public.motorcycle_media to authenticated;

commit;

select table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('categories','motorcycles','motorcycle_media','admin_users')
  and grantee in ('anon','authenticated')
order by table_name, grantee, privilege_type;
