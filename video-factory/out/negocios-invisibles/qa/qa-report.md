# QA · negocios-invisibles

Estado: **APROBADO** · iteraciones: 1 · duración 20.50 s · 5 escenas

![Revisión](contact.jpg)

Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)

| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |
|---|---|---|---|---|---|---|
| 1 | gancho | 0.00 | 3.00 | 0.97 | — | — |
| 2 | busqueda | 3.00 | 4.60 | 6.47 | — | — |
| 3 | existir | 7.60 | 3.40 | 8.72 | — | — |
| 4 | solucion | 11.00 | 5.00 | 13.96 | — | — |
| 5 | cierre | 16.00 | 4.50 | 18.15 | — | — |

## Correcciones automáticas aplicadas

Ninguna: el layout pasó a la primera.

## Reglas

- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).
- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.
- Sin superposición entre bloques de texto visibles (opacidad > 0,6).
- Zona vacía: advertencia si hay más de 420 px verticales sin contenido.
- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.
