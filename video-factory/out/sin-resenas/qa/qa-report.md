# QA · sin-resenas

Estado: **APROBADO** · iteraciones: 1 · duración 15.15 s · 5 escenas

![Revisión](contact.jpg)

Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)

| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |
|---|---|---|---|---|---|---|
| 1 | gancho | 0.00 | 2.07 | 0.82 | — | — |
| 2 | ficha | 2.07 | 3.14 | 3.59 | — | — |
| 3 | como | 5.21 | 3.23 | 7.05 | — | — |
| 4 | remate | 8.44 | 2.66 | 10.19 | — | — |
| 5 | cierre | 11.10 | 4.05 | 13.10 | — | — |

## Correcciones automáticas aplicadas

Ninguna: el layout pasó a la primera.

## Reglas

- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).
- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.
- Sin superposición entre bloques de texto visibles (opacidad > 0,6).
- Zona vacía: advertencia si hay más de 420 px verticales sin contenido.
- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.
