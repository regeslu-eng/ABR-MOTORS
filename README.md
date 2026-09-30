# ABR Motors — Sitio web comercial

Sitio estático listo para GitHub + Vercel y configurado para `https://abrmotors.com/`.

## Publicar
1. Sube **el contenido de esta carpeta** a la raíz del repositorio de GitHub.
2. En Vercel, importa el repositorio.
3. No requiere framework, instalación ni build command.
4. En Vercel > Settings > Domains agrega `abrmotors.com` y `www.abrmotors.com`.
5. Configura en tu proveedor de dominio los registros DNS que Vercel indique.
6. Para Google Search Console, usa el método DNS recomendado o agrega el archivo HTML de verificación que Google te entregue.

## Fotos
- Logo: `assets/logo-abr-motors.png`
- Portada: `assets/portada-inicio.jpg`
- Motos: `assets/moto-01-principal.jpg` a `assets/moto-20-principal.jpg`

Cada moto usa una fotografía principal. Esa misma foto aparece en la tarjeta y, al abrir la moto, se muestra ampliada en su ficha.

## Edición rápida
Abre `index.html` y busca estas marcas:
- `EDITAR: DATOS GENERALES`
- `EDITAR: TEXTOS PRINCIPALES`
- `EDITAR: MOTOS`
- `EDITAR: REDES Y CONTACTO`

Si sustituyes una foto conservando exactamente su nombre, no necesitas cambiar el código.


## Versión comercial enriquecida
- 20 motos cargadas.
- Fotografías principales: `moto-XX-principal.jpg`.
- Precio, año y ficha técnica visibles en cada unidad.
- Iconos de WhatsApp, Facebook, correo y ubicación integrados como SVG dentro del HTML, sin archivos extra.
- El catálogo mezcla motos disponibles en sucursal, unidades que llegan en octubre y próximas unidades.


## Mejoras de marketing y conversión
- Flujo automatizado **Quiero esta moto**: moto seleccionada → ubicación → modalidad de entrega → WhatsApp con solicitud completa.
- Alternativas de entrega dinámicas según el estado/ciudad (siempre sujetas a confirmación de ABR Motors).
- Datos del prospecto guardados localmente en su navegador para no tener que reescribirlos.
- URLs compartibles por moto usando `?moto=ABR-001`.
- Botón **Compartir moto** con Web Share API y copia de enlace como respaldo.
- Eventos preparados en `window.dataLayer` para conectar después Google Tag Manager / GA4 (`view_item`, `begin_quote`, `generate_lead`, `share_item`).
- Animaciones de portada, tarjetas, galería, scroll y microinteracciones, respetando `prefers-reduced-motion`.
- El proyecto conserva la estructura para ampliar el catálogo sin agregar archivos extra de configuración.


## Mejoras finales agregadas

- Tarjetas de redes sociales con diseño premium, íconos SVG integrados y efectos de brillo.
- Flotante de “Continuar cotización” con opción de cerrar y opción de ocultarlo permanentemente en el navegador del cliente.
- Flujo de cotización con campo de comentarios o referencia de entrega.
- Botón para descargar PDF de solicitud con logo, foto de la moto, precio, año, características, datos del cliente, ubicación, entrega solicitada y requerimientos a confirmar.
- El PDF se genera en el navegador mediante jsPDF cargado por CDN, sin agregar archivos al proyecto.

## Ajustes finales
- PDF generado de forma local en el navegador, sin depender de librerías externas.
- Botón **Descargar PDF** descarga la solicitud formal de compra/entrega.
- Botón **Enviar PDF** usa el sistema de compartir del celular cuando está disponible; si el navegador no permite adjuntar archivos directo, descarga el PDF y abre WhatsApp con el mensaje de seguimiento.
- Tarjetas de redes mejoradas para móvil y escritorio, con logos SVG centrados dentro de su recuadro.
- Versión móvil reforzada para cotización, botones, redes y formulario.


## Correccion PDF
- El boton Descargar PDF genera un archivo PDF real desde el navegador.
- El PDF incluye las dos fotos de la moto seleccionada cuando el navegador permite leer archivos de /assets.
- Incluye precio, ano, tipo, cilindraje, transmision, combustible, arranque, disponibilidad, datos del cliente, ubicacion, entrega y comentarios.
- Para probar con maxima compatibilidad, abre el proyecto desde Vercel, GitHub Pages o un servidor local; abrirlo como archivo directo puede limitar el acceso del navegador a las imagenes.


## Correcciones finales
- El PDF integra el logo y las dos fotos de la moto seleccionada usando imágenes embebidas para que funcione también en pruebas locales.
- El index muestra las dos fotos de cada moto: principal y detalle con transición al pasar el mouse.
- El botón flotante aparece desde el inicio con la moto de menor precio.


## Corrección PDF
- El PDF se genera sin exigir campos obligatorios; campos vacíos aparecen como "Por confirmar".
- Incluye logo y miniaturas embebidas de las 2 fotos de cada moto para evitar fallas con file://, móvil, GitHub o Vercel.
- En móvil, el botón de descarga también abre el PDF en una pestaña para evitar bloqueos del navegador.
