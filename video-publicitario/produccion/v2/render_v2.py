# Render v2: claridad > espectacularidad. 1080x1920, ~24,9 s.
import os, sys, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import soundfile as sf
from scipy.ndimage import uniform_filter1d
import ui, ui2, sfx
from ui import ease, ease_io, font, Canvas, GOLD, GOLD_L, WHITE

B = os.path.dirname(os.path.abspath(__file__)) + "/.."
IMG, AUD = B + "/img", B + "/audio_v2"
W, H, FPS = 1080, 1920, 30
DUR = 24.9
NF = int(DUR * FPS)
PREVIEW = [float(x) for x in os.environ.get("PREVIEW", "").split(",") if x]

SC = {"HOOK": (0.0, 3.45), "P1": (3.45, 6.2), "P2": (6.2, 8.8), "P3": (8.8, 12.2),
      "SOL": (12.2, 18.5), "PROOF": (18.5, 22.0), "CTA": (22.0, DUR)}
VO = [("v1", 0.15), ("v2", 3.60), ("v3", 6.35), ("v4", 8.95), ("v5", 12.50), ("v6", 18.65), ("v7", 22.25)]
HOOK_SHOTS = [("s2_restaurant", "Restaurante"), ("v2_gym", "Gimnasio"), ("v2_shop", "Tienda"),
              ("v2_salon", "Peluquería"), ("v2_garage", "Taller")]
SUBS = {"v5": ["Yo te ayudo a ordenar todo eso:", "*Google*, *WhatsApp*, tu *web* y la forma en que tus clientes te contactan."],
        "v6": ["Ya ayudé a otros negocios.", "Puedo revisar *el tuyo*."]}

def pick(name):
    for c in (name + "_2x.png", name + ".png"):
        if os.path.exists(f"{IMG}/{c}"): return Image.open(f"{IMG}/{c}").convert("RGB")
    raise FileNotFoundError(name)

def grade(img, warm=0.25, sat=0.92, contrast=1.1):
    a = np.asarray(img).astype(np.float32) / 255
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    a = lum[..., None] + (a - lum[..., None]) * sat
    a = np.clip((a - 0.5) * contrast + 0.5, 0, 1) ** 1.06
    a[..., 0] *= 1 + 0.05 * warm; a[..., 2] *= 1 - 0.06 * warm
    return Image.fromarray((np.clip(0.03 + a * 0.94, 0, 1) * 255).astype(np.uint8))

def fit(img):
    """Escala la imagen para cubrir 1188x2112 (margen para el zoom)."""
    iw, ih = img.size; s = max(W * 1.1 / iw, H * 1.1 / ih)
    return img.resize((int(iw * s), int(ih * s)), Image.LANCZOS)

def kb(img, p, z0, z1, dy=0.0):
    iw, ih = img.size; k = ease_io(p)
    z = (W / iw) * 1.1 * 0 + max(W / iw, H / ih) * (z0 + (z1 - z0) * k)
    cw, ch = W / z, H / z
    cx, cy = iw / 2, ih / 2 + dy * k * (ih - ch) / 2
    return img.resize((W, H), Image.BICUBIC, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))

_y, _x = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = np.clip(1 - 0.5 * np.clip(np.sqrt(((_x - W / 2) / (W * 0.62)) ** 2 + ((_y - H / 2) / (H * 0.58)) ** 2) - 0.45, 0, 1) ** 1.6, 0, 1)[..., None]
rng = np.random.default_rng(1)
GRAIN = [rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(4)]

def finish(img, i, dim=1.0, amt=4.0, vig=True):
    a = np.asarray(img).astype(np.float32)
    if vig: a = a * VIG
    g = np.repeat(np.repeat(GRAIN[i % 4], 2, 0), 2, 1)[..., None]
    return Image.fromarray(np.clip(a * dim + g * amt, 0, 255).astype(np.uint8)).convert("RGBA")

print("cargando…", flush=True)
def _safe_pick(n):
    try: return pick(n)
    except FileNotFoundError: return pick("s2_restaurant")   # solo para previsualizar
HOOK_IMG = [fit(grade(_safe_pick(n))) for n, _ in HOOK_SHOTS]
BG = {"P1": fit(grade(pick("s2_cafe"))), "P2": fit(grade(pick("s1_owner_a"))), "P3": fit(grade(pick("s2_gym"), warm=0.1))}
BLUR = {k: v.filter(ImageFilter.GaussianBlur(12)) for k, v in BG.items()}
_full = grade(pick("s3_full_c"), warm=0.4).resize((W // 4, H // 4)).filter(ImageFilter.GaussianBlur(14)).resize((W, H), Image.BICUBIC)

def dark_bg(t):
    y, x = np.mgrid[0:H // 4, 0:W // 4].astype(np.float32)
    d = np.sqrt((x - W / 8 - 30 * math.sin(t * 0.6)) ** 2 + ((y - H / 8 * 0.9) * 0.8) ** 2) / (W / 4)
    g = np.exp(-d ** 2 * 3.2)
    bg = Image.fromarray(np.stack([8 + 34 * g, 8 + 27 * g, 8 + 16 * g], -1).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    return Image.blend(bg, _full, 0.14)

# ---------------- texto ----------------
def rich(c, x, y, txt, size, alpha, name="InterDisplay-SemiBold", anchor="m"):
    parts = [(s, i % 2 == 1) for i, s in enumerate(txt.split("*")) if s]
    f = font(name, size); tot = sum(f.getlength(s) for s, _ in parts)
    xx = x - tot / 2 if anchor == "m" else x
    for s, hl in parts:
        c.text(xx, y, s, name, size, (GOLD_L if hl else WHITE) + (alpha,), anchor="lm"); xx += f.getlength(s)

def wrap(txt, size, maxw, name="InterDisplay-SemiBold"):
    f = font(name, size); lines = [""]
    for w_ in txt.split(" "):
        cand = (lines[-1] + " " + w_).strip()
        if f.getlength(cand.replace("*", "")) <= maxw: lines[-1] = cand
        else: lines.append(w_)
    out, op = [], False
    for ln in lines:
        if op: ln = "*" + ln
        op = ln.count("*") % 2 == 1
        if op: ln += "*"
        out.append(ln)
    return out

_tc = {}
def text_block(txt, size, maxw=920, name="InterDisplay-SemiBold", lh=1.16):
    k = (txt, size, maxw, name)
    if k not in _tc:
        lines = wrap(txt, size, maxw, name); h = int(size * lh * len(lines) + 40)
        c = Canvas(W, h)
        for i, ln in enumerate(lines): rich(c, W / 2, 20 + size * lh * (i + 0.5), ln, size, 255, name)
        img = c.out()
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); sh.putalpha(img.split()[3].filter(ImageFilter.GaussianBlur(12)).point(lambda v: int(v * 0.9)))
        _tc[k] = (sh, img)
    return _tc[k]

def kicker(label, gold=True):
    k = ("kick", label)
    if k not in _tc:
        c = Canvas(W, 60); col = GOLD if gold else (170, 170, 166)
        f = font("Inter-SemiBold", 26); tw = sum(f.getlength(ch) for ch in label) + 4 * (len(label) - 1)
        x0 = W / 2 - (tw + 56) / 2
        c.line([(x0, 31), (x0 + 40, 31)], col + (255,), 2)
        c.text(x0 + 56, 30, label, "Inter-SemiBold", 26, col + (255,), anchor="lm", tracking=4)
        _tc[k] = c.out()
    return _tc[k]

def alpha_mul(img, a):
    if a >= 0.999: return img
    im = img.copy(); im.putalpha(img.split()[3].point(lambda v: int(v * a))); return im

def put(frame, img, cx, cy, a=1.0, shadow=False, scale=1.0):
    if a <= 0.004: return
    if scale != 1.0: img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
    x, y = int(cx - img.width / 2), int(cy - img.height / 2)
    if shadow:
        sh, pad = ui.shadow_for(img, blur=34, alpha=int(150 * a), grow=12)
        _paste(frame, sh, x - pad, y - pad)
    _paste(frame, alpha_mul(img, a), x, y)

def _paste(frame, layer, x, y):
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + layer.width), min(H, y + layer.height)
    if x1 > x0 and y1 > y0: frame.alpha_composite(layer.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))

def headline(frame, txt, t, t0, size=74, cy=470, maxw=920):
    k = ease((t - t0) / 0.3)
    sh, img = text_block(txt, size, maxw)
    put(frame, sh, W / 2, cy + 4, k); put(frame, sh, W / 2, cy + 4, k)
    put(frame, img, W / 2, cy + (1 - k) * 14, k)

# ---------------- audio / subtítulos ----------------
VOICE = {}
for n, st in VO:
    x, sr = sf.read(f"{AUD}/{n}.wav")
    VOICE[n] = (x if x.ndim == 1 else x.mean(1), sr, st)

def chunk_times(name):
    x, sr, st = VOICE[name]; win = int(0.02 * sr)
    e = np.array([np.sqrt((x[i:i + win] ** 2).mean()) for i in range(0, len(x) - win, win)])
    v = np.where(e > 0.02)[0]; t0, t1 = v[0] * 0.02, v[-1] * 0.02 + 0.02
    ch = SUBS[name]; L = np.array([len(c.replace("*", "")) for c in ch], float)
    cuts = []
    for p in np.cumsum(L)[:-1] / L.sum():
        tg = t0 + p * (t1 - t0); lo, hi = max(1, int((tg - 0.4) / 0.02)), min(len(e) - 1, int((tg + 0.4) / 0.02))
        cuts.append((lo + int(np.argmin(e[lo:hi]))) * 0.02)
    b = [t0] + cuts + [t1]
    return [(st + b[i] - 0.05, st + b[i + 1] + 0.05, ch[i]) for i in range(len(ch))]

SUBT = []
for n in SUBS:
    ct = chunk_times(n)
    for i in range(len(ct) - 1): ct[i] = (ct[i][0], ct[i + 1][0], ct[i][2])
    ct[-1] = (ct[-1][0], ct[-1][1] + 0.35, ct[-1][2])
    SUBT += ct
SUBT.sort()
for i in range(len(SUBT) - 1):
    if SUBT[i][1] > SUBT[i + 1][0]: SUBT[i] = (SUBT[i][0], SUBT[i + 1][0], SUBT[i][2])
SOL_CH = [c for c in SUBT if c[2] in SUBS["v5"]]
ROW_T = [SOL_CH[1][0] + 0.0, SOL_CH[1][0] + 0.6, SOL_CH[1][0] + 1.25]
print("subs", [(round(a, 2), round(b, 2), s) for a, b, s in SUBT], "rows", [round(r, 2) for r in ROW_T], flush=True)

_cards = {}
def card(key, fn):
    if key not in _cards: _cards[key] = fn()
    return _cards[key]
def q(v, n=24): return round(min(1.4, max(0.0, v)) * n) / n

# ---------------- cuadro ----------------
def render(i):
    t = i / FPS
    a0, a1 = SC["HOOK"]
    if t < a1:
        n = len(HOOK_SHOTS); seg = (a1 - a0) / n; j = min(n - 1, int(t / seg)); p = (t - j * seg) / seg
        fr = finish(kb(HOOK_IMG[j], p, 1.0, 1.06), i, dim=0.82)
        # banda oscura superior para el titular
        top = Image.new("RGBA", (W, 900), (0, 0, 0, 0)); g = Image.linear_gradient("L").rotate(180).resize((W, 900)).point(lambda v: int(v * 0.75))
        top.putalpha(g); fr.alpha_composite(top, (0, 0))
        headline(fr, "¿Tu negocio está *perdiendo clientes* sin que lo notes?", t, -0.3, size=80, cy=500)
        lab = HOOK_SHOTS[j][1]
        pl = card(("pill", lab), lambda: ui.pill(f"{lab} · 0 consultas nuevas"))
        put(fr, pl, W / 2, 1330, ease(p / 0.25) if j else 1.0, shadow=True)
    elif t < SC["SOL"][0]:
        key = "P1" if t < SC["P1"][1] else ("P2" if t < SC["P2"][1] else "P3")
        s0, s1 = SC[key]; lt = t - s0; p = lt / (s1 - s0)
        kin = ease(lt / 0.3)
        bg = Image.blend(kb(BG[key], p, 1.02, 1.08), kb(BLUR[key], p, 1.02, 1.08), kin)
        fr = finish(bg, i, dim=1 - 0.45 * kin)
        num = {"P1": "1", "P2": "2", "P3": "3"}[key]
        put(fr, kicker(f"PROBLEMA {num}", gold=False), W / 2, 300, kin)
        txt = {"P1": "¿Te encuentran en Google… *pero no te eligen*?", "P2": "¿Te escriben y *tardás en responder*?",
               "P3": "¿Perdés consultas por no tener un *proceso simple*?"}[key]
        headline(fr, txt, t, s0 + 0.05, size=70, cy=450)
        ck = q((lt - 0.15) / 1.1)
        fn = {"P1": ui2.search_maps_bad, "P2": ui2.wa_unanswered, "P3": ui2.confusing_process}[key]
        cd = card((key, ck), lambda: fn(ck))
        ke = ease((lt - 0.1) / 0.35)
        put(fr, cd, W / 2, 1030 + (1 - ke) * 40, ke, shadow=True, scale=0.97 + 0.03 * ke)
    elif t < SC["SOL"][1]:
        s0 = SC["SOL"][0]; lt = t - s0
        fr = finish(dark_bg(t), i, amt=3.5)
        k = ease((lt - 0.15) / 0.5)
        put(fr, kicker("LA SOLUCIÓN"), W / 2, 300, k)
        headline(fr, "Te ayudo a *ordenar todo eso*", t, s0 + 0.2, size=70, cy=405)
        rows = [("pin", "Google Maps", "3,9 ★ · info incompleta", "4,8 ★ · ficha completa"),
                ("chat", "WhatsApp", "Sin respuesta", "Respuesta al instante"),
                ("cal", "Web y reservas", "Proceso confuso", "Reserva confirmada ✓")]
        for r, (ic, ti, b4, af) in enumerate(rows):
            lr = t - ROW_T[r]
            if lr <= 0: continue
            rk = q(lr / 1.1)
            img = card(("row", r, rk), lambda: ui2.before_after_row(ic, ti, b4, af, rk))
            ke = ease(lr / 0.4)
            put(fr, img, W / 2, 640 + r * 222 + (1 - ke) * 30, ke, shadow=True)
        # apertura con línea dorada
        if lt < 0.5:
            fr = Image.blend(Image.new("RGBA", (W, H), (5, 5, 5, 255)), fr, ease(lt / 0.5))
            lk = ease(lt / 0.3); la = 1 - ease((lt - 0.25) / 0.25)
            ln = Image.new("RGBA", (W, 60), (0, 0, 0, 0)); ImageDraw.Draw(ln).line([(0, 30), (W * lk, 30)], fill=GOLD_L + (255,), width=3)
            gl = ln.filter(ImageFilter.GaussianBlur(8)); gl.alpha_composite(ln)
            fr.alpha_composite(alpha_mul(gl, la), (0, 930))
    elif t < SC["PROOF"][1]:
        s0 = SC["PROOF"][0]; lt = t - s0
        fr = finish(dark_bg(t), i, amt=3.5)
        if lt < 0.3:
            prev = finish(dark_bg(t), i, amt=3.5)
        headline(fr, "Esto *se puede medir*.", t, s0 + 0.05, size=70, cy=330)
        pk = q((lt - 0.2) / 1.4)
        pn = card(("proof", pk), lambda: ui2.proof_panel(pk))
        ke = ease(lt / 0.4)
        put(fr, pn, W / 2, 900 + (1 - ke) * 30, ke, shadow=True)
    else:
        s0 = SC["CTA"][0]; lt = t - s0
        fr = finish(Image.new("RGB", (W, H), (7, 7, 7)), i, amt=3, vig=False)
        put(fr, card("glow", _glow), W / 2, 820, ease(lt / 0.8))
        k1 = ease(lt / 0.5)
        put(fr, card("title", _title), W / 2, 640 - (1 - k1) * 20, k1)
        k2 = ease((lt - 0.2) / 0.5)
        ln = Canvas(W, 10); ww = 300 * k2; ln.line([(W / 2 - ww / 2, 5), (W / 2 + ww / 2, 5)], GOLD + (255,), 2.2)
        put(fr, ln.out(), W / 2, 722, k2)
        put(fr, card("role", _role), W / 2, 790, ease((lt - 0.3) / 0.5))
        k4 = ease((lt - 0.25) / 0.4)
        put(fr, card("cta", _cta), W / 2, 990 + (1 - k4) * 24, k4, shadow=True, scale=0.97 + 0.03 * k4)
        put(fr, card("wa", _wa_line), W / 2, 1150, ease((lt - 0.6) / 0.4))
    # transición suave entre bloques (fundido corto desde negro al entrar a PROOF y CTA)
    for key in ("PROOF", "CTA"):
        lt = t - SC[key][0]
        if 0 <= lt < 0.25:
            fr = Image.blend(Image.new("RGBA", (W, H), (6, 6, 6, 255)), fr, ease(lt / 0.25))
    # subtítulos (solo donde el titular no repite la voz)
    for a, b, txt in SUBT:
        if a <= t < b:
            k = ease((t - a) / 0.12) * (1 - ease((t - (b - 0.1)) / 0.1))
            sh, img = text_block(txt, 50, 940, "InterDisplay-SemiBold", 1.2)
            cy = 1440
            put(fr, sh, W / 2, cy + 3, k); put(fr, sh, W / 2, cy + 3, k)
            put(fr, img, W / 2, cy + (1 - k) * 8, k)
    return fr.convert("RGB")

def _glow():
    g = Image.new("RGBA", (1000, 800), (0, 0, 0, 0)); ImageDraw.Draw(g).ellipse([150, 150, 850, 650], fill=(201, 164, 92, 42))
    return g.filter(ImageFilter.GaussianBlur(110))
def _title():
    c = Canvas(W, 140); c.text(W / 2, 70, "IVÁN BOLOGNA", "InterDisplay-SemiBold", 92, WHITE + (255,), anchor="mm", tracking=10); return c.out()
def _role():
    c = Canvas(W, 70); c.text(W / 2, 35, "Gestor de Presencia Online", "InterDisplay-Medium", 46, GOLD_L + (255,), anchor="mm", tracking=1); return c.out()
def _cta():
    w, h = 920, 140; c = Canvas(w, h); c.rrect(0, 0, w - 1, h - 1, 70, fill=GOLD + (255,))
    c.text(w / 2, h / 2 + 1, "SOLICITÁ UN ANÁLISIS GRATUITO", "InterDisplay-SemiBold", 44, (12, 12, 12, 255), anchor="mm", tracking=2); return c.out()
def _wa_line():
    c = Canvas(W, 90); txt = "Escribime por WhatsApp"; tw = c.tlen(txt, "Inter-SemiBold", 44); x0 = W / 2 - (tw + 64) / 2
    c.circle(x0 + 24, 44, 24, fill=(37, 160, 100, 255)); ui.chat(c, x0 + 25, 43, 11, (255, 255, 255, 255), filled=True)
    c.text(x0 + 64, 46, txt, "Inter-SemiBold", 44, WHITE + (255,), anchor="lm")
    c.text(x0 + 64 + tw + 16, 46, "→", "Inter-SemiBold", 44, GOLD_L + (255,), anchor="lm"); return c.out()

# ---------------- mezcla ----------------
def build_audio():
    SR = 48000; n = int(DUR * SR) + SR
    voice = np.zeros(n)
    for name, st in VO:
        x, sr, _ = VOICE[name]; x = x / np.abs(x).max() * 0.6; s = int(st * SR); voice[s:s + len(x)] += x[:n - s]
    # ecualización de voz: realce de presencia (2–5 kHz) para parlantes de celular
    from scipy.signal import butter, sosfilt
    voice = voice + 0.35 * sosfilt(butter(2, [2000, 5000], 'band', fs=SR, output='sos'), voice)
    voice = sosfilt(butter(2, 90, 'high', fs=SR, output='sos'), voice)
    env = uniform_filter1d(np.abs(voice), int(0.06 * SR))
    duck = uniform_filter1d(1 - 0.94 * np.clip(env / 0.012, 0, 1), int(0.3 * SR))   # -20 dB bajo la voz
    m, _ = sf.read(f"{AUD}/music_raw.wav")
    if m.ndim == 1: m = np.stack([m, m], 1)
    mm = np.zeros((n, 2)); mm[:min(n, len(m))] = m[:n]
    t = np.arange(n) / SR
    g = np.ones(n)
    g = np.where((t > 12.05) & (t < 12.2), np.clip((12.2 - t) / 0.15, 0, 1) * 0.3 + 0.7, g)   # pequeño respiro en el cambio
    g = np.where((t > 22.1) & (t < 24.45), g * 0.35, g)   # CTA: la voz sola al frente
    g = np.where(t > DUR - 0.8, np.clip((DUR - t) / 0.8, 0, 1), g)
    from scipy.signal import butter as _b, sosfilt as _s
    mm = _s(_b(2, 120, 'high', fs=SR, output='sos'), mm, axis=0)   # sin graves que tapen la voz
    mm = mm / max(1e-6, np.abs(mm).max()) * 0.30 * (g * duck)[:, None]
    fx = np.zeros(n)
    def add(x, at, gain):
        s = int(at * SR); e = min(n, s + len(x)); fx[s:e] += x[:e - s] * gain
    add(sfx.sub_hit(0.6), 0.0, 0.15)
    for k in range(1, 5): add(sfx.tick(), k * 0.69, 0.05)
    add(sfx.muffled_notif(), 6.22, 0.10)
    add(sfx.whoosh(0.5), 11.95, 0.12); add(sfx.shimmer(1.0), 12.25, 0.04)
    for r in ROW_T: add(sfx.ui_click(), r, 0.04)
    add(sfx.chime((1046.5, 1568), 0.1, 1.0, bright=0.5), 18.55, 0.05)
    fx = fx * duck   # efectos también bajo la voz
    mix = np.stack([voice + mm[:, 0] + fx, voice + mm[:, 1] + fx], 1)[:int(DUR * SR)]
    mix = np.tanh(mix * 1.05) / np.tanh(1.05)
    sf.write(f"{AUD}/mix.wav", mix, SR, subtype="PCM_24")
    # pistas separadas para medir relación voz/música
    sf.write(f"{AUD}/stem_voice.wav", voice[:int(DUR * SR)], SR); sf.write(f"{AUD}/stem_bed.wav", (mm[:, 0] + fx)[:int(DUR * SR)], SR)

if __name__ == "__main__":
    if PREVIEW:
        for tt in PREVIEW: render(int(round(tt * FPS))).save(f"{B}/pv2_{tt:05.2f}.png")
        sys.exit()
    build_audio()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{AUD}/mix.wav", "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", "48000", f"{AUD}/mix_norm.wav"], check=True)
    out = sys.argv[1]
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-i", f"{AUD}/mix_norm.wav", "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "20",
                           "-maxrate", "9M", "-bufsize", "18M", "-tune", "film", "-profile:v", "high", "-level", "4.2", "-pix_fmt", "yuv420p",
                           "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out], stdin=subprocess.PIPE)
    for i in range(NF):
        ff.stdin.write(np.asarray(render(i)).tobytes())
        if i % 150 == 0: print("frame", i, "/", NF, flush=True)
    ff.stdin.close(); ff.wait(); print("OK", out)
