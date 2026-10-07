# Presencia Online · Buenos Aires

Landing page y catálogo de WhatsApp Business para ofrecer presencia online a negocios locales de Buenos Aires.

## Contenido

| Ruta | Qué es |
|------|--------|
| `index.html` | Landing page. Archivo único con CSS y JS internos: se abre directo en el navegador, sin backend. |
| `video-factory/` | Fábrica de videos verticales (motion graphics, sin fotos): motor determinista, componentes, QA, audio procedural y render. Ver su README. |
| `catalogo-whatsapp/` | Catálogo de 6 imágenes 1080×1080 (y @2x) para WhatsApp Business, más el HTML editable y el script que las genera. Ver su README. |

## Datos pendientes de la landing

Antes de publicar, completá el bloque `CONFIG` al final de `index.html`
(número de WhatsApp, precios, plazos y condiciones). El número no se muestra
en la página: solo se usa para los botones. Mientras un dato esté vacío,
la página muestra un placeholder visible como `[PRECIO_PLAN_INICIO]`.

## Publicar

Como `index.html` está en la raíz, se puede publicar con GitHub Pages
(Settings → Pages → rama `main`, carpeta `/`) o en cualquier hosting estático.
