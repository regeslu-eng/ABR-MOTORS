# ABR Motors - Catalogo y panel de administracion

Proyecto estatico conectado a Supabase. Conserva la estructura visual del sitio,
el flujo de cotizacion y el boton movil centrado **Cotizar entrega**.

## Contenido

- `index.html`: catalogo publico.
- `admin.html`: panel privado para administrar motocicletas.
- `admin.js` y `admin.css`: logica y estilos del panel.
- `supabase-config.js`: URL y llave publica de Supabase.
- `permisos_api_abr_motors.sql`: permisos de API que se ejecutan una sola vez.
- `assets/`: fotografias, videos y logotipo actuales.

## Inventario validado

La base de datos contiene 20 motocicletas:

- 10 en sucursal.
- 3 llegan en noviembre.
- 3 proximamente.
- 4 vendidas.

El catalogo conserva el inventario local como respaldo. Cuando Supabase esta
disponible, los datos del panel son los que aparecen publicamente.

## Activacion inicial de Supabase

1. Abre **SQL Editor** en el proyecto ABR Motors de Supabase.
2. Crea un snippet nuevo.
3. Pega el contenido de `permisos_api_abr_motors.sql`.
4. Presiona **Run** una sola vez.
5. Confirma que el resultado muestre permisos para `anon` y `authenticated`.

RLS permanece activo: los visitantes solo pueden leer el catalogo y solo los
usuarios registrados en `admin_users` pueden modificarlo.

## Uso del panel

1. Publica el proyecto.
2. Abre `https://tu-dominio.com/admin.html`.
3. Inicia sesion con el usuario administrador creado en Supabase Auth.
4. Desde el panel puedes agregar, editar, ordenar, ocultar, retirar o marcar como
   vendida una moto, cambiar precio y disponibilidad, y subir fotos o video.

Los archivos nuevos se guardan en el bucket publico `catalogo-motos`.

## Publicar en Vercel

1. Sube el contenido de esta carpeta a la raiz del repositorio de GitHub.
2. Importa el repositorio desde Vercel o deja que el proyecto existente se
   actualice con el nuevo commit.
3. No selecciones framework y no configures comando de instalacion o build.
4. Publica y prueba `/` y `/admin.html`.

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

Despues abre la direccion indicada por el comando y visita `/admin.html` para el
panel.
