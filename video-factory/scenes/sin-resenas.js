/* Idea 1 · Qué pasa si no tenés reseñas */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "gold";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  TextReveal({ text: "¿Tu negocio\ntiene *reseñas*?", size: 130, weight: 800, y: -40, role: "hero", cue: "impact", cueGain: 0.8 }),
], { vo: "¿Tu negocio tiene reseñas?", voAt: 0.2, hold: 0.25, camera: { from: { z: -140 }, to: { z: 60 } }, bg: { rings: 0.9, ringScale: 0.85 } });

scene("ficha", null, [
  TextReveal({ text: "Sin reseñas,\nparecés *cerrado*.", size: 100, y: -560 }),
  UICard({ kind: "maps", at: 0.5, width: 820, y: 160, rx: 8, float: 6, data: { rating: "—", count: 0, status: "Sin reseñas todavía" } }),
], { vo: "Una ficha sin reseñas parece un negocio cerrado.", voAt: 0.05, hold: 0.35, camera: { from: { z: -80, rx: 4 }, to: { z: 30 } }, bg: { tint: "warn", glow: [0, 100] } });

scene("como", null, [
  TextReveal({ text: "Pedirlas,\n*sin incomodar*:", size: 104, y: -540 }),
  PillCascade({ at: 0.5, stagger: 0.32, y: 160, items: [
    { icon: "qr", text: "QR en el mostrador" },
    { icon: "chat", text: "Mensaje post-compra" },
    { icon: "star", text: "Respuesta a cada reseña", hl: true },
  ] }),
], { vo: "Te armo un sistema para pedirlas sin incomodar a nadie.", voAt: 0.05, hold: 0.35, transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("remate", null, [
  TextReveal({ text: "Cada reseña real es", size: 76, color: "muted", y: -330, role: "body", cue: null }),
  KeywordCircle({ text: "confianza", at: 0.6, size: 170, y: -110, circleAt: 0.95 }),
], { vo: "Cada reseña real es confianza.", voAt: 0.05, hold: 0.6, transition: { type: "zoom" }, camera: { from: { z: -140 }, to: { z: 70 } }, bg: { rings: 1, ringScale: 0.7 } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
