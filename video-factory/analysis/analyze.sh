#!/usr/bin/env bash
# Analiza un video (referencia o render propio): metadatos, frames cada 0,5 s,
# hoja de contactos, cortes de escena, loudness y onsets de audio.
#
# Uso: bash analysis/analyze.sh <video.mp4> <carpeta-salida>
set -euo pipefail
IN="$1"; OUT="$2"
mkdir -p "$OUT/frames"

ffprobe -v error -show_format -show_streams "$IN" > "$OUT/ffprobe.txt"

# Frames cada 0,5 s (270 px de ancho, suficiente para revisar composición)
ffmpeg -v error -y -i "$IN" -vf "fps=2,scale=270:-1" -q:v 4 "$OUT/frames/f_%03d.jpg"

# Hoja de contactos con timecode
ffmpeg -v error -y -i "$IN" -vf "fps=2,scale=216:-1,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=10x8" \
  -frames:v 1 -q:v 4 "$OUT/contact-sheet.jpg"

# Cortes de escena
ffmpeg -nostats -i "$IN" -vf "select='gt(scene,0.2)',showinfo" -an -f null - 2>&1 \
  | grep -o "pts_time:[0-9.]*" | cut -d: -f2 > "$OUT/scene-cuts.txt" || true

# Loudness (EBU R128)
ffmpeg -nostats -i "$IN" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' > "$OUT/loudness.txt" || true

# Onsets de audio (saltos de +6 dB en ventanas de 100 ms)
ffmpeg -v error -i "$IN" -ac 1 -ar 8000 -f f32le - | python3 -I -c "
import sys, numpy as np
a = np.frombuffer(sys.stdin.buffer.read(), np.float32)
if a.size == 0: sys.exit(0)
w = 800
r = np.sqrt(np.convolve(a * a, np.ones(w) / w, 'same'))[::w]
db = 20 * np.log10(r + 1e-9)
print('\n'.join(f'{i/10:.1f}' for i in range(1, len(db)) if db[i] - db[i-1] > 6 and db[i] > -35))
" > "$OUT/audio-onsets.txt" || true

echo "Análisis listo en $OUT"
