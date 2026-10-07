#!/usr/bin/env python3
"""
Locución neuronal local (sin servicios externos) con Kokoro vía sherpa-onnx.

Uso:
  python3 audio/voice.py lines.json <carpeta-salida> [--voice em_alex] [--speed 1.08] [--models models]

lines.json: [{"id": "gancho", "text": "Si tenés un negocio, mirá esto."}, ...]
Salida: <carpeta>/<id>.wav (48 kHz mono, procesado) y <carpeta>/voice.json {id: segundos}.
Cachea por texto + voz + velocidad: sólo resintetiza lo que cambió.

Cadena "de locutor": recorte de silencios → pasaaltos 80 Hz → leve recorte de graves
→ presencia (+2,5 dB ~3,5 kHz) → de-esser suave → compresión 3:1 → nivel a -18 dBFS RMS.
"""
import argparse
import hashlib
import json
import os

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
# Kokoro v1.0 multi-idioma: IDs de las voces en español
VOICES = {"em_alex": 29, "em_santa": 30, "ef_dora": 28}
# Pronunciación: palabras que el TTS lee mejor escritas de otra forma (sólo para el audio)
RESPELL = {"googlea": "gúglea", "googlean": "gúglean", "qr": "cu erre", "nfc": "ene efe ce"}


def respell(text):
    out = []
    for w in text.split(" "):
        core = w.strip(".,;:!?¡¿").lower()
        if core in RESPELL:
            w = w.replace(w.strip(".,;:!?¡¿"), RESPELL[core])
        out.append(w)
    return " ".join(out)


def load_tts(models, threads=4):
    import sherpa_onnx
    d = os.path.join(models, "kokoro-multi-lang-v1_0")
    if not os.path.exists(os.path.join(d, "model.onnx")):
        raise SystemExit(f"Falta el modelo de voz en {d}. Corré: bash audio/get-voice.sh")
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=f"{d}/model.onnx", voices=f"{d}/voices.bin", tokens=f"{d}/tokens.txt",
            data_dir=f"{d}/espeak-ng-data", dict_dir=f"{d}/dict", lexicon=f"{d}/lexicon-us-en.txt", lang="es-419"),
        num_threads=threads))
    return sherpa_onnx.OfflineTts(cfg)


def peaking(x, f0, gain_db, q):
    a = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    b = [1 + al * a, -2 * np.cos(w), 1 - al * a]
    den = [1 + al / a, -2 * np.cos(w), 1 - al / a]
    return signal.lfilter(np.array(b) / den[0], np.array(den) / den[0], x)


def compress(x, thresh_db=-24, ratio=3.0, attack=0.005, release=0.12):
    env = np.abs(x)
    a_a, a_r = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    e = np.zeros_like(env)
    prev = 0.0
    for i, v in enumerate(env):  # seguidor de envolvente
        c = a_a if v > prev else a_r
        prev = c * prev + (1 - c) * v
        e[i] = prev
    lvl = 20 * np.log10(e + 1e-9)
    over = np.maximum(0, lvl - thresh_db)
    gain = 10 ** (-(over - over / ratio) / 20)
    return x * gain


def process(x, sr_in):
    # recorte de silencios con margen
    idx = np.where(np.abs(x) > 0.008)[0]
    if len(idx):
        x = x[max(0, idx[0] - int(0.01 * sr_in)): idx[-1] + int(0.06 * sr_in)]
    # a 48 kHz
    x = signal.resample_poly(x, SR, sr_in)
    x = signal.sosfilt(signal.butter(2, 80, btype="high", fs=SR, output="sos"), x)
    x = peaking(x, 220, -1.5, 0.9)    # menos "barro"
    x = peaking(x, 3500, 2.5, 0.8)    # presencia
    x = peaking(x, 7200, -2.0, 2.5)   # de-esser suave (estático)
    x = compress(x)
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    x = x * (10 ** (-18 / 20) / rms)
    x = np.clip(x, -0.98, 0.98)
    f = int(0.008 * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return x


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lines")
    ap.add_argument("out")
    ap.add_argument("--voice", default="em_alex")
    ap.add_argument("--speed", type=float, default=1.08)
    ap.add_argument("--models", default=os.path.join(os.path.dirname(__file__), "..", "models"))
    a = ap.parse_args()
    lines = json.load(open(a.lines))
    os.makedirs(a.out, exist_ok=True)
    cache_f = os.path.join(a.out, "cache.json")
    cache = json.load(open(cache_f)) if os.path.exists(cache_f) else {}
    tts = None
    durs = {}
    for ln in lines:
        text = ln["text"]
        key = hashlib.sha1(f"{a.voice}|{a.speed}|{respell(text)}".encode()).hexdigest()[:16]
        wav = os.path.join(a.out, f"{ln['id']}.wav")
        if cache.get(ln["id"], {}).get("key") == key and os.path.exists(wav):
            durs[ln["id"]] = cache[ln["id"]]["dur"]
            continue
        if tts is None:
            tts = load_tts(a.models)
        g = tts.generate(respell(text), sid=VOICES.get(a.voice, 29), speed=a.speed)
        x = process(np.array(g.samples, dtype=np.float64), g.sample_rate)
        wavfile.write(wav, SR, (x * 32767).astype(np.int16))
        d = round(len(x) / SR, 3)
        durs[ln["id"]] = d
        cache[ln["id"]] = {"key": key, "dur": d, "text": text}
        print(f"  voz {ln['id']}: {d:.2f} s · {text}")
    json.dump(cache, open(cache_f, "w"), ensure_ascii=False, indent=1)
    json.dump(durs, open(os.path.join(a.out, "voice.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
