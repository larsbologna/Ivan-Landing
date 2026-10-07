# QA · redes-vs-web

Estado: **APROBADO** · iteraciones: 1 · duración 20.50 s · 5 escenas

![Revisión](contact.jpg)

Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)

| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |
|---|---|---|---|---|---|---|
| 1 | gancho | 0.00 | 2.60 | 0.90 | — | — |
| 2 | redes | 2.60 | 4.60 | 5.00 | — | — |
| 3 | web | 7.20 | 4.60 | 8.80 | — | — |
| 4 | ambas | 11.80 | 4.40 | 14.24 | — | — |
| 5 | cierre | 16.20 | 4.30 | 18.35 | — | — |

## Correcciones automáticas aplicadas

Ninguna: el layout pasó a la primera.

## Reglas

- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).
- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.
- Sin superposición entre bloques de texto visibles (opacidad > 0,6).
- Zona vacía: advertencia si hay más de 420 px verticales sin contenido.
- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.
