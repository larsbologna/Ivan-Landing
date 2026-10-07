/* Idea 4 · Redes sociales vs. web propia */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "violet";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  TextReveal({ text: "Instagram\n*no es tu web*.", size: 140, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { vo: "Instagram no es tu web.", voAt: 0.2, hold: 0.25, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("redes", null, [
  TextReveal({ text: "En redes,\nestás *alquilando*.", size: 110, accent: "warn", y: -540 }),
  HexFeature({ icon: "trend", label: "Algoritmo", tone: "warn", at: 0.6, x: -240, y: -20 }),
  HexFeature({ icon: "search", label: "Difícil de encontrar", tone: "warn", at: 1.0, x: 0, y: 340, labelSize: 46, z: 40 }),
  HexFeature({ icon: "eye", label: "Info perdida", tone: "warn", at: 0.8, x: 240, y: -20, z: -40 }),
], { vo: "En redes estás alquilando: el algoritmo decide quién te ve.", voAt: 0.05, hold: 0.35, camera: { from: { z: -60, ry: -5 }, to: { z: 40, ry: 4 } }, bg: { tint: "warn" } });

scene("web", null, [
  TextReveal({ text: "Tu web\nes *tuya*.", size: 140, y: -520 }),
  UICard({ kind: "web", at: 0.4, width: 820, y: 180, z: 40, glow: true, float: 6 }),
], { vo: "Tu web es tuya, y te encuentran cuando te buscan.", voAt: 0.05, hold: 0.4, transition: { type: "push" }, camera: { from: { z: -80, rx: 6 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
