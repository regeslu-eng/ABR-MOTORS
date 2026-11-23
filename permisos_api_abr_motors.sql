begin;

-- La API pública solo puede leer el catálogo visible; RLS sigue aplicándose.
grant usage on schema public to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.motorcycles to anon, authenticated;
grant select on public.motorcycle_media to anon, authenticated;

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
