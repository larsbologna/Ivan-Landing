# QA · maps-abandonado

Estado: **APROBADO** · iteraciones: 1 · duración 15.30 s · 5 escenas

![Revisión](contact.jpg)

Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)

| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |
|---|---|---|---|---|---|---|
| 1 | gancho | 0.00 | 2.57 | 0.97 | — | — |
| 2 | ficha | 2.57 | 2.83 | 3.99 | — | — |
| 3 | duda | 5.41 | 2.66 | 7.61 | — | — |
| 4 | solucion | 8.07 | 3.04 | 9.82 | — | zona-vacia (454px) |
| 5 | cierre | 11.10 | 4.20 | 13.10 | — | — |

## Correcciones automáticas aplicadas

Ninguna: el layout pasó a la primera.

## Reglas

- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).
- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.
- Sin superposición entre bloques de texto visibles (opacidad > 0,6).
- Zona vacía: advertencia si hay más de 420 px verticales sin contenido.
- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.
