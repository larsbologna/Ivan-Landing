# QA · como-te-eligen

Estado: **APROBADO** · iteraciones: 1 · duración 15.30 s · 6 escenas

![Revisión](contact.jpg)

Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)

| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |
|---|---|---|---|---|---|---|
| 1 | gancho | 0.00 | 2.00 | 0.90 | — | — |
| 2 | busca | 2.00 | 1.67 | 3.65 | — | zona-vacia (440px)<br>poco-tiempo-de-lectura |
| 3 | compara | 3.67 | 1.78 | 4.60 | — | — |
| 4 | confia | 5.45 | 1.75 | 6.38 | — | — |
| 5 | escribe | 7.21 | 3.90 | 9.61 | — | — |
| 6 | cierre | 11.11 | 4.19 | 13.11 | — | — |

## Correcciones automáticas aplicadas

Ninguna: el layout pasó a la primera.

## Reglas

- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).
- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.
- Sin superposición entre bloques de texto visibles (opacidad > 0,6).
- Zona vacía: advertencia si hay más de 420 px verticales sin contenido.
- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.
