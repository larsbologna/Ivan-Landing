# QA · presencia

Estado: **APROBADO** · iteraciones: 1 · duración 38.40 s · 10 escenas

![Revisión](contact.jpg)

Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)

| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |
|---|---|---|---|---|---|---|
| 1 | atencion | 0.00 | 1.80 | 0.82 | — | — |
| 2 | mira | 1.80 | 2.80 | 3.00 | — | — |
| 3 | googlea | 4.60 | 3.80 | 7.73 | — | — |
| 4 | cinco | 8.40 | 5.00 | 12.90 | — | — |
| 5 | perdes | 13.40 | 5.00 | 16.60 | — | — |
| 6 | cascada | 18.40 | 5.60 | 22.50 | — | — |
| 7 | unlugar | 24.00 | 4.00 | 25.98 | — | — |
| 8 | gasto | 28.00 | 2.80 | 30.25 | — | — |
| 9 | palanca | 30.80 | 3.60 | 33.45 | — | — |
| 10 | cierre | 34.40 | 4.00 | 36.55 | — | — |

## Correcciones automáticas aplicadas

- `googlea/2` → {"scale":0.95} (fuera-de-zona:left)
- `perdes/4` → {"y":376} (fuera-de-zona:bottom)
- `perdes/0` → {"y":-635} (fuera-de-zona:top)

## Reglas

- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).
- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.
- Sin superposición entre bloques de texto visibles (opacidad > 0,6).
- Zona vacía: advertencia si hay más de 420 px verticales sin contenido.
- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.
