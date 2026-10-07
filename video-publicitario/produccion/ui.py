# Componentes de interfaz dibujados por código (texto 100 % legible, sin IA).
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

SS = 2  # supersampling para bordes suaves
F = "/usr/share/fonts/opentype/inter/"
_fc = {}
def font(name, size):
    k = (name, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(F + name + ".otf", int(size))
    return _fc[k]

WHITE = (245, 245, 242)
MUTED = (150, 150, 146)
DIM = (96, 96, 94)
GOLD = (201, 164, 92)
GOLD_L = (227, 200, 138)
CARD = (20, 20, 20)
LINE = (255, 255, 255, 26)
GREEN = (120, 186, 140)
WA_IN = (32, 44, 51)
WA_OUT = (0, 92, 75)

def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3

def ease_io(x):
    x = max(0.0, min(1.0, x))
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


class Canvas:
    """Lienzo RGBA a 2x; se reduce al final."""
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def s(self, v):
        return int(round(v * SS))

    def rrect(self, x, y, w, h, r, fill=None, outline=None, width=1):
        self.d.rounded_rectangle([self.s(x), self.s(y), self.s(x + w), self.s(y + h)], radius=self.s(r),
                                 fill=fill, outline=outline, width=self.s(width) if outline else 0)

    def circle(self, cx, cy, r, fill=None, outline=None, width=1):
        self.d.ellipse([self.s(cx - r), self.s(cy - r), self.s(cx + r), self.s(cy + r)], fill=fill,
                       outline=outline, width=self.s(width) if outline else 0)

    def line(self, pts, fill, width=2):
        self.d.line([(self.s(x), self.s(y)) for x, y in pts], fill=fill, width=self.s(width), joint="curve")

    def poly(self, pts, fill):
        self.d.polygon([(self.s(x), self.s(y)) for x, y in pts], fill=fill)

    def arc(self, cx, cy, r, a0, a1, fill, width):
        self.d.arc([self.s(cx - r), self.s(cy - r), self.s(cx + r), self.s(cy + r)], a0, a1, fill=fill, width=self.s(width))

    def text(self, x, y, txt, name, size, fill, anchor="la", tracking=0):
        f = font(name, size * SS)
        if tracking:
            cx = self.s(x)
            if anchor[0] == "m":
                tw = sum(f.getlength(c) for c in txt) + self.s(tracking) * (len(txt) - 1)
                cx -= tw / 2
                anchor = "l" + anchor[1]
            for c in txt:
                self.d.text((cx, self.s(y)), c, font=f, fill=fill, anchor=anchor)
                cx += f.getlength(c) + self.s(tracking)
        else:
            self.d.text((self.s(x), self.s(y)), txt, font=f, fill=fill, anchor=anchor)

    def tlen(self, txt, name, size):
        return font(name, size).getlength(txt)

    def paste(self, img, x, y):
        img2 = img.resize((img.width * SS, img.height * SS), Image.LANCZOS)
        self.im.alpha_composite(img2, (self.s(x), self.s(y)))

    def out(self):
        return self.im.resize((self.w, self.h), Image.LANCZOS)


# ---------- iconos ----------
def star(c, cx, cy, r, fill):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    c.poly(pts, fill)

def stars(c, x, cy, r, value, on, off):
    for i in range(5):
        cx = x + r + i * r * 2.3
        star(c, cx, cy, r, off)
        frac = max(0, min(1, value - i))
        if frac > 0:
            layer = Canvas(c.w, c.h)
            star(layer, cx, cy, r, on)
            if frac < 1:
                layer.d.rectangle([layer.s(cx - r + 2 * r * frac), 0, layer.im.width, layer.im.height], fill=(0, 0, 0, 0))
            c.im.alpha_composite(layer.im)

def pin(c, cx, cy, r, fill, hole=CARD):
    c.circle(cx, cy - r * 0.2, r, fill=fill)
    c.poly([(cx - r * 0.82, cy + r * 0.25), (cx + r * 0.82, cy + r * 0.25), (cx, cy + r * 1.45)], fill)
    c.circle(cx, cy - r * 0.2, r * 0.42, fill=hole)

def clock(c, cx, cy, r, col):
    c.circle(cx, cy, r, outline=col, width=2.4)
    c.line([(cx, cy - r * 0.55), (cx, cy), (cx + r * 0.45, cy + r * 0.3)], col, 2.4)

def globe(c, cx, cy, r, col):
    c.circle(cx, cy, r, outline=col, width=2.2)
    c.d.ellipse([c.s(cx - r * 0.45), c.s(cy - r), c.s(cx + r * 0.45), c.s(cy + r)], outline=col, width=c.s(2.2))
    c.line([(cx - r, cy), (cx + r, cy)], col, 2.2)

def chat(c, cx, cy, r, col, filled=False):
    if filled:
        c.circle(cx, cy, r, fill=col)
        c.poly([(cx - r * 0.85, cy + r * 0.45), (cx - r * 1.05, cy + r * 1.1), (cx - r * 0.3, cy + r * 0.85)], col)
    else:
        c.circle(cx, cy, r, outline=col, width=2.4)
        c.poly([(cx - r * 0.8, cy + r * 0.5), (cx - r * 1.0, cy + r * 1.05), (cx - r * 0.35, cy + r * 0.85)], col)

def calendar(c, x, y, s, col):
    c.rrect(x, y + s * 0.12, s, s * 0.88, s * 0.14, outline=col, width=2.4)
    c.line([(x, y + s * 0.38), (x + s, y + s * 0.38)], col, 2.4)
    c.line([(x + s * 0.28, y), (x + s * 0.28, y + s * 0.24)], col, 2.4)
    c.line([(x + s * 0.72, y), (x + s * 0.72, y + s * 0.24)], col, 2.4)

def image_icon(c, x, y, s, col):
    c.rrect(x, y, s, s * 0.8, s * 0.12, outline=col, width=2.2)
    c.poly([(x + s * 0.12, y + s * 0.68), (x + s * 0.4, y + s * 0.36), (x + s * 0.62, y + s * 0.6),
            (x + s * 0.74, y + s * 0.48), (x + s * 0.9, y + s * 0.68)], col)
    c.circle(x + s * 0.72, y + s * 0.24, s * 0.08, fill=col)

def check(c, cx, cy, r, col, width, prog=1.0):
    pts = [(cx - r * 0.45, cy + r * 0.02), (cx - r * 0.1, cy + r * 0.36), (cx + r * 0.5, cy - r * 0.32)]
    l1 = math.dist(pts[0], pts[1]); l2 = math.dist(pts[1], pts[2]); L = (l1 + l2) * prog
    if L <= 0:
        return
    if L <= l1:
        p = (pts[0][0] + (pts[1][0] - pts[0][0]) * L / l1, pts[0][1] + (pts[1][1] - pts[0][1]) * L / l1)
        c.line([pts[0], p], col, width)
    else:
        k = (L - l1) / l2
        p = (pts[1][0] + (pts[2][0] - pts[1][0]) * k, pts[1][1] + (pts[2][1] - pts[1][1]) * k)
        c.line([pts[0], pts[1], p], col, width)

def ticks(c, x, y, col):
    for dx in (0, 7):
        c.line([(x + dx, y + 5), (x + dx + 4, y + 9), (x + dx + 12, y)], col, 2)


# ---------- base de tarjeta ----------
def card_base(w, h):
    c = Canvas(w, h)
    c.rrect(0, 0, w - 1, h - 1, 38, fill=(16, 16, 16, 214), outline=(255, 255, 255, 30), width=1.5)
    return c

def shadow_for(card_img, blur=40, alpha=170, grow=10):
    w, h = card_img.size
    pad = blur * 2
    sh = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    a = card_img.split()[3].point(lambda v: alpha if v > 0 else 0)
    m = Image.new("L", sh.size, 0)
    m.paste(a, (pad, pad + grow))
    m = m.filter(ImageFilter.GaussianBlur(blur))
    sh.putalpha(m)
    return sh, pad


# ---------- tarjetas "ANTES" ----------
def maps_bad(t=1.0):
    w, h = 860, 560
    c = card_base(w, h)
    pin(c, 70, 78, 20, (110, 110, 108), hole=(16, 16, 16))
    c.text(112, 58, "Barbería Don Ramón", "InterDisplay-SemiBold", 40, WHITE)
    c.text(112, 108, "Barbería", "Inter-Regular", 26, MUTED)
    c.text(48, 168, "3,9", "InterDisplay-SemiBold", 34, (200, 200, 196))
    stars(c, 112, 188, 15, 3.9, (150, 150, 146), (58, 58, 58))
    c.text(300, 172, "(12 reseñas)", "Inter-Regular", 26, MUTED)
    c.line([(48, 240), (w - 48, 240)], (255, 255, 255, 26), 1.5)
    rows = [("clock", "Horario no disponible"), ("img", "Sin fotos del local"), ("globe", "Sin sitio web"), ("chat", "Sin WhatsApp ni reservas")]
    for i, (ic, txt) in enumerate(rows):
        k = ease((t - 0.15 * i) / 0.4)
        if k <= 0:
            continue
        y = 286 + i * 64
        col = (120, 120, 116, int(255 * k))
        if ic == "clock": clock(c, 66, y + 16, 15, col)
        if ic == "img": image_icon(c, 50, y + 4, 32, col)
        if ic == "globe": globe(c, 66, y + 16, 15, col)
        if ic == "chat": chat(c, 66, y + 14, 14, col)
        c.text(108, y, txt, "Inter-Regular", 30, (175, 175, 170, int(255 * k)))
    return c.out()

def wa_bad(t=1.0):
    w, h = 860, 600
    c = card_base(w, h)
    c.circle(78, 76, 30, fill=(48, 56, 60))
    chat(c, 78, 74, 13, (150, 160, 164), filled=True)
    c.text(126, 50, "Consultas de clientes", "InterDisplay-SemiBold", 34, WHITE)
    c.text(126, 94, "WhatsApp", "Inter-Regular", 24, MUTED)
    c.rrect(w - 236, 52, 190, 46, 23, fill=(60, 60, 58))
    c.text(w - 141, 75, "3 sin responder", "Inter-Medium", 22, (220, 220, 214), anchor="mm")
    c.line([(40, 144), (w - 40, 144)], (255, 255, 255, 22), 1.5)
    msgs = [("Hola! ¿Tienen lugar hoy a la tarde?", "19:12"), ("¿Hacen envíos a domicilio?", "20:40"), ("¿Siguen abiertos? Nadie contesta…", "21:47")]
    for i, (m, hh) in enumerate(msgs):
        k = ease((t - 0.22 * i) / 0.35)
        if k <= 0:
            continue
        y = 176 + i * 120 + (1 - k) * 18
        tw = c.tlen(m, "Inter-Regular", 29)
        c.rrect(40, y, tw + 140, 92, 22, fill=WA_IN + (int(255 * k),))
        c.text(66, y + 18, m, "Inter-Regular", 29, (233, 237, 239, int(255 * k)))
        c.text(66 + tw + 50, y + 58, hh, "Inter-Regular", 20, (140, 150, 154, int(255 * k)))
    k = ease((t - 0.8) / 0.4)
    if k > 0:
        c.text(w / 2, h - 52, "Visto · sin respuesta", "Inter-Medium", 24, (130, 130, 126, int(255 * k)), anchor="mm")
    return c.out()

def web_bad(t=1.0, spin=0.0):
    w, h = 860, 600
    c = card_base(w, h)
    for i, col in enumerate([(90, 90, 88)] * 3):
        c.circle(56 + i * 30, 52, 9, fill=col)
    c.rrect(160, 30, w - 200, 44, 22, fill=(36, 36, 36))
    c.text(186, 52, "restaurante-delbarrio.com.ar", "Inter-Regular", 22, MUTED, anchor="lm")
    c.rrect(0, 92, w, 4, 0, fill=(40, 40, 40))
    c.rrect(0, 92, int(w * 0.31), 4, 0, fill=(140, 140, 136))
    for (x, y, ww, hh) in [(48, 136, 764, 150), (48, 310, 480, 34), (48, 362, 620, 26), (48, 402, 560, 26), (48, 442, 400, 26)]:
        c.rrect(x, y, ww, hh, 10, fill=(38, 38, 38))
    cx, cy = w / 2, 211
    c.arc(cx, cy, 30, 0, 360, (70, 70, 68), 5)
    a0 = spin * 360
    c.arc(cx, cy, 30, a0, a0 + 90, (200, 200, 196), 5)
    k = ease((t - 0.2) / 0.4)
    c.text(48, h - 72, "Cargando…", "Inter-Medium", 30, (200, 200, 196, int(255 * k)))
    c.text(w - 48, h - 72, f"{3.0 + 5.4 * min(1, t):.1f} s".replace(".", ","), "InterDisplay-SemiBold", 30, (200, 200, 196, int(255 * k)), anchor="ra")
    return c.out()

def agenda_bad(t=1.0):
    w, h = 860, 600
    c = card_base(w, h)
    calendar(c, 48, 44, 40, (160, 160, 156))
    c.text(110, 46, "Turnos de la semana", "InterDisplay-SemiBold", 36, WHITE)
    c.line([(40, 122), (w - 40, 122)], (255, 255, 255, 22), 1.5)
    rows = [("18:00", "Martín G.", "superpuesto", True), ("18:00", "Lucía P.", "superpuesto", False),
            ("19:30", "Diego R.", "no vino", True), ("20:00", "— ? —", "sin confirmar", False)]
    for i, (hh, n, st, strike) in enumerate(rows):
        k = ease((t - 0.18 * i) / 0.35)
        if k <= 0:
            continue
        y = 150 + i * 92
        a = int(255 * k)
        c.text(48, y + 14, hh, "InterDisplay-SemiBold", 32, (200, 200, 196, a))
        c.text(170, y + 14, n, "Inter-Regular", 32, (200, 200, 196, a))
        tw = c.tlen(st, "Inter-Medium", 22) + 36
        c.rrect(w - 48 - tw, y + 12, tw, 42, 21, outline=(150, 150, 146, a), width=1.5)
        c.text(w - 48 - tw / 2, y + 33, st, "Inter-Medium", 22, (190, 190, 186, a), anchor="mm")
        if strike:
            sk = ease((t - 0.18 * i - 0.25) / 0.3)
            c.line([(164, y + 34), (164 + (c.tlen(n, "Inter-Regular", 32) + 12) * sk, y + 32)], (210, 210, 206, a), 3)
    k = ease((t - 0.85) / 0.4)
    if k > 0:
        c.text(w / 2, h - 50, "3 clientes perdidos esta semana", "Inter-Medium", 26, (190, 190, 186, int(255 * k)), anchor="mm")
    return c.out()


# ---------- tarjetas "DESPUÉS" ----------
def maps_good(photos, t=1.0):
    w, h = 860, 680
    c = card_base(w, h)
    pw = (w - 48 * 2 - 24) / 3
    for i, ph in enumerate(photos):
        k = ease((t - 0.08 * i) / 0.35)
        if k <= 0:
            continue
        im = ph.resize((int(pw), 210), Image.LANCZOS).convert("RGBA")
        m = Image.new("L", im.size, 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=20, fill=int(255 * k))
        im.putalpha(m)
        c.paste(im, 48 + i * (pw + 12), 44)
    pin(c, 70, 316, 20, GOLD, hole=(16, 16, 16))
    c.text(112, 294, "Barbería Don Ramón", "InterDisplay-SemiBold", 40, WHITE)
    c.text(112, 344, "Barbería clásica · Palermo", "Inter-Regular", 26, MUTED)
    k = ease((t - 0.25) / 0.45)
    val = 4.9 * k
    c.text(48, 400, f"{val:.1f}".replace(".", ","), "InterDisplay-SemiBold", 34, WHITE)
    stars(c, 112, 420, 15, val, GOLD, (58, 58, 58))
    c.text(300, 404, f"({int(248 * k)} reseñas)", "Inter-Regular", 26, MUTED)
    c.circle(58, 488, 7, fill=GREEN)
    c.text(78, 470, "Abierto", "Inter-Medium", 28, GREEN)
    c.text(78 + c.tlen("Abierto ", "Inter-Medium", 28), 470, "· Cierra a las 21:00", "Inter-Regular", 28, (200, 200, 196))
    bw = (w - 96 - 32) / 3
    labels = ["Cómo llegar", "WhatsApp", "Reservar"]
    for i, lb in enumerate(labels):
        k = ease((t - 0.35 - 0.08 * i) / 0.35)
        if k <= 0:
            continue
        x = 48 + i * (bw + 16)
        y = 560 + (1 - k) * 12
        if i == 2:
            c.rrect(x, y, bw, 76, 38, fill=GOLD + (int(255 * k),))
            c.text(x + bw / 2, y + 38, lb, "Inter-SemiBold", 27, (12, 12, 12, int(255 * k)), anchor="mm")
        else:
            c.rrect(x, y, bw, 76, 38, outline=(255, 255, 255, int(70 * k)), width=1.5)
            c.text(x + bw / 2, y + 38, lb, "Inter-Medium", 27, WHITE + (int(255 * k),), anchor="mm")
    return c.out()

def wa_good(t=1.0):
    w, h = 860, 640
    c = card_base(w, h)
    c.circle(78, 76, 30, fill=(48, 56, 60))
    chat(c, 78, 74, 13, GOLD_L, filled=True)
    c.text(126, 50, "Barbería Don Ramón", "InterDisplay-SemiBold", 34, WHITE)
    c.text(126, 94, "Responde al instante", "Inter-Regular", 24, GREEN)
    c.line([(40, 144), (w - 40, 144)], (255, 255, 255, 22), 1.5)
    # entrante
    k = ease(t / 0.3)
    if k > 0:
        m = "¿Tienen turno hoy?"
        tw = c.tlen(m, "Inter-Regular", 30)
        y = 176 + (1 - k) * 16
        c.rrect(40, y, tw + 130, 92, 22, fill=WA_IN + (int(255 * k),))
        c.text(66, y + 18, m, "Inter-Regular", 30, (233, 237, 239, int(255 * k)))
        c.text(66 + tw + 40, y + 58, "18:02", "Inter-Regular", 20, (140, 150, 154, int(255 * k)))
    # escribiendo…
    if 0.32 < t < 0.5:
        y = 292
        c.rrect(w - 170, y, 130, 64, 22, fill=WA_OUT)
        for i in range(3):
            ph = (t * 8 + i * 0.3) % 1
            c.circle(w - 135 + i * 30, y + 32, 7, fill=(200, 230, 220, int(120 + 135 * abs(math.sin(ph * math.pi)))))
    k = ease((t - 0.5) / 0.28)
    if k > 0:
        lines = ["¡Hola! Sí, tenemos 18:30 o 19:15.", "¿Te reservo uno?"]
        bw = max(c.tlen(l, "Inter-Regular", 30) for l in lines) + 130
        y = 292 + (1 - k) * 16
        x = w - 40 - bw
        c.rrect(x, y, bw, 140, 22, fill=WA_OUT + (int(255 * k),))
        for j, l in enumerate(lines):
            c.text(x + 26, y + 18 + j * 42, l, "Inter-Regular", 30, (233, 240, 238, int(255 * k)))
        c.text(x + bw - 92, y + 104, "18:02", "Inter-Regular", 20, (170, 210, 200, int(255 * k)))
        ticks(c, x + bw - 36, y + 106, (83, 189, 235, int(255 * k)))
    k = ease((t - 0.8) / 0.25)
    if k > 0:
        m = "Dale, 19:15"
        tw = c.tlen(m, "Inter-Regular", 30)
        y = 456 + (1 - k) * 16
        c.rrect(40, y, tw + 130, 92, 22, fill=WA_IN + (int(255 * k),))
        c.text(66, y + 18, m, "Inter-Regular", 30, (233, 237, 239, int(255 * k)))
        c.text(66 + tw + 40, y + 58, "18:03", "Inter-Regular", 20, (140, 150, 154, int(255 * k)))
    return c.out()

def web_good(hero, t=1.0):
    w, h = 860, 680
    c = card_base(w, h)
    for i, col in enumerate([(90, 90, 88)] * 3):
        c.circle(56 + i * 30, 52, 9, fill=col)
    c.rrect(160, 30, w - 200, 44, 22, fill=(36, 36, 36))
    c.text(186, 52, "barberiadonramon.com.ar", "Inter-Regular", 22, (200, 200, 196), anchor="lm")
    c.rrect(0, 92, w, 4, 0, fill=GOLD)
    im = hero.resize((w - 2, 420), Image.LANCZOS).convert("RGBA")
    grad = Image.linear_gradient("L").resize(im.size)
    shade = Image.new("RGBA", im.size, (8, 8, 8, 255)); shade.putalpha(grad.point(lambda v: int(v * 0.85)))
    im.alpha_composite(shade)
    c.paste(im, 1, 96)
    k = ease(t / 0.4)
    c.text(48, 320, "Cortes clásicos.", "InterDisplay-SemiBold", 48, WHITE + (int(255 * k),))
    c.text(48, 376, "Turnos en 30 segundos.", "InterDisplay-SemiBold", 48, GOLD_L + (int(255 * k),))
    k2 = ease((t - 0.3) / 0.35)
    if k2 > 0:
        c.rrect(48, 548, 330, 84, 42, fill=GOLD + (int(255 * k2),))
        c.text(48 + 165, 590, "Reservar turno", "Inter-SemiBold", 28, (12, 12, 12, int(255 * k2)), anchor="mm")
        c.rrect(w - 48 - 200, 562, 200, 56, 28, outline=(255, 255, 255, int(60 * k2)), width=1.5)
        c.text(w - 148, 590, "Carga: 0,8 s", "Inter-Medium", 22, (200, 200, 196, int(255 * k2)), anchor="mm")
    return c.out()

def booking_good(t=1.0):
    w, h = 860, 600
    c = card_base(w, h)
    k = ease(t / 0.35)
    c.circle(w / 2, 150, 74 * (0.85 + 0.15 * k), fill=GOLD + (int(255 * k),))
    check(c, w / 2, 150, 70, (14, 14, 14), 9, prog=ease((t - 0.15) / 0.3))
    k2 = ease((t - 0.25) / 0.35)
    a = int(255 * k2)
    c.text(w / 2, 282, "Turno confirmado", "InterDisplay-SemiBold", 50, WHITE + (a,), anchor="mm")
    c.text(w / 2, 340, "Hoy · 19:15 · Corte + barba", "Inter-Regular", 30, (200, 200, 196, a), anchor="mm")
    c.line([(80, 400), (w - 80, 400)], (255, 255, 255, int(26 * k2)), 1.5)
    k3 = ease((t - 0.45) / 0.35)
    a3 = int(255 * k3)
    calendar(c, 120, 440, 34, GOLD_L + (a3,))
    c.text(174, 442, "Agendado automáticamente", "Inter-Regular", 28, (220, 220, 214, a3))
    chat(c, 137, 516, 15, GOLD_L + (a3,))
    c.text(174, 500, "Recordatorio por WhatsApp", "Inter-Regular", 28, (220, 220, 214, a3))
    return c.out()

def toast(title, body, icon, k=1.0):
    w, h = 900, 132
    c = Canvas(w, h)
    c.rrect(0, 0, w - 1, h - 1, 34, fill=(28, 28, 28, int(230 * k)), outline=(255, 255, 255, int(34 * k)), width=1.5)
    c.rrect(26, 30, 72, 72, 18, fill=(GOLD if icon != "wa" else (37, 160, 100)) + (int(255 * k),))
    ic = (14, 14, 14, int(255 * k)) if icon != "wa" else (255, 255, 255, int(255 * k))
    if icon == "cal": calendar(c, 44, 46, 36, ic)
    if icon == "wa": chat(c, 62, 64, 17, ic)
    if icon == "star": star(c, 62, 67, 24, ic)
    c.text(122, 34, title, "Inter-SemiBold", 30, WHITE + (int(255 * k),))
    c.text(122, 76, body, "Inter-Regular", 27, (200, 200, 196, int(255 * k)))
    c.text(w - 32, 36, "ahora", "Inter-Regular", 23, (150, 150, 146, int(255 * k)), anchor="ra")
    return c.out()

def pill(text, k=1.0, dot=(150, 150, 146)):
    f = font("Inter-Medium", 28)
    w = int(f.getlength(text)) + 100
    h = 70
    c = Canvas(w, h)
    c.rrect(0, 0, w - 1, h - 1, 35, fill=(18, 18, 18, int(200 * k)), outline=(255, 255, 255, int(40 * k)), width=1.5)
    c.circle(38, 35, 8, fill=dot + (int(255 * k),))
    c.text(60, 35, text, "Inter-Medium", 28, (230, 230, 226, int(255 * k)), anchor="lm")
    return c.out()
