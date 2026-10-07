# QA · primera-impresion

Estado: **APROBADO** · iteraciones: 1 · duración 20.00 s · 5 escenas

![Revisión](contact.jpg)

Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)

| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |
|---|---|---|---|---|---|---|
| 1 | gancho | 0.00 | 3.00 | 0.90 | — | — |
| 2 | busqueda | 3.00 | 4.40 | 5.60 | — | — |
| 3 | mensaje | 7.40 | 4.60 | 9.94 | — | — |
| 4 | remate | 12.00 | 3.40 | 13.65 | — | — |
| 5 | cierre | 15.40 | 4.60 | 17.55 | — | — |

## Correcciones automáticas aplicadas

Ninguna: el layout pasó a la primera.

## Reglas

- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).
- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.
- Sin superposición entre bloques de texto visibles (opacidad > 0,6).
- Zona vacía: advertencia si hay más de 420 px verticales sin contenido.
- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.
