# Efectos de sonido sintetizados (sutiles).
import numpy as np
SR = 48000
rng = np.random.default_rng(3)

def env(n, a, d, sus=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
    return e

def lp(x, fc):
    # filtro pasa-bajos de un polo, aplicado dos veces
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x); s = 0.0
    for _ in range(2):
        out = np.empty_like(x); s = 0.0
        for i in range(len(x)):
            s = (1 - a) * x[i] + a * s; out[i] = s
        x = out
    return x

def lp_fast(x, fc):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(4, fc, 'low', fs=SR, output='sos'), x)

def hp_fast(x, fc):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(4, fc, 'high', fs=SR, output='sos'), x)

def bp_fast(x, lo, hi):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)

def sub_hit(dur=1.4, f0=62, f1=34):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(n, 0.004, 0.45)
    click = hp_fast(rng.standard_normal(n), 2000) * env(n, 0.001, 0.008) * 0.15
    return x + click

def room_tone(dur):
    n = int(dur * SR)
    x = lp_fast(rng.standard_normal(n), 900) * 0.6 + lp_fast(rng.standard_normal(n), 250)
    return x / np.abs(x).max()

def tick():
    n = int(0.05 * SR)
    x = bp_fast(rng.standard_normal(n), 2500, 6000) * env(n, 0.0005, 0.006)
    return x / np.abs(x).max()

def chime(freqs=(1318.5, 1760.0), gap=0.09, dur=0.9, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for i, f in enumerate(freqs):
        o = int(i * gap * SR); m = n - o; tt = t[:m]
        tone = (np.sin(2 * np.pi * f * tt) + 0.35 * bright * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 12)
                + 0.12 * np.sin(2 * np.pi * 3.01 * f * tt) * np.exp(-tt * 20))
        out[o:] += tone * env(m, 0.003, 0.22)
    return out / np.abs(out).max()

def muffled_notif():
    return lp_fast(chime((1046.5, 1318.5), 0.11, 0.8), 1100)

def page_flip():
    n = int(0.35 * SR); t = np.arange(n) / SR
    x = bp_fast(rng.standard_normal(n), 800, 7000)
    e = np.exp(-((t - 0.12) / 0.07) ** 2) + 0.4 * np.exp(-((t - 0.22) / 0.03) ** 2)
    return x * e / np.abs(x * e).max()

def whoosh(dur=0.7):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    # barrido de un pasa-banda simulando aire que pasa
    from scipy.signal import butter, sosfilt
    out = np.zeros(n); seg = 2400
    for i in range(0, n, seg):
        k = i / n; fc = 400 + 5000 * k ** 1.5
        sos = butter(2, [fc * 0.6, min(fc * 1.6, 20000)], 'band', fs=SR, output='sos')
        out[i:i + seg] = sosfilt(sos, x[i:i + seg])
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    out = out * e
    return out / np.abs(out).max()

def shimmer(dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for f, d in [(2637, 0.0), (3136, 0.05), (3951, 0.1), (5274, 0.16)]:
        o = int(d * SR); tt = t[: n - o]
        out[o:] += np.sin(2 * np.pi * f * tt) * env(n - o, 0.01, 0.35) * 0.5
    return out / np.abs(out).max()

def ui_click():
    n = int(0.04 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1800 * t) * env(n, 0.0005, 0.005) + 0.4 * bp_fast(rng.standard_normal(n), 3000, 9000) * env(n, 0.0003, 0.003)
    return x / np.abs(x).max()

def pop(f=900):
    n = int(0.12 * SR); t = np.arange(n) / SR
    fr = f * (1 + 0.6 * np.exp(-t * 60))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, 0.002, 0.03)
    return x / np.abs(x).max()

def vibrate(dur=0.32):
    n = int(dur * SR); t = np.arange(n) / SR
    buzz = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.5 + np.sin(2 * np.pi * 300 * t) * 0.3
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 22 * t)
    x = lp_fast(buzz * am, 1800) * np.minimum(1, np.minimum(t / 0.01, (dur - t) / 0.03))
    return x / np.abs(x).max()

def murmur(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(6):
        v = bp_fast(rng.standard_normal(n), 250 + 60 * k, 900 + 120 * k)
        am = 0.5 + 0.5 * np.sin(2 * np.pi * (2.2 + 0.7 * k) * t + k) ** 2
        x += v * am
    x = lp_fast(x, 1500)
    return x / np.abs(x).max()

def warm_hit():
    n = int(2.5 * SR); t = np.arange(n) / SR
    x = sub_hit(2.5, 55, 40) * 0.8
    for f, a in [(87.3, 0.5), (174.6, 0.3), (261.6, 0.15)]:
        x += a * np.sin(2 * np.pi * f * t) * env(n, 0.01, 0.9)
    return x / np.abs(x).max()

def soft_kick():
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 45 + 70 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.16)
    return x / np.abs(x).max()
