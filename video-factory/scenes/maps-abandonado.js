/* Idea 2 · Google Maps abandonado */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "ocean";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  TextReveal({ text: "Tu ficha de Google\nestá *abandonada*.", size: 112, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { vo: "Tu ficha de Google está abandonada.", voAt: 0.2, hold: 0.25, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("ficha", null, [
  TextReveal({ text: "Horario viejo.\nCero *señales de vida*.", size: 96, y: -540 }),
  UICard({ kind: "maps", at: 0.4, width: 820, y: 170, rx: 8, float: 6, data: { rating: "3,6", count: 9, status: "Horario no disponible" } }),
], { vo: "Horarios viejos, sin fotos, sin respuestas.", voAt: 0.05, hold: 0.35, camera: { from: { z: -80 }, to: { z: 30 } }, bg: { tint: "warn" } });

scene("duda", null, [
  TextReveal({ text: "Y el cliente *duda*:", size: 110, accent: "warn", y: -560 }),
  HexFeature({ icon: "clock", label: "¿Está abierto?", tone: "warn", at: 0.6, x: -240, y: -60, labelSize: 44 }),
  HexFeature({ icon: "phone", label: "¿Me atienden?", tone: "warn", at: 1.0, x: 240, y: -60, labelSize: 44, z: -40 }),
  HexFeature({ icon: "eye", label: "¿Sigue existiendo?", tone: "warn", at: 1.4, x: 0, y: 330, labelSize: 44, z: 40 }),
], { vo: "Y el cliente duda, y se va con otro.", voAt: 0.05, hold: 0.5, camera: { from: { z: -60, ry: -5 }, to: { z: 40, ry: 4 } }, bg: { tint: "warn" } });

scene("solucion", null, [
  TextReveal({ text: "La dejo *al día*:", size: 110, y: -560 }),
  PillCascade({ at: 0.45, stagger: 0.3, y: 150, items: [
    { icon: "clock", text: "Horarios reales" },
    { icon: "eye", text: "Fotos actuales" },
    { icon: "spark", text: "Publicaciones al día", hl: true },
  ] }),
], { vo: "Yo la dejo completa y al día, todos los meses.", voAt: 0.05, hold: 0.4, transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
