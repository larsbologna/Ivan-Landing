# QA · maps-abandonado

Estado: **APROBADO** · iteraciones: 1 · duración 25.00 s · 6 escenas

![Revisión](contact.jpg)

Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)

| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |
|---|---|---|---|---|---|---|
| 1 | gancho | 0.00 | 2.60 | 0.97 | — | — |
| 2 | ficha | 2.60 | 4.20 | 4.52 | — | — |
| 3 | errores | 6.80 | 4.80 | 9.20 | — | — |
| 4 | vidriera | 11.60 | 3.20 | 13.55 | — | — |
| 5 | solucion | 14.80 | 5.00 | 17.76 | — | — |
| 6 | cierre | 19.80 | 5.20 | 21.95 | — | — |

## Correcciones automáticas aplicadas

- `ficha/0` → {"y":-708} (superposicion)
- `ficha/1` → {"y":-512} (superposicion)

## Reglas

- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).
- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.
- Sin superposición entre bloques de texto visibles (opacidad > 0,6).
- Zona vacía: advertencia si hay más de 420 px verticales sin contenido.
- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.
