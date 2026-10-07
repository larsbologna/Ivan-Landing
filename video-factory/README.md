# Iván Bologna · Fábrica de videos

Sistema para generar videos verticales premium (1080×1920, 30 fps) que promocionan
servicios de presencia online para negocios locales. **Para hacer un video nuevo sólo se
crea un archivo en `scenes/`.** El motor, los componentes, el audio y el render no se tocan.

Todo se construye con tipografía cinética, formas, interfaces estilizadas y luz.
**Sin fotos, sin stock, sin imágenes generadas por IA, sin capturas reales.**

## Entregables de esta versión

| Qué | Dónde |
|---|---|
| Video demo "Tu presencia online" (19,5 s, con locución) | `out/presencia/presencia.mp4` · póster `out/presencia/poster.jpg` |
| Muestra en tema claro (idea 5, con locución) | `out/primera-impresion/primera-impresion.mp4` |
| Capturas de control (QA) de las 11 escenas | `out/<nombre>/qa/contact.jpg`, `contact-overlay.jpg`, `qa-report.md` |
| Autoanálisis del render (frames cada 0,5 s, loudness, cortes) | `out/presencia/analysis/` |
| Análisis del video de referencia | `analysis/reference-report.md` |
| 10 ideas nuevas, listas para renderizar | `scenes/*.js` (ver `IDEAS.md`) |

## Uso

```bash
cd video-factory
node snap.js presencia          # QA: capturas de revisión + validaciones + correcciones automáticas
node render.js presencia        # QA → frames en paralelo → cues.json → audio.wav → MP4
node render.js sin-resenas --workers 4 --music pulse
```

Requisitos: Node 22, Playwright (usa el instalado; no descarga browsers), Chromium,
FFmpeg, Python 3 con `numpy` y `scipy` (`pip install numpy scipy`).
Para la locución: `bash audio/get-voice.sh` (instala `sherpa-onnx` y baja el modelo Kokoro, ~350 MB,
a `models/`; no se versiona).
Si Chromium está en otra ruta: `CHROMIUM_PATH=/ruta/chromium node render.js …`.

Ver un frame en el navegador: abrí `engine/index.html?scene=presencia&t=12.5`.

## Estructura

```
video-factory/
├── scenes/                 ← lo ÚNICO que se edita para hacer videos nuevos
│   ├── _plantilla.js
│   ├── presencia.js        (demo)
│   └── … 10 ideas
├── engine/
│   ├── index.html          escenario 1080×1920; carga ?scene=<nombre>
│   ├── engine.js           motor determinista (__seek, __cues, __qa, __info)
│   ├── components.js       TextReveal, Typewriter, ProgressRing, HexFeature, PillCascade,
│   │                       KeywordCircle, UICard, Lever, Glyph, OutroBrand, SceneTransition
│   ├── themes.js           paletas + fondo diseñado (glows, anillos, grilla, partículas, grano)
│   ├── styles.css
│   └── fonts/              Inter Display + Inter (incluidas: render idéntico en cualquier máquina)
├── audio/
│   ├── sfx.py              audio procedural (numpy + scipy) + mezcla con la voz
│   ├── voice.py            locución neuronal local (Kokoro vía sherpa-onnx) + cadena de locutor
│   └── get-voice.sh        descarga el modelo de voz
├── snap.js                 control de calidad con autocorrección
├── render.js               render en paralelo + mux
├── lib.js                  utilidades compartidas
├── analysis/
│   ├── analyze.sh          ffprobe + frames cada 0,5 s + hoja de contactos + loudness + onsets
│   ├── reference-report.md
│   └── reference/          capturas del video de referencia
└── out/<nombre>/           <nombre>.mp4, poster.jpg, cues.json, qa/, analysis/
```

## Cómo se escribe una escena

```js
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "midnight";          // o { theme: "ocean", accent: "#4DA3FF" }
const DURATION = [15, 20];          // rango (o un número exacto)
const VOICE = { voice: "em_alex", speed: 1.15 };   // null = sin locución

scene("gancho", null, [
  TextReveal({ text: "¿Tu negocio\ntiene *reseñas*?", size: 130, weight: 800, y: -40, role: "hero" }),
], { vo: "¿Tu negocio tiene reseñas?", voAt: 0.2, hold: 0.25, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })],
  { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9 });
```

`scene(id, duración, [componentes], opciones)`

- **Coordenadas:** `x`, `y` en px desde el centro de la pantalla; `y` negativo es arriba.
  `z` es profundidad (negativo = más lejos). Zona segura de texto: `y` entre −760 y +600.
- **Texto:** `*palabra*` = color de acento · `\n` = salto de línea.
- **`camera`:** `from` / `to` con `x, y, z, rx, ry, rz` y `ease`. La cámara se mueve
  durante toda la escena; los elementos con distinto `z` generan parallax real.
- **`bg`:** `glow: [x, y]`, `glow2`, `tint: "warn"` (luz roja para problemas), `rings`, `ringScale`,
  `grid`, `intensity`. El fondo es continuo e interpola entre escenas.
- **`transition`:** `{ type: "blur" | "zoom" | "push" | "fade", dur: 0.45, sound: "whoosh" }`.
- **`vo`:** la frase que dice la voz en esa escena. Con duración `null`, la escena dura
  `voAt + duración de la voz + hold`. Si el total queda por debajo del mínimo de `DURATION`,
  el motor estira las pausas; si pasa el máximo, el QA lo frena.

Opciones comunes a todos los componentes: `at` (inicio, en segundos de la escena), `out`
(salida opcional), `x`, `y`, `z`, `rx`, `ry`, `scale`, `float` (flotación en px), `id`.

| Componente | Para qué | Opciones clave |
|---|---|---|
| `TextReveal` | Entrada palabra por palabra (blur + opacidad + translateY) | `text`, `size`, `weight`, `color`, `accent`, `role`, `stagger`, `marks: { palabra: "circle"\|"strike"\|"underline" }`, `maxWidth`, `maxLines` |
| `Eyebrow` | Etiqueta chica con tracking | `text` |
| `Typewriter` | Máquina de escribir (con sonido por tecla) | `text`, `cps`, `variant: "search"`, `placeholder` |
| `ProgressRing` | Anillo + contador con rebote | `from`, `to`, `dur`, `suffix`, `diameter`, `numberSize` |
| `HexFeature` | Hexágono + ícono + etiqueta | `icon`, `label`, `tone: "accent"\|"warn"`, `badge: "down"` |
| `PillCascade` | Lista en cascada con spring | `items: [{ icon, text, hl }]`, `stagger`, `from: "depth"\|"right"\|"left"`, `check` |
| `KeywordCircle` | Palabra destacada con círculo dibujado | `text`, `size`, `circleAt` |
| `UICard` | Interfaces estilizadas | `kind: "maps"\|"chat"\|"review"\|"web"\|"results"\|"booking"`, `data`, `glow`, `dim` (profundidad de campo) |
| `Glyph` | Ícono grande | `icon`, `size` |
| `Lever` | Palanca geométrica | `width` |
| `OutroBrand` | Cierre de marca + CTA | toma `BRAND`, `TAGLINE`, `CTA`; monograma automático (IB), ajuste de ancho; `note`, `tracking` |
| `SceneTransition` | Transiciones entre escenas | se configura con `transition` |

Íconos: `web pin star chat grid layers users shield trend search check down phone calendar route spark clock qr eye x`.

Temas: `midnight` (default), `ivory` (claro), `emerald`, `ocean`, `violet`, `gold`, `aurora`.

## Motor determinista

- Todo el estado visual es una función pura de `t`. No hay `requestAnimationFrame`,
  timers ni transiciones CSS (están desactivadas globalmente).
- `window.__seek(t)` dibuja cualquier instante, en cualquier orden. Verificado: el mismo `t`
  da exactamente los mismos píxeles aunque se llegue desde otro frame.
- Resortes analíticos (sin integración paso a paso) y PRNG con semilla para partículas y tipeo.
- `window.__cues()` devuelve los eventos de audio que los componentes registran al construirse,
  así el sonido siempre cae en el frame exacto de la animación.

## Control de calidad (`snap.js`)

Muestrea cada escena cada 0,2 s y en su momento de reposo, y detecta:

- **errores** (bloquean el render): texto fuera de la zona segura, texto cortado, texto chico
  (< 34 px efectivos en titulares y cuerpo, < 26 px en UI y etiquetas), superposición entre
  bloques de texto, duración fuera de `DURATION`, voz que no entra en su escena;
- **advertencias**: zonas vacías, composición cargada arriba, jerarquía débil, poco tiempo
  de lectura, elementos que salen antes de asentarse.

Lo que puede corregir lo corrige solo (achica, reubica, separa) y lo guarda en
`out/<nombre>/qa/fixes.json`; vuelve a generar previews y repite hasta pasar (máx. 6 vueltas).
`render.js` sólo renderiza si el QA aprueba (o con `--force`). `--reset` borra los fixes.

## Locución (`audio/voice.py`)

Voz neuronal que corre local, sin servicios externos ni claves: Kokoro v1.0 (`em_alex`, español
latino) vía sherpa-onnx. Se eligió frente a otras voces locales (Piper con acento argentino,
Kokoro `em_santa` / `ef_dora`) verificando cada frase con reconocimiento de voz (Whisper):
`em_alex` fue la única que se transcribió casi sin errores.
- Cadena de locutor: recorte de silencios, pasaaltos, presencia, de-esser suave, compresión y nivel.
- `RESPELL` corrige pronunciaciones sólo para el audio (googlea → gúglea, QR → cu erre).
- Caché por texto + voz + velocidad: sólo se resintetiza lo que cambió (`out/<nombre>/vo/`).
- En la mezcla la voz va adelante: la música baja ~60 % y los efectos ~45 % mientras habla.

## Audio procedural (`audio/sfx.py`)

Sin samples: whoosh, pop, tick, ding, impact, swipe, chime y typewriter se sintetizan con
numpy/scipy. Cadena: paneo leve de potencia constante → reverb corto por convolución con IR
sintética → cama musical (pad con progresión lenta, `--music pad|pulse|none`) con ducking →
normalización de loudness ≈ −14 LUFS (BS.1770) → limitador tanh → fade final.

## Render (`render.js`)

Playwright + Chromium headless, workers en paralelo (bloques intercalados), captura PNG sin
pérdida vía CDP, H.264 High CRF 16 BT.709 + AAC 192 kb/s, `faststart`. Exporta `cues.json`,
`audio.wav` (no se versiona), `poster.jpg` y un autoanálisis del MP4 en `out/<nombre>/analysis/`.
Con `--keep-frames` conserva los PNG en `out/<nombre>/frames/`.
