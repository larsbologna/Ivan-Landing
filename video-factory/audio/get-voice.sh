#!/usr/bin/env bash
# Descarga el modelo de voz (Kokoro v1.0 multi-idioma, ~350 MB) desde los releases de sherpa-onnx en GitHub
# e instala las dependencias de Python. Se guarda en video-factory/models/ (no se versiona).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/models"
mkdir -p "$DIR"
pip install -q sherpa-onnx soundfile numpy scipy
if [ ! -f "$DIR/kokoro-multi-lang-v1_0/model.onnx" ]; then
  curl -L --fail -o "$DIR/kokoro.tar.bz2" https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2
  tar xjf "$DIR/kokoro.tar.bz2" -C "$DIR" && rm "$DIR/kokoro.tar.bz2"
fi
echo "Voz lista en $DIR/kokoro-multi-lang-v1_0"
