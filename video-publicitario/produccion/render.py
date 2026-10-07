# Render final: compone escenas IA + UI + subtítulos + audio -> MP4 1080x1920.
import os, sys, math, subprocess, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import soundfile as sf
import ui
from ui import ease, ease_io, font, Canvas, GOLD, GOLD_L, WHITE
import sfx

B = os.path.dirname(os.path.abspath(__file__)) + "/.."
IMG = B + "/img"
W, H, FPS = 1080, 1920, 30
DUR = 16.0
NF = int(DUR * FPS)
PREVIEW = [float(x) for x in os.environ.get("PREVIEW", "").split(",") if x]

# ---------------- línea de tiempo ----------------
SC = {
    "A": (0.00, 1.70), "B": (1.70, 3.10), "C": (3.10, 4.15), "D": (4.15, 5.35), "E": (5.35, 6.60),
    "T": (6.60, 7.12), "F": (7.12, 10.15), "G": (10.15, 11.50), "H": (11.50, DUR),
}
VO = [("l1", 0.15), ("l2", 3.12), ("l3", 7.30), ("l4", 11.95)]
SUBS = {
    "l1": [("Tu negocio aparece en *Google*…", 0), ("pero *nadie* te escribe.", 0)],
    "l2": [("Fichas incompletas.", 0), ("Mensajes sin responder.", 0), ("Reservas que se pierden.", 0)],
    "l3": [("Yo ordeno tu *presencia online*", 0), ("para convertir más búsquedas", 0), ("en *consultas y clientes*.", 0)],
    "l4": [("Soy *Iván Bologna*.", 0), ("Pedime un análisis *gratuito*.", 0)],
}

def pick(name):
    for c in (name + "_2x.png", name + ".png"):
        if os.path.exists(f"{IMG}/{c}"):
            return Image.open(f"{IMG}/{c}").convert("RGB")
    raise FileNotFoundError(name)

CHOICE = json.load(open(B + "/choice.json"))

# ---------------- grading ----------------
def grade(img, warm=0.0, lift=0.0, sat=0.9, contrast=1.12):
    a = np.asarray(img).astype(np.float32) / 255
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    a = lum[..., None] + (a - lum[..., None]) * sat
    a = np.clip((a - 0.5) * contrast + 0.5 + lift, 0, 1)
    a = a ** 1.08
    a[..., 0] *= 1 + 0.05 * warm; a[..., 2] *= 1 - 0.06 * warm
    a = 0.03 + a * 0.97 * (1 - 0.03)
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

def vignette():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((x - W / 2) / (W * 0.62)) ** 2 + ((y - H / 2) / (H * 0.58)) ** 2)
    return np.clip(1 - 0.55 * np.clip(d - 0.45, 0, 1) ** 1.6, 0, 1)[..., None]
VIG = vignette()
_yy = np.arange(H, dtype=np.float32)
SUBBAND = (1 - 0.42 * np.exp(-((_yy - 1385) / 190) ** 2))[:, None, None]
VIG = VIG * SUBBAND
rng = np.random.default_rng(1)
GRAIN = [rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]
def grain(i, amt=5.0):
    g = GRAIN[i % 6]
    g = np.repeat(np.repeat(g, 2, 0), 2, 1)
    return g[..., None] * amt

def kb(img, t, z0, z1, dx0=0, dx1=0, dy0=0, dy1=0):
    """Ken Burns: zoom y desplazamiento (en fracción del ancho/alto disponible)."""
    iw, ih = img.size
    base = max(W / iw, H / ih)
    k = ease_io(t)
    z = base * (z0 + (z1 - z0) * k)
    cw, ch = W / z, H / z
    cx = iw / 2 + (dx0 + (dx1 - dx0) * k) * (iw - cw) / 2
    cy = ih / 2 + (dy0 + (dy1 - dy0) * k) * (ih - ch) / 2
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return img.resize((W, H), Image.BICUBIC, box=box, reducing_gap=None)

# ---------------- precarga ----------------
print("cargando imágenes…", flush=True)
PL = {k: grade(pick(v["img"]), warm=v.get("warm", 0.3)) for k, v in CHOICE.items()}
full_blur = PL["G"].resize((W // 4, H // 4)).filter(ImageFilter.GaussianBlur(14)).resize((W, H), Image.BICUBIC)

def crop_photo(img, fx, fy, fw, fh):
    iw, ih = img.size
    return img.crop((int(fx * iw), int(fy * ih), int((fx + fw) * iw), int((fy + fh) * ih)))
src_after = pick(CHOICE["G"]["img"]); src_after2 = pick(CHOICE.get("G2", CHOICE["G"])["img"])
PHOTOS = [grade(crop_photo(src_after, 0.05, 0.25, 0.45, 0.35)), grade(crop_photo(src_after2, 0.3, 0.3, 0.45, 0.35)),
          grade(crop_photo(pick(CHOICE["A"]["img"]), 0.15, 0.35, 0.6, 0.45))]
HERO = grade(crop_photo(src_after2, 0.0, 0.2, 1.0, 0.45), warm=0.4)

def f_background(t):
    y, x = np.mgrid[0:H // 4, 0:W // 4].astype(np.float32)
    cx, cy = W / 8 + 30 * math.sin(t * 0.7), H / 8 * 0.95
    d = np.sqrt((x - cx) ** 2 + ((y - cy) * 0.8) ** 2) / (W / 4)
    glow = np.exp(-d ** 2 * 3.2)
    base = np.stack([8 + 34 * glow, 8 + 27 * glow, 8 + 16 * glow], -1)
    bg = Image.fromarray(base.astype(np.uint8)).resize((W, H), Image.BICUBIC)
    return Image.blend(bg, full_blur, 0.16)

# ---------------- textos ----------------
def rich_line(c, x, y, txt, size, alpha, anchor="mm", name="InterDisplay-SemiBold"):
    parts = []
    for i, seg in enumerate(txt.split("*")):
        if seg: parts.append((seg, i % 2 == 1))
    f = font(name, size)
    total = sum(f.getlength(s) for s, _ in parts)
    xx = x - total / 2 if anchor == "mm" else x
    for s, hl in parts:
        col = (GOLD_L if hl else WHITE) + (alpha,)
        c.text(xx, y, s, name, size, col, anchor="lm")
        xx += f.getlength(s)

def wrap(txt, size, maxw, name="InterDisplay-SemiBold"):
    f = font(name, size)
    words = txt.split(" "); lines = [""]
    for w_ in words:
        cand = (lines[-1] + " " + w_).strip()
        if f.getlength(cand.replace("*", "")) <= maxw: lines[-1] = cand
        else: lines.append(w_)
    # equilibra las marcas de color entre líneas
    fixed = []; open_ = False
    for ln in lines:
        if open_: ln = "*" + ln
        if ln.count("*") % 2 == 1: ln = ln + "*"; open_ = True
        else: open_ = False
        fixed.append(ln)
    return fixed

def subtitle_layer(text, k, y_center, size):
    lines = wrap(text, size, 900)
    lh = size * 1.22
    h = int(lh * len(lines) + 60)
    c = Canvas(W, h)
    a = int(255 * k)
    for i, ln in enumerate(lines):
        rich_line(c, W / 2, 30 + lh * (i + 0.5), ln, size, a)
    img = c.out()
    sh = img.split()[3].filter(ImageFilter.GaussianBlur(10)).point(lambda v: int(v * 0.85))
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0)); shadow.putalpha(sh)
    return shadow, img, int(y_center - h / 2)

def kicker(idx, label, k):
    c = Canvas(700, 60)
    a = int(255 * k)
    x = 0
    if not idx:
        c.line([(0, 31), (40, 31)], (150, 150, 146, a), 2)
        x = 56
    if idx:
        c.text(0, 30, idx, "Inter-SemiBold", 26, GOLD + (a,), anchor="lm", tracking=2)
        x = c.tlen(idx, "Inter-SemiBold", 26) + 12
        c.line([(x, 31), (x + 40, 31)], GOLD + (a,), 2)
        x += 56
    c.text(x, 30, label, "Inter-SemiBold", 26, (235, 235, 230, a), anchor="lm", tracking=4)
    return c.out()

# ---------------- subtítulos: tiempos desde el audio ----------------
AUD = {}
for name, st in VO:
    x, sr = sf.read(f"{B}/audio/{name}.wav")
    AUD[name] = (x, sr, st)

def split_times(name, n):
    x, sr, st = AUD[name]
    win = int(0.02 * sr)
    e = np.array([np.sqrt((x[i:i + win] ** 2).mean()) for i in range(0, len(x) - win, win)])
    dur = len(x) / sr
    voiced = np.where(e > 0.02)[0]
    t0, t1 = voiced[0] * 0.02, voiced[-1] * 0.02 + 0.02
    chunks = [s for s, _ in SUBS[name]]
    lens = np.array([len(c.replace("*", "")) for c in chunks], float)
    cum = np.cumsum(lens)[:-1] / lens.sum()
    cuts = []
    for p in cum:
        target = t0 + p * (t1 - t0)
        lo, hi = int((target - 0.35) / 0.02), int((target + 0.35) / 0.02)
        lo, hi = max(1, lo), min(len(e) - 1, hi)
        j = lo + int(np.argmin(e[lo:hi])) if hi > lo else int(target / 0.02)
        cuts.append(j * 0.02)
    bounds = [t0] + cuts + [t1]
    return [(st + bounds[i], st + bounds[i + 1]) for i in range(n)]

SUBT = []
for name, _ in VO:
    tt = split_times(name, len(SUBS[name]))
    for (txt, _), (a, b) in zip(SUBS[name], tt):
        SUBT.append((a - 0.05, b + 0.05, txt, name))
# alarga cada bloque hasta el siguiente (sin huecos dentro de la misma frase)
for i in range(len(SUBT) - 1):
    a, b, txt, n = SUBT[i]
    if SUBT[i + 1][3] == n: SUBT[i] = (a, SUBT[i + 1][0], txt, n)
print("subtítulos:", [(round(a, 2), round(b, 2), t) for a, b, t, _ in SUBT], flush=True)

# ---------------- utilidades de composición ----------------
def place(frame, layer, cx, cy, alpha=1.0, scale=1.0, shadow=True):
    if alpha <= 0.003: return
    if scale != 1.0:
        layer = layer.resize((max(1, int(layer.width * scale)), max(1, int(layer.height * scale))), Image.LANCZOS)
    if alpha < 1:
        a = layer.split()[3].point(lambda v: int(v * alpha)); layer = layer.copy(); layer.putalpha(a)
    x, y = int(cx - layer.width / 2), int(cy - layer.height / 2)
    if shadow:
        sh, pad = ui.shadow_for(layer, blur=36, alpha=int(150 * alpha), grow=14)
        frame.alpha_composite(sh, (x - pad, y - pad)) if x - pad >= 0 and y - pad >= 0 else _safe(frame, sh, x - pad, y - pad)
    _safe(frame, layer, x, y)

def _safe(frame, layer, x, y):
    fx0, fy0 = max(0, x), max(0, y)
    fx1, fy1 = min(W, x + layer.width), min(H, y + layer.height)
    if fx1 <= fx0 or fy1 <= fy0: return
    frame.alpha_composite(layer.crop((fx0 - x, fy0 - y, fx1 - x, fy1 - y)), (fx0, fy0))

def enter(t, t0, d=0.32):
    return ease((t - t0) / d)

def local(t, key):
    a, b = SC[key]
    return (t - a) / (b - a), t - a

def in_sc(t, key):
    a, b = SC[key]
    return a <= t < b

def finish(frame_rgb, i, dim=1.0, grain_amt=5.0, vig=True):
    a = np.asarray(frame_rgb).astype(np.float32)
    if vig: a = a * VIG
    a = a * dim + grain(i, grain_amt)
    return np.clip(a, 0, 255).astype(np.uint8)

# cachés de tarjetas estáticas
CARD_CACHE = {}
def cached(key, fn):
    if key not in CARD_CACHE: CARD_CACHE[key] = fn()
    return CARD_CACHE[key]

def q(v, n=24):  # cuantiza el progreso de animación para cachear
    return round(min(1.5, max(0, v)) * n) / n

# ---------------- render de un cuadro ----------------
def render(i):
    t = i / FPS
    frame = None
    overlays = []      # (layer, cx, cy, alpha, scale, shadow)
    sub_y, sub_size = 1385, 62

    if t < SC["T"][0]:
        if in_sc(t, "A"):
            p, lt = local(t, "A")
            bg = kb(PL["A"], p, 1.04, 1.12, 0.0, 0.0, 0.05, -0.08)
            card_k = enter(t, 0.45)
            blur = 6 * card_k
            ck = q((t - 0.45) / 1.0)
            card = cached(("mb", ck), lambda: ui.maps_bad(ck))
            overlays.append((card, W / 2, 930 + (1 - card_k) * 40, card_k, 0.97 + 0.03 * card_k, True))
            dimv = 1 - 0.38 * card_k
        elif in_sc(t, "B"):
            p, lt = local(t, "B")
            bg = kb(PL["B"], p, 1.06, 1.12, -0.25, 0.15, 0.0, 0.0)
            blur = 0; dimv = 0.95
        elif in_sc(t, "C"):
            p, lt = local(t, "C")
            bg = kb(PL["C"], p, 1.1, 1.14, -0.3, 0.3, 0, 0)
            card_k = enter(t, SC["C"][0] + 0.08, 0.28)
            ck = q((lt - 0.08) / 0.8); sp = q((lt * 1.3) % 1, 30)
            card = cached(("web", ck, sp), lambda: ui.web_bad(ck, sp))
            overlays.append((card, W / 2, 920 + (1 - card_k) * 40, card_k, 0.97 + 0.03 * card_k, True))
            blur = 9 * card_k; dimv = 1 - 0.42 * card_k
        elif in_sc(t, "D"):
            p, lt = local(t, "D")
            bg = kb(PL["D"], p, 1.12, 1.06, 0, 0, 0.1, 0.0)
            card_k = enter(t, SC["D"][0] + 0.08, 0.28)
            ck = q((lt - 0.08) / 0.75)
            card = cached(("wb", ck), lambda: ui.wa_bad(ck))
            overlays.append((card, W / 2, 920 + (1 - card_k) * 40, card_k, 0.97 + 0.03 * card_k, True))
            blur = 9 * card_k; dimv = 1 - 0.42 * card_k
        else:
            p, lt = local(t, "E")
            bg = kb(PL["E"], p, 1.05, 1.12, 0, 0, -0.1, 0.1)
            card_k = enter(t, SC["E"][0] + 0.08, 0.28)
            ck = q((lt - 0.08) / 0.9)
            card = cached(("ag", ck), lambda: ui.agenda_bad(ck))
            overlays.append((card, W / 2, 920 + (1 - card_k) * 40, card_k, 0.97 + 0.03 * card_k, True))
            blur = 9 * card_k; dimv = 1 - 0.42 * card_k
        if blur > 0.3:
            bg = bg.filter(ImageFilter.GaussianBlur(blur))
        frame = Image.fromarray(finish(bg, i, dim=dimv)).convert("RGBA")
        # píldora superior "0 consultas" (A y B)
        if t < SC["C"][0]:
            k = (1.0 if t < 0.5 else 1.0) * (1 - enter(t, SC["C"][0] - 0.15, 0.15))
            overlays.append((cached("pill0", lambda: ui.pill("Hoy · 0 consultas nuevas")), W / 2, 330, k, 1.0, True))
        else:
            for key, idx, lab in (("C", "", "SITIO WEB"), ("D", "", "WHATSAPP"), ("E", "", "RESERVAS")):
                if in_sc(t, key):
                    k = enter(t, SC[key][0] + 0.05, 0.2)
                    kl = cached(("kick", key), lambda: kicker(idx, lab, 1.0))
                    overlays.append((kl, 96 + kl.width / 2, 300, k, 1.0, False))
    elif t < SC["F"][0] + 0.0 and t >= SC["T"][0]:
        frame = Image.new("RGBA", (W, H), (6, 6, 6, 255))
    if SC["T"][0] <= t < SC["F"][0] + 0.32:
        # línea dorada + apertura
        if frame is None or t >= SC["F"][0]:
            pass
    if SC["F"][0] <= t < SC["G"][0]:
        lt = t - SC["F"][0]
        bg = f_background(t)
        frame = Image.fromarray(finish(bg, i, dim=1.0, grain_amt=4)).convert("RGBA")
        segs = [("maps", 0.00, 0.85, "01", "GOOGLE MAPS"), ("wa", 0.85, 1.70, "02", "WHATSAPP"),
                ("web", 1.70, 2.40, "03", "SITIO WEB"), ("book", 2.40, 3.10, "04", "RESERVAS")]
        for name, a, b, idx, lab in segs:
            if a - 0.01 <= lt < b + 0.22:
                kin = enter(lt, a, 0.3) if name != "maps" else enter(lt, 0.12, 0.35)
                kout = ease((lt - b) / 0.22) if name != "book" else 0
                prog = (lt - a) / (b - a)
                if name == "maps":
                    ck = q((lt - 0.15) / 0.7); card = cached(("mg", ck), lambda: ui.maps_good(PHOTOS, ck))
                elif name == "wa":
                    ck = q(prog * 1.05, 40); card = cached(("wg", ck), lambda: ui.wa_good(ck))
                elif name == "web":
                    ck = q(prog * 1.2); card = cached(("webg", ck), lambda: ui.web_good(HERO, ck))
                else:
                    ck = q(prog * 1.3); card = cached(("bk", ck), lambda: ui.booking_good(ck))
                alpha = kin * (1 - kout)
                cy = 900 + (1 - kin) * 70 - kout * 70
                overlays.append((card, W / 2, cy, alpha, 0.96 + 0.04 * kin, True))
                kl = cached(("kick", name), lambda: kicker(idx, lab, 1.0))
                overlays.append((kl, 96 + kl.width / 2, 300, alpha, 1.0, False))
    if SC["G"][0] <= t < SC["H"][0]:
        p, lt = local(t, "G")
        bg = kb(PL["G"], p, 1.12, 1.04, 0.0, 0.0, 0.1, -0.05)
        frame = Image.fromarray(finish(bg, i, dim=0.92)).convert("RGBA")
        # disolvencia desde la escena F
        if lt < 0.25:
            prev = Image.fromarray(finish(f_background(t), i, grain_amt=4)).convert("RGBA")
            frame = Image.blend(prev, frame, ease(lt / 0.25))
        k = enter(t, SC["G"][0] + 0.05, 0.3) * (1 - enter(t, SC["H"][0] - 0.2, 0.2))
        overlays.append((cached("pill14", lambda: ui.pill("Hoy · 14 consultas nuevas", dot=GOLD)), W / 2, 330, k, 1.0, True))
        toasts = [(0.15, "Nueva reserva", "Hoy 19:15 · Corte + barba", "cal"),
                  (0.45, "WhatsApp · Nuevo mensaje", "¿Tenés lugar mañana a las 10?", "wa"),
                  (0.75, "Nueva reseña  ★★★★★", "“Excelente atención, reservé en 1 minuto”", "star")]
        for j, (ts, ti, bo, ic) in enumerate(toasts):
            kk = enter(lt, ts, 0.3) * (1 - enter(t, SC["H"][0] - 0.2, 0.2))
            if kk > 0:
                tl = cached(("toast", j), lambda: ui.toast(ti, bo, ic))
                overlays.append((tl, W / 2, 470 + j * 156 - (1 - kk) * 40, kk, 0.96 + 0.04 * kk, True))
        # oscurece hacia el cierre
        fade_out = enter(t, SC["H"][0] - 0.3, 0.3)
        if fade_out > 0:
            frame = Image.blend(frame, Image.new("RGBA", (W, H), (6, 6, 6, 255)), fade_out)
    if t >= SC["H"][0]:
        frame = Image.fromarray(finish(Image.new("RGB", (W, H), (7, 7, 7)), i, grain_amt=3.5, vig=False)).convert("RGBA")
        lt = t - SC["H"][0]
        # halo cálido muy sutil detrás del nombre
        k0 = enter(lt, 0.0, 0.8)
        glow = cached("endglow", lambda: _glow())
        place(frame, glow, W / 2, 900, 0.9 * k0, 1.0, False)
        k1 = enter(lt, 0.05, 0.6)
        name_l = cached("name", lambda: _title())
        place(frame, name_l, W / 2, 740 - (1 - k1) * 24, k1, 1.0, False)
        k2 = enter(lt, 0.35, 0.6)
        ln = Canvas(W, 10); ww = 300 * k2
        ln.line([(W / 2 - ww / 2, 5), (W / 2 + ww / 2, 5)], GOLD + (255,), 2.2)
        place(frame, ln.out(), W / 2, 825, k2, 1.0, False)
        k3 = enter(lt, 0.55, 0.6)
        role = cached("role", lambda: _role())
        place(frame, role, W / 2, 895 - (1 - k3) * 16, k3, 1.0, False)
        k4 = enter(lt, 1.35, 0.45)
        cta = cached("cta", lambda: _cta())
        place(frame, cta, W / 2, 1075 + (1 - k4) * 26, k4, 0.97 + 0.03 * k4, True)
        k5 = enter(lt, 1.75, 0.5)
        wa = cached("wa_line", lambda: _wa_line())
        place(frame, wa, W / 2, 1222 - (1 - k5) * 10, k5, 1.0, False)
        sub_y, sub_size = 1440, 50

    # línea dorada (transición)
    T0 = SC["T"][0]
    if T0 <= t < SC["F"][0] + 0.45:
        if t < SC["F"][0]:
            frame = Image.fromarray(finish(Image.new("RGB", (W, H), (5, 5, 5)), i, grain_amt=3, vig=False)).convert("RGBA")
        draw_k = ease((t - (T0 + 0.32)) / 0.24)
        open_k = ease_io((t - (SC["F"][0] - 0.02)) / 0.38)
        if draw_k > 0:
            # máscara de apertura desde la línea
            if open_k > 0 and open_k < 1:
                mask = Image.new("L", (W, H), 0)
                hh = H / 2 * open_k
                ImageDraw.Draw(mask).rectangle([0, 960 - hh, W, 960 + hh], fill=255)
                black = Image.new("RGBA", (W, H), (5, 5, 5, 255))
                frame = Image.composite(frame, black, mask)
            elif open_k <= 0 and t >= SC["F"][0]:
                frame = Image.new("RGBA", (W, H), (5, 5, 5, 255))
            line_alpha = 1 - ease((t - (SC["F"][0] + 0.1)) / 0.3)
            if line_alpha > 0:
                lw = W * draw_k
                gl = Image.new("RGBA", (W, 120), (0, 0, 0, 0))
                d = ImageDraw.Draw(gl)
                d.line([(0, 60), (lw, 60)], fill=GOLD_L + (255,), width=3)
                glow = gl.filter(ImageFilter.GaussianBlur(10))
                d2 = ImageDraw.Draw(glow);
                glow.alpha_composite(gl)
                hx = lw
                head = Image.new("RGBA", (W, 120), (0, 0, 0, 0))
                ImageDraw.Draw(head).ellipse([hx - 40, 40, hx + 40, 80], fill=(255, 236, 190, 200))
                head = head.filter(ImageFilter.GaussianBlur(14))
                if draw_k < 1: glow.alpha_composite(head)
                a = glow.split()[3].point(lambda v: int(v * line_alpha)); glow.putalpha(a)
                for dy in (-60 * open_k, 60 * open_k) if open_k > 0 else (0,):
                    frame.alpha_composite(glow, (0, int(960 - 60 + dy)))

    for layer, cx, cy, al, sc, shd in overlays:
        place(frame, layer, cx, cy, al, sc, shd)

    # subtítulos
    for a, b, txt, nm in SUBT:
        if a <= t < b:
            k = ease((t - a) / 0.12) * (1 - ease((t - (b - 0.08)) / 0.08))
            sh, im, y0 = cached(("sub", txt, sub_size, round(k, 2)), lambda: subtitle_layer(txt, k, sub_y, sub_size))
            frame.alpha_composite(sh, (0, y0 + 3)); frame.alpha_composite(sh, (0, y0 + 3))
            frame.alpha_composite(im, (0, y0 + int((1 - k) * 8)))
    return frame.convert("RGB")

def _glow():
    g = Image.new("RGBA", (1000, 700), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse([150, 150, 850, 550], fill=(201, 164, 92, 40))
    return g.filter(ImageFilter.GaussianBlur(110))

def _title():
    c = Canvas(W, 140)
    c.text(W / 2, 70, "IVÁN BOLOGNA", "InterDisplay-SemiBold", 92, WHITE + (255,), anchor="mm", tracking=10)
    return c.out()

def _role():
    c = Canvas(W, 70)
    c.text(W / 2, 35, "Gestor de Presencia Online", "InterDisplay-Medium", 44, GOLD_L + (255,), anchor="mm", tracking=1)
    return c.out()

def _cta():
    w, h = 900, 132
    c = Canvas(w, h)
    c.rrect(0, 0, w - 1, h - 1, 66, fill=GOLD + (255,))
    c.text(w / 2, h / 2 + 1, "SOLICITÁ UN ANÁLISIS GRATUITO", "InterDisplay-SemiBold", 42, (12, 12, 12, 255), anchor="mm", tracking=2)
    return c.out()

def _wa_line():
    c = Canvas(W, 80)
    txt = "Escribime por WhatsApp"
    tw = c.tlen(txt, "Inter-Medium", 40)
    x0 = W / 2 - (tw + 60) / 2
    c.circle(x0 + 22, 38, 22, fill=(37, 160, 100, 255))
    ui.chat(c, x0 + 23, 37, 10, (255, 255, 255, 255), filled=True)
    c.text(x0 + 60, 40, txt, "Inter-Medium", 40, WHITE + (255,), anchor="lm")
    c.text(x0 + 60 + tw + 16, 40, "→", "Inter-Medium", 40, GOLD_L + (255,), anchor="lm")
    return c.out()

# ---------------- audio ----------------
def build_audio():
    SR = 48000
    n = int(DUR * SR) + SR
    L = np.zeros(n); R = np.zeros(n)
    def add(x, at, g, pan=0.0):
        s = int(at * SR); e = min(n, s + len(x))
        if e <= s: return
        L[s:e] += x[:e - s] * g * (1 - max(0, pan)); R[s:e] += x[:e - s] * g * (1 + min(0, pan))
    # voz
    voice = np.zeros(n)
    for name, st in VO:
        x, sr, _ = AUD[name]
        if x.ndim > 1: x = x.mean(1)
        x = x / np.abs(x).max() * 0.5
        s = int(st * SR); voice[s:s + len(x)] += x[: n - s]
    # música con corte en el segundo 6,6
    m, msr = sf.read(f"{B}/audio/music_raw.wav")
    if m.ndim == 1: m = np.stack([m, m], 1)
    m = m[:n]; mm = np.zeros((n, 2)); mm[:len(m)] = m
    t = np.arange(n) / SR
    g = np.ones(n) * 0.9
    g = np.where((t > 6.58) & (t < 7.22), 0, g)
    g = np.where((t >= 6.50) & (t <= 6.58), 0.9 * (6.58 - t) / 0.08, g)
    g = np.where((t >= 7.22) & (t <= 7.40), 0.9 * (t - 7.22) / 0.18, g)
    g = np.where((t > 11.8) & (t < 15.2), g * 0.55, g)
    g = np.where(t > 15.2, 0.9 * np.clip((16.0 - t) / 0.8, 0, 1), g)
    # ducking bajo la voz
    from scipy.ndimage import uniform_filter1d
    venv = uniform_filter1d(np.abs(voice), int(0.08 * SR))
    duck = 1 - 0.68 * np.clip(venv / 0.04, 0, 1)
    duck = uniform_filter1d(duck, int(0.12 * SR))
    mm = mm * (g * duck)[:, None]
    mm /= max(1e-6, np.abs(mm).max()); mm *= 0.30
    L += mm[:, 0]; R += mm[:, 1]
    # efectos
    add(sfx.sub_hit(), 0.0, 0.55)
    rt = sfx.room_tone(6.6); rt *= np.minimum(1, np.minimum(np.arange(len(rt)) / (0.4 * SR), (len(rt) - np.arange(len(rt))) / (0.05 * SR)))
    add(rt, 0.0, 0.035)
    for k in range(7): add(sfx.tick(), 0.55 + k * 0.95, 0.045, pan=0.3)
    add(sfx.ui_click(), 0.5, 0.06)
    for k in range(5): add(sfx.ui_click(), 3.30 + k * 0.17, 0.025)
    add(sfx.muffled_notif(), 4.25, 0.13, pan=-0.2)
    add(sfx.page_flip(), 5.45, 0.07, pan=0.2)
    add(sfx.whoosh(0.5), 6.86, 0.2)
    add(sfx.shimmer(1.2), 7.08, 0.06)
    add(sfx.sub_hit(1.6, 50, 36), 7.12, 0.28)
    for k in range(6): add(sfx.soft_kick(), 7.30 + k * 0.6667, 0.22)
    for ts in (7.25, 7.45, 7.62): add(sfx.ui_click(), ts, 0.05)
    add(sfx.pop(820), 7.92, 0.07); add(sfx.pop(1100), 8.38, 0.07, pan=0.2); add(sfx.pop(820), 8.62, 0.06)
    add(sfx.ui_click(), 8.78, 0.05); add(sfx.ui_click(), 9.05, 0.05)
    add(sfx.chime((1318.5, 1975.5), 0.1, 1.0), 9.52, 0.16)
    mur = sfx.murmur(1.6); mur *= np.minimum(1, np.minimum(np.arange(len(mur)) / (0.3 * SR), (len(mur) - np.arange(len(mur))) / (0.3 * SR)))
    add(mur, 10.1, 0.05)
    for k, ts in enumerate((10.30, 10.60, 10.90)):
        add(sfx.vibrate(0.26), ts, 0.10); add(sfx.chime((1568, 2093), 0.07, 0.6), ts + 0.02, 0.05, pan=(-0.2, 0.2, 0)[k])
    add(sfx.warm_hit(), 11.5, 0.22)
    add(sfx.chime((1046.5, 1568), 0.12, 1.2, bright=0.5), 12.85, 0.05)
    mix = np.stack([L + voice, R + voice], 1)[: int(DUR * SR)]
    # limitador suave
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    sf.write(f"{B}/audio/mix.wav", mix, SR, subtype="PCM_24")

if __name__ == "__main__":
    if PREVIEW:
        for tt in PREVIEW:
            render(int(round(tt * FPS))).save(f"{B}/preview_{tt:05.2f}.png")
        sys.exit()
    build_audio()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{B}/audio/mix.wav", "-af",
                    "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", "48000", f"{B}/audio/mix_norm.wav"], check=True)
    out = sys.argv[1] if len(sys.argv) > 1 else f"{B}/video.mp4"
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-i", f"{B}/audio/mix_norm.wav", "-map", "0:v", "-map", "1:a",
                           "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "9M", "-bufsize", "18M", "-tune", "film", "-profile:v", "high", "-level", "4.2",
                           "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-shortest", out],
                          stdin=subprocess.PIPE)
    for i in range(NF):
        ff.stdin.write(np.asarray(render(i)).tobytes())
        if i % 30 == 0: print("frame", i, "/", NF, flush=True)
    ff.stdin.close(); ff.wait()
    print("OK", out)
