begin;

-- Crea las categorias faltantes y fija el orden solicitado.
insert into public.categories (slug, name, display_order, active)
values
  ('en-sucursal', 'En sucursal', 10, true),
  ('proximamente', 'Próximamente', 20, true),
  ('llegan-en-enero', 'Llegan en enero', 101, true),
  ('llegan-en-febrero', 'Llegan en febrero', 102, true),
  ('llegan-en-marzo', 'Llegan en marzo', 103, true),
  ('llegan-en-abril', 'Llegan en abril', 104, true),
  ('llegan-en-mayo', 'Llegan en mayo', 105, true),
  ('llegan-en-junio', 'Llegan en junio', 106, true),
  ('llegan-en-julio', 'Llegan en julio', 107, true),
  ('llegan-en-agosto', 'Llegan en agosto', 108, true),
  ('llegan-en-septiembre', 'Llegan en septiembre', 109, true),
  ('llegan-en-octubre', 'Llegan en octubre', 110, true),
  ('llegan-en-noviembre', 'Llegan en noviembre', 111, true),
  ('llegan-en-diciembre', 'Llegan en diciembre', 112, true)
on conflict (slug) do update
set name = excluded.name,
    display_order = excluded.display_order,
    active = true;

commit;

select name, display_order, active
from public.categories
where slug in (
  'en-sucursal',
  'proximamente',
  'llegan-en-enero',
  'llegan-en-febrero',
  'llegan-en-marzo',
  'llegan-en-abril',
  'llegan-en-mayo',
  'llegan-en-junio',
  'llegan-en-julio',
  'llegan-en-agosto',
  'llegan-en-septiembre',
  'llegan-en-octubre',
  'llegan-en-noviembre',
  'llegan-en-diciembre'
)
order by display_order;
