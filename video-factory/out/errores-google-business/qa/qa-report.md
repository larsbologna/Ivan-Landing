# QA · errores-google-business

Estado: **APROBADO** · iteraciones: 1 · duración 21.00 s · 5 escenas

![Revisión](contact.jpg)

Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)

| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |
|---|---|---|---|---|---|---|
| 1 | gancho | 0.00 | 2.80 | 0.97 | — | — |
| 2 | lista | 2.80 | 6.40 | 6.70 | — | — |
| 3 | remate | 9.20 | 3.40 | 10.85 | — | — |
| 4 | ficha | 12.60 | 4.00 | 14.22 | — | — |
| 5 | cierre | 16.60 | 4.40 | 18.75 | — | — |

## Correcciones automáticas aplicadas

Ninguna: el layout pasó a la primera.

## Reglas

- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).
- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.
- Sin superposición entre bloques de texto visibles (opacidad > 0,6).
- Zona vacía: advertencia si hay más de 420 px verticales sin contenido.
- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.
