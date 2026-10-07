/* Idea 1 · Qué pasa si no tenés reseñas */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "gold";
const DURATION = 25;

scene("gancho", 2.4, [
  TextReveal({ text: "¿Tu negocio\ntiene *reseñas*?", size: 130, weight: 800, y: -40, role: "hero", cue: "impact", cueGain: 0.8 }),
], { camera: { from: { z: -140 }, to: { z: 60 } }, bg: { rings: 0.9, ringScale: 0.85 } });

scene("ficha", 4.4, [
  TextReveal({ text: "Una ficha sin reseñas\nparece *cerrada*.", size: 92, y: -560 }),
  UICard({ kind: "maps", at: 0.8, width: 820, y: 160, rx: 8, float: 6, data: { rating: "—", count: 0, status: "Sin reseñas todavía" } }),
], { camera: { from: { z: -80, rx: 4 }, to: { z: 30 } }, bg: { tint: "warn", glow: [0, 100] } });

scene("mira", 4.0, [
  TextReveal({ text: "Antes de escribirte,\ntu cliente lee *esto*:", size: 90, y: -560 }),
  UICard({ kind: "review", at: 0.9, width: 820, y: 120, z: 40, float: 6, glow: true }),
], { transition: { type: "push" }, camera: { from: { z: -60, ry: 4 }, to: { z: 40, ry: -3 } }, bg: { glow: [0, 120] } });

scene("como", 5.2, [
  Eyebrow({ text: "Cómo lo resolvemos", y: -690 }),
  TextReveal({ text: "Pedir reseñas,\n*sin incomodar*:", size: 100, y: -530 }),
  PillCascade({ at: 1.0, y: 160, items: [
    { icon: "qr", text: "QR en el mostrador" },
    { icon: "chat", text: "Mensaje después de la compra" },
    { icon: "star", text: "Respuesta a cada reseña" },
    { icon: "trend", text: "Seguimiento todos los meses", hl: true },
  ] }),
], { camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("remate", 3.6, [
  TextReveal({ text: "Cada reseña real es", size: 76, color: "muted", y: -330, role: "body", cue: null }),
  KeywordCircle({ text: "confianza", at: 0.3, size: 170, y: -110 }),
], { transition: { type: "zoom" }, camera: { from: { z: -140 }, to: { z: 70 } }, bg: { rings: 1, ringScale: 0.7 } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
