/* Idea 8 · Errores comunes en Google Business */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "ocean";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  Eyebrow({ text: "Google Business", y: -260 }),
  TextReveal({ text: "Errores que\n*te cuestan clientes*.", size: 110, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { vo: "Tres errores en Google que te cuestan clientes.", voAt: 0.2, hold: 0.25, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("lista", null, [
  TextReveal({ text: "¿Cuántos *tenés*?", size: 110, y: -580 }),
  PillCascade({ at: 0.3, stagger: 0.8, y: 80, check: false, size: 50, items: [
    { icon: "clock", text: "Horarios desactualizados" },
    { icon: "eye", text: "Sin fotos reales" },
    { icon: "star", text: "Reseñas sin responder" },
  ] }),
], { vo: "Horarios desactualizados, sin fotos reales, y reseñas sin responder.", voAt: 0.05, hold: 0.4, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } }, bg: { tint: "warn" } });

scene("remate", null, [
  TextReveal({ text: "Todos tienen", size: 80, color: "muted", y: -330, role: "body", cue: null }),
  KeywordCircle({ text: "arreglo", at: 0.4, size: 200, y: -110, circleAt: 0.75 }),
], { vo: "Todos tienen arreglo, y rápido.", voAt: 0.05, hold: 0.6, transition: { type: "zoom" }, camera: { from: { z: -140 }, to: { z: 70 } }, bg: { rings: 1, ringScale: 0.7 } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
