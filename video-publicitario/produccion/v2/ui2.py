# Tarjetas v2: genéricas (cualquier rubro), texto grande y legible en celular.
from PIL import Image
from ui import (Canvas, card_base, ease, font, star, stars, pin, clock, globe, chat, calendar, image_icon,
                check, ticks, WHITE, MUTED, GOLD, GOLD_L, GREEN, WA_IN, WA_OUT)

RED = (214, 120, 110)

def search_maps_bad(t=1.0):
    w, h = 880, 640
    c = card_base(w, h)
    # barra de búsqueda
    c.rrect(36, 36, w - 72, 78, 39, fill=(34, 34, 34))
    c.circle(80, 75, 13, outline=(170, 170, 166), width=3)
    c.line([(89, 84), (100, 95)], (170, 170, 166), 3)
    q = "negocio cerca de mí"
    n = int(len(q) * ease(t / 0.35))
    c.text(118, 75, q[:n], "Inter-Regular", 32, (220, 220, 214), anchor="lm")
    k = ease((t - 0.3) / 0.35)
    a = int(255 * k)
    pin(c, 70, 186, 20, (120, 120, 116, a), hole=(16, 16, 16))
    c.text(112, 162, "Tu negocio", "InterDisplay-SemiBold", 42, WHITE + (a,))
    c.text(112, 214, "Comercio local", "Inter-Regular", 28, MUTED + (a,))
    c.text(48, 272, "3,9", "InterDisplay-SemiBold", 38, (210, 210, 206, a))
    stars(c, 118, 294, 17, 3.9 * k, (160, 160, 156, a), (58, 58, 58, a))
    c.text(330, 276, "(12 reseñas)", "Inter-Regular", 30, MUTED + (a,))
    c.line([(48, 348), (w - 48, 348)], (255, 255, 255, int(26 * k)), 1.5)
    rows = [("clock", "Horario no disponible"), ("img", "Sin fotos"), ("globe", "Sin sitio web")]
    for i, (ic, txt) in enumerate(rows):
        kk = ease((t - 0.45 - 0.12 * i) / 0.3)
        if kk <= 0: continue
        y = 380 + i * 76; col = (140, 140, 136, int(255 * kk))
        if ic == "clock": clock(c, 68, y + 20, 17, col)
        if ic == "img": image_icon(c, 50, y + 6, 36, col)
        if ic == "globe": globe(c, 68, y + 20, 17, col)
        c.text(112, y, txt, "Inter-Medium", 34, (195, 195, 190, int(255 * kk)))
    return c.out()

def wa_unanswered(t=1.0):
    w, h = 880, 640
    c = card_base(w, h)
    c.circle(80, 80, 32, fill=(48, 56, 60))
    chat(c, 80, 78, 14, (150, 160, 164), filled=True)
    c.text(132, 52, "Clientes", "InterDisplay-SemiBold", 38, WHITE)
    c.text(132, 100, "WhatsApp", "Inter-Regular", 26, MUTED)
    c.rrect(w - 250, 58, 204, 50, 25, fill=(70, 46, 42))
    c.text(w - 148, 83, "Sin responder", "Inter-SemiBold", 24, (240, 200, 190), anchor="mm")
    c.line([(40, 152), (w - 40, 152)], (255, 255, 255, 22), 1.5)
    msgs = [("Hola! ¿Tienen disponibilidad hoy?", "10:12"), ("¿Cuánto sale?", "10:15"), ("¿Hola? ¿Siguen atendiendo?", "13:40")]
    for i, (m, hh) in enumerate(msgs):
        k = ease((t - 0.2 * i) / 0.3)
        if k <= 0: continue
        y = 184 + i * 128 + (1 - k) * 16
        tw = c.tlen(m, "Inter-Regular", 33)
        c.rrect(40, y, tw + 140, 100, 24, fill=WA_IN + (int(255 * k),))
        c.text(66, y + 20, m, "Inter-Regular", 33, (233, 237, 239, int(255 * k)))
        c.text(66 + tw + 46, y + 66, hh, "Inter-Regular", 21, (140, 150, 154, int(255 * k)))
    k = ease((t - 0.7) / 0.3)
    if k > 0:
        c.text(w / 2, h - 50, "Última respuesta: hace 3 horas", "Inter-Medium", 28, (200, 170, 160, int(255 * k)), anchor="mm")
    return c.out()

def confusing_process(t=1.0):
    w, h = 880, 640
    c = card_base(w, h)
    c.text(48, 48, "Cómo reservar", "InterDisplay-SemiBold", 40, WHITE)
    c.line([(40, 122), (w - 40, 122)], (255, 255, 255, 22), 1.5)
    steps = ["Llamá de 9 a 13 hs", "Si no atendemos, mandá un mail", "Esperá la confirmación (24–48 hs)"]
    for i, s in enumerate(steps):
        k = ease((t - 0.15 * i) / 0.3)
        if k <= 0: continue
        y = 150 + i * 92; a = int(255 * k)
        c.circle(70, y + 30, 22, outline=(150, 150, 146, a), width=2)
        c.text(70, y + 31, str(i + 1), "Inter-SemiBold", 24, (200, 200, 196, a), anchor="mm")
        c.text(112, y + 30, s, "Inter-Regular", 33, (205, 205, 200, a), anchor="lm")
    k = ease((t - 0.55) / 0.3)
    if k > 0:
        a = int(255 * k)
        c.rrect(40, 444, w - 80, 150, 24, fill=(52, 30, 28, a), outline=(214, 120, 110, int(150 * k)), width=1.5)
        c.circle(98, 519, 24, outline=RED + (a,), width=3)
        c.text(98, 520, "!", "Inter-SemiBold", 30, RED + (a,), anchor="mm")
        c.text(144, 486, "Reserva no completada", "Inter-SemiBold", 32, (240, 205, 198, a))
        c.text(144, 532, "El cliente se fue a otro negocio", "Inter-Regular", 28, (210, 180, 172, a))
    return c.out()

# --------- fila ANTES -> DESPUÉS ---------
def before_after_row(icon, title, before, after, t=1.0):
    w, h = 880, 196
    c = Canvas(w, h)
    c.rrect(0, 0, w - 1, h - 1, 32, fill=(18, 18, 18, 225), outline=(255, 255, 255, 30), width=1.5)
    col = GOLD_L
    if icon == "pin": pin(c, 52, 50, 15, col, hole=(18, 18, 18))
    if icon == "chat": chat(c, 52, 48, 15, col)
    if icon == "cal": calendar(c, 36, 30, 34, col)
    c.text(86, 49, title, "Inter-SemiBold", 33, WHITE, anchor="lm")
    # antes
    c.rrect(32, 92, 360, 76, 20, fill=(34, 34, 34))
    c.text(52, 102, "ANTES", "Inter-SemiBold", 17, (150, 150, 146), tracking=2)
    c.text(52, 140, before, "Inter-Medium", 29, (190, 190, 186), anchor="lm")
    # flecha
    k = ease((t - 0.15) / 0.35)
    c.line([(408, 130), (408 + 50 * k, 130)], GOLD + (int(255 * k),), 3)
    if k > 0.6:
        c.poly([(460, 130), (446, 120), (446, 140)], GOLD + (int(255 * k),))
    # después
    k2 = ease((t - 0.35) / 0.4)
    if k2 > 0:
        a = int(255 * k2)
        c.rrect(478, 92, 370, 76, 20, fill=(42, 36, 24, a), outline=GOLD + (int(170 * k2),), width=1.5)
        c.text(498, 102, "DESPUÉS", "Inter-SemiBold", 17, GOLD + (a,), tracking=2)
        c.text(498, 140, after, "Inter-SemiBold", 29, WHITE + (a,), anchor="lm")
    return c.out()

# --------- panel de prueba (ejemplo ilustrativo) ---------
def proof_panel(t=1.0):
    w, h = 880, 760
    c = card_base(w, h)
    c.rrect(40, 36, 380, 50, 25, fill=(42, 36, 24), outline=GOLD + (160,), width=1.5)
    c.text(230, 61, "EJEMPLO DE MEJORA", "Inter-SemiBold", 21, GOLD_L, anchor="mm", tracking=2)
    c.text(w - 44, 61, "Datos ilustrativos", "Inter-Regular", 22, MUTED, anchor="rm")
    # rating antes / después
    c.rrect(40, 116, 380, 200, 26, fill=(30, 30, 30))
    c.text(64, 132, "ANTES", "Inter-SemiBold", 18, (150, 150, 146), tracking=2)
    c.text(64, 170, "4,2", "InterDisplay-SemiBold", 64, (200, 200, 196))
    star(c, 205, 207, 22, (160, 160, 156))
    c.text(64, 262, "127 reseñas", "Inter-Regular", 26, MUTED)
    k = ease((t - 0.1) / 0.4)
    a = int(255 * k)
    c.rrect(460, 116, 380, 200, 26, fill=(42, 36, 24, a), outline=GOLD + (int(170 * k),), width=1.5)
    c.text(484, 132, "DESPUÉS", "Inter-SemiBold", 18, GOLD + (a,), tracking=2)
    val = 4.2 + 0.6 * ease((t - 0.15) / 0.5)
    c.text(484, 170, f"{val:.1f}".replace(".", ","), "InterDisplay-SemiBold", 64, WHITE + (a,))
    star(c, 625, 207, 22, GOLD + (a,))
    c.text(484, 262, "+ reseñas  ·  + consultas", "Inter-Medium", 26, GOLD_L + (a,))
    # barras de métricas
    rows = [("Google Maps", "visibilidad", 0.62, 0.9), ("WhatsApp", "consultas", 0.45, 0.85), ("Reservas", "conversiones", 0.38, 0.8)]
    for i, (name, lab, b0, b1) in enumerate(rows):
        y = 356 + i * 128
        kk = ease((t - 0.35 - 0.15 * i) / 0.5)
        c.text(40, y, name, "Inter-SemiBold", 30, WHITE)
        c.text(w - 40, y, "↑ " + lab, "Inter-SemiBold", 30, GOLD_L + (int(255 * max(0.25, kk)),), anchor="ra")
        y2 = y + 54
        c.rrect(40, y2, w - 80, 26, 13, fill=(40, 40, 40))
        c.rrect(40, y2, (w - 80) * b0, 26, 13, fill=(92, 92, 90))
        bw = (w - 80) * (b0 + (b1 - b0) * kk)
        if kk > 0:
            c.rrect(40, y2, bw, 26, 13, fill=GOLD)
            c.rrect(40 + (w - 80) * b0 - 2, y2 - 6, 4, 38, 2, fill=(235, 235, 230))
    return c.out()
