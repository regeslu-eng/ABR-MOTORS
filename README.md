# ABR Motors - Catalogo y panel de administracion

Proyecto estatico conectado a Supabase. Conserva la estructura visual del sitio,
el flujo de cotizacion y el boton movil centrado **Cotizar entrega**.

## Contenido

- `index.html`: catalogo publico.
- `admin.html`: panel privado para administrar motocicletas.
- `admin.js` y `admin.css`: logica y estilos del panel.
- `supabase-config.js`: URL y llave publica de Supabase.
- `permisos_api_abr_motors.sql`: corrige y limita los permisos de la API.
- `ampliar_panel_abr_motors.sql`: agrega fechas e historial de movimientos.
- `crear_editor_catalogo_ablopez.sql`: crea el rol limitado para
  `ablopez2391@gmail.com` despues de registrar su cuenta en Authentication.
- `assets/`: fotografias, videos y logotipo actuales.

## Inventario validado

La base de datos contiene 20 motocicletas:

- 10 en sucursal.
- 3 llegan en noviembre.
- 3 proximamente.
- 4 vendidas.

Supabase es la fuente de verdad del catalogo publicado. Si la conexion falla,
el sitio muestra un aviso temporal en vez de publicar un inventario local que
pueda estar desactualizado.

## Actualizacion de Supabase

1. Abre **SQL Editor** en el proyecto ABR Motors de Supabase.
2. Crea un snippet nuevo llamado `Permisos seguros ABR Motors`.
3. Pega el contenido de `permisos_api_abr_motors.sql` y presiona **Run**.
4. Crea otro snippet llamado `Ampliar panel ABR Motors`.
5. Pega el contenido de `ampliar_panel_abr_motors.sql` y presiona **Run**.
6. No vuelvas a ejecutar el importador del inventario: las 20 motos ya existen.

## Crear el editor de catalogo

1. En Supabase abre **Authentication > Users > Add user**.
2. Registra `ablopez2391@gmail.com`, asigna una contrasena temporal segura y
   activa la confirmacion automatica del correo.
3. En **SQL Editor** ejecuta `crear_editor_catalogo_ablopez.sql`.
4. El resultado final debe mostrar el correo, `catalog_editor` y `active = true`.

Este perfil puede administrar motocicletas, precios, fechas, apartados, ventas,
orden, fotografias y videos. No puede modificar usuarios, roles, permisos ni
categorias generales. Los administradores existentes conservan acceso completo.

RLS permanece activo: los visitantes solo pueden leer el catalogo y solo los
usuarios registrados en `admin_users` pueden modificarlo.

## Uso del panel

1. Publica el proyecto.
2. Abre `https://tu-dominio.com/admin`.
3. Inicia sesion con el usuario administrador creado en Supabase Auth.
4. Desde el panel puedes:

   - agregar y editar motocicletas;
   - cambiar precio, datos tecnicos, descripcion y disponibilidad;
   - apartar, quitar un apartado o marcar una unidad como vendida;
   - registrar fechas de llegada, apartado y venta;
   - cambiar el orden de motos, fotografias y categorias;
   - elegir la fotografia de portada y subir fotos o video;
   - crear categorias como `Llegan en diciembre` sin modificar codigo;
   - ocultar, archivar y restaurar unidades;
   - consultar el historial de cambios de cada motocicleta.

Los archivos nuevos se guardan en el bucket publico `catalogo-motos`. Conviene
comprimir las fotografias a WebP o JPG y mantenerlas por debajo de 2 MB. El panel
rechaza cualquier archivo individual que supere 50 MB.

## Publicar en Vercel

1. Sube el contenido de esta carpeta a la raiz del repositorio de GitHub.
2. Importa el repositorio desde Vercel o deja que el proyecto existente se
   actualice con el nuevo commit.
3. No selecciones framework y no configures comando de instalacion o build.
4. Publica y prueba `/` y `/admin`.

Este proyecto no usa Next.js ni necesita ejecutar `npm install`. Las bibliotecas
de Supabase y Lucide del panel se cargan desde CDN.

## Seguridad

- La llave de `supabase-config.js` es publicable y puede usarse en el navegador.
- Nunca agregues una llave `service_role` o una secret key al proyecto.
- Para dar acceso a otra persona, crea su cuenta en Supabase Auth y agrega su UID
  a `public.admin_users`.

## Prueba local

Sirve la carpeta con un servidor HTTP para que fotos, videos y PDF funcionen de
forma consistente. Por ejemplo:

```bash
npx http-server .
```

Despues abre la direccion indicada por el comando y visita `/admin` para el
panel.
