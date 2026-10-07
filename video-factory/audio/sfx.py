#!/usr/bin/env python3
"""
Audio procedural para la fábrica de videos. Sin samples externos: todo se sintetiza
con numpy + scipy a partir de cues.json (eventos que emite el motor visual).

Uso:
  python3 audio/sfx.py cues.json audio.wav --duration 38 [--music pad|pulse|none] [--seed 1]

Efectos: whoosh, pop, tick, ding, impact, swipe, chime, typewriter.
Locución: cues "vo" → <vo-dir>/<id>.wav (ver audio/voice.py), con ducking de música y efectos.
Cadena final: paneo leve → reverb corto → cama musical → limitador tanh → normalización → fade final.
"""
import argparse
import json
import os

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000


# ---------------------------------------------------------------- utilidades
def env_adsr(n, a=0.005, d=0.05, s=0.0, r=0.1, sr=SR):
    """Envolvente ADSR de n muestras (s = nivel de sustain)."""
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    sus = max(0, n - a - d - r)
    e = np.concatenate([
        np.linspace(0, 1, max(a, 1), endpoint=False),
        np.linspace(1, s, max(d, 1), endpoint=False),
        np.full(sus, s),
        np.linspace(s, 0, max(r, 1)),
    ])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def exp_decay(n, tau, sr=SR):
    return np.exp(-np.arange(n) / (tau * sr))


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def sweep_filter(noise, f0, f1, q=2.0, blocks=64):
    """Filtro pasabanda con frecuencia central que barre de f0 a f1 (por bloques)."""
    out = np.zeros_like(noise)
    n = len(noise)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    zi = None
    for i in range(blocks):
        fc = f0 * (f1 / f0) ** (i / (blocks - 1))
        bw = fc / q
        lo, hi = max(30, fc - bw / 2), min(SR / 2 - 100, fc + bw / 2)
        sos = signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        seg, zi = signal.sosfilt(sos, noise[edges[i]:edges[i + 1]], zi=zi)
        out[edges[i]:edges[i + 1]] = seg
    return out


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-12
    return x / m * peak


# ---------------------------------------------------------------- efectos (mono)
def whoosh(rng, pitch=1.0):
    dur = 0.55
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    x = sweep_filter(noise, 380 * pitch, 3200 * pitch, q=1.6)
    t = np.linspace(0, 1, n)
    e = np.sin(np.pi * t ** 0.7) ** 2
    return norm(x * e, 0.8), "sweep"


def swipe(rng, pitch=1.0):
    n = int(0.22 * SR)
    x = sweep_filter(rng.standard_normal(n), 2400 * pitch, 7000 * pitch, q=2.5)
    t = np.linspace(0, 1, n)
    return norm(hp(x, 1500) * np.sin(np.pi * t) ** 1.5, 0.5), "sweep"


def pop(rng, pitch=1.0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 720 * pitch * (1 + 0.9 * np.exp(-t * 60))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * exp_decay(n, 0.028)
    click = hp(rng.standard_normal(n), 3000) * exp_decay(n, 0.002) * 0.25
    return norm(x + click, 0.7), None


def tick(rng, pitch=1.0):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2600 * pitch * t) * exp_decay(n, 0.006)
    x += bp(rng.standard_normal(n), 3000, 9000) * exp_decay(n, 0.0025) * 0.6
    return norm(x, 0.55), None


def ding(rng, pitch=1.0):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f0 = 1046.5 * pitch  # Do6
    partials = [(1.0, 1.0, 0.9), (2.756, 0.35, 0.45), (5.404, 0.18, 0.25), (2.0, 0.2, 0.7)]
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * exp_decay(n, tau) for r, a, tau in partials)
    x *= env_adsr(n, a=0.002, d=0.01, s=1.0, r=0.05)
    return norm(x, 0.6), None


def chime(rng, pitch=1.0):
    # arpegio Maj9 (Re · Fa# · La · Do# · Mi)
    notes = [587.33, 739.99, 880.0, 1108.73, 1318.51]
    n = int(2.2 * SR)
    out = np.zeros(n)
    for i, f in enumerate(notes):
        off = int(i * 0.075 * SR)
        m = n - off
        t = np.arange(m) / SR
        tone = (np.sin(2 * np.pi * f * pitch * t) + 0.3 * np.sin(2 * np.pi * f * 2.0 * pitch * t) * exp_decay(m, 0.25)) * exp_decay(m, 0.9)
        out[off:] += tone * env_adsr(m, a=0.003, d=0.01, s=1.0, r=0.1) * (0.9 - i * 0.08)
    return norm(out, 0.55), None


def impact(rng, pitch=1.0):
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f = 34 + 70 * np.exp(-t * 22)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * exp_decay(n, 0.42)
    thump = lp(rng.standard_normal(n), 1800) * exp_decay(n, 0.035) * 0.6
    air = bp(rng.standard_normal(n), 2000, 9000) * exp_decay(n, 0.12) * 0.12
    x = np.tanh(1.6 * (body + thump)) + air
    return norm(x, 0.95), None


def typewriter(rng, pitch=1.0):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    click = bp(rng.standard_normal(n), 1800 * pitch, 6500) * exp_decay(n, 0.004)
    body = np.sin(2 * np.pi * (180 + rng.uniform(-20, 20)) * pitch * t) * exp_decay(n, 0.012) * 0.5
    return norm(click + body, 0.4), None


SFX = dict(whoosh=whoosh, swipe=swipe, pop=pop, tick=tick, ding=ding, chime=chime, impact=impact, typewriter=typewriter)
LEVEL = dict(whoosh=0.55, swipe=0.35, pop=0.42, tick=0.32, ding=0.5, chime=0.5, impact=0.9, typewriter=0.22)


# ---------------------------------------------------------------- cama musical
def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pad_bed(duration, rng, style="pad"):
    """Pad cálido (sierras desafinadas filtradas) con progresión lenta + pulso opcional."""
    n = int(duration * SR)
    t = np.arange(n) / SR
    # progresión: Dmaj9 → Bm9 → Gmaj7 → A6sus (en voicings abiertos)
    chords = [[50, 57, 64, 66, 69], [47, 54, 62, 64, 69], [43, 50, 59, 62, 66], [45, 52, 59, 61, 64]]
    seg = 4.8
    out = np.zeros((n, 2))
    for ci in range(int(np.ceil(duration / seg)) + 1):
        start = ci * seg - 0.6
        notes = chords[ci % len(chords)]
        a, b = max(0, int(start * SR)), min(n, int((start + seg + 1.2) * SR))
        if b <= a:
            continue
        tt = t[a:b] - start
        m = b - a
        e = np.clip(tt / 1.2, 0, 1) * np.clip((seg + 1.2 - tt) / 1.2, 0, 1)
        for k, note in enumerate(notes):
            f = midi(note)
            for side, det in ((0, -0.08), (1, 0.08)):
                ph = rng.uniform(0, 2 * np.pi)
                saw = signal.sawtooth(2 * np.pi * f * (1 + det / 100 * (k + 1)) * tt + ph)
                out[a:b, side] += saw * e * (0.16 if k == 0 else 0.1)
    # filtro pasabajos que "respira"
    for ch in range(2):
        out[:, ch] = lp(out[:, ch], 900, order=4)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t)
    out *= lfo[:, None]
    if style == "pulse":
        bpm = 100
        beat = 60 / bpm
        pulse = np.zeros(n)
        k = 0
        while k * beat / 2 < duration:
            i0 = int(k * beat / 2 * SR)
            m = min(int(0.09 * SR), n - i0)
            if m > 0:
                pulse[i0:i0 + m] += hp(rng.standard_normal(m), 7000) * exp_decay(m, 0.012) * (0.5 if k % 2 else 0.25)
            k += 1
        out += pulse[:, None] * 0.25
    return out


# ---------------------------------------------------------------- espacio
def reverb_ir(rng, length=0.7, tau=0.22):
    n = int(length * SR)
    ir = np.zeros((n, 2))
    for ch in range(2):
        noise = rng.standard_normal(n)
        ir[:, ch] = lp(noise, 6000) * exp_decay(n, tau)
    ir[: int(0.012 * SR)] = 0  # pre-delay 12 ms
    return ir / np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))


def pan_stereo(x, pan):
    """Paneo de potencia constante. pan en [-1, 1]."""
    p = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(p), x * np.sin(p)], axis=1)


def loudness(x):
    """Loudness integrado aproximado según ITU-R BS.1770 (ponderación K + gating)."""
    # ponderación K: shelf de agudos + pasaaltos
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([np.mean(y[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk, hop)])
    lk = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[lk > -70]
    if not len(g):
        return -70.0
    rel = -0.691 + 10 * np.log10(np.mean(g)) - 10
    g = ms[(lk > -70) & (lk > rel)]
    return -0.691 + 10 * np.log10(np.mean(g) + 1e-12)


def render(cues, duration, music="pad", seed=1, target_lufs=-14.0, vo_dir=None):
    rng = np.random.default_rng(seed)
    n = int((duration + 0.05) * SR)
    dry = np.zeros((n, 2))
    cache = {}
    last = {}
    for i, c in enumerate(sorted(cues, key=lambda c: c["t"])):
        kind = c["type"]
        if kind not in SFX:
            continue
        # evita apilar el mismo efecto en menos de 35 ms
        if c["t"] - last.get(kind, -1) < 0.035:
            continue
        last[kind] = c["t"]
        r = np.random.default_rng(seed * 1000 + i)
        key = (kind, round(c.get("pitch", 1), 3)) if kind not in ("typewriter", "whoosh", "swipe") else None
        if key and key in cache:
            x, mode = cache[key]
        else:
            x, mode = SFX[kind](r, c.get("pitch", 1.0))
            if key:
                cache[key] = (x, mode)
        g = LEVEL[kind] * c.get("gain", 1.0)
        pan = c.get("pan", 0.0) * 0.6  # paneo leve
        if mode == "sweep":
            # el whoosh viaja de un lado al otro
            m = len(x)
            pans = np.linspace(-0.35, 0.35, m) + pan
            p = (np.clip(pans, -1, 1) + 1) * np.pi / 4
            st = np.stack([x * np.cos(p), x * np.sin(p)], axis=1)
        else:
            st = pan_stereo(x, pan)
        i0 = int(c["t"] * SR)
        i1 = min(n, i0 + len(st))
        if i1 > i0:
            dry[i0:i1] += st[: i1 - i0] * g

    # reverb corto (envío ~18 %)
    ir = reverb_ir(rng)
    wet = np.stack([signal.fftconvolve(dry[:, ch], ir[:, ch])[:n] for ch in range(2)], axis=1)
    sfx = dry + wet * 0.18

    # bus de locución: cada cue "vo" coloca <vo_dir>/<id>.wav (48 kHz mono) en el centro
    vo = np.zeros(n)
    for c in cues:
        if c["type"] != "vo" or not vo_dir:
            continue
        f = os.path.join(vo_dir, f"{c['id']}.wav")
        if not os.path.exists(f):
            continue
        sr, x = wavfile.read(f)
        x = x.astype(np.float64) / 32768.0
        if x.ndim > 1:
            x = x.mean(axis=1)
        if sr != SR:
            x = signal.resample_poly(x, SR, sr)
        i0 = int(c["t"] * SR)
        i1 = min(n, i0 + len(x))
        if i1 > i0:
            vo[i0:i1] += x[: i1 - i0]
    has_vo = np.any(vo)
    # envolvente de la voz (para ducking): rápida al subir, lenta al bajar
    vo_env = np.clip(lp(np.abs(vo), 6) / (np.max(lp(np.abs(vo), 6)) + 1e-9) * 2.5, 0, 1) if has_vo else np.zeros(n)
    if has_vo:
        vo_room = signal.fftconvolve(vo, ir[:, 0])[:n] * 0.05  # sala mínima: la voz queda adelante
        vo_st = np.stack([vo + vo_room, vo + vo_room], axis=1) * 1.6
        sfx = sfx * 0.6 * (1 - 0.45 * vo_env)[:, None]  # los efectos acompañan, no tapan
        mix = sfx + vo_st
    else:
        mix = sfx

    if music != "none":
        bed = pad_bed(duration + 0.05, rng, style=music)[:n]
        bed = bed / (np.max(np.abs(bed)) + 1e-9) * (0.13 if has_vo else 0.16)
        # ducking: la cama baja con los efectos y bastante más con la voz
        envf = lp(np.abs(dry).sum(axis=1), 8)
        duck = 1 - 0.45 * np.clip(envf / (np.max(envf) + 1e-9) * 3, 0, 1)
        duck *= 1 - 0.6 * vo_env
        mix += bed * duck[:, None]

    # normalización de loudness (≈ -14 LUFS, estándar de redes) + limitador tanh
    for _ in range(3):
        lufs = loudness(mix)
        mix = mix * 10 ** ((target_lufs - lufs) / 20)
        mix = np.tanh(mix * 1.15) / 1.15  # limitador suave: comprime sólo los picos
    if np.max(np.abs(mix)) > 10 ** (-1.0 / 20):
        mix = norm(mix, 10 ** (-1.0 / 20))  # pico a -1 dBFS

    # fade de entrada mínimo y fade final
    fi = int(0.01 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(min(1.2, duration * 0.1) * SR)
    mix[-fo:] *= (np.linspace(1, 0, fo) ** 2)[:, None]
    return mix[: int(duration * SR)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cues")
    ap.add_argument("out")
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--music", default="pad", choices=["pad", "pulse", "none"])
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--vo-dir", default=None)
    a = ap.parse_args()
    with open(a.cues) as f:
        cues = json.load(f)
    mix = render(cues, a.duration, a.music, a.seed, vo_dir=a.vo_dir)
    wavfile.write(a.out, SR, (mix * 32767).astype(np.int16))
    print(f"audio: {a.out} · {a.duration:.2f} s · {len(cues)} cues · música={a.music}")


if __name__ == "__main__":
    main()
