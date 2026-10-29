# Punto Reseña · Soporte QR para reseñas de Google

Landing page para vender un soporte físico con código QR que lleva a los clientes de un negocio a su página de reseñas de Google. La conversión principal es la consulta por WhatsApp.

> "Punto Reseña" es un **nombre provisional**.

## Contenido

| Ruta | Qué es |
|------|--------|
| `index.html` | Landing completa. Un solo archivo con HTML, CSS y JS, sin build ni backend. |
| `favicon.svg` | Favicon provisional. |
| `og-image.png` | Imagen para compartir en redes (1200×630). |
| `tools/shots.mjs` | Capturas de control (desktop y móvil), detección de errores de consola y overflow, y regeneración de `og-image.png`. |
| `catalogo-whatsapp/` | Catálogo de la oferta anterior ("Presencia Online"). La landing no lo usa. |

## Configuración

Todo está en el bloque `CONFIG`, al final de `index.html`:

```js
const CONFIG = {
  brand: "Punto Reseña",
  whatsapp: "5491140347468",
  whatsappMessage: "Hola, vi el QR para reseñas de Google y quiero saber cómo funciona para mi negocio.",
};
```

- **Marca:** además de `CONFIG.brand`, cambiá el nombre en `<title>` y `og:site_name` (en el `<head>`).
- **WhatsApp:** formato internacional sin `+` (54 9 + código de área + número).
- **QR de muestra:** el QR de los mockups es real y abre `https://wa.me/5491140347468`. Si cambia el número, regeneralo (por ejemplo, con el paquete `qrcode`: `QRCode.toString(url,{type:"svg",margin:0})`) y reemplazá el `<symbol id="qr">` en `index.html`.
- **Open Graph:** `og:url` y `og:image` apuntan a `https://larsbologna.github.io/Ivan-Landing/`. Si publicás en otro dominio, actualizalos.

## Pendiente con datos reales

- Nombre comercial definitivo.
- Fotos reales del soporte. Hoy los mockups están hechos en CSS/SVG y están marcados como `PROVISIONAL` en el código y como "Imagen ilustrativa" en la página.
- Opciones de personalización, precio y entrega: la página no los menciona a propósito, para no inventar condiciones.

## Analítica

Los eventos `click_whatsapp`, `click_demo`, `demo_scan`, `click_cta_hero` y `click_cta_final` se envían a `window.dataLayer` (si existe) y como evento DOM `landing:track`. No se carga ningún script de terceros. Si sumás Google Tag Manager o el píxel de Meta, implementá antes el consentimiento que corresponda.

## Probar y publicar

Abrí `index.html` en el navegador. Para las capturas de control:

```bash
node tools/shots.mjs /ruta/de/salida
```

Para publicar con GitHub Pages: Settings → Pages → rama `main`, carpeta `/`. También funciona en cualquier hosting estático.
